import { useState, useEffect } from 'react';
import {
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { createPaymentIntent, confirmPayment } from '../../services/stripeService';

interface CheckoutFormProps {
    orderId: string;
    amount: number;
    onSuccess?: (paymentIntentId: string) => void;
    onError?: (error: string) => void;
}

export default function CheckoutForm({
    orderId,
    amount,
    onSuccess,
    onError,
}: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

    // Create payment intent when component mounts
    useEffect(() => {
        const setupPayment = async () => {
            try {
                setLoading(true);
                const response = await createPaymentIntent(
                    orderId,
                    amount,
                    `Order #${orderId}`
                );
                setClientSecret(response.clientSecret);
                setPaymentIntentId(response.paymentIntentId);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to initialize payment';
                setError(errorMsg);
                onError?.(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        setupPayment();
    }, [orderId, amount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            setError('Payment system not ready');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Confirm payment with Stripe
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                {
                    payment_method: {
                        card: elements.getElement(CardElement)!,
                        billing_details: {
                            name: 'Customer', // Could be from user context
                        },
                    },
                }
            );

            if (stripeError) {
                setError(stripeError.message || 'Payment failed');
                onError?.(stripeError.message || 'Payment failed');
                return;
            }

            if (paymentIntent?.status === 'succeeded') {
                // Confirm payment on backend
                await confirmPayment(paymentIntent.id);
                onSuccess?.(paymentIntent.id);
                setError(null);
            } else if (paymentIntent?.status === 'processing') {
                setError('Payment is processing. Please wait...');
            } else {
                setError(`Unexpected payment status: ${paymentIntent?.status}`);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Payment processing failed';
            setError(errorMsg);
            onError?.(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !clientSecret) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
                <span className="ml-3">Loading payment form...</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card Element */}
            <div className="border rounded-lg p-4 bg-white">
                <label className="block text-sm font-medium mb-2">Card Details</label>
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                            },
                            invalid: {
                                color: '#fa755a',
                            },
                        },
                    }}
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">{orderId}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-primary">₹{amount.toFixed(2)}</span>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={!stripe || loading || !clientSecret}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${loading || !stripe || !clientSecret
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                    }`}
            >
                {loading ? 'Processing...' : `Pay ₹${amount.toFixed(2)}`}
            </button>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Your payment information is secure and encrypted</span>
            </div>
        </form>
    );
}
