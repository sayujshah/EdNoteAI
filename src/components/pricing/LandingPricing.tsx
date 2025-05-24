"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { SubscriptionPlan, BillingCycle } from '@/lib/types/subscription';

interface LandingPricingProps {
  className?: string;
}

export function LandingPricing({ className }: LandingPricingProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans');
      if (response.ok) {
        const data = await response.json();
        // The API returns { plans: [...] }, so we need to extract the plans array
        const plansArray = data.plans || [];
        setPlans(plansArray);
      } else {
        console.error('Failed to load plans: HTTP', response.status);
        setPlans([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      setPlans([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    if (plan.name === 'Free') {
      // For free plan, just redirect to sign up
      if (!auth.user) {
        router.push('/auth/signup');
      } else {
        router.push('/dashboard');
      }
      return;
    }

    if (!auth.user) {
      // Store the selected plan in localStorage and redirect to sign up
      localStorage.setItem('selectedPlan', JSON.stringify({ planId: plan.id, billingCycle }));
      router.push('/auth/signup');
      return;
    }

    // For authenticated users, create subscription
    setSelectedPlanId(plan.id);
    try {
      const priceId = billingCycle === 'monthly' ? plan.stripe_price_id_monthly : plan.stripe_price_id_yearly;
      
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.session?.access_token}`,
        },
        body: JSON.stringify({
          planName: plan.name,
          billingCycle,
          priceId,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      // You could add a toast notification here
    } finally {
      setSelectedPlanId(null);
    }
  };

  if (isLoading) {
    return (
      <section id="pricing" className={cn("w-full py-12 md:py-24 lg:py-32", className)}>
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className={cn("w-full py-12 md:py-24 lg:py-32", className)}>
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
              Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
              Choose the plan that fits your learning needs
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mt-8">
            <Card className="p-1">
              <Tabs 
                value={billingCycle} 
                onValueChange={(value) => setBillingCycle(value as BillingCycle)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly" className="text-sm">
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger value="yearly" className="text-sm relative">
                    Yearly
                    <Badge 
                      variant="secondary" 
                      className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    >
                      Save 17%
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </Card>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
          {Array.isArray(plans) && plans.length > 0 ? (
            (() => {
              const sortedPlans = [...plans].sort((a, b) => a.price_monthly - b.price_monthly);
              return sortedPlans.map((plan, index) => {
                const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
                const monthlyPrice = billingCycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly;
                const savings = billingCycle === 'yearly' && plan.price_monthly > 0 
                  ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)
                  : 0;

                const isPopular = plan.name === 'Student';
                const isProcessing = selectedPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative flex flex-col rounded-lg border bg-background p-6 shadow-sm transition-all duration-300 hover:shadow-lg",
                      isPopular && "border-primary shadow-lg"
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                        Most Popular
                      </div>
                    )}

                    <div className="flex flex-col space-y-2">
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      <p className="text-muted-foreground">
                        {plan.name === 'Free' && 'Perfect for trying out EdNoteAI'}
                        {plan.name === 'Student' && 'For serious learners'}
                        {plan.name === 'Professional' && 'For educators and professionals'}
                      </p>
                      
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">
                            ${monthlyPrice.toFixed(monthlyPrice % 1 === 0 ? 0 : 2)}
                          </span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                        
                        {billingCycle === 'yearly' && savings > 0 && (
                          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Save {savings}% with annual billing
                          </div>
                        )}
                        
                        {billingCycle === 'yearly' && price > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Billed annually (${price.toFixed(0)}/year)
                          </div>
                        )}
                      </div>
                    </div>

                    <ul className="my-6 space-y-2 flex-1">
                      {plan.name === 'Free' && (
                        <>
                          <FeatureItem text="3 transcriptions/note generations per month" />
                          <FeatureItem text="Files up to 10 minutes" />
                          <FeatureItem text="Customizable note formatting" />
                        </>
                      )}
                      
                      {plan.name === 'Student' && (
                        <>
                          <FeatureItem text="Unlimited transcriptions/note generations" />
                          <FeatureItem text="Files up to 2 hours" />
                          <FeatureItem text="Notes Library access with unlimited storage" />
                        </>
                      )}
                      
                      {plan.name === 'Professional' && (
                        <>
                          <FeatureItem text="Everything in Student plan" />
                          <FeatureItem text="Files up to 8 hours" />
                          <FeatureItem text="Priority processing" />
                          <FeatureItem text="Priority support" />
                        </>
                      )}
                    </ul>

                    <Button
                      variant={plan.name === 'Free' ? "outline" : isPopular ? "default" : "outline"}
                      className="mt-auto"
                      onClick={() => handlePlanSelect(plan)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {plan.name === 'Free' ? 'Get Started' : 'Subscribe Now'}
                        </>
                      )}
                    </Button>
                  </div>
                );
              });
            })()
          ) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-muted-foreground">No pricing plans available at the moment.</p>
              <Button 
                variant="outline" 
                onClick={loadPlans}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>All plans include secure payment processing and can be canceled anytime.</p>
          <p className="mt-2">✨ Start with a free account and upgrade when you're ready.</p>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="h-4 w-4 text-primary flex-shrink-0" />
      <span>{text}</span>
    </li>
  );
} 