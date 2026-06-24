import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

const InstallBanner = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install: ${outcome}`);
            setDeferredPrompt(null);
        }
    };

    if (!deferredPrompt) return null;

    return (
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-lg">
            <div>
                <p className="font-bold">Unwrap the Magic on Your Phone!</p>
                <p className="text-sm">Install our digital storefront app directly. No App Store required!</p>
            </div>
            <button onClick={handleInstallClick} className="bg-white text-blue-600 px-4 py-2 rounded font-bold shadow hover:bg-gray-100">
                Install App
            </button>
        </div>
    );
};

const NavBar = () => (
    <nav className="bg-white border-b p-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-900">SarkarBrothers</Link>
        <div className="space-x-4">
            <Link to="/shop" className="text-gray-700 hover:text-blue-600">Shop</Link>
            <Link to="/cart" className="text-gray-700 hover:text-blue-600">Cart</Link>
            <Link to="/profile" className="text-gray-700 hover:text-blue-600">Profile</Link>
        </div>
    </nav>
);

const CustomerHome = () => (
    <div>
        <NavBar />
        <div className="p-8">
            <h2 className="text-4xl font-bold mb-4">Welcome to SarkarBrothers</h2>
            <p className="text-lg text-gray-600 mb-8">Discover quality products and premium shopping experience</p>
            <Link to="/shop" className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block">
                Start Shopping
            </Link>
        </div>
    </div>
);

const CustomerShop = () => {
    const [products, setProducts] = useState<any[]>([]);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API_URL}/api/customer/products`);
                const data = await res.json();
                setProducts(data.products || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div>
            <NavBar />
            <div className="p-8">
                <h1 className="text-4xl font-bold mb-8">Products</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(p => (
                        <div key={p._id || p.id} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
                            {p.imageUrl || p.image ? (
                                <img src={p.imageUrl || p.image} alt={p.name} className="w-full h-48 object-cover rounded mb-4" />
                            ) : (
                                <div className="bg-gray-200 h-48 rounded mb-4 flex items-center justify-center">No Image</div>
                            )}
                            <h3 className="font-bold text-lg">{p.name}</h3>
                            <p className="text-gray-600 mb-2">{p.category}</p>
                            <p className="text-blue-600 font-bold text-xl">₹{p.price}</p>
                            <button className="bg-blue-600 text-white w-full py-2 rounded mt-4 hover:bg-blue-700 transition">Add to Cart</button>
                        </div>
                    ))}
                    {products.length === 0 && <p className="col-span-full text-center text-gray-500">No published products available.</p>}
                </div>
            </div>
        </div>
    );
};

const CustomerCart = () => (
    <div>
        <NavBar />
        <div className="p-8">
            <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>
            <p className="text-gray-600">Your cart is empty</p>
        </div>
    </div>
);

export default function CustomerApp() {
    return (
        <BrowserRouter>
            <InstallBanner />
            <Routes>
                <Route path="/" element={<CustomerHome />} />
                <Route path="/shop" element={<CustomerShop />} />
                <Route path="/cart" element={<CustomerCart />} />
            </Routes>
        </BrowserRouter>
    );
}
