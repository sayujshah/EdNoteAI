"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CreditCard, FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserPlanLimits, UserUsage } from '@/lib/types/subscription';

interface UsageDashboardProps {
  limits: UserPlanLimits;
  usage: UserUsage;
  className?: string;
}

export function UsageDashboard({ limits, usage, className }: UsageDashboardProps) {
  const creditsPercentage = limits.monthly_credits === -1 
    ? -1 // Unlimited
    : Math.round((limits.credits_used_this_month / limits.monthly_credits) * 100);
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Plan Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
          <Badge variant={limits.plan_name === 'Professional' ? 'default' : 'secondary'}>
            {limits.plan_name}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{limits.plan_name} Plan</div>
          <p className="text-xs text-muted-foreground">
            {limits.can_save_notes ? 'Premium features enabled' : 'Basic features only'}
          </p>
        </CardContent>
      </Card>

      {/* Usage Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Credits Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {limits.monthly_credits === -1 ? '∞' : limits.credits_remaining}
            </div>
            <p className="text-xs text-muted-foreground">
              {limits.monthly_credits === -1 
                ? 'Unlimited credits'
                : `${limits.credits_used_this_month} / ${limits.monthly_credits} used`
              }
            </p>
            {limits.monthly_credits !== -1 && (
              <div className="mt-2">
                <Progress 
                  value={creditsPercentage} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Duration */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upload Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(limits.max_upload_duration_minutes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum per upload
            </p>
          </CardContent>
        </Card>

        {/* Monthly Uploads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(usage.total_upload_minutes)} min
            </div>
            <p className="text-xs text-muted-foreground">
              {usage.transcriptions_count} transcriptions
            </p>
          </CardContent>
        </Card>

        {/* Notes Generated */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.notes_generated_count}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Credits Progress */}
          {limits.monthly_credits !== -1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monthly Credits</span>
                <span className="text-sm text-muted-foreground">
                  {limits.credits_used_this_month} / {limits.monthly_credits}
                </span>
              </div>
              <Progress 
                value={creditsPercentage} 
                className={cn(
                  "h-2",
                  creditsPercentage > 90 && "bg-red-100",
                  creditsPercentage > 75 && creditsPercentage <= 90 && "bg-yellow-100"
                )}
              />
              {creditsPercentage > 90 && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  You&apos;re running low on credits. Consider upgrading your plan.
                </p>
              )}
            </div>
          )}

          {/* Library Access */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">Library Access</span>
            <Badge variant={limits.can_save_notes ? "default" : "secondary"}>
              {limits.can_save_notes ? "Enabled" : "Upgrade Required"}
            </Badge>
          </div>

          {/* Plan Benefits */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Plan Benefits</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>• {formatDuration(limits.max_upload_duration_minutes)} max upload</div>
              <div>• {limits.monthly_credits === -1 ? 'Unlimited' : limits.monthly_credits} monthly credits</div>
              <div>• {limits.can_save_notes ? 'Library access' : 'No library access'}</div>
              {limits.plan_name === 'Professional' && (
                <div>• Priority processing</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
} 