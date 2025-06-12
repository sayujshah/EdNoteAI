import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST /api/subscription/sync - Manually sync subscription from Stripe
export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { session_id } = body;

    console.log(`Manual sync requested for user ${user.id}`);

    // If we have a session ID, retrieve the checkout session and subscription
    if (session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        
        if (session.customer && session.subscription) {
          console.log(`Found session ${session_id} with subscription ${session.subscription}`);
          
          // Retrieve the subscription
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          // Get plan information from price ID
          const priceId = subscription.items.data[0].price.id;
          const billingCycle = subscription.items.data[0].price.recurring?.interval === 'year' ? 'yearly' : 'monthly';
          
          // Find the plan that matches this price ID
          const { data: plan } = await supabase
            .from('subscription_plans')
            .select('*')
            .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
            .single();

          if (!plan) {
            console.error('No plan found for price ID:', priceId);
            return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
          }

          console.log(`Syncing subscription for user ${user.id}, plan ${plan.name} (${billingCycle})`);

          // Create or update user subscription
          const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: user.id,
              plan_id: plan.id,
              status: subscription.status as any,
              billing_cycle: billingCycle,
              current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
              cancel_at_period_end: (subscription as any).cancel_at_period_end,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
            }, {
              onConflict: 'user_id'
            });

          if (error) {
            console.error('Error saving subscription:', error);
            return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
          }

          console.log(`Successfully synced subscription ${subscription.id} for user ${user.id}`);
          return NextResponse.json({ 
            success: true, 
            message: 'Subscription synced successfully',
            plan: plan.name
          });
        }
      } catch (error) {
        console.error('Error retrieving session/subscription:', error);
      }
    }

    // Fallback: Try to find subscription by customer email
    try {
      // Get user email
      const { data: { user: userData }, error: userError } = await supabase.auth.admin.getUserById(user.id);
      
      if (userError || !userData?.email) {
        return NextResponse.json({ error: 'User email not found' }, { status: 400 });
      }

      // Find Stripe customer by email
      const customers = await stripe.customers.list({
        email: userData.email,
        limit: 1
      });

      if (customers.data.length === 0) {
        return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
      }

      const customer = customers.data[0];
      
      // Get active subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
      }

      const subscription = subscriptions.data[0];
      
      // Get plan information from price ID
      const priceId = subscription.items.data[0].price.id;
      const billingCycle = subscription.items.data[0].price.recurring?.interval === 'year' ? 'yearly' : 'monthly';
      
      // Find the plan that matches this price ID
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
        .single();

      if (!plan) {
        console.error('No plan found for price ID:', priceId);
        return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
      }

      console.log(`Syncing subscription for user ${user.id}, plan ${plan.name} (${billingCycle})`);

      // Create or update user subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: plan.id,
          status: subscription.status as any,
          billing_cycle: billingCycle,
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: (subscription as any).cancel_at_period_end,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving subscription:', error);
        return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
      }

      console.log(`Successfully synced subscription ${subscription.id} for user ${user.id}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Subscription synced successfully',
        plan: plan.name
      });

    } catch (error) {
      console.error('Error in fallback sync:', error);
      return NextResponse.json({ error: 'Failed to sync subscription' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in manual sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription' }, 
      { status: 500 }
    );
  }
} 