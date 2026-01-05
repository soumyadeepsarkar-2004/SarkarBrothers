
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext'; // Relative import
import { formatPrice } from '../utils/formatters';
import { Link, useSearchParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Product, Address, Order, UserProfile } from '../types';
import { products } from '../data';
import OrderTracker from '../components/OrderTracker'; // Import tracker

// Mock Map Component for Location Selection
const MapPicker: React.FC<{
    onConfirm: (coords: { lat: number; lng: number }, addressStub: Partial<Address>) => void;
    onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 }); // Percentage
    const [loading, setLoading] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (mapRef.current) {
            const rect = mapRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setPosition({ x, y });
        }
    };

    const handleLocateMe = () => {
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setTimeout(() => {
                        setPosition({ x: 45 + Math.random() * 10, y: 45 + Math.random() * 10 });
                        setLoading(false);
                    }, 800);
                },
                (err) => {
                    console.error(err);
                    setLoading(false);
                    alert("Could not access location. Please click on the map manually.");
                }
            );
        }
    };

    const handleConfirm = () => {
        const mockLat = 40.7128 + (Math.random() - 0.5) * 0.1;
        const mockLng = -74.0060 + (Math.random() - 0.5) * 0.1;
        const streetNum = Math.floor(Math.random() * 900) + 10;
        
        onConfirm(
            { lat: mockLat, lng: mockLng }, 
            {
                street: `${streetNum} ToyWonder Lane`,
                city: 'New York',
                state: 'NY',
                country: 'United States',
                zip: '10001'
            }
        );
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1a170d] rounded-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out]">
            <div className="relative flex-1 bg-[#e5e3df] overflow-hidden cursor-crosshair group" ref={mapRef} onClick={handleMapClick}>
                {/* Simulated Map Tiles */}
                <div className="absolute inset-0 opacity-30" style={{ 
                    backgroundImage: 'radial-gradient(#8a8060 1px, transparent 1px)', 
                    backgroundSize: '20px 20px' 
                }}></div>
                {/* Decorative Map Elements */}
                <div className="absolute top-[20%] left-[30%] w-32 h-32 border-4 border-white/50 rounded-full"></div>
                <div className="absolute bottom-[10%] right-[20%] w-full h-2 bg-white/40 rotate-12"></div>
                <div className="absolute top-[10%] left-[10%] bg-blue-200/50 w-24 h-24 rounded-full blur-xl"></div>

                {/* The Pin */}
                <div 
                    className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 ease-out"
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                >
                    <span className="material-symbols-outlined text-4xl text-red-500 drop-shadow-md fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    <div className="w-4 h-1 bg-black/30 rounded-full blur-[2px] mx-auto mt-[-5px]"></div>
                </div>

                {/* Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleLocateMe(); }}
                        className="bg-white dark:bg-[#252525] p-3 rounded-lg shadow-lg hover:bg-gray-50 text-[#181611] dark:text-white transition-all active:scale-95"
                        title="Locate Me"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin text-primary">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined">my_location</span>
                        )}
                    </button>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-[#252525] px-4 py-2 rounded-full shadow-lg text-xs font-bold text-[#181611] dark:text-white pointer-events-none">
                    Click anywhere to change pin
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-[#1a170d] border-t border-[#e6e3db] dark:border-[#332f20]">
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="font-bold text-lg text-[#181611] dark:text-white">Confirm Location</h3>
                        <p className="text-sm text-[#8a8060]">Drag the pin to the exact entrance.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 rounded-xl border border-[#e6e3db] dark:border-[#332f20] font-bold text-[#181611] dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirm}
                            className="flex-1 py-3 px-4 rounded-xl bg-primary text-[#181611] font-bold hover:bg-yellow-400 shadow-md transition-colors"
                        >
                            Confirm & Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// New: Order Details Modal component
const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-[#1a170d] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-[#e6e3db] dark:border-[#332f20] flex justify-between items-center sticky top-0 bg-white dark:bg-[#1a170d] z-10">
                    <h3 className="text-2xl font-bold text-[#181611] dark:text-white">Order {order.id} Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold mb-2">Customer Info</p>
                            <p className="font-bold text-[#181611] dark:text-white">{order.customerName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{order.customerEmail}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold mb-2">Shipping Address</p>
                            <p className="font-bold text-[#181611] dark:text-white">{order.shippingAddress.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{order.shippingAddress.street}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{order.shippingAddress.country}</p>
                        </div>
                    </div>

                    <h4 className="text-lg font-bold text-[#181611] dark:text-white mb-4">Items Ordered</h4>
                    <div className="space-y-4 mb-8">
                        {order.items.map(item => (
                            <div key={item.productId} className="flex items-center gap-4 bg-[#f5f3f0] dark:bg-[#2a261a] p-4 rounded-xl border border-[#e6e3db] dark:border-[#332f20]">
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-bold text-[#181611] dark:text-white">{item.name}</p>
                                    <p className="text-sm text-[#8a8060] dark:text-gray-400">Qty: {item.quantity} • {formatPrice(item.price)} each</p>
                                </div>
                                <span className="font-bold text-lg text-primary">{formatPrice(item.quantity * item.price)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center border-t border-[#e6e3db] dark:border-[#332f20] pt-4">
                        <span className="text-xl font-bold text-[#181611] dark:text-white">Total</span>
                        <span className="text-3xl font-extrabold text-primary">{formatPrice(order.total)}</span>
                    </div>

                    <h4 className="text-lg font-bold text-[#181611] dark:text-white mt-8 mb-4">Tracking Information</h4>
                    <OrderTracker status={order.status} />
                </div>
            </div>
        </div>
    );
};

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'past' | 'wishlist' | 'profile' | 'addresses'>('active');
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth(); // Use AuthContext
  const navigate = useNavigate(); // For redirection
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Wishlist specific state
  const [sortOption, setSortOption] = useState<string>('default');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Async Data State
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  // Use AuthContext user as default, then allow local edits
  const [userProfile, setUserProfile] = useState<UserProfile>(user || {
    id: '', name: 'Guest', email: '', phone: '', avatar: '', bio: '', preferences: { newsletter: false, smsNotifications: false }
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null); // For active order tracker expansion
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // For detailed order modal

  // Form States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<UserProfile>(userProfile); // Initialize with userProfile
  const [addressModal, setAddressModal] = useState<{ open: boolean; step: 'map' | 'form' }>({ open: false, step: 'map' });
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      displayToast('Please log in to view your profile.');
    }
  }, [isAuthenticated, navigate]);


  const displayToast = (msg: string) => {
      setToastMessage(msg);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };

  // Initial Data Fetch & Order Success Toast
  useEffect(() => {
    // Only fetch if authenticated AND user email is available
    if (!isAuthenticated || !user?.email) {
        setLoading(false); // Ensure loading is false if not authenticated/no email
        return; 
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            // User profile is now from AuthContext, but we can fetch addresses and orders
            const ordersData = await api.user.getOrders(user.email); // Pass user.email
            setOrders(ordersData);
            setAddresses([
                { id: '1', name: 'Home', street: '123 Maple Avenue', city: 'Springfield', state: 'IL', zip: '62704', country: 'United States', isDefault: true, coordinates: { lat: 39.7817, lng: -89.6501 } },
                { id: '2', name: 'Work', street: '456 Tech Blvd, Suite 200', city: 'Chicago', state: 'IL', zip: '60601', country: 'United States', isDefault: false, coordinates: { lat: 41.8781, lng: -87.6298 } }
            ]);

             // Check for order success from URL
            if (searchParams.get('order_success') === 'true') {
                displayToast('🎉 Your order has been placed successfully!');
                // Expand the newest order
                if (ordersData.length > 0) {
                    setExpandedOrder(ordersData[0].id);
                    setActiveTab('active'); // Switch to active orders tab
                }
                // Clean up URL
                searchParams.delete('order_success');
                setSearchParams(searchParams);
            }

        } catch (e) {
            console.error("Failed to fetch profile data", e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [isAuthenticated, user?.email, searchParams, setSearchParams]); // Depend on isAuthenticated and user.email


  // Update profileForm if AuthContext user changes
  useEffect(() => {
    if (user) {
      setUserProfile(user);
      setProfileForm(user);
    }
  }, [user]);

  const activeOrders = orders.filter(o => o.status !== 'Delivered');
  const pastOrders = orders.filter(o => o.status === 'Delivered');
  
  const wishlistProducts = useMemo(() => {
    let items = products.filter(p => wishlist.includes(p.id));
    return [...items].sort((a, b) => {
        switch (sortOption) {
            case 'price-low': return a.price - b.price;
            case 'price-high': return b.price - a.price;
            case 'name': return a.name.localeCompare(b.name);
            default: return 0;
        }
    });
  }, [wishlist, sortOption]);

  const handleShareWishlist = () => {
      const url = `${window.location.origin}/#/shop?wishlist=${userProfile.id || 'shared'}`;
      navigator.clipboard.writeText(url).then(() => {
          displayToast("Wishlist link copied to clipboard!");
      }).catch(() => {
          displayToast("Copied: " + url);
      });
  };

  // --- Profile Logic ---
  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              setProfileForm(prev => ({ ...prev, avatar: result }));
              displayToast("Image selected. Save to apply.");
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          // Assuming updateProfile API returns the updated profile
          const updated = await api.user.updateProfile(profileForm);
          setUserProfile(updated);
          setIsEditingProfile(false);
          displayToast('Profile updated successfully!');
      } catch (err) {
          displayToast('Failed to update profile.');
      }
  };

  // --- Address Logic ---
  const handleAddNewAddress = () => {
      setEditingAddress(null);
      setAddressForm({ isDefault: false, name: '', street: '', city: '', state: '', zip: '', country: 'United States' });
      setAddressModal({ open: true, step: 'map' });
  };

  const handleEditAddress = (addr: Address) => {
      setEditingAddress(addr);
      setAddressForm(addr);
      setAddressModal({ open: true, step: 'form' });
  };

  const handleDeleteAddress = (id: string) => {
      if (window.confirm('Are you sure you want to delete this address?')) {
          setAddresses(prev => prev.filter(a => a.id !== id));
          displayToast('Address deleted.');
      }
  };

  const handleMapConfirm = (coords: { lat: number; lng: number }, addressStub: Partial<Address>) => {
      setAddressForm(prev => ({ ...prev, ...addressStub, coordinates: coords }));
      setAddressModal({ open: true, step: 'form' });
  };

  const handleSaveAddress = (e: React.FormEvent) => {
      e.preventDefault();
      if (!addressForm.name || !addressForm.street || !addressForm.city || !addressForm.zip) {
          alert('Please fill in all required fields');
          return;
      }

      if (addressForm.isDefault) {
           setAddresses(prev => prev.map(a => ({ ...a, isDefault: false })));
      }

      if (editingAddress) {
          setAddresses(prev => prev.map(a => a.id === editingAddress.id ? { ...a, ...addressForm, isDefault: addressForm.isDefault || (prev.length === 1) } as Address : a));
          displayToast('Address updated.');
      } else {
          const newId = Math.random().toString(36).substr(2, 9);
          setAddresses(prev => [...prev, { ...addressForm, id: newId, isDefault: addressForm.isDefault || prev.length === 0 } as Address]);
          displayToast('New address added.');
      }
      setAddressModal({ open: false, step: 'map' });
  };

  // --- Render Helpers ---
  const AddressModal = () => {
      if (!addressModal.open) return null;

      if (addressModal.step === 'map') {
          return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="w-full max-w-2xl h-[500px]">
                      <MapPicker 
                        onConfirm={handleMapConfirm} 
                        onCancel={() => setAddressModal({ ...addressModal, open: false })}
                      />
                  </div>
              </div>
          );
      }

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-[#1a170d] rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-2">
                          <button onClick={() => setAddressModal({ ...addressModal, step: 'map' })} className="text-primary hover:text-yellow-600">
                              <span className="material-symbols-outlined">arrow_back</span>
                          </button>
                          <h3 className="text-xl font-bold text-[#181611] dark:text-white">{editingAddress ? 'Edit Details' : 'Confirm Details'}</h3>
                      </div>
                      <button onClick={() => setAddressModal({ ...addressModal, open: false })} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  
                  {addressForm.coordinates && (
                      <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3 border border-blue-100 dark:border-blue-900/30">
                          <span className="material-symbols-outlined text-blue-500">location_on</span>
                          <div className="flex flex-col">
                            <span className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase">Location Pinned</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{addressForm.coordinates.lat.toFixed(6)}, {addressForm.coordinates.lng.toFixed(6)}</span>
                          </div>
                      </div>
                  )}

                  <form onSubmit={handleSaveAddress} className="flex flex-col gap-4">
                      <div>
                          <label className="block text-xs font-bold text-[#8a8060] uppercase mb-1">Label</label>
                          <div className="flex gap-2 mb-2">
                              {['Home', 'Work', 'Other'].map(type => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => setAddressForm({...addressForm, name: type})}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                        addressForm.name === type 
                                        ? 'bg-primary border-primary text-[#181611]' 
                                        : 'border-[#e6e3db] dark:border-[#332f20] text-[#8a8060] hover:border-primary'
                                    }`}
                                  >
                                      {type}
                                  </button>
                              ))}
                          </div>
                          <input 
                              type="text" 
                              value={addressForm.name || ''}
                              onChange={e => setAddressForm({...addressForm, name: e.target.value})}
                              className="w-full rounded-lg border-[#e6e3db] dark:border-[#332f20] bg-[#f5f3f0] dark:bg-[#252525] p-3 text-sm text-[#181611] dark:text-white focus:ring-2 focus:ring-primary outline-none"
                              required 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-[#8a8060] uppercase mb-1">Street Address</label>
                          <input 
                              type="text" 
                              value={addressForm.street || ''}
                              onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                              className="w-full rounded-lg border-[#e6e3db] dark:border-[#332f20] bg-[#f5f3f0] dark:bg-[#252525] p-3 text-sm text-[#181611] dark:text-white focus:ring-2 focus:ring-primary outline-none"
                              required
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="City" value={addressForm.city || ''} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full rounded-lg border-[#e6e3db] dark:border-[#332f20] bg-[#f5f3f0] dark:bg-[#252525] p-3 text-sm text-[#181611] dark:text-white focus:ring-2 focus:ring-primary outline-none" />
                          <input type="text" placeholder="Zip" value={addressForm.zip || ''} onChange={e => setAddressForm({...addressForm, zip: e.target.value})} className="w-full rounded-lg border-[#e6e3db] dark:border-[#332f20] bg-[#f5f3f0] dark:bg-[#252525] p-3 text-sm text-[#181611] dark:text-white focus:ring-2 focus:ring-primary outline-none" />
                      </div>

                      <button type="submit" className="mt-2 w-full bg-primary hover:bg-yellow-400 text-[#181611] font-bold py-3 rounded-xl transition-colors shadow-lg shadow-primary/20">
                          {t('common.save')}
                      </button>
                  </form>
              </div>
          </div>
      );
  };

  const QuickViewModal = () => {
    if (!quickViewProduct) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setQuickViewProduct(null)}>
            <div className="bg-white dark:bg-[#1a170d] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="aspect-square bg-gray-100 dark:bg-[#252525] relative">
                         <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{quickViewProduct.category}</p>
                                <h3 className="text-2xl font-bold text-[#181611] dark:text-white">{quickViewProduct.name}</h3>
                            </div>
                            <button onClick={() => setQuickViewProduct(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                             <span className="text-2xl font-bold text-[#181611] dark:text-white">{formatPrice(quickViewProduct.price)}</span>
                        </div>

                        <div className="mt-auto flex flex-col gap-3">
                            <button 
                                onClick={() => { addToCart(quickViewProduct); setQuickViewProduct(null); }}
                                className="w-full bg-primary hover:bg-yellow-400 text-[#181611] font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">shopping_bag</span>
                                {t('product.add_to_cart')}
                            </button>
                             <Link 
                                to={`/product/${quickViewProduct.id}`}
                                onClick={() => setQuickViewProduct(null)} // Close modal when navigating
                                className="w-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#252525] text-[#181611] dark:text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center text-sm"
                            >
                                View Details
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  if (!isAuthenticated) {
    return null; // Redirect handled by useEffect
  }

  if (loading) {
      return (
          <div className="flex-1 flex items-center justify-center min-h-[500px]">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[#8a8060] font-medium">Loading your magical chest...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <div className="layout-container flex h-full grow w-full max-w-[1440px] mx-auto">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-[280px] bg-white dark:bg-[#1a170d] border-r border-[#e6e3db] dark:border-[#332f20] h-full overflow-y-auto">
          <div className="p-6 border-b border-[#e6e3db] dark:border-[#332f20]">
            <img className="size-24 rounded-full mx-auto mb-4 object-cover" src={userProfile.avatar} alt={userProfile.name} />
            <h2 className="text-center text-xl font-bold text-[#181611] dark:text-white">{userProfile.name}</h2>
            <p className="text-center text-sm text-[#8a8060]">{userProfile.email}</p>
          </div>
          <nav className="flex-1 p-6 space-y-2">
            {(['active', 'past', 'wishlist', 'profile', 'addresses'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === tab 
                    ? 'bg-primary/20 text-primary' 
                    : 'text-[#8a8060] hover:bg-[#f5f3f0] dark:hover:bg-[#2a261a]'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-lg">{
                  tab === 'active' ? 'package_2' :
                  tab === 'past' ? 'archive' :
                  tab === 'wishlist' ? 'favorite' :
                  tab === 'profile' ? 'person' : 'location_on'
                }</span>
                {t(`profile.tab.${tab}`)}
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-[#e6e3db] dark:border-[#332f20]">
            <button onClick={logout} className="w-full flex items-center px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <span className="material-symbols-outlined mr-3 text-lg">logout</span>
              {t('profile.logout')}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex flex-col flex-1 min-w-0 bg-background-light dark:bg-background-dark overflow-y-auto px-4 md:px-12 py-8">
            <div className="max-w-[1000px] w-full mx-auto flex flex-col gap-8 pb-20">
                {activeTab === 'profile' && (
                    <div className="bg-white dark:bg-[#1a170d] rounded-2xl shadow-sm border border-[#e6e3db] dark:border-[#332f20] p-6">
                        <h2 className="text-2xl font-bold mb-6 text-[#181611] dark:text-white">My Profile</h2>
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="relative size-24 rounded-full border border-[#e6e3db] dark:border-[#332f20] overflow-hidden group">
                                    <img src={profileForm.avatar} alt="Profile" className="size-full object-cover" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold flex-col gap-1">
                                        <span className="material-symbols-outlined text-xl">camera_alt</span>
                                        Change
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleProfileImageUpload} className="hidden" accept="image/*" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-[#181611] dark:text-white">{profileForm.name}</h3>
                                    <p className="text-sm text-[#8a8060]">{profileForm.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#8a8060] mb-1">Name</label>
                                    <input type="text" name="name" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full rounded-lg border-[#e6e3db] dark:border-[#332f20] bg-[#f5f3f0] dark:bg-[#252525] p-3 text-sm text-[#181611] dark:text-white focus:ring-primary focus:border-primary outline-none" disabled={!isEditingProfile} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#8a8060] mb-1">Email</label>
                                    <input type="email" name="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full rounded-lg border-[#e6e3db] dark:border-[#332f20] bg-[#f5f3f0] dark:bg-[#252525] p-3 text-sm text-[#181611] dark:text-white focus:ring-primary focus:border-primary outline-none" disabled={!isEditingProfile} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#8a8060] mb-1">Phone</label>
                                    <input type="text" name="phone" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full rounded-lg border-[#e6e3db] dark:border-[#332f20] bg-[#f5f3f0] dark:bg-[#252525] p-3 text-sm text-[#181611] dark:text-white focus:ring-primary focus:border-primary outline-none" disabled={!isEditingProfile} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-[#8a8060] mb-1">Bio</label>
                                    <textarea name="bio" value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} rows={3} className="w-full rounded-lg border-[#e6e3db] dark:border-[#332f20] bg-[#f5f3f0] dark:bg-[#252525] p-3 text-sm text-[#181611] dark:text-white focus:ring-primary focus:border-primary outline-none" disabled={!isEditingProfile}></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                {isEditingProfile ? (
                                    <>
                                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-5 py-2 rounded-xl text-sm font-bold text-[#8a8060] hover:bg-gray-100 dark:hover:bg-[#2a261a] transition-colors">{t('common.cancel')}</button>
                                        <button type="submit" className="px-5 py-2 rounded-xl bg-primary text-[#181611] text-sm font-bold hover:bg-yellow-400 shadow-md transition-colors">{t('common.save')}</button>
                                    </>
                                ) : (
                                    <button type="button" onClick={() => setIsEditingProfile(true)} className="px-5 py-2 rounded-xl bg-primary text-[#181611] text-sm font-bold hover:bg-yellow-400 shadow-md transition-colors">{t('common.edit')}</button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'addresses' && (
                    <div className="bg-white dark:bg-[#1a170d] rounded-2xl shadow-sm border border-[#e6e3db] dark:border-[#332f20] p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-[#181611] dark:text-white">My Addresses</h2>
                            <button onClick={handleAddNewAddress} className="px-5 py-2 rounded-xl bg-primary text-[#181611] text-sm font-bold hover:bg-yellow-400 shadow-md transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">add</span> Add New
                            </button>
                        </div>
                        <div className="space-y-4">
                            {addresses.length === 0 ? (
                                <p className="text-[#8a8060] text-center py-4">No addresses saved. Add one to get started!</p>
                            ) : (
                                addresses.map(addr => (
                                    <div key={addr.id} className="flex items-center justify-between p-4 bg-[#f5f3f0] dark:bg-[#2a261a] rounded-xl border border-[#e6e3db] dark:border-[#332f20]">
                                        <div>
                                            <h3 className="font-bold text-[#181611] dark:text-white">{addr.name} {addr.isDefault && <span className="text-xs font-medium text-primary ml-2 bg-primary/10 px-2 py-0.5 rounded-full">{t('common.default')}</span>}</h3>
                                            <p className="text-sm text-[#8a8060]">{addr.street}, {addr.city}</p>
                                            <p className="text-sm text-[#8a8060]">{addr.state} {addr.zip}, {addr.country}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditAddress(addr)} className="text-primary hover:text-yellow-600 transition-colors p-2">
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-500 hover:text-red-700 transition-colors p-2">
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'wishlist' && (
                    <div className="bg-white dark:bg-[#1a170d] rounded-2xl shadow-sm border border-[#e6e3db] dark:border-[#332f20] p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-[#181611] dark:text-white">{t('profile.my_wishlist')}</h2>
                            <button onClick={handleShareWishlist} className="px-5 py-2 rounded-xl bg-primary text-[#181611] text-sm font-bold hover:bg-yellow-400 shadow-md transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">share</span> Share
                            </button>
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-sm font-medium text-[#8a8060]">Sort by:</span>
                            <div className="relative">
                                <select 
                                    value={sortOption}
                                    onChange={(e) => setSortOption(e.target.value)}
                                    className="appearance-none bg-[#f5f3f0] dark:bg-[#2a261a] border border-[#e6e3db] dark:border-[#332f20] rounded-lg py-2 pl-4 pr-10 text-sm font-medium text-[#181611] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                                >
                                    <option value="default">Default</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="name">Name (A-Z)</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-lg">expand_more</span>
                            </div>
                        </div>

                        {wishlistProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-6xl text-gray-200 dark:text-gray-700 mb-4">favorite</span>
                                <h3 className="text-xl font-bold text-[#181611] dark:text-white mb-2">{t('profile.wishlist_empty')}</h3>
                                <p className="text-[#8a8060] mb-6">Start adding your favorite toys!</p>
                                <Link to="/shop" className="bg-primary hover:bg-yellow-400 text-[#181611] font-bold py-3 px-8 rounded-xl transition-colors inline-flex items-center gap-2">
                                    {t('cart.start_shopping')}
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {wishlistProducts.map(product => (
                                    <div key={product.id} className="group bg-[#f5f3f0] dark:bg-[#2a261a] rounded-xl border border-[#e6e3db] dark:border-[#332f20] overflow-hidden hover:shadow-lg transition-all flex flex-col relative">
                                        <Link to={`/product/${product.id}`} className="relative aspect-square bg-white dark:bg-[#332f20] overflow-hidden block">
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <button 
                                                onClick={(e) => { e.preventDefault(); setQuickViewProduct(product); }}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold flex-col gap-1"
                                            >
                                                <span className="material-symbols-outlined text-3xl">visibility</span>
                                                Quick View
                                            </button>
                                            <button 
                                                onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
                                                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-red-50 text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[20px] fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                            </button>
                                        </Link>
                                        <div className="p-4 flex flex-col flex-1">
                                            <Link to={`/product/${product.id}`} className="font-bold text-lg text-[#181611] dark:text-white hover:text-primary transition-colors mb-1">{product.name}</Link>
                                            <p className="text-sm text-[#8a8060] mb-3">{product.category}</p>
                                            <div className="mt-auto flex items-center justify-between">
                                                <span className="font-bold text-lg text-primary">{formatPrice(product.price)}</span>
                                                <button 
                                                    onClick={() => { addToCart(product); displayToast(`${product.name} added to cart!`); }}
                                                    className="bg-primary hover:bg-yellow-400 text-[#181611] p-2.5 rounded-lg transition-colors active:scale-95 flex items-center gap-2 text-sm font-bold"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                                                    {t('product.add_to_cart')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'active' && (
                    <div className="bg-white dark:bg-[#1a170d] rounded-2xl shadow-sm border border-[#e6e3db] dark:border-[#332f20] p-6">
                        <h2 className="text-2xl font-bold mb-6 text-[#181611] dark:text-white">{t('profile.tab.active')}</h2>
                        {activeOrders.length === 0 ? (
                            <p className="text-[#8a8060] text-center py-4">No active orders at the moment. Time to shop!</p>
                        ) : (
                            <div className="space-y-6">
                                {activeOrders.map(order => (
                                    <div key={order.id} className="bg-[#f5f3f0] dark:bg-[#2a261a] rounded-xl p-4 border border-[#e6e3db] dark:border-[#332f20]">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-[#181611] dark:text-white">Order {order.id}</h3>
                                                <p className="text-sm text-[#8a8060]">{order.date} • {order.items.length} items</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                order.status === 'Processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                order.status === 'Shipped' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {order.items.slice(0, 3).map((item, index) => (
                                                <img key={index} src={item.image} alt={item.name} className="size-12 object-cover rounded-md border border-[#e6e3db] dark:border-[#332f20]" />
                                            ))}
                                            {order.items.length > 3 && (
                                                <div className="size-12 flex items-center justify-center bg-[#e6e3db] dark:bg-[#332f20] text-sm font-bold text-[#8a8060] rounded-md">
                                                    +{order.items.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center border-t border-[#e6e3db] dark:border-[#332f20] pt-4">
                                            <span className="font-bold text-lg text-[#181611] dark:text-white">{formatPrice(order.total)}</span>
                                            <button onClick={() => setSelectedOrder(order)} className="px-4 py-2 rounded-xl bg-primary text-[#181611] text-sm font-bold hover:bg-yellow-400 transition-colors flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">visibility</span> View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'past' && (
                    <div className="bg-white dark:bg-[#1a170d] rounded-2xl shadow-sm border border-[#e6e3db] dark:border-[#332f20] p-6">
                        <h2 className="text-2xl font-bold mb-6 text-[#181611] dark:text-white">{t('profile.tab.past')}</h2>
                        {pastOrders.length === 0 ? (
                            <p className="text-[#8a8060] text-center py-4">No past orders yet. Keep shopping!</p>
                        ) : (
                            <div className="space-y-6">
                                {pastOrders.map(order => (
                                    <div key={order.id} className="bg-[#f5f3f0] dark:bg-[#2a261a] rounded-xl p-4 border border-[#e6e3db] dark:border-[#332f20]">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-[#181611] dark:text-white">Order {order.id}</h3>
                                                <p className="text-sm text-[#8a8060]">{order.date} • {order.items.length} items</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                order.status === 'Delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {order.items.slice(0, 3).map((item, index) => (
                                                <img key={index} src={item.image} alt={item.name} className="size-12 object-cover rounded-md border border-[#e6e3db] dark:border-[#332f20]" />
                                            ))}
                                            {order.items.length > 3 && (
                                                <div className="size-12 flex items-center justify-center bg-[#e6e3db] dark:bg-[#332f20] text-sm font-bold text-[#8a8060] rounded-md">
                                                    +{order.items.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center border-t border-[#e6e3db] dark:border-[#332f20] pt-4">
                                            <span className="font-bold text-lg text-[#181611] dark:text-white">{formatPrice(order.total)}</span>
                                            <button onClick={() => setSelectedOrder(order)} className="px-4 py-2 rounded-xl bg-primary text-[#181611] text-sm font-bold hover:bg-yellow-400 transition-colors flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg">visibility</span> View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal />
      {/* Address Management Modal */}
      <AddressModal />
      {/* Order Details Modal */}
      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

      {/* Toast Notification */}
      {showToast && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-[fadeIn_0.3s_ease-out]">
              {toastMessage}
          </div>
      )}
    </div>
  );
};

export default Profile;
