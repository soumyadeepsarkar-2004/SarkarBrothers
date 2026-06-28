import { useState } from 'react';
import {
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { confirmPayment } from '../../services/stripeService';

interface CheckoutFormProps {
    clientSecret: string;
    orderId: string;
    amount: number;
    onSuccess?: (paymentIntentId: string) => void;
    onError?: (error: string) => void;
}

export default function CheckoutForm({
    clientSecret,
    orderId,
    amount,
    onSuccess,
    onError,
}: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            setError('Payment system not ready');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Confirm payment with Stripe Universal PaymentElement
            const { error: stripeError } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin + '/#/profile?order_success=true',
                },
            });

            // This point will only be reached if there is an immediate error when
            // confirming the payment. Otherwise, your customer will be redirected to
            // your `return_url`. For some payment methods like iDEAL, your customer will
            // be redirected to an intermediate site first to authorize the payment, then
            // redirected to the `return_url`.
            if (stripeError) {
                setError(stripeError.message || 'Payment failed');
                onError?.(stripeError.message || 'Payment failed');
                return;
            }

            // If we reach here and it didn't redirect, it means success (for non-redirect payment methods)
            onSuccess?.(orderId);
            setError(null);
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
            {/* Universal Payment Element */}
            <div className="border rounded-lg p-4 bg-white">
                <PaymentElement />
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
