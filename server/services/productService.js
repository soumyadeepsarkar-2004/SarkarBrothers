import { Product } from '../models.js';
import { products as seedProducts } from '../data.js';

export const getCustomerProducts = async ({ page = 1, limit = 20, category, search, sort, dbConnected, isProd }) => {
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 20;
    const skip = (parsedPage - 1) * parsedLimit;

    if (dbConnected) {
        let query = { stock: { $gt: 0 }, isPublished: true };
        if (category) {
            query.category = category;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        let dbQuery = Product.find(query);
        if (sort === 'price-asc') dbQuery = dbQuery.sort({ price: 1 });
        else if (sort === 'price-desc') dbQuery = dbQuery.sort({ price: -1 });
        else if (sort === 'rating') dbQuery = dbQuery.sort({ rating: -1 });
        else dbQuery = dbQuery.sort({ createdAt: -1 });

        const total = await Product.countDocuments(query);
        const products = await dbQuery.skip(skip).limit(parsedLimit).lean();

        return {
            status: 200,
            data: {
                products,
                pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) }
            }
        };
    }

    // Fallback Mock Data
    return {
        status: 200,
        data: {
            products: seedProducts,
            pagination: { page: 1, limit: 20, total: seedProducts.length, pages: 1 }
        }
    };
};

export const getProductById = async ({ id, dbConnected, isProd }) => {
    if (dbConnected) {
        const product = await Product.findById(id).lean();
        if (!product) {
            return { status: 404, error: 'Product not found' };
        }
        return { status: 200, data: product };
    }

    const product = seedProducts.find(p => p.id === id || p._id === id);
    if (!product) {
        return { status: 404, error: 'Product not found' };
    }
    return { status: 200, data: product };
};

export const createProduct = async ({ name, price, originalPrice, category, description, stock, image, userId, dbConnected, isProd }) => {
    if (dbConnected) {
        const product = await Product.create({
            name,
            price,
            originalPrice,
            category,
            description,
            stock,
            image,
            rating: 0,
            reviews: 0,
            createdBy: userId
        });
        return { status: 201, data: product.toObject() };
    }

    // Mock Success Fallback
    const mockProduct = {
        _id: 'mock-p-' + Date.now(),
        name, price, originalPrice, category, description, stock, image,
        rating: 0, reviews: 0, isPublished: true, createdAt: new Date()
    };
    return { status: 201, data: mockProduct };
};

export const listAdminProducts = async ({ page, limit, dbConnected, isProd }) => {
    if (dbConnected) {
        if (page !== undefined || limit !== undefined) {
            const parsedPage = parseInt(page) || 1;
            const parsedLimit = parseInt(limit) || 20;
            const skip = (parsedPage - 1) * parsedLimit;

            const total = await Product.countDocuments({});
            const products = await Product.find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parsedLimit)
                .lean();

            return {
                status: 200,
                data: {
                    products,
                    pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) }
                }
            };
        } else {
            const products = await Product.find({}).sort({ createdAt: -1 }).lean();
            return { status: 200, data: products };
        }
    }

    // Mock Fallback
    if (page !== undefined || limit !== undefined) {
        const parsedPage = parseInt(page) || 1;
        const parsedLimit = parseInt(limit) || 20;
        const skip = (parsedPage - 1) * parsedLimit;
        const products = seedProducts.slice(skip, skip + parsedLimit);
        return {
            status: 200,
            data: {
                products,
                pagination: { page: parsedPage, limit: parsedLimit, total: seedProducts.length, pages: Math.ceil(seedProducts.length / parsedLimit) }
            }
        };
    }
    return { status: 200, data: seedProducts };
};

export const uploadProductDraft = async ({ name, price, originalPrice, category, description, stock, file, userId, dbConnected, isProd, cloudinary }) => {
    if (dbConnected) {
        let imageUrl = '';
        if (file) {
            const b64 = Buffer.from(file.buffer).toString('base64');
            const dataURI = "data:" + file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, { 
                resource_type: 'auto',
                folder: 'sarkarbrothers/products',
                transformation: [
                    { width: 800, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            });
            imageUrl = result.secure_url;
        }

        const product = await Product.create({
            name,
            price,
            originalPrice,
            category,
            description,
            stock,
            imageUrl,
            isPublished: false,
            rating: 0,
            reviews: 0,
            createdBy: userId
        });

        return { status: 201, data: product.toObject() };
    }

    // Mock Success Fallback
    const mockProduct = {
        _id: 'mock-p-' + Date.now(),
        name, price, originalPrice, category, description, stock,
        imageUrl: file ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' : '',
        isPublished: false, rating: 0, reviews: 0, createdBy: userId, createdAt: new Date()
    };
    return { status: 201, data: mockProduct };
};

export const publishProduct = async ({ id, dbConnected, isProd }) => {
    if (dbConnected) {
        const product = await Product.findByIdAndUpdate(
            id,
            { isPublished: true },
            { new: true }
        );

        if (!product) {
            return { status: 404, error: 'Product not found' };
        }
        return { status: 200, data: product.toObject() };
    }

    // Mock Success Fallback
    const product = seedProducts.find(p => p.id === id || p._id === id);
    if (!product) {
        return { status: 404, error: 'Product not found' };
    }
    return { status: 200, data: { ...product, isPublished: true } };
};

export const bulkUploadProducts = async ({ products, userId, dbConnected, isProd }) => {
    if (dbConnected) {
        const productsWithMeta = products.map(p => ({
            ...p,
            rating: 0,
            reviews: 0,
            createdBy: userId
        }));

        const created = await Product.insertMany(productsWithMeta);
        return { status: 200, data: { created: created.length, products: created } };
    }

    // Mock Success Fallback
    return { status: 200, data: { created: products.length, products } };
};

export const updateProductStock = async ({ id, newStock, dbConnected, isProd }) => {
    if (dbConnected) {
        const product = await Product.findByIdAndUpdate(
            id,
            { stock: newStock },
            { new: true }
        );

        if (!product) {
            return { status: 404, error: 'Product not found' };
        }
        return { status: 200, data: product.toObject() };
    }

    // Mock Success Fallback
    const product = seedProducts.find(p => p.id === id || p._id === id);
    if (!product) {
        return { status: 404, error: 'Product not found' };
    }
    return { status: 200, data: { ...product, stock: newStock } };
};
