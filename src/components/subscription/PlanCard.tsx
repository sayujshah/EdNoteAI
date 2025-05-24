"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan, BillingCycle } from '@/lib/types/subscription';

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  isPopular?: boolean;
  billingCycle: BillingCycle;
  onSelectPlan: (plan: SubscriptionPlan, billingCycle: BillingCycle) => void;
  isLoading?: boolean;
}

const planIcons = {
  Free: <Star className="h-6 w-6" />,
  Student: <Zap className="h-6 w-6" />,
  Professional: <Crown className="h-6 w-6" />
};

const planColors = {
  Free: 'border-gray-200 dark:border-gray-800',
  Student: 'border-blue-200 dark:border-blue-800',
  Professional: 'border-purple-200 dark:border-purple-800'
};

export function PlanCard({ 
  plan, 
  isCurrentPlan, 
  isPopular, 
  billingCycle, 
  onSelectPlan, 
  isLoading = false 
}: PlanCardProps) {
  const [localLoading, setLocalLoading] = useState(false);

  const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  const monthlyPrice = billingCycle === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly;
  
  const savings = billingCycle === 'yearly' && plan.price_monthly > 0 
    ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)
    : 0;

  const handleSelectPlan = async () => {
    if (isCurrentPlan || isLoading) return;
    
    setLocalLoading(true);
    try {
      await onSelectPlan(plan, billingCycle);
    } finally {
      setLocalLoading(false);
    }
  };

  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <Card className={cn(
      'relative transition-all duration-300 hover:shadow-lg',
      planColors[plan.name],
      isCurrentPlan && 'ring-2 ring-primary',
      isPopular && 'border-primary shadow-lg scale-105'
    )}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          {planIcons[plan.name]}
          <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-baseline justify-center space-x-1">
            <span className="text-4xl font-bold">
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

        <CardDescription className="text-center mt-2">
          {getDefaultDescription(plan.name)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <FeatureItem 
            icon={<Check className="h-4 w-4" />}
            text={`${plan.max_upload_duration_minutes === 480 ? '8 hours' : 
                   plan.max_upload_duration_minutes === 120 ? '2 hours' : 
                   '10 minutes'} max upload duration`}
          />
          
          <FeatureItem 
            icon={<Check className="h-4 w-4" />}
            text={plan.monthly_credits === -1 ? 'Unlimited credits' : `${plan.monthly_credits} credits/month`}
          />
          
          <FeatureItem 
            icon={<Check className="h-4 w-4" />}
            text={plan.can_save_notes ? 'Save notes to library' : 'Basic note generation'}
            disabled={!plan.can_save_notes}
          />
          
          {features.map((feature, index) => (
            <FeatureItem 
              key={index}
              icon={<Check className="h-4 w-4" />}
              text={feature}
            />
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? "secondary" : "default"}
          size="lg"
          onClick={handleSelectPlan}
          disabled={isCurrentPlan || isLoading || localLoading}
        >
          {localLoading ? "Processing..." : 
           isCurrentPlan ? "Current Plan" : 
           plan.price_monthly === 0 ? "Downgrade" : "Upgrade"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function FeatureItem({ icon, text, disabled = false }: { 
  icon: React.ReactNode; 
  text: string; 
  disabled?: boolean; 
}) {
  return (
    <div className={cn(
      "flex items-center space-x-2",
      disabled && "opacity-50"
    )}>
      <div className={cn(
        "text-green-600 dark:text-green-400",
        disabled && "text-gray-400 dark:text-gray-600"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-sm",
        disabled && "text-gray-500 dark:text-gray-400"
      )}>
        {text}
      </span>
    </div>
  );
}

function getDefaultDescription(planName: string): string {
  switch (planName) {
    case 'Free':
      return 'Perfect for trying out our service';
    case 'Student':
      return 'Ideal for students and light usage';
    case 'Professional':
      return 'Best for professionals and heavy users';
    default:
      return '';
  }
} 