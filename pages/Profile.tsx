
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { Product, Address, Order } from '../types';
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
                            {/* @ts-ignore */}
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

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'past' | 'wishlist' | 'profile' | 'addresses'>('active');
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Wishlist specific state
  const [sortOption, setSortOption] = useState<string>('default');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Async Data State
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userProfile, setUserProfile] = useState<any>({
    name: 'Loading...',
    email: '',
    phone: '',
    avatar: '',
    bio: '',
    preferences: {}
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Form States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(userProfile);
  const [addressModal, setAddressModal] = useState<{ open: boolean; step: 'map' | 'form' }>({ open: false, step: 'map' });
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({});

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const [profileData, ordersData] = await Promise.all([
                api.user.getProfile(),
                api.user.getOrders()
            ]);
            setUserProfile(profileData);
            setProfileForm(profileData);
            setOrders(ordersData);
            
            // Hardcoded addresses for now as API might not return them in mock
            setAddresses([
                { id: '1', name: 'Home', street: '123 Maple Avenue', city: 'Springfield', state: 'IL', zip: '62704', country: 'United States', isDefault: true, coordinates: { lat: 39.7817, lng: -89.6501 } },
                { id: '2', name: 'Work', street: '456 Tech Blvd, Suite 200', city: 'Chicago', state: 'IL', zip: '60601', country: 'United States', isDefault: false, coordinates: { lat: 41.8781, lng: -87.6298 } }
            ]);
        } catch (e) {
            console.error("Failed to fetch profile data", e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

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

  const showToast = (msg: string) => {
      setToastMessage(msg);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
  };

  const handleShareWishlist = () => {
      // Create a shareable link (mock)
      const url = `${window.location.origin}/#/shop?wishlist=${userProfile.id || 'shared'}`;
      navigator.clipboard.writeText(url).then(() => {
          showToast("Wishlist link copied to clipboard!");
      }).catch(() => {
          showToast("Copied: " + url);
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
              showToast("Image selected. Save to apply.");
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const updated = await api.user.updateProfile(profileForm);
          setUserProfile(updated);
          setIsEditingProfile(false);
          showToast('Profile updated successfully!');
      } catch (err) {
          showToast('Failed to update profile.');
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
          showToast('Address deleted.');
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
          showToast('Address updated.');
      } else {
          const newId = Math.random().toString(36).substr(2, 9);
          setAddresses(prev => [...prev, { ...addressForm, id: newId, isDefault: addressForm.isDefault || prev.length === 0 } as Address]);
          showToast('New address added.');
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

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
          <div className="flex flex-col h-full justify-between p-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 pb-6 border-b border-[#e6e3db] dark:border-[#332f20]">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 ring-2 ring-primary relative group cursor-pointer" onClick={() => setActiveTab('profile')}>
                    <div style={{ backgroundImage: `url("${userProfile.avatar}")` }} className="w-full h-full rounded-full bg-cover bg-center"></div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-[#181611] dark:text-white text-base font-bold leading-normal truncate max-w-[150px]">{userProfile.name}</h1>
                  <span className="text-[10px] text-gray-400">Completion: 80%</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'text-[#181611] dark:text-white hover:bg-[#f5f3f0] dark:hover:bg-[#2c281b]'}`}>
                  <span className="material-symbols-outlined fill-current">person</span>
                  <p className="text-sm font-medium leading-normal">{t('profile.tab.profile')}</p>
                </button>
                <button onClick={() => setActiveTab('active')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${activeTab === 'active' || activeTab === 'past' ? 'bg-primary/10 text-primary' : 'text-[#181611] dark:text-white hover:bg-[#f5f3f0] dark:hover:bg-[#2c281b]'}`}>
                  <span className="material-symbols-outlined fill-current">inventory_2</span>
                  <p className="text-sm font-bold leading-normal">{t('profile.tab.active')}</p>
                </button>
                <button onClick={() => setActiveTab('wishlist')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${activeTab === 'wishlist' ? 'bg-primary/10 text-primary' : 'text-[#181611] dark:text-white hover:bg-[#f5f3f0] dark:hover:bg-[#2c281b]'}`}>
                    <span className="material-symbols-outlined fill-current">favorite</span>
                    <p className="text-sm font-medium leading-normal">{t('profile.tab.wishlist')}</p>
                </button>
                <button onClick={() => setActiveTab('addresses')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${activeTab === 'addresses' ? 'bg-primary/10 text-primary' : 'text-[#181611] dark:text-white hover:bg-[#f5f3f0] dark:hover:bg-[#2c281b]'}`}>
                    <span className="material-symbols-outlined fill-current">location_on</span>
                    <p className="text-sm font-medium leading-normal">{t('profile.tab.addresses')}</p>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1 pt-6 border-t border-[#e6e3db] dark:border-[#332f20]">
                <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full text-left">
                    <span className="material-symbols-outlined">logout</span>
                    <p className="text-sm font-medium leading-normal">{t('profile.logout')}</p>
                </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex flex-col flex-1 min-w-0 bg-background-light dark:bg-background-dark overflow-y-auto px-4 md:px-12 py-8">
            <div className="max-w-[1000px] w-full mx-auto flex flex-col gap-8 pb-20">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-[#181611] dark:text-white tracking-tight text-[32px] font-bold leading-tight">
                            {activeTab === 'wishlist' ? t('profile.my_wishlist') : 
                             activeTab === 'profile' ? t('profile.tab.profile') : 
                             activeTab === 'addresses' ? t('profile.tab.addresses') : t('profile.tab.active')}
                        </h2>
                    </div>
                </div>

                {activeTab === 'profile' && (
                    <div className="bg-white dark:bg-[#1a170d] rounded-xl border border-[#e6e3db] dark:border-[#332f20] shadow-sm overflow-hidden p-8 animate-[fadeIn_0.3s_ease-out]">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                             <div className="flex flex-col items-center gap-4">
                                <div className="relative group cursor-pointer" onClick={() => isEditingProfile && fileInputRef.current?.click()}>
                                    <div className="size-32 rounded-full bg-cover bg-center ring-4 ring-[#f5f3f0] dark:ring-[#2a261a]" style={{ backgroundImage: `url("${userProfile.avatar}")` }}></div>
                                    <div className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isEditingProfile ? 'cursor-pointer' : ''}`}>
                                        <span className="material-symbols-outlined text-white">{isEditingProfile ? 'photo_camera' : 'lock'}</span>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                                </div>
                             </div>

                             <form className="flex-1 w-full flex flex-col gap-6" onSubmit={handleSaveProfile}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-[#181611] dark:text-white">Full Name</label>
                                        <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} disabled={!isEditingProfile} className="w-full px-4 py-2.5 rounded-lg border border-[#e6e3db] dark:border-[#332f20] bg-[#f5f3f0] dark:bg-[#252525] text-[#181611] dark:text-white focus:ring-2 focus:ring-primary outline-none disabled:opacity-70 disabled:cursor-not-allowed" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-[#181611] dark:text-white">Email Address</label>
                                        <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} disabled={!isEditingProfile} className="w-full px-4 py-2.5 rounded-lg border border-[#e6e3db] dark:border-[#332f20] bg-[#f5f3f0] dark:bg-[#252525] text-[#181611] dark:text-white focus:ring-2 focus:ring-primary outline-none disabled:opacity-70 disabled:cursor-not-allowed" />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-[#e6e3db] dark:border-[#332f20]">
                                    {!isEditingProfile ? (
                                        <button type="button" onClick={() => { setIsEditingProfile(true); setProfileForm(userProfile); }} className="bg-[#f5f3f0] dark:bg-[#252525] hover:bg-[#e6e3db] text-[#181611] dark:text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2">
                                            <span className="material-symbols-outlined">edit</span> {t('common.edit')}
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => { setIsEditingProfile(false); setProfileForm(userProfile); }} className="text-red-500 font-bold py-2.5 px-6"> {t('common.cancel')} </button>
                                            <button type="submit" className="bg-primary hover:bg-yellow-400 text-[#181611] font-bold py-2.5 px-6 rounded-lg"> {t('common.save')} </button>
                                        </div>
                                    )}
                                </div>
                             </form>
                        </div>
                    </div>
                )}

                {activeTab === 'addresses' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.3s_ease-out]">
                        <button onClick={handleAddNewAddress} className="flex flex-col items-center justify-center min-h-[220px] border-2 border-dashed border-[#e6e3db] dark:border-[#332f20] rounded-xl hover:border-primary hover:bg-primary/5 transition-all group">
                            <div className="size-16 rounded-full bg-[#f5f3f0] dark:bg-[#252525] group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors"><span className="material-symbols-outlined text-[#8a8060] group-hover:text-primary text-3xl">add_location_alt</span></div>
                            <h3 className="font-bold text-lg text-[#181611] dark:text-white">Add New Address</h3>
                        </button>
                        {addresses.map(addr => (
                            <div key={addr.id} className="bg-white dark:bg-[#1a170d] rounded-xl border border-[#e6e3db] dark:border-[#332f20] p-6 flex flex-col relative shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`size-12 rounded-full flex items-center justify-center bg-[#f5f3f0] text-[#8a8060]`}><span className="material-symbols-outlined">place</span></div>
                                    <div><h3 className="font-bold text-lg text-[#181611] dark:text-white">{addr.name}</h3></div>
                                </div>
                                <div className="flex-1 text-sm text-[#5e584a] dark:text-gray-400 leading-relaxed mb-6"><p>{addr.street}</p><p>{addr.city}, {addr.state} {addr.zip}</p><p>{addr.country}</p></div>
                                <div className="flex items-center justify-between pt-4 border-t border-[#e6e3db] dark:border-[#332f20]">
                                    <button onClick={() => handleEditAddress(addr)} className="text-sm font-bold text-[#8a8060] hover:text-[#181611] dark:hover:text-white">{t('common.edit')}</button>
                                    <button onClick={() => handleDeleteAddress(addr.id)} className="text-sm font-bold text-red-400 hover:text-red-500">{t('common.delete')}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Orders and Wishlist Tabs */}
                {(activeTab === 'active' || activeTab === 'past' || activeTab === 'wishlist') && (
                    <div className="bg-white dark:bg-[#1a170d] rounded-xl border border-[#e6e3db] dark:border-[#332f20] shadow-sm overflow-hidden min-h-[500px] animate-[fadeIn_0.3s_ease-out]">
                    <div className="border-b border-[#e6e3db] dark:border-[#332f20] px-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex gap-8 overflow-x-auto no-scrollbar">
                                <button onClick={() => setActiveTab('active')} className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 whitespace-nowrap transition-colors ${activeTab === 'active' ? 'border-b-primary text-[#181611] dark:text-white' : 'border-b-transparent text-[#8a8060] hover:text-[#181611] dark:hover:text-white'}`}><p className="text-sm font-bold leading-normal">{t('profile.tab.active')}</p></button>
                                <button onClick={() => setActiveTab('past')} className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 whitespace-nowrap transition-colors ${activeTab === 'past' ? 'border-b-primary text-[#181611] dark:text-white' : 'border-b-transparent text-[#8a8060] hover:text-[#181611] dark:hover:text-white'}`}><p className="text-sm font-bold leading-normal">{t('profile.tab.past')}</p></button>
                                <button onClick={() => setActiveTab('wishlist')} className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 whitespace-nowrap transition-colors ${activeTab === 'wishlist' ? 'border-b-primary text-[#181611] dark:text-white' : 'border-b-transparent text-[#8a8060] hover:text-[#181611] dark:hover:text-white'}`}><p className="text-sm font-bold leading-normal">{t('profile.tab.wishlist')} ({wishlist.length})</p></button>
                            </div>
                            
                            {activeTab === 'wishlist' && (
                                <div className="flex items-center gap-3 pb-3 sm:pb-0 ml-auto">
                                     <div className="relative">
                                        <select
                                            value={sortOption}
                                            onChange={(e) => setSortOption(e.target.value)}
                                            className="appearance-none bg-white dark:bg-[#1a170d] border border-[#e6e3db] dark:border-[#332f20] text-[#181611] dark:text-white text-xs font-bold py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                                        >
                                            <option value="default">Default</option>
                                            <option value="price-low">Price: Low to High</option>
                                            <option value="price-high">Price: High to Low</option>
                                            <option value="name">Name (A-Z)</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">expand_more</span>
                                     </div>

                                     <button 
                                        onClick={handleShareWishlist}
                                        className="bg-primary/10 hover:bg-primary/20 text-[#181611] dark:text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                                     >
                                         <span className="material-symbols-outlined text-[16px]">share</span>
                                         Share
                                     </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full">
                        {activeTab === 'wishlist' ? (
                            <div className="p-6">
                                {wishlistProducts.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                        {wishlistProducts.map(product => (
                                            <div key={product.id} className="group bg-white dark:bg-[#1a170e] border border-[#f5f3f0] dark:border-[#332f25] rounded-xl overflow-hidden hover:shadow-lg transition-all flex flex-col relative">
                                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }} className="absolute top-2 right-2 z-20 bg-white/90 dark:bg-black/60 p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"><span className="material-symbols-outlined text-[18px]">close</span></button>
                                                
                                                {/* Quick View Trigger Overlay */}
                                                <div className="absolute inset-x-0 top-0 aspect-square z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/10 dark:bg-black/30 pointer-events-none">
                                                    <button 
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewProduct(product); }}
                                                        className="pointer-events-auto bg-white dark:bg-[#252525] text-[#181611] dark:text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                        Quick View
                                                    </button>
                                                </div>

                                                <Link to={`/product/${product.id}`} className="relative aspect-square bg-[#f8f8f8] dark:bg-[#252525] overflow-hidden block"><img alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src={product.image} /></Link>
                                                <div className="p-4 flex flex-col flex-1">
                                                    <Link to={`/product/${product.id}`} className="block"><h3 className="font-bold text-[#181611] dark:text-white text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">{product.name}</h3></Link>
                                                    <div className="mt-auto flex items-center justify-between">
                                                        <span className="text-lg font-bold text-[#181611] dark:text-white">{formatPrice(product.price)}</span>
                                                        <button 
                                                            onClick={(e) => { e.preventDefault(); addToCart(product); }} 
                                                            className="bg-primary hover:bg-yellow-400 text-[#181611] p-2 rounded-lg transition-colors shadow-sm active:scale-95"
                                                            title="Add to Cart"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px] block">add_shopping_cart</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-[#8a8060] dark:text-gray-400"><span className="material-symbols-outlined text-4xl mb-2 opacity-50">favorite</span><p>{t('profile.wishlist_empty')}</p></div>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-[#e6e3db] dark:divide-[#332f20]">
                                {(activeTab === 'active' ? activeOrders : pastOrders).map(order => (
                                    <div key={order.id} className="group">
                                        <div 
                                            className="flex flex-col md:flex-row md:items-center justify-between p-6 hover:bg-[#faf9f6] dark:hover:bg-[#252115] transition-colors cursor-pointer"
                                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                        >
                                            <div className="flex gap-4">
                                                <div className="flex -space-x-3">
                                                    {order.thumbnails.map((src, i) => (
                                                        <div key={i} className="bg-center bg-white bg-no-repeat aspect-square bg-cover rounded-full w-12 h-12 border-2 border-white dark:border-[#332f20] shadow-sm relative z-10" style={{ backgroundImage: `url("${src}")` }}></div>
                                                    ))}
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-[#181611] dark:text-white font-bold text-sm">Order #{order.id}</span>
                                                    <span className="text-[#8a8060] text-xs">{order.items.length} Items • {order.date}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0">
                                                <span className="text-[#181611] dark:text-white font-bold">{formatPrice(order.total)}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'Processing' ? 'bg-primary/15 text-yellow-700 dark:text-primary' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'}`}>
                                                        {order.status}
                                                    </span>
                                                    <span className={`material-symbols-outlined text-gray-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`}>expand_more</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Expandable Tracking Area */}
                                        {expandedOrder === order.id && (
                                            <div className="bg-[#fcfbf9] dark:bg-[#1f1b13] px-6 pb-6 pt-2 animate-[fadeIn_0.2s_ease-out]">
                                                <OrderTracker status={order.status} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(activeTab === 'active' ? activeOrders : pastOrders).length === 0 && (
                                    <div className="p-8 text-center text-[#8a8060] dark:text-gray-400"><span className="material-symbols-outlined text-4xl mb-2 opacity-50">inbox</span><p>No orders found.</p></div>
                                )}
                            </div>
                        )}
                    </div>
                    </div>
                )}
            </div>
        </section>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal />
      <AddressModal />

      {/* Toast Notification */}
      {showShareToast && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-[fadeIn_0.3s_ease-out]">
              {toastMessage}
          </div>
      )}
    </div>
  );
};

export default Profile;
