import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Sector,
} from 'recharts';



const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#a855f7', '#f97316', '#64748b'];
const STATUS_COLORS = { pending: '#f59e0b', confirmed: '#3b82f6', completed: '#22c55e', cancelled: '#ef4444' };

const fmt = (v) => Number(v).toLocaleString('vi-VN') + 'đ';
const fmtShort = (v) => {
    if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'tỷ';
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'tr';
    if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k';
    return v.toLocaleString('vi-VN');
};

const CustomTooltipRevenue = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
                <p className="font-bold text-gray-800 mb-1">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }}>
                        {p.name}: <strong>{p.name === 'Doanh thu' ? fmt(p.value) : p.value}</strong>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
        <g>
            <text x={cx} y={cy - 12} textAnchor="middle" fill="#111827" className="text-sm font-bold" fontSize={13} fontWeight={700}>
                {payload.name}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#6b7280" fontSize={12}>
                {fmt(value)}
            </text>
            <text x={cx} y={cy + 28} textAnchor="middle" fill="#6b7280" fontSize={12}>
                {(percent * 100).toFixed(1)}%
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius - 2} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        </g>
    );
};

const Statistics = () => {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [period, setPeriod] = useState('month');
    const [overview, setOverview] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [facilityData, setFacilityData] = useState([]);
    const [customerData, setCustomerData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFacility, setActiveFacility] = useState(0);
    const [activeCustomer, setActiveCustomer] = useState(0);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [ov, rev, fac, cust, stat] = await Promise.all([
                api.get('/stats/overview'),
                api.get(`/stats/revenue-by-period?period=${period}&year=${year}`),
                api.get(`/stats/revenue-by-facility?year=${year}`),
                api.get(`/stats/top-customers?year=${year}`),
                api.get('/stats/booking-status'),
            ]);
            setOverview(ov.data);
            setRevenueData(rev.data);
            setFacilityData(fac.data);
            setCustomerData(cust.data);
            setStatusData(stat.data);
        } catch (e) {
            console.error('Stats error:', e);
        } finally {
            setLoading(false);
        }
    }, [period, year]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const PERIODS = [
        { key: 'day', label: 'Ngày' },
        { key: 'week', label: 'Tuần' },
        { key: 'month', label: 'Tháng' },
        { key: 'quarter', label: 'Quý' },
        { key: 'year', label: 'Năm' },
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Đang tải dữ liệu thống kê...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">📊 Thống Kê & Báo Cáo</h1>
                    <p className="text-gray-500 text-sm">Tổng quan doanh thu, lượng đặt sân và khách hàng</p>
                </div>

                {/* KPI Cards */}
                {overview && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                        {[
                            { label: 'Tổng doanh thu', value: fmt(overview.totalRevenue), icon: '💰', color: 'from-green-500 to-emerald-600' },
                            { label: 'Tổng lịch đặt', value: overview.totalBookings, icon: '📅', color: 'from-blue-500 to-indigo-600' },
                            { label: 'Hoàn thành', value: overview.completedBookings, icon: '✅', color: 'from-teal-500 to-cyan-600' },
                            { label: 'Chờ xác nhận', value: overview.pendingBookings, icon: '⏳', color: 'from-amber-500 to-orange-500' },
                            { label: 'Đã hủy', value: overview.cancelledBookings, icon: '❌', color: 'from-red-500 to-rose-600' },
                        ].map((kpi, i) => (
                            <div key={i} className={`bg-gradient-to-br ${kpi.color} rounded-2xl p-4 text-white shadow-md`}>
                                <div className="text-2xl mb-1">{kpi.icon}</div>
                                <p className="text-white/80 text-xs font-medium">{kpi.label}</p>
                                <p className="text-xl font-bold mt-0.5 truncate">{kpi.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Revenue by Period - Bar Chart */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Doanh thu theo thời gian</h2>
                            <p className="text-xs text-gray-400">Chỉ tính lịch đã xác nhận hoặc hoàn thành</p>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            {/* Period tabs */}
                            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                {PERIODS.map(p => (
                                    <button
                                        key={p.key}
                                        onClick={() => setPeriod(p.key)}
                                        className={`px-3 py-1.5 text-xs font-semibold transition-all ${period === p.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >{p.label}</button>
                                ))}
                            </div>
                            {/* Year selector */}
                            {period !== 'day' && (
                                <select
                                    value={year}
                                    onChange={e => setYear(parseInt(e.target.value))}
                                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700"
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            )}
                        </div>
                    </div>

                    {revenueData.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">Chưa có dữ liệu doanh thu trong kỳ này</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" tickFormatter={fmtShort} tick={{ fontSize: 11 }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltipRevenue />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                <Bar yAxisId="right" dataKey="count" name="Số lịch" fill="#22c55e" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Row 2: Facility Pie + Status Pie */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                    {/* Revenue by Facility */}
                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Doanh thu theo sân</h2>
                        <p className="text-xs text-gray-400 mb-4">Top 10 sân có doanh thu cao nhất</p>
                        {facilityData.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">Chưa có dữ liệu</div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            activeIndex={activeFacility}
                                            activeShape={renderActiveShape}
                                            data={facilityData}
                                            dataKey="revenue"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={95}
                                            onMouseEnter={(_, idx) => setActiveFacility(idx)}
                                        >
                                            {facilityData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => fmt(v)} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Legend */}
                                <div className="w-full mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                                    {facilityData.map((f, i) => {
                                        const total = facilityData.reduce((s, x) => s + x.revenue, 0);
                                        const pct = total > 0 ? ((f.revenue / total) * 100).toFixed(1) : 0;
                                        return (
                                            <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }}></span>
                                                    <span className="truncate">{f.name}</span>
                                                </div>
                                                <span className="flex-shrink-0 font-semibold ml-2">{pct}% · {f.count} lịch</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Booking Status Distribution */}
                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Phân bố trạng thái lịch đặt</h2>
                        <p className="text-xs text-gray-400 mb-4">Tổng toàn bộ lịch trong hệ thống</p>
                        {statusData.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">Chưa có dữ liệu</div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={95}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                            labelLine={false}
                                        >
                                            {statusData.map((entry, i) => (
                                                <Cell key={i} fill={STATUS_COLORS[entry.status] || COLORS[i]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => `${v} lịch`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-full mt-2 grid grid-cols-2 gap-2">
                                    {statusData.map((s, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <span className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[s.status] || COLORS[i] }}></span>
                                            <span className="text-gray-600">{s.name}:</span>
                                            <span className="font-bold">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Customers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                    {/* Pie chart */}
                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Top khách hàng chi tiêu nhiều nhất</h2>
                        <p className="text-xs text-gray-400 mb-4">% trên tổng chi tiêu của top 10</p>
                        {customerData.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">Chưa có dữ liệu</div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            activeIndex={activeCustomer}
                                            activeShape={renderActiveShape}
                                            data={customerData}
                                            dataKey="totalSpent"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={95}
                                            onMouseEnter={(_, idx) => setActiveCustomer(idx)}
                                        >
                                            {customerData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-full mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                                    {customerData.map((c, i) => {
                                        const total = customerData.reduce((s, x) => s + x.totalSpent, 0);
                                        const pct = total > 0 ? ((c.totalSpent / total) * 100).toFixed(1) : 0;
                                        return (
                                            <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }}></span>
                                                    <span className="truncate">{c.name}</span>
                                                </div>
                                                <span className="flex-shrink-0 font-semibold ml-2">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Bảng xếp hạng khách hàng</h2>
                        {customerData.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">Chưa có dữ liệu</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-left">
                                            <th className="px-3 py-2 text-xs font-semibold text-gray-500 rounded-l-lg">#</th>
                                            <th className="px-3 py-2 text-xs font-semibold text-gray-500">Khách hàng</th>
                                            <th className="px-3 py-2 text-xs font-semibold text-gray-500">Số lịch</th>
                                            <th className="px-3 py-2 text-xs font-semibold text-gray-500 rounded-r-lg">Tổng chi tiêu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {customerData.map((c, i) => (
                                            <tr key={i} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-3 py-2.5">
                                                    <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-gray-200 text-gray-600'
                                                        }`}>
                                                        {i + 1}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                                                    <p className="text-gray-400 text-xs truncate max-w-[140px]">{c.email}</p>
                                                </td>
                                                <td className="px-3 py-2.5 text-gray-700 font-medium">{c.bookingCount}</td>
                                                <td className="px-3 py-2.5 text-blue-700 font-bold">{fmt(c.totalSpent)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Statistics;
