import { ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../services/stripeService';
import type { Stripe } from '@stripe/stripe-js';

interface StripeProviderProps {
    children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeStripe = async () => {
            try {
                const stripeInstance = await getStripe();
                if (!stripeInstance) {
                    setError('Stripe not available. Payment functionality will be limited.');
                } else {
                    setStripe(stripeInstance);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load Stripe');
                console.error('Stripe initialization error:', err);
            } finally {
                setLoading(false);
            }
        };

        initializeStripe();
    }, []);

    if (loading) {
        return <>{children}</>;
    }

    if (!stripe) {
        console.warn('Stripe not initialized. Payment features will be unavailable.');
        // Still render children so app doesn't break
        return <>{children}</>;
    }

    return (
        <Elements
            stripe={stripe}
            options={{
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#f4c025',
                        colorDanger: '#fa755a',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        spacingUnit: '4px',
                    },
                },
                locale: 'en',
            }}
        >
            {error && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 m-4 text-yellow-700 text-sm">
                    ⚠️ {error}
                </div>
            )}
            {children}
        </Elements>
    );
}
