import bcrypt from 'bcryptjs';
import { User } from '../models.js';
import { generateToken } from '../../shared/middleware/auth.js';

export const loginUser = async ({ email, password, portal, isProd, dbConnected, secret }) => {
    // 1. Check Database if connected
    if (dbConnected) {
        const user = await User.findOne({ email }).select('+passwordHash');
        if (!user) {
            return { status: 401, error: 'Invalid credentials' };
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return { status: 401, error: 'Invalid credentials' };
        }

        // Check portal access
        if (!user.portalAccess.includes(portal)) {
            return { status: 403, error: `No access to ${portal} portal` };
        }

        const token = generateToken(user._id.toString(), email, user.role, user.portalAccess, secret);
        const userData = user.toObject();
        delete userData.passwordHash;

        return { status: 200, data: { user: userData, token } };
    }

    // 2. Fallback Mock Accounts (used when DB is down or in dev)
    if (email === 'user@example.com' && password === 'password') {
        const user = { id: 'customer-1', email, name: 'Sarah Jenkins', role: 'customer', portalAccess: ['customer'] };
        const token = generateToken(user.id, email, 'customer', ['customer'], secret);
        return { status: 200, data: { user, token } };
    }
    if (email === 'admin@example.com' && password === 'adminpass') {
        const user = { id: 'admin-1', email, name: 'Admin Owner', role: 'admin', portalAccess: ['admin', 'customer'] };
        const token = generateToken(user.id, email, 'admin', ['admin', 'customer'], secret);
        return { status: 200, data: { user, token } };
    }

    if (isProd) {
        return { status: 503, error: 'Database unavailable. Use demo credentials (user@example.com / password) to login.' };
    }

    return { status: 401, error: 'Invalid credentials' };
};

export const registerUser = async ({ name, email, password, phone, isProd, dbConnected, secret }) => {
    if (dbConnected) {
        const existing = await User.findOne({ email });
        if (existing) {
            return { status: 409, error: 'Email already registered' };
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name,
            email,
            passwordHash,
            phone: phone || '',
            role: 'customer',
            portalAccess: ['customer'],
            avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`
        });

        const token = generateToken(user._id.toString(), email, 'customer', ['customer'], secret);
        const userData = user.toObject();
        delete userData.passwordHash;

        return { status: 201, data: { user: userData, token } };
    }

    // Mock registration fallback
    const user = { id: 'mock-customer-' + Date.now(), email, name, role: 'customer', portalAccess: ['customer'] };
    const token = generateToken(user.id, email, 'customer', ['customer'], secret);
    return { status: 201, data: { user, token } };
};
