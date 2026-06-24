import { useEffect, useState } from 'react';
import { getUsers, deleteUser } from '../../services/adminApi';

interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    createdAt?: string;
}

export default function UsersView() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getUsers(page, 20, search || undefined);
            setUsers(result.data);
            setTotalPages(result.pages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            setDeleting(userId);
            await deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
            alert('User deleted successfully');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) return <div className="p-6 text-center">Loading users...</div>;
    if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Customer Management</h2>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="px-4 py-2 border rounded-lg w-64"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-3 text-left">Name</th>
                            <th className="border p-3 text-left">Email</th>
                            <th className="border p-3 text-left">Phone</th>
                            <th className="border p-3 text-left">Joined</th>
                            <th className="border p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="border p-3 text-center text-gray-500">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-100">
                                    <td className="border p-3">{user.name}</td>
                                    <td className="border p-3">{user.email}</td>
                                    <td className="border p-3">{user.phone || '-'}</td>
                                    <td className="border p-3">
                                        {user.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString()
                                            : '-'}
                                    </td>
                                    <td className="border p-3 text-center">
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            disabled={deleting === user.id}
                                            className={`px-3 py-1 rounded text-sm font-semibold ${deleting === user.id
                                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                    : 'bg-red-600 text-white hover:bg-red-700'
                                                }`}
                                        >
                                            {deleting === user.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-6">
                <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`px-4 py-2 rounded ${page === 1
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    Previous
                </button>
                <span className="text-gray-700">
                    Page {page} of {totalPages}
                </span>
                <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className={`px-4 py-2 rounded ${page === totalPages
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
