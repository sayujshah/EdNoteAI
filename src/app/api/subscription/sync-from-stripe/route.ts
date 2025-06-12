import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// POST /api/subscription/sync-from-stripe - Sync user subscription from Stripe data
export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Syncing subscription from Stripe for user ${user.id}`);

    // Call the sync function for this specific user
    const { data, error } = await supabase
      .rpc('sync_user_subscription_from_stripe', { 
        p_user_id: user.id 
      });

    if (error) {
      console.error('Error syncing subscription:', error);
      return NextResponse.json({ error: 'Failed to sync subscription' }, { status: 500 });
    }

    // Check if any subscription was updated
    const syncResult = data?.[0];
    
    if (syncResult?.updated) {
      console.log(`Successfully synced subscription for user ${user.id}: ${syncResult.plan_name} (${syncResult.status})`);
      return NextResponse.json({ 
        success: true,
        message: 'Subscription synced successfully',
        subscription: {
          planName: syncResult.plan_name,
          status: syncResult.status,
          updated: syncResult.updated
        }
      });
    } else {
      console.log(`No subscription changes needed for user ${user.id}`);
      return NextResponse.json({ 
        success: true,
        message: 'No subscription found or no changes needed',
        subscription: null
      });
    }

  } catch (error: any) {
    console.error('Error in sync-from-stripe:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription from Stripe' }, 
      { status: 500 }
    );
  }
}

// GET /api/subscription/sync-from-stripe - Check sync status
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current subscription status
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .single();

    // Get Stripe customer data  
    const { data: { user: userData } } = await supabase.auth.admin.getUserById(user.id);
    
    if (!userData?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const { data: stripeCustomer } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('email', userData.email)
      .single();

    let stripeSubscription = null;
    if (stripeCustomer) {
      const { data } = await supabase
        .from('stripe_subscriptions')
        .select('*')
        .eq('customer', stripeCustomer.id)
        .eq('attrs->>status', 'active')
        .single();
      stripeSubscription = data;
    }

    return NextResponse.json({
      currentSubscription: subscription,
      stripeCustomer,
      stripeSubscription,
      syncNeeded: !subscription || 
        (stripeSubscription && subscription?.stripe_subscription_id !== stripeSubscription.id)
    });

  } catch (error: any) {
    console.error('Error checking sync status:', error);
    return NextResponse.json(
      { error: 'Failed to check sync status' }, 
      { status: 500 }
    );
  }
} 