import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { 
  CreateSubscriptionRequest
} from '@/lib/types/subscription';

// =====================================================
// Stripe Service
// =====================================================

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

// Create Supabase service role client for admin operations
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

// Validate Stripe configuration on module load
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY environment variable is not set');
  throw new Error('Stripe configuration missing');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  throw new Error('Supabase service role key missing');
}

export class StripeService {

  /**
   * Create a Stripe Checkout session for subscription
   */
  static async createCheckoutSession(
    userId: string,
    request: CreateSubscriptionRequest & { success_url: string; cancel_url: string }
  ): Promise<{ url: string }> {
    try {
      console.log(`Creating checkout session for user ${userId}`);
      
      // Get or create Stripe customer
      const customer = await this.getOrCreateCustomer(userId);
      console.log(`Using Stripe customer ${customer.id} for user ${userId}`);

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: request.price_id,
            quantity: 1,
          },
        ],
        success_url: request.success_url,
        cancel_url: request.cancel_url,
        metadata: {
          user_id: userId,
          billing_cycle: request.billing_cycle,
        },
        subscription_data: {
          metadata: {
            user_id: userId,
            billing_cycle: request.billing_cycle,
          },
        },
      });

      if (!session.url) {
        throw new Error('Failed to create checkout session URL');
      }

      console.log(`Checkout session created: ${session.id}`);
      return { url: session.url };
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      
      // Provide more specific error messages
      if (error.type === 'StripeInvalidRequestError') {
        if (error.code === 'resource_missing') {
          throw new Error('Invalid price or customer information. Please try again.');
        }
        if (error.code === 'parameter_invalid_empty') {
          throw new Error('Missing required subscription information.');
        }
      }
      
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  /**
   * Get or create a Stripe customer for a user
   */
  static async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    const supabase = await createServiceClient();
    
    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions_test')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    // Check if we have a valid (non-manual) customer ID
    if (subscription?.stripe_customer_id && !subscription.stripe_customer_id.startsWith('manual_customer_')) {
      try {
        // Try to retrieve the existing customer
        const customer = await stripe.customers.retrieve(subscription.stripe_customer_id) as Stripe.Customer;
        if (!customer.deleted) {
          return customer;
        }
      } catch (error) {
        console.log(`Customer ${subscription.stripe_customer_id} not found in Stripe, creating new one`);
        // Continue to create new customer if retrieval fails
      }
    }

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('Error fetching user:', userError);
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }
    
    if (!user?.email) {
      throw new Error('User email not found');
    }

    console.log(`Creating new Stripe customer for user ${userId} with email ${user.email}`);

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: userId,
      },
    });

    // Update the database with the real Stripe customer ID
    if (subscription) {
      // Update existing subscription record
      await supabase
        .from('user_subscriptions_test')
        .update({ stripe_customer_id: customer.id })
        .eq('user_id', userId);
    } else {
      // This case shouldn't happen in normal checkout flow, but handle it gracefully
      console.log(`No subscription record found for user ${userId}, will be created by webhook`);
    }

    console.log(`Created Stripe customer ${customer.id} for user ${userId}`);
    return customer;
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Resume a subscription
   */
  static async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      return subscription;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      throw new Error('Failed to resume subscription');
    }
  }

  /**
   * Change subscription plan
   */
  static async changeSubscriptionPlan(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription> {
    try {
      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Update subscription with new price
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error changing subscription plan:', error);
      throw new Error('Failed to change subscription plan');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(
    body: string,
    signature: string
  ): Promise<{ received: boolean }> {
    try {
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
      
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

      console.log('Processing Stripe webhook:', event.type);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw new Error('Webhook handling failed');
    }
  }

  /**
   * Handle checkout session completed event
   */
  private static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log(`Checkout session completed: ${session.id}`);
    
    // For subscription mode, the subscription will be handled by subscription.created event
    if (session.mode === 'subscription' && session.subscription) {
      console.log(`Subscription ${session.subscription} created from checkout session ${session.id}`);
      // The subscription.created webhook will handle the database update
    }
  }

  /**
   * Handle subscription created event
   */
  private static async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const supabase = await createServiceClient();
    const sub = subscription as Stripe.Subscription;
    let userId = sub.metadata.user_id;
    
    // If no user_id in metadata, try to find user by customer email
    if (!userId) {
      console.log('No user_id in subscription metadata, attempting to find user by customer email');
      
      try {
        // Get customer from Stripe
        const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer;
        
        if (customer.email) {
          // Find user by email in auth.users
          const { data: user, error: userError } = await supabase.auth.admin.listUsers();
          
          if (!userError && user?.users) {
            const foundUser = user.users.find(u => u.email === customer.email);
            if (foundUser) {
              userId = foundUser.id;
              console.log(`Found user ${userId} for email ${customer.email}`);
            }
          }
        }
      } catch (error) {
        console.error('Error finding user by customer email:', error);
      }
    }
    
    if (!userId) {
      console.error('Could not determine user_id for subscription');
      return;
    }

    // Get plan information from price ID
    const priceId = sub.items.data[0].price.id;
    const billingCycle = sub.items.data[0].price.recurring?.interval === 'year' ? 'yearly' : 'monthly';
    
    // Find the plan that matches this price ID
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .single();

    if (!plan) {
      console.error('No plan found for price ID:', priceId);
      return;
    }

    console.log(`Processing subscription for user ${userId}, plan ${plan.name} (${billingCycle})`);

    // Create or update user subscription
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_id: plan.id,
        status: sub.status as any,
        billing_cycle: billingCycle,
        current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving subscription:', error);
    } else {
      console.log(`Successfully processed subscription ${sub.id} for user ${userId}`);
    }
  }

  /**
   * Handle subscription updated event
   */
  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const supabase = await createServiceClient();
    const sub = subscription as Stripe.Subscription;
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: sub.status as any,
        current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', sub.id);

    if (error) {
      console.error('Error updating subscription:', error);
    }
  }

  /**
   * Handle subscription deleted event
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error marking subscription as canceled:', error);
    }
  }

  /**
   * Handle successful payment
   */
  private static async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!('subscription' in invoice) || !invoice.subscription) return;
    const supabase = await createServiceClient();
    // Get subscription to find user
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', invoice.subscription as string)
      .single();

    if (!subscription) return;

    // Record payment in history
    const { error } = await supabase
      .from('payment_history')
      .insert({
        user_id: subscription.user_id,
        stripe_payment_intent_id: (invoice as any).payment_intent as string,
        stripe_invoice_id: invoice.id,
        amount: (invoice.amount_paid || 0) / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status: 'succeeded',
        description: `Payment for subscription`,
        paid_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error recording payment:', error);
    }
  }

  /**
   * Handle failed payment
   */
  private static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!('subscription' in invoice) || !invoice.subscription) return;
    const supabase = await createServiceClient();
    // Get subscription to find user
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', invoice.subscription as string)
      .single();

    if (!subscription) return;

    // Record failed payment
    const { error } = await supabase
      .from('payment_history')
      .insert({
        user_id: subscription.user_id,
        stripe_invoice_id: invoice.id,
        amount: (invoice.amount_due || 0) / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status: 'failed',
        description: `Failed payment for subscription`,
      });

    if (error) {
      console.error('Error recording failed payment:', error);
    }
  }

  /**
   * Get customer's payment methods
   */
  static async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Create customer portal session
   */
  static async createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw new Error('Failed to create portal session');
    }
  }
}