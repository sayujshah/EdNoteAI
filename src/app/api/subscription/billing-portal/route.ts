import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST /api/subscription/billing-portal - Create Stripe Customer Portal session
export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Creating billing portal session for user ${user.id}`);

    // Get user email from authenticated session
    if (!user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const userEmail = user.email;

    // Try to find existing Stripe customer by email
    let stripeCustomerId: string | null = null;
    
    // First check our local stripe_customers table
    const { data: localCustomer } = await supabase
      .from('stripe_customers')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (localCustomer) {
      stripeCustomerId = localCustomer.id;
    } else {
      // Fallback: Search Stripe directly
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      }
    }

    // If no customer exists, create one
    if (!stripeCustomerId) {
      console.log(`Creating new Stripe customer for ${userEmail}`);
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: user.id
        }
      });
      stripeCustomerId = customer.id;
    }

    console.log(`Found/Created Stripe customer: ${stripeCustomerId}`);

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account?section=billing`,
    });

    console.log(`Created billing portal session: ${session.id}`);

    return NextResponse.json({ 
      url: session.url 
    });

  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' }, 
      { status: 500 }
    );
  }
} 