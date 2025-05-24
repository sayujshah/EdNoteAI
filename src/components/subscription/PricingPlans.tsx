"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanCard } from './PlanCard';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan, BillingCycle, UserPlanLimits } from '@/lib/types/subscription';

interface PricingPlansProps {
  plans: SubscriptionPlan[];
  currentLimits: UserPlanLimits;
  onSelectPlan: (plan: SubscriptionPlan, billingCycle: BillingCycle) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function PricingPlans({ 
  plans, 
  currentLimits, 
  onSelectPlan, 
  isLoading = false, 
  className 
}: PricingPlansProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const sortedPlans = [...plans].sort((a, b) => a.price_monthly - b.price_monthly);

  const handlePlanSelect = async (plan: SubscriptionPlan, cycle: BillingCycle) => {
    await onSelectPlan(plan, cycle);
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
          <p className="text-muted-foreground mt-2">
            Select the perfect plan for your transcription and note-taking needs
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center">
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

      {/* Plans Grid */}
      <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
        {sortedPlans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={plan.name === currentLimits.plan_name}
            isPopular={plan.name === 'Student'} // Mark Student plan as popular
            billingCycle={billingCycle}
            onSelectPlan={handlePlanSelect}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Feature Comparison */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Feature</th>
                  {sortedPlans.map((plan) => (
                    <th key={plan.id} className="text-center py-2 font-medium min-w-[120px]">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="space-y-2">
                <FeatureRow
                  feature="Max Upload Duration"
                  values={sortedPlans.map(plan => 
                    plan.max_upload_duration_minutes === 480 ? '8 hours' :
                    plan.max_upload_duration_minutes === 120 ? '2 hours' : '10 minutes'
                  )}
                />
                <FeatureRow
                  feature="Monthly Credits"
                  values={sortedPlans.map(plan => 
                    plan.monthly_credits === -1 ? 'Unlimited' : plan.monthly_credits.toString()
                  )}
                />
                <FeatureRow
                  feature="Save to Library"
                  values={sortedPlans.map(plan => plan.can_save_notes)}
                />
                <FeatureRow
                  feature="LaTeX Support"
                  values={sortedPlans.map(plan => plan.can_save_notes)}
                />
                <FeatureRow
                  feature="Priority Processing"
                  values={sortedPlans.map(plan => plan.name === 'Professional')}
                />
                <FeatureRow
                  feature="Priority Support"
                  values={sortedPlans.map(plan => plan.name !== 'Free')}
                />
                <FeatureRow
                  feature="API Access"
                  values={sortedPlans.map(plan => plan.name === 'Professional')}
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FAQItem
            question="Can I change my plan anytime?"
            answer="Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
          />
          <FAQItem
            question="What happens if I exceed my limits?"
            answer="If you exceed your upload duration or credit limits, you'll need to upgrade your plan to continue using the service."
          />
          <FAQItem
            question="Do you offer refunds?"
            answer="We offer a 30-day money-back guarantee for all paid plans. Contact support for assistance."
          />
          <FAQItem
            question="What payment methods do you accept?"
            answer="We accept all major credit cards and debit cards through Stripe's secure payment processing."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureRow({ 
  feature, 
  values 
}: { 
  feature: string; 
  values: (string | boolean | number)[];
}) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-3 font-medium">{feature}</td>
      {values.map((value, index) => (
        <td key={index} className="text-center py-3">
          {typeof value === 'boolean' ? (
            value ? (
              <span className="text-green-600 dark:text-green-400">✓</span>
            ) : (
              <span className="text-gray-400">-</span>
            )
          ) : (
            <span className="text-sm">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">{question}</h4>
      <p className="text-sm text-muted-foreground">{answer}</p>
    </div>
  );
} 