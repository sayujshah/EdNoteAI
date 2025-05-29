"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface LandingPricingProps {
  className?: string;
}

// Static pricing plans for landing page
const STATIC_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price_monthly: 0,
    price_yearly: 0,
    description: 'Perfect for trying out EdNoteAI',
    features: [
      '3 transcriptions/note generations per month',
      'Files up to 10 minutes',
      'Customizable note formatting'
    ]
  },
  {
    id: 'student',
    name: 'Student', 
    price_monthly: 9.99,
    price_yearly: 99.99,
    description: 'For serious learners',
    features: [
      'Unlimited transcriptions/note generations',
      'Files up to 2 hours',
      'Notes Library access with unlimited storage'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price_monthly: 19.99,
    price_yearly: 199.99,
    description: 'For educators and professionals',
    features: [
      'Everything in Student plan',
      'Files up to 8 hours',
      'Priority processing',
      'Priority support'
    ]
  }
];

export function LandingPricing({ className }: LandingPricingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const auth = useAuth();
  const router = useRouter();

  const handlePlanSelect = async (plan: typeof STATIC_PLANS[0]) => {
    if (plan.name === 'Free') {
      // For free plan, just redirect to sign up
      if (!auth.user) {
        router.push('/login');
      } else {
        router.push('/dashboard/library');
      }
      return;
    }

    if (!auth.user) {
      // Store the selected plan in localStorage and redirect to sign up
      localStorage.setItem('selectedPlan', JSON.stringify({ planId: plan.id, billingCycle }));
      router.push('/login');
      return;
    }

    // For authenticated users, redirect to account page for subscription management
    setSelectedPlanId(plan.id);
    router.push('/dashboard/account');
  };

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
                onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}
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
          {STATIC_PLANS.map((plan) => {
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
                  <p className="text-muted-foreground">{plan.description}</p>
                  
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
                  {plan.features.map((feature, index) => (
                    <FeatureItem key={index} text={feature} />
                  ))}
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
          })}
        </div>

        {/* Additional Information */}
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>All plans include secure payment processing and can be canceled anytime.</p>
          <p className="mt-2">✨ Start with a free account and upgrade when you&apos;re ready.</p>
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