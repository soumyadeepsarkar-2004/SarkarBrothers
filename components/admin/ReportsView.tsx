import { useEffect, useState } from 'react';
import { getReportSummary, ReportSummary } from '../../services/adminApi';

export default function ReportsView() {
    const [report, setReport] = useState<ReportSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getReportSummary(startDate || undefined, endDate || undefined);
            setReport(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleFilter = () => {
        fetchReport();
    };

    if (loading) return <div className="p-6 text-center">Loading report...</div>;
    if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
    if (!report) return <div className="p-6 text-center">No data available</div>;

    const statusColors: Record<string, string> = {
        Processing: 'text-yellow-600',
        Shipped: 'text-blue-600',
        Delivered: 'text-green-600',
        Cancelled: 'text-red-600',
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Sales Reports</h2>

            {/* Date Filters */}
            <div className="flex gap-4 mb-6 items-end">
                <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border rounded px-3 py-2"
                    />
                </div>
                <button
                    onClick={handleFilter}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Apply Filter
                </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Total Orders</div>
                    <div className="text-3xl font-bold text-blue-600">{report.totalOrders}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Total Revenue</div>
                    <div className="text-3xl font-bold text-green-600">
                        ₹{report.totalRevenue.toLocaleString()}
                    </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Avg Order Value</div>
                    <div className="text-3xl font-bold text-purple-600">
                        ₹{(report.totalRevenue / Math.max(report.totalOrders, 1)).toFixed(0)}
                    </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Order Status</div>
                    <div className="text-sm font-semibold">View breakdown below</div>
                </div>
            </div>

            {/* Order Status Distribution */}
            {report.ordersByStatus.length > 0 && (
                <div className="bg-white border rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-bold mb-4">Orders by Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {report.ordersByStatus.map((status) => (
                            <div key={status._id} className="border rounded-lg p-4">
                                <div className={`text-lg font-semibold ${statusColors[status._id] || 'text-gray-600'}`}>
                                    {status._id}
                                </div>
                                <div className="text-2xl font-bold text-gray-800 mt-2">
                                    {status.count}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Products */}
            {report.topProducts.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4">Top 10 Products by Sales</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 px-3">Rank</th>
                                    <th className="text-left py-2 px-3">Product ID</th>
                                    <th className="text-left py-2 px-3">Units Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.topProducts.map((product, idx) => (
                                    <tr key={product._id} className="border-b hover:bg-gray-50">
                                        <td className="py-2 px-3 font-semibold">#{idx + 1}</td>
                                        <td className="py-2 px-3">{product._id}</td>
                                        <td className="py-2 px-3 font-semibold text-blue-600">
                                            {product.count} units
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
