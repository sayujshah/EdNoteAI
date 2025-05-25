import { NextResponse } from 'next/server';
import { SubscriptionService } from '@/lib/services/subscriptionService';

// GET /api/subscription/plans - Get all available subscription plans
export async function GET() {
  try {
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