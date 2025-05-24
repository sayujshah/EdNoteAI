"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PricingPlans } from './PricingPlans';
import { UsageDashboard } from './UsageDashboard';
import { Loader2, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  SubscriptionPlan, 
  BillingCycle, 
  UserPlanLimits, 
  UserUsage,
  UserSubscription 
} from '@/lib/types/subscription';

interface SubscriptionManagerProps {
  className?: string;
}

export function SubscriptionManager({ className }: SubscriptionManagerProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentLimits, setCurrentLimits] = useState<UserPlanLimits | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load subscription data
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load plans and subscription status
      const [plansResponse, statusResponse] = await Promise.all([
        fetch('/api/subscription/plans'),
        fetch('/api/subscription/status')
      ]);

      if (!plansResponse.ok) {
        throw new Error('Failed to load subscription plans');
      }

      if (!statusResponse.ok) {
        throw new Error('Failed to load subscription status');
      }

      const plansData = await plansResponse.json();
      const statusData = await statusResponse.json();

      setPlans(plansData.plans || []);
      setCurrentLimits(statusData.limits);
      setUsage(statusData.usage);
      setSubscription(statusData.subscription);
    } catch (err: any) {
      console.error('Error loading subscription data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = async (plan: SubscriptionPlan, billingCycle: BillingCycle) => {
    if (!plan.stripe_price_id_monthly && !plan.stripe_price_id_yearly) {
      setError('This plan is not available for purchase at the moment.');
      return;
    }

    // Handle free plan "downgrade"
    if (plan.name === 'Free') {
      setError('To downgrade to the free plan, please cancel your subscription through the billing portal.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);

      const priceId = billingCycle === 'monthly' 
        ? plan.stripe_price_id_monthly 
        : plan.stripe_price_id_yearly;

      if (!priceId) {
        throw new Error(`${billingCycle} billing is not available for this plan`);
      }

      // Create checkout session
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          billing_cycle: billingCycle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      console.error('Error selecting plan:', err);
      setError(err.message || 'Failed to process plan selection');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // This would typically create a Stripe Customer Portal session
      // For now, we'll show a placeholder
      setSuccess('Billing management coming soon! You can cancel anytime by contacting support.');
    } catch (err: any) {
      console.error('Error opening billing portal:', err);
      setError(err.message || 'Failed to open billing portal');
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear alerts after some time
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription Overview */}
      {currentLimits && subscription && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Current Subscription</CardTitle>
              <p className="text-sm text-muted-foreground">
                {subscription.status === 'active' ? 'Active subscription' : 'Subscription status: ' + subscription.status}
              </p>
            </div>
            <div className="text-right space-y-2">
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {currentLimits.plan_name} Plan
              </Badge>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  {isProcessing ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <ExternalLink className="h-3 w-3 mr-1" />
                  )}
                  Manage Billing
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Plan:</span>
                <span className="ml-2">{currentLimits.plan_name}</span>
              </div>
              <div>
                <span className="font-medium">Credits:</span>
                <span className="ml-2">
                  {currentLimits.monthly_credits === -1 ? 'Unlimited' : `${currentLimits.credits_remaining} remaining`}
                </span>
              </div>
              <div>
                <span className="font-medium">Upload Limit:</span>
                <span className="ml-2">
                  {currentLimits.max_upload_duration_minutes >= 60 
                    ? `${Math.floor(currentLimits.max_upload_duration_minutes / 60)}h`
                    : `${currentLimits.max_upload_duration_minutes}m`
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="usage">Usage & Billing</TabsTrigger>
          <TabsTrigger value="plans">Change Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-6">
          {currentLimits && usage ? (
            <UsageDashboard limits={currentLimits} usage={usage} />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p>Unable to load usage information</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSubscriptionData}
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          {plans.length > 0 && currentLimits ? (
            <PricingPlans
              plans={plans}
              currentLimits={currentLimits}
              onSelectPlan={handlePlanSelect}
              isLoading={isProcessing}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p>Unable to load subscription plans</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSubscriptionData}
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 