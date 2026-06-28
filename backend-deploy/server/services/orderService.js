import { Order, Product, User } from '../models.js';

export const createCustomerOrder = async ({ items, shippingAddress, user, dbConnected, isProd, stripe }) => {
    let orderTotal = 0;
    const orderItems = [];

    // Calculate total regardless of DB status for mock fallback compatibility
    for (const item of items) {
        orderTotal += (item.price || 100) * item.quantity;
        orderItems.push({
            productId: item.productId || 'mock-p-id',
            name: item.name || 'Mock Product',
            price: item.price || 100,
            quantity: item.quantity,
            image: item.image || ''
        });
    }

    if (dbConnected) {
        const productIds = items.map(item => item.productId);
        const products = await Product.find({ _id: { $in: productIds } }).lean();
        
        const productMap = products.reduce((acc, p) => {
            acc[p._id.toString()] = p;
            return acc;
        }, {});

        const verifiedOrderItems = [];
        let verifiedTotal = 0;

        for (const item of items) {
            const product = productMap[item.productId];
            if (!product) {
                return { status: 404, error: `Product not found: ${item.productId}` };
            }
            if (product.stock < item.quantity) {
                return { status: 400, error: `Insufficient stock for ${product.name}` };
            }

            verifiedOrderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.image || product.imageUrl
            });
            verifiedTotal += product.price * item.quantity;
        }

        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(verifiedTotal * 100), // cents
            currency: 'inr',
            metadata: { customerId: user.id, email: user.email }
        });

        const order = await Order.create({
            customerId: user.id,
            customerEmail: user.email,
            customerName: user.name,
            items: verifiedOrderItems,
            total: verifiedTotal,
            status: 'pending',
            paymentStatus: 'pending',
            shippingAddress,
            stripePaymentIntentId: paymentIntent.id
        });

        return {
            status: 201,
            data: {
                order: order.toObject(),
                paymentIntent: { clientSecret: paymentIntent.client_secret }
            }
        };
    }

    // Mock Success Fallback (with actual Stripe Intent if keys are active)
    let clientSecret = 'pi_mock_secret_' + Date.now();
    let paymentIntentId = 'pi_mock_' + Date.now();
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(orderTotal * 100),
            currency: 'inr',
            metadata: { customerId: user.id, email: user.email }
        });
        clientSecret = paymentIntent.client_secret;
        paymentIntentId = paymentIntent.id;
    } catch (e) {}

    const mockOrder = {
        _id: 'mock-o-' + Date.now(),
        customerId: user.id,
        customerEmail: user.email,
        customerName: user.name,
        items: orderItems,
        total: orderTotal,
        status: 'pending',
        paymentStatus: 'pending',
        shippingAddress,
        stripePaymentIntentId: paymentIntentId,
        createdAt: new Date()
    };

    return {
        status: 201,
        data: {
            order: mockOrder,
            paymentIntent: { clientSecret }
        }
    };
};

export const getCustomerOrders = async ({ userId, page, limit, dbConnected, isProd }) => {
    if (dbConnected) {
        if (page !== undefined || limit !== undefined) {
            const parsedPage = parseInt(page) || 1;
            const parsedLimit = parseInt(limit) || 20;
            const skip = (parsedPage - 1) * parsedLimit;

            const total = await Order.countDocuments({ customerId: userId });
            const orders = await Order.find({ customerId: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parsedLimit)
                .lean();

            return {
                status: 200,
                data: {
                    orders,
                    pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) }
                }
            };
        } else {
            const orders = await Order.find({ customerId: userId }).sort({ createdAt: -1 }).lean();
            return { status: 200, data: orders };
        }
    }

    // Mock Fallback
    const mockOrders = [
        {
            _id: 'mock-order-123',
            customerId: userId,
            customerEmail: 'customer@example.com',
            customerName: 'Sarah Jenkins',
            items: [
                { productId: 'mock-p-1', name: 'Premium Coffee Blend', price: 950, quantity: 2, image: '' }
            ],
            total: 1900,
            status: 'processing',
            paymentStatus: 'completed',
            shippingAddress: { name: 'Sarah Jenkins', street: '123 Main St', city: 'Mumbai', state: 'MH', zip: '400001', country: 'IN' },
            createdAt: new Date(Date.now() - 3600000 * 24)
        }
    ];

    if (page !== undefined || limit !== undefined) {
        return {
            status: 200,
            data: {
                orders: mockOrders,
                pagination: { page: 1, limit: 20, total: mockOrders.length, pages: 1 }
            }
        };
    }
    return { status: 200, data: mockOrders };
};

