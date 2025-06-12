import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import type { SubscriptionStatusResponse } from '@/lib/types/subscription';

// GET /api/subscription/status - Get user's subscription status
export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching subscription status for user:', user.id);

    // Get user's subscription status
    const { subscription, limits, usage } = await SubscriptionService.getUserSubscriptionStatus(user.id);

    // Get the plan details
    const plans = await SubscriptionService.getPlans();
    const currentPlan = plans.find(plan => plan.name === limits.plan_name);

    if (!currentPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const response: SubscriptionStatusResponse = {
      subscription,
      plan: currentPlan,
      usage,
      limits
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' }, 
      { status: 500 }
    );
  }
}