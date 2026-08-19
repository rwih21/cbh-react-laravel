import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Award } from 'lucide-react';
import { formatPrice, getStatusLabel, PAYMENT_METHODS, ORDER_STATUSES } from '@/lib/format';

const CHART_COLORS = ['#B87D2B', '#6B7A5F', '#2C1A0E', '#C66B4E', '#D9C5B2', '#8B6914'];

export default function Analytics() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 500),
  });

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.order_total || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    return {
      totalRevenue,
      totalOrders: orders.length,
      avgOrderValue,
    };
  }, [orders]);

  const revenueData = useMemo(() => {
    const grouped = {};
    orders.forEach(o => {
      const date = o.created_date?.split('T')[0];
      if (date) {
        grouped[date] = (grouped[date] || 0) + (o.order_total || 0);
      }
    });
    return Object.entries(grouped)
      .map(([date, revenue]) => ({ date: date.slice(5), revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [orders]);

  const statusData = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      const label = getStatusLabel(o.order_status);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      o.items?.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + (item.quantity || 0);
      });
    });
    return Object.entries(counts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const paymentData = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      const method = PAYMENT_METHODS[o.payment_method] || o.payment_method;
      counts[method] = (counts[method] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const hourData = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      if (o.created_date) {
        const hour = new Date(o.created_date).getHours();
        counts[hour] = (counts[hour] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  }, [orders]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="font-heading text-3xl font-bold mb-4">Analytics</h1>
        <p className="text-muted-foreground">No orders yet. Analytics will appear once orders are placed.</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'bg-green-100 text-green-700' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
    { label: 'Avg Order Value', value: formatPrice(stats.avgOrderValue), icon: TrendingUp, color: 'bg-amber-100 text-amber-700' },
    { label: 'Top Product', value: topProducts[0]?.name || '-', icon: Award, color: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">Analytics</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 shadow-warm-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="font-label text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="font-heading text-xl font-bold truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-card rounded-2xl shadow-warm-sm p-6 mb-6">
        <h2 className="font-heading text-xl font-bold mb-6">Revenue (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9C5B2" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#4A3728" />
            <YAxis tick={{ fontSize: 12 }} stroke="#4A3728" tickFormatter={(v) => 'Rp ' + (v / 1000).toFixed(0) + 'k'} />
            <Tooltip formatter={(value) => formatPrice(value)} contentStyle={{ borderRadius: '12px', border: '1px solid #D9C5B2' }} />
            <Line type="monotone" dataKey="revenue" stroke="#B87D2B" strokeWidth={2} dot={{ fill: '#B87D2B', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-6">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #D9C5B2' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {statusData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-6">Payment Method Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {paymentData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #D9C5B2' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {paymentData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                <span>{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-6">Best & Least Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No product data.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-label text-xs ${
                      i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}>{i + 1}</span>
                    <span className="font-heading text-sm">{product.name}</span>
                  </div>
                  <span className="font-bold text-sm">{product.quantity} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-6">Peak Ordering Hours</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9C5B2" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#4A3728" />
              <YAxis tick={{ fontSize: 12 }} stroke="#4A3728" allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #D9C5B2' }} />
              <Bar dataKey="count" fill="#B87D2B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}