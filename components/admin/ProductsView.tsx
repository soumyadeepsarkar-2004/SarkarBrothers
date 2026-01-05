
import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';

const ProductModal: React.FC<{ product: Product | null; onSave: (product: Product) => void; onClose: () => void }> = ({ product, onSave, onClose }) => {
    const [formData, setFormData] = useState<Omit<Product, 'id' | 'rating' | 'reviews'>>(product || { name: '', category: 'Educational', price: 0, stock: 10, image: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = "Product name is required.";
        if (formData.price <= 0) newErrors.price = "Price must be greater than zero.";
        if (formData.stock < 0) newErrors.stock = "Stock cannot be negative.";
        if (!formData.image) newErrors.image = "Image URL is required.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave({ ...formData, id: product?.id || '', rating: product?.rating || 0, reviews: product?.reviews || 0 });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">{product ? 'Edit Product' : 'Add New Product'}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <input name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" className="p-2 w-full border rounded dark:bg-gray-700 dark:border-gray-600" />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <select name="category" value={formData.category} onChange={handleChange} className="p-2 w-full border rounded dark:bg-gray-700 dark:border-gray-600">
                                {['Educational', 'Plushies', 'Outdoor Fun', 'Arts & Crafts', 'Robots', 'Gifts'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <div>
                                <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price (INR)" className="p-2 w-full border rounded dark:bg-gray-700 dark:border-gray-600" />
                                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                            </div>
                            <div>
                                <input name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="Stock" className="p-2 w-full border rounded dark:bg-gray-700 dark:border-gray-600" />
                                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <input name="image" value={formData.image} onChange={handleChange} placeholder="Image URL" className="p-2 w-full border rounded dark:bg-gray-700 dark:border-gray-600" />
                                {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg font-medium">Cancel</button>
                        <button type="submit" className="bg-primary text-black font-bold py-2 px-4 rounded-lg">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


interface ProductsViewProps {
    products: Product[];
    onSave: (product: Product) => void;
    onDelete: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

const ProductsView: React.FC<ProductsViewProps> = ({ products, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            (p.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (categoryFilter === 'All' || p.category === categoryFilter)
        );
    }, [products, searchTerm, categoryFilter]);
    
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

    const openModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    return (
        <div className="animate-[fadeIn_0.3s_ease-out]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Products</h1>
                <button onClick={() => openModal()} className="bg-primary text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-sm">add</span> Add Product</button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                           className="md:col-span-2 p-2 w-full border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                            className="p-2 w-full border rounded dark:bg-gray-700 dark:border-gray-600">
                        <option value="All">All Categories</option>
                        {['Educational', 'Plushies', 'Outdoor Fun', 'Arts & Crafts', 'Robots', 'Gifts'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Product</th>
                                <th className="px-6 py-3 hidden md:table-cell">Category</th>
                                <th className="px-6 py-3">Price</th>
                                <th className="px-6 py-3">Stock</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.map(p => (
                                <tr key={p.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center gap-3"><img src={p.image} className="w-10 h-10 rounded-md object-cover" /> {p.name}</td>
                                    <td className="px-6 py-4 hidden md:table-cell">{p.category}</td>
                                    <td className="px-6 py-4">{formatPrice(p.price)}</td>
                                    <td className={`px-6 py-4 font-bold ${p.stock < 10 ? 'text-red-500' : 'text-green-500'}`}>{p.stock}</td>
                                    <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                        <button onClick={() => openModal(p)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</button>
                                        <button onClick={() => onDelete(p.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm rounded-lg disabled:opacity-50">Previous</button>
                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm rounded-lg disabled:opacity-50">Next</button>
                    </div>
                )}
            </div>
            {isModalOpen && <ProductModal product={editingProduct} onSave={onSave} onClose={closeModal} />}
        </div>
    );
};

export default ProductsView;
