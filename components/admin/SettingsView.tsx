
import React, { useState, useEffect } from 'react';

interface SettingsViewProps {
    showToast: (message: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ showToast }) => {
    const [storeInfo, setStoreInfo] = useState({
        name: "SarkarBrothers'",
        email: 'contact@sarkarbrothers.com',
        phone: '+91 98765 43210',
        address: '123 Fun Lane, Joyville',
    });

    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('adminTheme') === 'dark');

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('adminTheme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('adminTheme', 'light');
        }
    }, [isDarkMode]);

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value });
    };

    const handleInfoSave = (e: React.FormEvent) => {
        e.preventDefault();
        showToast('Store information updated!');
    };

    return (
        <div className="animate-[fadeIn_0.3s_ease-out] space-y-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>

            {/* Store Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold mb-4">Store Information</h2>
                <form onSubmit={handleInfoSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="name" value={storeInfo.name} onChange={handleInfoChange} placeholder="Store Name" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    <input name="email" type="email" value={storeInfo.email} onChange={handleInfoChange} placeholder="Contact Email" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    <input name="phone" value={storeInfo.phone} onChange={handleInfoChange} placeholder="Phone Number" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    <input name="address" value={storeInfo.address} onChange={handleInfoChange} placeholder="Store Address" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    <div className="md:col-span-2 flex justify-end">
                        <button type="submit" className="bg-primary text-black font-bold py-2 px-4 rounded-lg">Save Info</button>
                    </div>
                </form>
            </div>

            {/* Appearance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold mb-4">Appearance</h2>
                <div className="flex justify-between items-center">
                    <label htmlFor="darkModeToggle" className="font-medium">Dark Mode</label>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isDarkMode ? 'bg-primary' : 'bg-gray-200'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
