import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

const DbaConsole = () => {
    const [dbInfo, setDbInfo] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchDbaData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const resUsers = await fetch(`${API_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataUsers = await resUsers.json();
            setUsers(dataUsers.users || dataUsers || []);

            const resStats = await fetch(`${API_URL}/api/admin/analytics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resStats.ok) {
                const dataStats = await resStats.json();
                setDbInfo(dataStats || null);
            }
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDbaData();
    }, []);

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                alert('User role updated successfully!');
                fetchDbaData();
            } else {
                const errData = await res.json();
                alert(errData.error || 'Failed to update user role.');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to connect to the server.');
        }
    };

    if (loading) {
        return <div className="p-8 text-gray-500 font-semibold">Loading secure DBA metrics...</div>;
    }

    return (
        <div className="p-8 space-y-8 max-w-5xl">
            <h1 className="text-4xl font-bold flex items-center gap-3 text-red-600">
                <span className="material-symbols-outlined text-4xl">terminal</span>
                Secure DBA Console
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500">dns</span> DB Connection status
                    </h2>
                    <div className="space-y-2">
                        <p className="text-sm">Status: <span className="font-bold text-green-600">Active (Online)</span></p>
                        <p className="text-sm">Driver Mode: <span className="font-mono text-xs">mongoose (v8.x)</span></p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">analytics</span> Collections Stats
                    </h2>
                    <div className="space-y-2">
                        <p className="text-sm">Total registered users: <span className="font-bold">{users.length}</span></p>
                        <p className="text-sm">Total catalog products: <span className="font-bold">{dbInfo?.totalProducts || 0}</span></p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600">manage_accounts</span> User Account Permissions
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b text-gray-500 text-xs font-bold uppercase">
                                <th className="py-3 px-4">Name</th>
                                <th className="py-3 px-4">Email</th>
                                <th className="py-3 px-4">Current Role</th>
                                <th className="py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {users.map((u: any) => (
                                <tr key={u.id || u._id}>
                                    <td className="py-3 px-4 font-bold">{u.name || 'N/A'}</td>
                                    <td className="py-3 px-4">{u.email}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                            u.role === 'admin' || u.role === 'dba' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                        }`}>{u.role}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleUpdate(u.id || u._id, e.target.value)}
                                            className="border rounded p-1 text-xs outline-none bg-gray-50"
                                        >
                                            <option value="customer">customer</option>
                                            <option value="owner">owner</option>
                                            <option value="dba">dba</option>
                                            <option value="admin">admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default function AdminApp() {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, portal: 'admin' })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                if (data.user.role === 'admin' || data.user.role === 'dba') {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('adminUser', JSON.stringify(data.user));
                    setToken(data.token);
                    window.location.reload();
                } else {
                    setError('Access denied: Requires DBA / Administrator privileges.');
                }
            } else {
                setError(data.error || 'Invalid credentials.');
            }
        } catch (err) {
            setError('Connection failed. Please check backend.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        setToken(null);
        window.location.reload();
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200">
                    <div className="text-center mb-6">
                        <img src="/image.svg" alt="Sarkar Brothers" className="h-16 mx-auto mb-4 object-contain" />
                        <h2 className="text-2xl font-bold text-gray-900">Admin & DBA Portal</h2>
                        <p className="text-sm text-gray-500 mt-1">Sign in with administrator credentials</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50"
                                placeholder="dba@sarkarbrothers.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <div className="flex h-screen bg-gray-100 overflow-hidden relative">
                {/* Mobile Top Navbar */}
                <div className="md:hidden w-full bg-red-950 text-white h-16 flex items-center justify-between px-4 absolute top-0 left-0 z-20 border-b border-red-900">
                    <div className="flex items-center gap-2">
                        <img src="/image.svg" alt="Sarkar Brothers" className="h-10 object-contain bg-white p-0.5 rounded" />
                        <span className="text-xs font-bold uppercase tracking-wider text-red-200">DBA Console</span>
                    </div>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 focus:outline-none">
                        <span className="material-symbols-outlined text-3xl">menu</span>
                    </button>
                </div>

                {/* Sidebar (Desktop & Mobile drawer overlay) */}
                <div className={`
                    fixed md:static inset-y-0 left-0 w-64 bg-gray-900 text-white p-6 space-y-6 flex flex-col shrink-0 z-30 transition-transform duration-300 transform
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                `}>
                    <div className="flex justify-between items-center md:block">
                        <div className="flex flex-col gap-2">
                            <img src="/image.svg" alt="Sarkar Brothers Logo" className="h-16 w-auto object-contain bg-white p-1 rounded-md" />
                            <span className="text-xs text-red-400 text-center font-bold tracking-wider uppercase">
                                Admin & DBA Portal
                            </span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white">
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>
                    <nav className="space-y-2 flex-1">
                        <Link to="/" onClick={() => setSidebarOpen(false)} className="block px-4 py-2 rounded bg-red-950/40 border border-red-900/30 text-red-200 hover:bg-gray-700 font-semibold flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">terminal</span> DBA Console
                        </Link>
                    </nav>
                    <button
                        onClick={handleLogout}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors mt-auto flex items-center justify-center gap-2"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Dark overlay when mobile sidebar is open */}
                {sidebarOpen && (
                    <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden"></div>
                )}

                {/* Main Content Container */}
                <div className="flex-grow flex flex-col overflow-y-auto bg-gray-50 pt-16 md:pt-0 w-full">
                    <div className="flex-grow">
                        <Routes>
                            <Route path="/" element={<DbaConsole />} />
                        </Routes>
                    </div>
                    
                    <footer className="bg-white text-gray-500 py-4 px-8 border-t border-gray-200 text-xs flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
                        <p>&copy; {new Date().getFullYear()} SarkarBrothers DBA Portal. All rights reserved.</p>
                        <div className="flex gap-4">
                            <span>Support: contact@sarkarbrothers.com</span>
                            <span>Tel: +91 72785 70727</span>
                        </div>
                    </footer>
                </div>
            </div>
        </BrowserRouter>
    );
}
