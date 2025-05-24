import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SubscriptionService } from '@/lib/services/subscriptionService';

// GET /api/subscription/plans - Get all available subscription plans
export async function GET(request: Request) {
  try {
    // Get authenticated user (optional for viewing plans)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('Fetching subscription plans');

    // Get all active plans
    const plans = await SubscriptionService.getPlans();

    return NextResponse.json({ plans });

  } catch (error: any) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' }, 
      { status: 500 }
    );
  }
} 