export const getAdminOrders = async ({ status, page = 1, limit = 20, dbConnected, isProd }) => {
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 20;
    const skip = (parsedPage - 1) * parsedLimit;

    if (dbConnected) {
        let query = {};
        if (status) query.status = status;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parsedLimit)
            .lean();

        return {
            status: 200,
            data: {
                orders,
                pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) }
            }
        };
    }

    // Mock Fallback
    const mockOrders = [
        {
            _id: 'mock-order-123',
            customerId: 'customer-1',
            customerEmail: 'user@example.com',
            customerName: 'Sarah Jenkins',
            items: [
                { productId: 'mock-p-1', name: 'Premium Coffee Blend', price: 950, quantity: 2, image: '' }
            ],
            total: 1900,
            status: status || 'processing',
            paymentStatus: 'completed',
            shippingAddress: { name: 'Sarah Jenkins', street: '123 Main St', city: 'Mumbai', state: 'MH', zip: '400001', country: 'IN' },
            createdAt: new Date(Date.now() - 3600000 * 24)
        }
    ];

    return {
        status: 200,
        data: {
            orders: mockOrders,
            pagination: { page: parsedPage, limit: parsedLimit, total: mockOrders.length, pages: Math.ceil(mockOrders.length / parsedLimit) }
        }
    };
};

export const updateOrderStatus = async ({ id, status, dbConnected, isProd }) => {
    if (dbConnected) {
        const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
        if (!order) {
            return { status: 404, error: 'Order not found' };
        }
        return { status: 200, data: order.toObject() };
    }

    // Mock Fallback
    return {
        status: 200,
        data: {
            _id: id,
            customerId: 'customer-1',
            customerEmail: 'user@example.com',
            customerName: 'Sarah Jenkins',
            items: [],
            total: 0,
            status,
            paymentStatus: 'completed',
            createdAt: new Date()
        }
    };
};

export const getAdminAnalytics = async ({ dbConnected, isProd }) => {
    if (dbConnected) {
        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const topProducts = await Order.aggregate([
            { $unwind: '$items' },
            { $group: { _id: '$items.productId', sales: { $sum: '$items.quantity' } } },
            { $sort: { sales: -1 } },
            { $limit: 10 }
        ]);

        return {
            status: 200,
            data: {
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                totalCustomers,
                topProducts
            }
        };
    }

    // Mock Fallback
    return {
        status: 200,
        data: {
            totalOrders: 154,
            totalRevenue: 289400,
            totalCustomers: 45,
            topProducts: [
                { _id: 'mock-p-1', sales: 42 },
                { _id: 'mock-p-2', sales: 29 }
            ]
        }
    };
};

export const handleStripeWebhook = async ({ body, signature, stripe, webhookSecret, dbConnected }) => {
    let event;
    if (webhookSecret) {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            webhookSecret
        );
    } else {
        event = JSON.parse(body.toString());
    }

    switch (event.type) {
        case 'payment_intent.succeeded':
            if (dbConnected) {
                const paymentIntent = event.data.object;
                await Order.findOneAndUpdate(
                    { stripePaymentIntentId: paymentIntent.id },
                    { paymentStatus: 'completed', status: 'processing' }
                );
            }
            break;

        case 'payment_intent.payment_failed':
            if (dbConnected) {
                const paymentIntent = event.data.object;
                await Order.findOneAndUpdate(
                    { stripePaymentIntentId: paymentIntent.id },
                    { paymentStatus: 'failed' }
                );
            }
            break;
    }

    return { received: true };
};
