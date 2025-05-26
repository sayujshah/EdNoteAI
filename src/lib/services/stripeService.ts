import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import type { 
  CreateSubscriptionRequest, 
  StripeWebhookEvent,
  UserSubscription 
} from '@/lib/types/subscription';

// =====================================================
// Stripe Service
// =====================================================

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export class StripeService {

  /**
   * Create a Stripe Checkout session for subscription
   */
  static async createCheckoutSession(
    userId: string,
    request: CreateSubscriptionRequest & { success_url: string; cancel_url: string }
  ): Promise<{ url: string }> {
    try {
      const supabase = await createClient();

      // Get or create Stripe customer
      const customer = await this.getOrCreateCustomer(userId);

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
      });

      if (!session.url) {
        throw new Error('Failed to create checkout session URL');
      }

      return { url: session.url };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Get or create a Stripe customer for a user
   */
  static async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    const supabase = await createClient();

    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (subscription?.stripe_customer_id) {
      // Return existing customer
      return await stripe.customers.retrieve(subscription.stripe_customer_id) as Stripe.Customer;
    }

    // Get user email from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    
    if (!user?.email) {
      throw new Error('User email not found');
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: userId,
      },
    });

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
   * Handle subscription created event
   */
  private static async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const supabase = await createClient();
    
    const userId = subscription.metadata.user_id;
    if (!userId) {
      console.error('No user_id in subscription metadata');
      return;
    }

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
      return;
    }

    // Create or update user subscription
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_id: plan.id,
        status: subscription.status as any,
        billing_cycle: billingCycle,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving subscription:', error);
    }
  }

  /**
   * Handle subscription updated event
   */
  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status as any,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription:', error);
    }
  }

  /**
   * Handle subscription deleted event
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const supabase = await createClient();

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
    const supabase = await createClient();

    if (!invoice.subscription) return;

    // Get subscription to find user
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (!subscription) return;

    // Record payment in history
    const { error } = await supabase
      .from('payment_history')
      .insert({
        user_id: subscription.user_id,
        stripe_payment_intent_id: invoice.payment_intent as string,
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
    const supabase = await createClient();

    if (!invoice.subscription) return;

    // Get subscription to find user
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', invoice.subscription)
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