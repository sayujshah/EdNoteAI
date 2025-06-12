import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { StripeService } from '@/lib/services/stripeService';
import type { CreateSubscriptionRequest, CreateSubscriptionResponse } from '@/lib/types/subscription';

// POST /api/subscription/checkout - Create Stripe checkout session
export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateSubscriptionRequest = await request.json();
    const { price_id, billing_cycle } = body;

    // Validate input
    if (!price_id || !billing_cycle) {
      return NextResponse.json(
        { error: 'price_id and billing_cycle are required' }, 
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(billing_cycle)) {
      return NextResponse.json(
        { error: 'billing_cycle must be monthly or yearly' }, 
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('status, current_period_end, stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (existingSubscription?.status === 'active' && existingSubscription.stripe_subscription_id) {
      // Check if subscription is not expired and has a real Stripe subscription
      const now = new Date();
      const periodEnd = new Date(existingSubscription.current_period_end);
      
      if (periodEnd > now) {
        return NextResponse.json(
          { error: 'You already have an active subscription. Please manage it through your account settings.' }, 
          { status: 400 }
        );
      }
    }

    console.log(`Creating checkout session for user ${user.id}, price: ${price_id}, cycle: ${billing_cycle}`);

    // Create checkout session
    const { url } = await StripeService.createCheckoutSession(user.id, {
      price_id,
      billing_cycle,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?canceled=true`
    });

    const response: CreateSubscriptionResponse = { url };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' }, 
      { status: 500 }
    );
  }
} 