"use client";

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserPlanLimits } from '@/lib/types/subscription';

interface UsageLimitAlertProps {
  limits: UserPlanLimits;
  attemptedDuration?: number; // in minutes
  onUpgrade?: () => void;
  className?: string;
}

export function UsageLimitAlert({ 
  limits, 
  attemptedDuration, 
  onUpgrade, 
  className 
}: UsageLimitAlertProps) {
  // Check if user has exceeded credit limits
  const creditsExceeded = limits.monthly_credits !== -1 && limits.credits_remaining <= 0;
  
  // Check if attempted upload exceeds duration limit
  const durationExceeded = attemptedDuration && attemptedDuration > limits.max_upload_duration_minutes;
  
  // Check if user is running low on credits (less than 2 remaining)
  const creditsLow = limits.monthly_credits !== -1 && limits.credits_remaining <= 2 && limits.credits_remaining > 0;

  if (!creditsExceeded && !durationExceeded && !creditsLow) {
    return null;
  }

  const getAlertContent = () => {
    if (creditsExceeded) {
      return {
        variant: 'destructive' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Credits Exhausted',
        description: `You've used all ${limits.monthly_credits} credits for this month. Upgrade your plan to continue transcribing videos.`,
        action: 'Upgrade Plan'
      };
    }

    if (durationExceeded) {
      const maxDurationFormatted = limits.max_upload_duration_minutes >= 60 
        ? `${Math.floor(limits.max_upload_duration_minutes / 60)} hour${Math.floor(limits.max_upload_duration_minutes / 60) > 1 ? 's' : ''}`
        : `${limits.max_upload_duration_minutes} minutes`;
      
      return {
        variant: 'destructive' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Upload Duration Limit Exceeded',
        description: `Your ${limits.plan_name} plan allows uploads up to ${maxDurationFormatted}. This video is approximately ${Math.round(attemptedDuration)} minutes.`,
        action: 'Upgrade Plan'
      };
    }

    if (creditsLow) {
      return {
        variant: 'default' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Running Low on Credits',
        description: `You have ${limits.credits_remaining} credit${limits.credits_remaining === 1 ? '' : 's'} remaining this month. Consider upgrading to avoid interruptions.`,
        action: 'Upgrade Plan'
      };
    }

    return null;
  };

  const alertContent = getAlertContent();
  if (!alertContent) return null;

  const getRecommendedPlan = () => {
    if (limits.plan_name === 'Free') {
      return { name: 'Student', icon: <Zap className="h-4 w-4" />, price: '$9.99/month' };
    }
    if (limits.plan_name === 'Student') {
      return { name: 'Professional', icon: <Crown className="h-4 w-4" />, price: '$14.99/month' };
    }
    return null;
  };

  const recommendedPlan = getRecommendedPlan();

  return (
    <Alert variant={alertContent.variant} className={cn("", className)}>
      {alertContent.icon}
      <AlertDescription className="space-y-3">
        <div>
          <div className="font-medium">{alertContent.title}</div>
          <div className="text-sm mt-1">{alertContent.description}</div>
        </div>
        
        {recommendedPlan && (
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-md border">
            <div className="flex items-center space-x-2">
              {recommendedPlan.icon}
              <div>
                <div className="font-medium text-sm">Recommended: {recommendedPlan.name} Plan</div>
                <div className="text-xs text-muted-foreground">{recommendedPlan.price}</div>
              </div>
            </div>
            {onUpgrade && (
              <Button size="sm" onClick={onUpgrade}>
                {alertContent.action}
              </Button>
            )}
          </div>
        )}
        
        {!recommendedPlan && onUpgrade && (
          <Button size="sm" onClick={onUpgrade} className="w-full">
            {alertContent.action}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
} 