import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, DollarSign, Clock, CheckCircle, ArrowRight, Cookie } from 'lucide-react';
import { formatPrice, formatShortDate, getStatusLabel, STATUS_BADGE_CLASSES } from '@/lib/format';

export default function Dashboard() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 200),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('sort_order', 100),
  });

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.created_date?.startsWith(today));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.order_total || 0), 0);
  const pendingOrders = orders.filter(o => ['awaiting_confirmation', 'awaiting_payment', 'awaiting_payment_verification', 'preparing_order'].includes(o.order_status));
  const completedOrders = orders.filter(o => o.order_status === 'completed');
  const activeProducts = products.filter(p => p.availability !== 'hidden');
  const recentOrders = orders.slice(0, 6);

  const stats = [
    { label: "Today's Orders", value: todayOrders.length, icon: ShoppingBag, color: 'bg-blue-100 text-blue-700' },
    { label: "Today's Revenue", value: formatPrice(todayRevenue), icon: DollarSign, color: 'bg-green-100 text-green-700' },
    { label: 'Pending Orders', value: pendingOrders.length, icon: Clock, color: 'bg-amber-100 text-amber-700' },
    { label: 'Completed Orders', value: completedOrders.length, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 shadow-warm-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="font-label text-xs text-muted-foreground mb-1">{stat.label}</p>
            <p className="font-heading text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-card rounded-2xl shadow-warm-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-bold">Recent Orders</h2>
            <Link to="/admin/orders" className="flex items-center gap-1 font-label text-sm text-primary hover:underline">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin mx-auto"></div>
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-label text-xs text-muted-foreground pb-3">Order #</th>
                    <th className="text-left font-label text-xs text-muted-foreground pb-3">Customer</th>
                    <th className="text-left font-label text-xs text-muted-foreground pb-3 hidden md:table-cell">Date</th>
                    <th className="text-left font-label text-xs text-muted-foreground pb-3">Total</th>
                    <th className="text-left font-label text-xs text-muted-foreground pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="py-3 font-heading text-sm">{order.order_number}</td>
                      <td className="py-3 text-sm">{order.customer_name}</td>
                      <td className="py-3 text-sm hidden md:table-cell">{order.created_date ? formatShortDate(order.created_date) : '-'}</td>
                      <td className="py-3 text-sm font-semibold">{formatPrice(order.order_total)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-label ${STATUS_BADGE_CLASSES[order.order_status] || 'bg-secondary'}`}>
                          {getStatusLabel(order.order_status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-card rounded-2xl shadow-warm-sm p-6">
          <h2 className="font-heading text-xl font-bold mb-6">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Cookie className="w-5 h-5 text-primary" />
                <span className="text-sm">Active Products</span>
              </div>
              <span className="font-heading text-xl font-bold">{activeProducts.length}</span>
            </div>
            <Link to="/admin/products" className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors">
              <span className="text-sm">Manage Products</span>
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
            <Link to="/admin/today-menu" className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors">
              <span className="text-sm">Today's Menu</span>
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
            <Link to="/admin/settings" className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors">
              <span className="text-sm">Settings</span>
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}