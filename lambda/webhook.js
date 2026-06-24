// ═══════════════════════════════════════════════════════════════
// STRIPE WEBHOOK HANDLER - Payment Events
// ═══════════════════════════════════════════════════════════════

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Handle Stripe payment events
 */
export const handler = async (event) => {
    console.log('Webhook received:', event.body);

    try {
        // Parse the raw body if needed
        const body = typeof event.body === 'string' ? event.body : JSON.stringify(event.body);
        const signature = event.headers['stripe-signature'];

        if (!signature) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing Stripe signature' }),
            };
        }

        // Verify webhook signature
        let stripeEvent;
        try {
            stripeEvent = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid signature' }),
            };
        }

        // Process event
        console.log(`Processing event: ${stripeEvent.type}`);

        switch (stripeEvent.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(stripeEvent.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(stripeEvent.data.object);
                break;

            case 'charge.refunded':
                await handleChargeRefunded(stripeEvent.data.object);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(stripeEvent.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${stripeEvent.type}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ received: true, eventId: stripeEvent.id }),
        };
    } catch (err) {
        console.error('Webhook processing error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Webhook processing failed' }),
        };
    }
};

// ─── Event Handlers ──────────────────────────────────────────────

/**
 * Payment succeeded - update order status
 */
async function handlePaymentSucceeded(paymentIntent) {
    const { id, amount, metadata, customer } = paymentIntent;

    console.log(`✓ Payment succeeded: ${id}`);
    console.log(`  Amount: ${amount / 100} INR`);
    console.log(`  Order: ${metadata?.orderId}`);
    console.log(`  Customer: ${customer}`);

    try {
        // TODO: Update database
        // - Find order by metadata.orderId
        // - Set status to 'paid' or 'Processing'
        // - Record payment transaction
        // - Send confirmation email

        console.log(`[DB] Would mark order ${metadata?.orderId} as paid`);
    } catch (err) {
        console.error('Failed to update order:', err);
    }
}

/**
 * Payment failed - notify customer
 */
async function handlePaymentFailed(paymentIntent) {
    const { id, last_payment_error, metadata } = paymentIntent;

    console.log(`✗ Payment failed: ${id}`);
    console.log(`  Reason: ${last_payment_error?.message}`);
    console.log(`  Order: ${metadata?.orderId}`);

    try {
        // TODO: Update database
        // - Find order by metadata.orderId
        // - Set status to 'payment_failed'
        // - Send failure notification email

        console.log(`[DB] Would mark order ${metadata?.orderId} as payment_failed`);
    } catch (err) {
        console.error('Failed to process payment failure:', err);
    }
}

/**
 * Charge refunded - update order status
 */
async function handleChargeRefunded(charge) {
    const { id, amount_refunded, metadata } = charge;

    console.log(`↩ Charge refunded: ${id}`);
    console.log(`  Refund amount: ${amount_refunded / 100} INR`);

    try {
        // TODO: Update database
        // - Find order associated with charge
        // - Set status to 'refunded'
        // - Send refund confirmation email

        console.log(`[DB] Would mark order as refunded with amount ${amount_refunded / 100}`);
    } catch (err) {
        console.error('Failed to process refund:', err);
    }
}

/**
 * Invoice paid - subscription or recurring charge
 */
async function handleInvoicePaid(invoice) {
    const { id, amount_paid, customer_email } = invoice;

    console.log(`📄 Invoice paid: ${id}`);
    console.log(`  Amount: ${amount_paid / 100} INR`);
    console.log(`  Customer: ${customer_email}`);

    try {
        // TODO: Update database if subscription order
        // - Record subscription payment
        // - Update subscription status if needed

        console.log(`[DB] Would record subscription payment for ${customer_email}`);
    } catch (err) {
        console.error('Failed to process invoice payment:', err);
    }
}

// Warmup handler
export const warmup = async (event) => {
    console.log('Webhook handler warmed up');
    return { statusCode: 200, body: JSON.stringify({ message: 'OK' }) };
};
