// ═══════════════════════════════════════════════════════════════
// STRIPE PAYMENT API INTEGRATION
// ═══════════════════════════════════════════════════════════════

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2023-10-16',
});

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// ─── Types ─────────────────────────────────────────────────────
export interface PaymentIntentRequest {
    amount: number;
    currency: string;
    customerId?: string;
    orderId: string;
    description: string;
    metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    status: string;
}

// ─── Create Payment Intent for Checkout ────────────────────────
export const createPaymentIntent = async (
    req: any,
    res: any
) => {
    try {
        const { amount, currency = 'INR', customerId, orderId, description, metadata } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        // Create or retrieve Stripe customer
        let stripeCustomerId = customerId;
        if (!stripeCustomerId && req.user) {
            try {
                const customers = await stripe.customers.list({
                    email: req.user.email,
                    limit: 1,
                });

                if (customers.data.length > 0) {
                    stripeCustomerId = customers.data[0].id;
                } else {
                    const customer = await stripe.customers.create({
                        email: req.user.email,
                        name: req.user.name,
                        metadata: { userId: req.user.id },
                    });
                    stripeCustomerId = customer.id;
                }
            } catch (err) {
                console.error('Customer creation error:', err);
            }
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            customer: stripeCustomerId,
            description: description || 'SarkarBrothers Order Payment',
            metadata: {
                orderId,
                userId: req.user?.id,
                ...metadata,
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
        } as PaymentIntentResponse);
    } catch (err) {
        console.error('Payment intent error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to create payment intent' });
    }
};

// ─── Confirm Payment ───────────────────────────────────────────
export const confirmPayment = async (
    req: any,
    res: any
) => {
    try {
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ error: 'Payment intent ID is required' });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            return res.json({
                success: true,
                message: 'Payment confirmed',
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status,
            });
        }

        res.status(400).json({
            success: false,
            message: `Payment status: ${paymentIntent.status}`,
            status: paymentIntent.status,
        });
    } catch (err) {
        console.error('Payment confirmation error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to confirm payment' });
    }
};

// ─── Get Payment Intent Details ─────────────────────────────────
export const getPaymentIntent = async (
    req: any,
    res: any
) => {
    try {
        const { paymentIntentId } = req.params;

        if (!paymentIntentId) {
            return res.status(400).json({ error: 'Payment intent ID is required' });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        res.json({
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            charges: paymentIntent.charges,
        });
    } catch (err) {
        console.error('Get payment intent error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to retrieve payment intent' });
    }
};

// ─── Webhook Handler for Payment Events ─────────────────────────
export const handlePaymentWebhook = async (
    req: any,
    res: any
) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        return res.status(400).json({ error: 'Missing Stripe signature' });
    }

    try {
        const event = stripe.webhooks.constructEvent(
            req.rawBody || req.body,
            sig,
            STRIPE_WEBHOOK_SECRET
        );

        // Handle different payment events
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            case 'charge.refunded':
                await handleChargeRefunded(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(400).json({ error: 'Webhook error' });
    }
};

// ─── Payment Event Handlers ────────────────────────────────────
const handlePaymentSucceeded = async (paymentIntent: any) => {
    console.log(`Payment succeeded: ${paymentIntent.id}`);
    console.log(`Order ID: ${paymentIntent.metadata.orderId}`);
    // TODO: Update order status to 'paid' in database
    // TODO: Send confirmation email
};

const handlePaymentFailed = async (paymentIntent: any) => {
    console.log(`Payment failed: ${paymentIntent.id}`);
    console.log(`Reason: ${paymentIntent.last_payment_error?.message}`);
    // TODO: Update order status to 'payment_failed'
    // TODO: Send failure notification
};

const handleChargeRefunded = async (charge: any) => {
    console.log(`Charge refunded: ${charge.id}`);
    console.log(`Amount: ${charge.amount_refunded / 100}`);
    // TODO: Update order status to 'refunded'
    // TODO: Send refund notification
};

// ─── Refund Payment ────────────────────────────────────────────
export const refundPayment = async (
    req: any,
    res: any
) => {
    try {
        const { paymentIntentId, reason } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ error: 'Payment intent ID is required' });
        }

        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: reason || 'requested_by_customer',
        });

        res.json({
            refundId: refund.id,
            amount: refund.amount / 100,
            status: refund.status,
        });
    } catch (err) {
        console.error('Refund error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to refund payment' });
    }
};

// ─── List Customer Payments ────────────────────────────────────
export const getCustomerPayments = async (
    req: any,
    res: any
) => {
    try {
        const { customerId } = req.params;
        const { limit = 10 } = req.query;

        if (!customerId) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        const paymentIntents = await stripe.paymentIntents.search({
            query: `customer:"${customerId}"`,
            limit: parseInt(limit),
        });

        res.json({
            payments: paymentIntents.data.map((pi) => ({
                paymentIntentId: pi.id,
                amount: pi.amount / 100,
                currency: pi.currency,
                status: pi.status,
                created: new Date(pi.created * 1000),
            })),
        });
    } catch (err) {
        console.error('Get customer payments error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to fetch payments' });
    }
};
