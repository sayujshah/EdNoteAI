import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { StripeService } from '@/lib/services/stripeService';

// POST /api/webhooks/stripe - Handle Stripe webhook events
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    console.log('Processing Stripe webhook');

    // Handle the webhook
    await StripeService.handleWebhook(body, signature);

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 400 }
    );
  }
} 