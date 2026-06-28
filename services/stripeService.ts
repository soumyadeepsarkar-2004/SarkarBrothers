// ═══════════════════════════════════════════════════════════════
// STRIPE CONFIGURATION & INITIALIZATION
// ═══════════════════════════════════════════════════════════════

import { loadStripe, Stripe } from '@stripe/stripe-js';

const API_BASE_URL = process.env.API_BASE_URL || '/api';

let stripePromise: Promise<Stripe | null>;

/**
 * Initialize Stripe with public key from environment
 */
export const getStripe = async (): Promise<Stripe | null> => {
    if (!stripePromise) {
        const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

        if (!publicKey) {
            console.error('VITE_STRIPE_PUBLIC_KEY is not set');
            return null;
        }

        stripePromise = loadStripe(publicKey);
    }

    return stripePromise;
};

/**
 * Types for payment operations
 */
export interface PaymentIntentResponse {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    status: string;
}

export interface PaymentStatus {
    success: boolean;
    message: string;
    paymentIntentId: string;
    status: string;
}

/**
 * Create a payment intent on the server
 */
export const createPaymentIntent = async (
    orderId: string,
    amount: number,
    description?: string,
    metadata?: Record<string, string>
): Promise<PaymentIntentResponse> => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
            orderId,
            amount,
            currency: 'INR',
            description,
            metadata,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment intent');
    }

    return response.json();
};

/**
 * Confirm payment after Stripe processes it
 */
export const confirmPayment = async (
    paymentIntentId: string
): Promise<PaymentStatus> => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ paymentIntentId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm payment');
    }

    return response.json();
};

/**
 * Get payment intent details
 */
export const getPaymentDetails = async (
    paymentIntentId: string
): Promise<any> => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/payments/intent/${paymentIntentId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get payment details');
    }

    return response.json();
};

/**
 * Refund a payment
 */
export const refundPayment = async (
    paymentIntentId: string,
    reason?: string
): Promise<any> => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/payments/refund`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ paymentIntentId, reason }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refund payment');
    }

    return response.json();
};

/**
 * Get customer payment history
 */
export const getPaymentHistory = async (
    customerId: string,
    limit: number = 10
): Promise<any[]> => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/payments/customer/${customerId}?limit=${limit}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get payment history');
    }

    const data = await response.json();
    return data.payments || [];
};

/**
 * Format amount for display
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
    }).format(amount);
};
