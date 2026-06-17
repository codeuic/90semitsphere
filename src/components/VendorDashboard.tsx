/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, CheckCircle2, XCircle, ShoppingBag, DollarSign, 
  Settings, UserCheck, MessageSquare, PlusCircle, Check, Loader2, Sparkles,
  Menu, X, Phone, MapPin, User, Compass
} from 'lucide-react';
import { Vendor, Product, Order, ChatMessage, Rider } from '../types';
import SettingsPanel from './SettingsPanel';
import OrderTrackerMap from './OrderTrackerMap';
import ImageUploadWithCrop from './ImageUploadWithCrop';

interface VendorDashboardProps {
  vendorId: string;
  currentUser: any;
  onUserUpdate?: (user: any) => void;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export default function VendorDashboard({ vendorId, currentUser, onUserUpdate, onLogout, theme = 'light', onThemeChange }: VendorDashboardProps) {
  const [vendorProfile, setVendorProfile] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  
  // Dashboard navigation tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'dispatch' | 'wallet' | 'settings'>('orders');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [vendorDateFilter, setVendorDateFilter] = useState<'all' | 'today' | 'month' | 'year'>('all');

  // Product CRUD states
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'Burgers',
    isAvailable: true,
    variants: '',
    addOns: [] as { name: string; price: number }[]
  });
  const [newAddOn, setNewAddOn] = useState({ name: '', price: '' });

  // Preferred rider configuration state
  const [dispatchMode, setDispatchMode] = useState<'auto' | 'preferred'>('auto');
  const [preferredRiders, setPreferredRiders] = useState<string[]>([]); // list of rider IDs

  // Wallet coordinates state
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Chat coordinates
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [newChatText, setNewChatText] = useState('');
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Poll live chat for specified order
  useEffect(() => {
    if (!activeChatOrderId) {
      setChatMessages([]);
      return;
    }
    const pullChats = async () => {
      try {
        const res = await fetch(`/api/chats/${activeChatOrderId}`);
        if (res.ok) {
          const d = await res.json();
          setChatMessages(d);
        }
      } catch(e) {}
    };
    pullChats();
    const interval = setInterval(pullChats, 3000);
    return () => clearInterval(interval);
  }, [activeChatOrderId]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatOrderId || !newChatText.trim()) return;

    try {
      const res = await fetch('/api/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeChatOrderId,
          senderId: vendorId,
          senderName: vendorProfile?.name || 'Restaurant staff',
          senderRole: 'vendor',
          text: newChatText
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, data.message]);
        setNewChatText('');
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchVendorData();
    fetchRiders();
    fetchVendorOrders();
    const interval = setInterval(fetchVendorOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { orderId } = customEvent.detail || {};
      if (orderId) {
        setActiveTab('orders');
        setActiveChatOrderId(orderId);
      }
    };
    window.addEventListener('navigate-to-order', handleNav);
    return () => window.removeEventListener('navigate-to-order', handleNav);
  }, []);

  const fetchVendorOrders = async () => {
    try {
      const res = await fetch(`/api/orders?vendorId=${vendorId}`);
      if (res.ok) {
        const d = await res.json();
        setOrders(d);
      }
    } catch(e) {}
  };

  const fetchVendorData = async () => {
    try {
      const res = await fetch('/api/admin/onboardings');
      const d = await res.json();
      
      const p = d.allVendors.find((v: Vendor) => v.id === vendorId);
      if (p) {
        setVendorProfile(p);
        
        // Load menu products
        const prdRes = await fetch(`/api/vendors/${vendorId}/products`);
        if (prdRes.ok) {
          const prdData = await prdRes.ok ? await prdRes.json() : [];
          setProducts(prdData);
        }
      }

      // Load transactions
      const transRes = await fetch(`/api/wallet/transactions/${vendorId}`);
      if (transRes.ok) {
        const trData = await transRes.json();
        setWalletTransactions(trData);
      }
    } catch(e) {}
  };

  const fetchRiders = async () => {
    try {
      const res = await fetch('/api/riders');
      if (res.ok) {
        const d = await res.json();
        setRiders(d.filter((r: Rider) => r.approvedStatus === 'APPROVED'));
      }
    } catch(e) {}
  };

  const handleUpdateProductStock = async (product: Product, checked: boolean) => {
    try {
      const res = await fetch('/api/products/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          isAvailable: checked
        })
      });
      if (res.ok) {
        fetchVendorData();
      }
    } catch(e) {}
  };

  const handleCreateOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const parsedVariants = productForm.variants
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    const payload = {
      id: editingProduct?.id || undefined,
      vendorId,
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      imageUrl: productForm.imageUrl || undefined,
      category: productForm.category,
      isAvailable: productForm.isAvailable,
      variants: parsedVariants,
      addOns: productForm.addOns
    };

    try {
      const res = await fetch('/api/products/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsEditingProduct(false);
        setEditingProduct(null);
        setProductForm({
          name: '',
          description: '',
          price: '',
          imageUrl: '',
          category: 'Burgers',
          isAvailable: true,
          variants: '',
          addOns: []
        });
        fetchVendorData();
      }
    } catch(e) {}
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if(!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVendorData();
      }
    } catch(e) {}
  };

  const handleAddAddOn = () => {
    if (!newAddOn.name || !newAddOn.price) return;
    setProductForm({
      ...productForm,
      addOns: [...productForm.addOns, { name: newAddOn.name, price: parseFloat(newAddOn.price) }]
    });
    setNewAddOn({ name: '', price: '' });
  };

  const handleRemoveAddOn = (index: number) => {
    setProductForm({
      ...productForm,
      addOns: productForm.addOns.filter((_, i) => i !== index)
    });
  };

  // Accept Order and trigger dispatch matching
  const handleAcceptOrder = async (orderId: string, accept: boolean) => {
    try {
      const res = await fetch('/api/orders/vendor-accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          accept,
          prepTime: 20
        })
      });
      if (res.ok) {
        alert(accept ? 'Order accepted! Dispatch courier search initiated.' : 'Order declined and refunded completely.');
        fetchVendorData();
      }
    } catch(e) {}
  };

  // Withdraw payout
  const handleWithdrawPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !vendorProfile) return;
    setLoading(true);

    try {
      const res = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: vendorProfile.userId,
          role: 'vendor',
          entityId: vendorId,
          amount: withdrawAmount
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Your withdrawal request has been submitted successfully and is awaiting Admin approval!');
        setWithdrawAmount('');
        fetchVendorData();
      } else {
        alert(data.message || 'Payout failed');
      }
    } catch (err) {
      alert('Error connecting logic payout api');
    } finally {
      setLoading(false);
    }
  };

  const getMyActiveOrdersStream = () => {
    // Return pre-seeded first mock item ord_1 to verify on-screen
    return [
      {
        id: 'ord_1',
        customerName: 'Isaac Irede',
        customerAddress: '45 Bode Thomas St, Surulere, Lagos',
        items: [{ name: 'Flame BBQ Bacon Burger', price: 4500, quantity: 1 }],
        subtotal: 4500,
        deliveryFee: 1200,
        serviceFee: 350,
        total: 5700,
        status: 'DELIVERED',
        createdAt: new Date().toISOString()
      } as any
    ];
  };

  if (vendorProfile && vendorProfile.approvedStatus !== 'APPROVED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-50 border border-slate-200 rounded-3xl max-w-2xl mx-auto mt-12 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 mb-3">Account Not Active</h2>
        <p className="text-slate-500 mb-6 text-sm leading-relaxed max-w-sm mx-auto">
          Your vendor account cannot access the operational dashboard at this time. Application is either pending administrative review, declined, or currently suspended. 
          Please contact our support for more information.
        </p>
        <span className="px-4 py-2 bg-amber-100 text-amber-800 text-xs font-bold rounded-xl uppercase tracking-wider">
          STATUS: {vendorProfile.approvedStatus.replace(/_/g, ' ')}
        </span>
      </div>
    );
  }

  return (
    <div id="vendor-dashboard-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      
      {/* Tab select bar - Bento style with mobile Hamburger support */}
      <div className="bg-slate-950 text-white rounded-3xl p-4 mb-8 border border-neutral-850 shadow-xl relative">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF5E2A]/20 flex items-center justify-center text-[#FF5E2A] font-extrabold border border-[#FF5E2A]/30">
              🍖
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight block">{vendorProfile?.name || 'Restaurant Panel'}</span>
              <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">90's.emitsphere Vendor Operations</span>
            </div>
          </div>
          
          {/* Hamburger toggle for mobile screens - Icon ONLY */}
          <div className="sm:hidden absolute top-4 right-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 bg-slate-900 hover:bg-[#E04B1A] border border-slate-800 text-[#FF5E2A] rounded-xl flex items-center justify-center transition-all cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 font-black" /> : <Menu className="w-5 h-5 font-black" />}
            </button>
          </div>

          <nav className={`sm:flex gap-1 ${mobileMenuOpen ? 'flex flex-col mt-4' : 'hidden sm:flex'}`}>
            <button
              onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false); }}
              className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center transition-all ${activeTab === 'orders' ? 'bg-[#1D9D41] text-white shadow-md font-black border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              Orders Fulfilled
            </button>
            <button
              onClick={() => { setActiveTab('menu'); setMobileMenuOpen(false); }}
              className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center transition-all ${activeTab === 'menu' ? 'bg-[#1D9D41] text-white shadow-md font-black border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              Product Management
            </button>
            <button
              onClick={() => { setActiveTab('dispatch'); setMobileMenuOpen(false); }}
              className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center transition-all ${activeTab === 'dispatch' ? 'bg-[#1D9D41] text-white shadow-md font-black border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              Dispatch Policies
            </button>
            <button
              onClick={() => { setActiveTab('wallet'); setMobileMenuOpen(false); }}
              className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center transition-all ${activeTab === 'wallet' ? 'bg-[#1D9D41] text-white shadow-md font-black border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              Balances Wallet
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              className={`px-3.5 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center transition-all ${activeTab === 'settings' ? 'bg-[#1D9D41] text-white shadow-md font-black border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              ⚙️ Settings
            </button>

            {/* HIGH FIDELITY THEME DYNAMIC TOGGLE */}
            <button
              type="button"
              onClick={() => { onThemeChange?.(theme === 'light' ? 'dark' : 'light'); setMobileMenuOpen(false); }}
              className="px-3.5 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center transition-all bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white cursor-pointer border border-neutral-800"
              title="Toggle theme style"
            >
              <span>{theme === 'light' ? '🌙 Dark' : '☀️ Light'}</span>
            </button>
            
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3.5 py-2 text-xs font-black uppercase rounded-xl text-left sm:text-center transition-all bg-[#FF5E2A] text-white hover:bg-[#E04B1A] shadow-md flex items-center gap-1.5 justify-center cursor-pointer border border-rose-500"
              >
                <span>🚪 Exit</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Active analytical summary metrics card block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#FF5E2A]/10 rounded-2xl p-4.5 shadow-sm text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E04B1A]/60 block">Total Orders Count</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-slate-905">{orders.length}</span>
                <span className="text-[10px] text-slate-400 font-bold">received</span>
              </div>
            </div>

            <div className="bg-white border border-[#FF5E2A]/10 rounded-2xl p-4.5 shadow-sm text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E04B1A]/60 block">Completed Sales</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-emerald-600">
                  {orders.filter(o => o.status === 'DELIVERED').length}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">delivered</span>
              </div>
            </div>

            <div className="bg-white border border-[#FF5E2A]/10 rounded-2xl p-4.5 shadow-sm text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E04B1A]/60 block">Active Kitchen Queue</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-amber-500">
                  {orders.filter(o => ['PAYMENT_CONFIRMED', 'ACCEPTED', 'READY_FOR_PICKUP'].includes(o.status)).length}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">preparing</span>
              </div>
            </div>

            <div className="bg-white border border-[#FF5E2A]/10 rounded-2xl p-4.5 shadow-sm text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E04B1A]/60 block">Net Payout Accrued</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-[#FF5E2A]">
                  ₦{orders.filter(o => o.status === 'DELIVERED').reduce((acc, o) => acc + o.subtotal, 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">net</span>
              </div>
            </div>
          </div>

          {/* Real-time split wallet credit notification indicator */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-left flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <h5 className="font-extrabold text-[#E04B1A] text-xs">90's.emitsphere Wallet Settlement Policy</h5>
              <p className="text-xs text-[#E04B1A]/80 leading-relaxed mt-0.5">
                Product payouts are processed instantly! Money is added to your secure wallet balance the microsecond a completed delivery is verified by OTP.
              </p>
            </div>
          </div>

          {/* Interactive Search Query & Interval Filter Bar */}
          <div className="bg-white border border-neutral-200 p-4.5 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search orders, clients, custom items..."
                value={vendorSearchQuery}
                onChange={(e) => setVendorSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#FF5E2A] font-semibold"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] font-extrabold uppercase text-[#E04B1A]/70 whitespace-nowrap">Interval Query:</span>
              <select
                value={vendorDateFilter}
                onChange={(e) => setVendorDateFilter(e.target.value as any)}
                className="bg-neutral-50 text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#FF5E2A] font-semibold flex-1 sm:flex-none"
              >
                <option value="all">All Interval Periods</option>
                <option value="today">Today's Transactions</option>
                <option value="month">Current Month Activity</option>
                <option value="year">Current Year Ledger</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {orders.length === 0 ? (
              <div className="bg-white border rounded-2xl p-12 text-center text-slate-500">
                <p className="text-sm font-bold">No incoming orders yet.</p>
                <p className="text-xs text-slate-400 mt-1">Orders placed by customers will automatically show up here in real-time!</p>
              </div>
            ) : orders.filter(order => {
                const matchesText = 
                  order.id.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
                  order.customerName.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
                  order.customerAddress.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
                  order.items.some((it: any) => it.name.toLowerCase().includes(vendorSearchQuery.toLowerCase()));
                  
                if (!matchesText) return false;
                if (vendorDateFilter === 'all') return true;
                
                const orderDate = new Date(order.createdAt || Date.now());
                const today = new Date();
                
                if (vendorDateFilter === 'today') {
                  return orderDate.toDateString() === today.toDateString();
                } else if (vendorDateFilter === 'month') {
                  return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
                } else if (vendorDateFilter === 'year') {
                  return orderDate.getFullYear() === today.getFullYear();
                }
                return true;
              }).length === 0 ? (
              <div className="bg-white border rounded-2xl p-12 text-center text-slate-400">
                <p className="text-sm font-bold">No orders match your search query filters.</p>
                <p className="text-xs text-neutral-400 mt-1">Try resetting the date interval query dropdown or text input matching.</p>
              </div>
            ) : (
              orders.filter(order => {
                const matchesText = 
                  order.id.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
                  order.customerName.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
                  order.customerAddress.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
                  order.items.some((it: any) => it.name.toLowerCase().includes(vendorSearchQuery.toLowerCase()));
                  
                if (!matchesText) return false;
                if (vendorDateFilter === 'all') return true;
                
                const orderDate = new Date(order.createdAt || Date.now());
                const today = new Date();
                
                if (vendorDateFilter === 'today') {
                  return orderDate.toDateString() === today.toDateString();
                } else if (vendorDateFilter === 'month') {
                  return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
                } else if (vendorDateFilter === 'year') {
                  return orderDate.getFullYear() === today.getFullYear();
                }
                return true;
              }).map((order) => (
                <div key={order.id} className="bg-white border border-neutral-250/75 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 text-left animate-fade-in space-y-4">
                  {/* Card Header segment */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3.5 border-dashed border-neutral-200">
                    <div>
                      <span className="inline-block bg-amber-50 text-amber-700 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg border border-amber-200/50 font-mono">
                        Reference ID: {order.id}
                      </span>
                      <p className="text-[10px] text-neutral-400 font-extrabold mt-1 uppercase tracking-wide">90s.emitsphere incoming order</p>
                    </div>
                    <div>
                      <span className={`inline-block text-[10px] font-extrabold tracking-wider px-3 py-1 rounded-full uppercase ${
                        order.status === 'PAYMENT_CONFIRMED' ? 'bg-amber-150 text-amber-900 border border-amber-200' :
                        ['ACCEPTED', 'PREPARING'].includes(order.status) ? 'bg-blue-100 text-blue-800 border border-blue-200/80' :
                        order.status === 'READY_FOR_PICKUP' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200/80' :
                        order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-850 border border-emerald-250' :
                        'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        ● {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Delivery / Recipient Segment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#FF5E2A] shrink-0" />
                        <div>
                          <p className="text-[10px] text-neutral-400 font-extrabold uppercase">Deliver To</p>
                          <h5 className="font-extrabold text-sm text-neutral-900 leading-tight">{order.customerName}</h5>
                        </div>
                      </div>

                      {order.customerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                          <a href={`tel:${order.customerPhone}`} className="text-xs font-bold text-neutral-700 hover:text-[#FF5E2A] transition-colors">
                            {order.customerPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-neutral-400 font-extrabold uppercase">Destination</p>
                          <p className="text-xs text-neutral-700 font-bold leading-relaxed">{order.customerAddress}</p>
                        </div>
                      </div>

                      {order.riderName && (
                        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
                          <span>🏍️ Rider:</span>
                          <span>{order.riderName}</span>
                          {order.riderPhone && <a href={`tel:${order.riderPhone}`} className="text-blue-600 hover:underline">({order.riderPhone})</a>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Culinary Receipt / Item list */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 pb-1 border-b">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                      <h6 className="text-[10.5px] font-black text-neutral-400 uppercase tracking-widest font-mono">Kitchen Items Ticket</h6>
                    </div>
                    
                    <div className="divide-y divide-neutral-100 border border-neutral-150 rounded-2xl bg-white overflow-hidden">
                      {order.items.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 text-xs hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-xs text-white bg-slate-900 rounded-lg w-6 h-6 flex items-center justify-center shrink-0">
                              {it.quantity}
                            </span>
                            <span className="font-extrabold text-neutral-800">{it.name}</span>
                          </div>
                          <span className="font-bold text-slate-900 font-mono">₦{it.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary & Live Interactions rows */}
                  <div className="pt-3 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <p className="text-[9px] text-neutral-400 font-extrabold uppercase animate-pulse">Order Subtotal</p>
                        <span className="text-lg font-black text-slate-950 font-mono">₦{order.subtotal?.toLocaleString()}</span>
                      </div>
                      
                      <button
                        onClick={() => setActiveChatOrderId(order.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1D9D41] hover:bg-[#168234] text-[10.5px] font-black text-white transition-all uppercase tracking-wider cursor-pointer shadow-xs border-transparent"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat Customer</span>
                      </button>

                      <button
                        onClick={() => setTrackingOrder(order)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF5E2A] hover:bg-[#FF5E2A] text-[10.5px] font-black text-white transition-all uppercase tracking-wider cursor-pointer shadow-xs"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Track Dispatch Map</span>
                      </button>
                    </div>
                    
                    <div className="w-full sm:w-auto">
                      {order.status === 'PAYMENT_CONFIRMED' ? (
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleAcceptOrder(order.id, false)}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#FF5E2A] hover:bg-[#E04B1A] text-white border border-rose-200 text-rose-700 text-xs font-extrabold rounded-xl transition-all uppercase tracking-wider cursor-pointer"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptOrder(order.id, true)}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white text-xs font-black rounded-xl border border-emerald-500 transition-all uppercase tracking-wider shadow-sm hover:shadow cursor-pointer"
                          >
                            ✓ Accept & Start Cooking
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>State verified: {order.status}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PRODUCT CATALOG MANAGEMENT TAB */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border p-6 rounded-2xl shadow-sm">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase font-mono">Culinary Inventory</span>
              <h2 className="text-2xl font-black text-neutral-900 mt-0.5">Product Management</h2>
            </div>
            <button
              onClick={() => {
                setIsEditingProduct(true);
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  description: '',
                  price: '',
                  imageUrl: '',
                  category: 'Burgers',
                  isAvailable: true,
                  variants: '',
                  addOns: []
                });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Add Dish</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white border rounded-2xl p-4 flex gap-4 items-start shadow-xs shadow-neutral-100">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-20 h-20 object-cover rounded-xl border flex-shrink-0"
                  referrerPolicy="no-referrer"
                />

                <div className="flex-grow space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-neutral-900">{p.name}</h4>
                      <p className="text-[10px] text-emerald-600 font-bold">{p.category}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setIsEditingProduct(true);
                          setEditingProduct(p);
                          setProductForm({
                            name: p.name,
                            description: p.description,
                            price: p.price.toString(),
                            imageUrl: p.imageUrl,
                            category: p.category,
                            isAvailable: p.isAvailable,
                            variants: p.variants.join(', '),
                            addOns: p.addOns
                          });
                        }}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{p.description}</p>
                  
                  <div className="flex justify-between items-center pt-2 border-t text-xs">
                    <span className="font-black text-neutral-900">₦{p.price.toLocaleString()}</span>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={p.isAvailable}
                        onChange={(e) => handleUpdateProductStock(p, e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-neutral-500 font-semibold">In Stock</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISPATCH POLICIES PREFERRED RIDER POOLS CHECKS */}
      {activeTab === 'dispatch' && (
        <div className="bg-white border rounded-3xl p-6 md:p-10 shadow-sm space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-black text-neutral-900 tracking-tight">Vendor Rider Preference System</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">Choose how logistics couriers are dispatched to collect your orders. Standard auto-routing searches nearby, whilst pool rules lock dispatching on vetted selections.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <label
              className={`border rounded-2xl p-6 cursor-pointer flex items-start gap-4 transition-all ${dispatchMode === 'auto' ? 'border-emerald-600 bg-emerald-50/20 shadow-sm' : 'border-neutral-200 hover:bg-neutral-100'}`}
              onClick={() => setDispatchMode('auto')}
            >
              <input
                type="radio"
                name="dis-mode"
                checked={dispatchMode === 'auto'}
                onChange={() => setDispatchMode('auto')}
                className="text-emerald-600 mt-1"
              />
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-neutral-900">Option 1: Automatic Dispatch System</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">System dispatch algorithms intelligently scan and alert online vetted riders within the standard coordinates radius.</p>
              </div>
            </label>

            <label
              className={`border rounded-2xl p-6 cursor-pointer flex items-start gap-4 transition-all ${dispatchMode === 'preferred' ? 'border-emerald-600 bg-emerald-50/20 shadow-sm' : 'border-neutral-200 hover:bg-neutral-100'}`}
              onClick={() => setDispatchMode('preferred')}
            >
              <input
                type="radio"
                name="dis-mode"
                checked={dispatchMode === 'preferred'}
                onChange={() => setDispatchMode('preferred')}
                className="text-emerald-600 mt-1"
              />
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-neutral-900">Option 2: Private Preferred Rider Pool</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">Restrict dispatch signals. Only selected trusted logistics individuals verified below are authorized to accept your kitchen parcels.</p>
              </div>
            </label>
          </div>

          {dispatchMode === 'preferred' && (
            <div className="pt-4 border-t space-y-4">
              <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Configure Preferred Rider Pool Checklist</span>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {riders.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center justify-between border p-4 rounded-xl cursor-pointer transition-all ${preferredRiders.includes(r.id) ? 'border-emerald-600 bg-emerald-50/50' : 'border-neutral-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferredRiders.includes(r.id)}
                        onChange={(e) => {
                          if (e.target.checked) setPreferredRiders([...preferredRiders, r.id]);
                          else setPreferredRiders(preferredRiders.filter(id => id !== r.id));
                        }}
                        className="rounded text-emerald-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-neutral-900">{r.name}</p>
                        <p className="text-[10px] text-neutral-500 font-medium font-mono">ID: {r.id} • {r.vehicleType}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 py-0.5 px-2 rounded-full">⭐ {r.rating} stars</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WALLET OVERVIEW & BANK WITHDRAWAL SETTLEMENTS */}
      {activeTab === 'wallet' && vendorProfile && (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-6">
            <div className={`rounded-3xl p-6 sm:p-10 shadow-md space-y-4 border ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-gradient-to-r from-emerald-600 to-teal-700 border-transparent text-white shadow-md'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest font-mono ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-100'}`}>Cleared Ledger Account Balance</p>
              <h3 className={`text-4xl sm:text-5xl font-black tracking-tight ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>₦{(vendorProfile.balance || 42000).toLocaleString()}</h3>
              
              <p className={`text-xs leading-relaxed pt-2 ${theme === 'light' ? 'text-slate-500' : 'text-emerald-100/95'}`}>All funds represent food checkout sales payouts less platform commission (5%). Withdrawals settle seamlessly inside <strong>{vendorProfile.bankAccount.bankName}</strong>.</p>
            </div>

            {/* Wallet logs transactions */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-neutral-900 text-base border-b pb-3 mb-4">Financial Ledger History</h4>
              
              <div className="space-y-3">
                {walletTransactions.length === 0 ? (
                  <div className="py-12 text-center text-neutral-400 text-xs">
                    <p>No transactions found on ledger index.</p>
                  </div>
                ) : (
                  walletTransactions.map((tr) => (
                    <div key={tr.id} className="flex justify-between items-center text-xs border-b pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-extrabold text-neutral-900">{tr.description}</p>
                        <p className="text-neutral-400 font-mono mt-0.5">{tr.reference} • {new Date(tr.timestamp).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-black uppercase text-sm ${tr.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tr.type === 'credit' ? '+' : '-'}₦{tr.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Secure payout drawer forms */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-neutral-900 text-base">Request Bank Cashout</h4>
            <p className="text-xs text-neutral-500 leading-relaxed">Payout transfers are processed in real-time under Nigerian central bank API limits.</p>
            
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 text-xs text-neutral-600 space-y-1.5">
              <p className="font-semibold text-neutral-900 uppercase tracking-wider text-[9px] text-neutral-400">Recipient Bank coordinates</p>
              <p>🏦 Bank: <strong>{vendorProfile.bankAccount.bankName}</strong></p>
              <p>💳 Account: <strong>{vendorProfile.bankAccount.accountNumber}</strong></p>
              <p>👤 Name: <strong>{vendorProfile.bankAccount.accountName}</strong></p>
            </div>

            <form onSubmit={handleWithdrawPayout} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-500 uppercase">Payout Amount (₦)</label>
                <input
                  type="number"
                  required
                  className="w-full bg-neutral-50 border px-3 py-2 rounded-lg text-sm focus:outline-emerald-600 font-bold"
                  placeholder="e.g. 5000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-neutral-100 text-black border border-neutral-300 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md inline-flex items-center justify-center cursor-pointer"
                style={{ color: '#000000' }}
              >
                {loading ? 'Processing bank settlement...' : 'Send Settlement Payout'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl text-left">
          <SettingsPanel 
            currentUser={{
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              phone: currentUser.phone || '',
              avatar: (currentUser as any).avatar || '',
              role: 'vendor',
              walletBalance: 0
            }} 
            onUserUpdate={(updated) => {
              if (onUserUpdate) {
                onUserUpdate(updated);
              }
            }} 
          />
        </div>
      )}

      {/* ==========================================
      MODAL ADD DISH DIALOG BOX (CRUD form)
      ========================================== */}
      {isEditingProduct && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl maxHeight-[90vh] overflow-y-auto">
            <div className="bg-neutral-950 text-white p-6 flex justify-between items-center">
              <h4 className="font-black text-lg">{editingProduct ? 'Edit Menu Product' : 'Add New Culinary offering'}</h4>
              <button
                onClick={() => setIsEditingProduct(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateProduct} className="p-6 space-y-4 text-xs text-neutral-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-neutral-500 uppercase">Dish Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-neutral-50 border px-3 py-2 rounded-lg"
                    placeholder="e.g. Double Beef Cheeseburger"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-neutral-500 uppercase">Pricing (₦)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-neutral-50 border px-3 py-2 rounded-lg"
                    placeholder="e.g. 4500"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <ImageUploadWithCrop
                    label="Dish Photo File"
                    aspectRatio="4:3"
                    radiusType="square"
                    initialValue={productForm.imageUrl}
                    onUploadSuccess={(url) => setProductForm({ ...productForm, imageUrl: url })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-neutral-500 uppercase">Category Tag</label>
                  <select
                    className="w-full bg-neutral-50 border px-3 py-2 rounded-lg"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option>Burgers</option>
                    <option>Wings</option>
                    <option>Sides</option>
                    <option>Noodles</option>
                    <option>Dumplings</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-500 uppercase">Culinary Description</label>
                <textarea
                  className="w-full bg-neutral-50 border px-3 py-2 rounded-lg h-16"
                  placeholder="Specify recipe, seasoning, core components..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-neutral-500 uppercase">Serving Variants (Comma separated strings)</label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 border px-3 py-2 rounded-lg"
                  placeholder="Single Patty, Double Beef Patty (+₦1200)"
                  value={productForm.variants}
                  onChange={(e) => setProductForm({ ...productForm, variants: e.target.value })}
                />
              </div>

              {/* Toppings add-ons CRUD inline drawer */}
              <div className="border p-4 rounded-xl space-y-3 bg-neutral-50">
                <span className="block font-bold text-neutral-500 uppercase tracking-wider">Configure Toppings & Extras List</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Topping e.g. Extra Avocado Slices"
                    className="bg-white border px-3 py-1.5 rounded-lg w-full"
                    value={newAddOn.name}
                    onChange={(e) => setNewAddOn({ ...newAddOn, name: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Price ₦ e.g. 500"
                    className="bg-white border px-3 py-1.5 rounded-lg w-28"
                    value={newAddOn.price}
                    onChange={(e) => setNewAddOn({ ...newAddOn, price: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={handleAddAddOn}
                    className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {productForm.addOns.map((add, i) => (
                    <span key={i} className="bg-white border px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1">
                      <span>{add.name} (+₦{add.price})</span>
                      <button type="button" onClick={() => handleRemoveAddOn(i)} className="text-rose-600 font-bold">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white font-black text-center rounded-xl transition-all shadow-md mt-4"
              >
                {loading ? 'Processing database update...' : editingProduct ? 'Commit Dish Modifications' : 'Publish Dish to Menu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REAL-TIME DELIVERY CHAT MONITOR MODAL FOR VENDORS */}
      {activeChatOrderId && (
        <div id="vendor-chat-modal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col h-[520px]">
            {/* Header */}
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest font-mono">Live Logs Intercept</span>
                <h4 className="font-extrabold text-white text-base">Order #{activeChatOrderId} Deliveries Chat</h4>
              </div>
              <button
                onClick={() => setActiveChatOrderId(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-all border-0"
              >
                ✕
              </button>
            </div>

            {/* Chat Body messages */}
            <div className="flex-grow p-5 overflow-y-auto space-y-3.5 bg-slate-50">
              {chatMessages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-1.5">
                  <p className="text-sm font-bold font-sans">No live messages mapped to this delivery yet.</p>
                  <p className="text-xs">Once the customer or courier rider types a message, they will sync here instantly.</p>
                </div>
              ) : (
                chatMessages.map((m) => {
                  let badgeColor = 'bg-slate-100 text-slate-700';
                  let displaySenderName = m.senderName;
                  
                  if (m.senderRole === 'rider') {
                    badgeColor = 'bg-emerald-100 text-emerald-800';
                    displaySenderName = `${m.senderName} (Rider)`;
                  } else if (m.senderRole === 'customer') {
                    badgeColor = 'bg-blue-100 text-blue-800';
                    displaySenderName = `${m.senderName} (Customer)`;
                  } else if (m.senderRole === 'vendor') {
                    badgeColor = 'bg-purple-100 text-purple-800';
                    displaySenderName = `${m.senderName} (Vendor)`;
                  } else if (m.senderRole === 'admin') {
                    badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200 font-extrabold';
                    displaySenderName = 'Customer Care';
                  }

                  return (
                    <div key={m.id} className="bg-white border p-3.5 rounded-2xl shadow-xs space-y-1 text-left">
                      <div className="flex justify-between items-center border-b pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-neutral-850 text-[11px]">{displaySenderName}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.25 rounded-full ${badgeColor}`}>
                            {m.senderRole === 'admin' ? 'Support' : m.senderRole}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold leading-relaxed pt-1">{m.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Send chat message - allow Vendor to send direct support msg to both */}
            <form onSubmit={handleSendChatMessage} className="p-4 border-t bg-white flex gap-2">
              <input
                type="text"
                placeholder="Send a message to Rider and Customer..."
                className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-[#FF5E2A] text-slate-800"
                value={newChatText}
                onChange={(e) => setNewChatText(e.target.value)}
              />
              <button
                type="submit"
                className="bg-[#FF5E2A] hover:bg-[#E04B1A] text-white px-4 py-2 text-xs font-bold rounded-xl transition-all font-sans cursor-pointer border-0"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {trackingOrder && (() => {
        const liveOrder = orders.find(o => o.id === trackingOrder.id) || trackingOrder;
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full border border-slate-200">
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <Compass className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span>Real-Time Dispatch Logistics Map</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Order Ref: #{liveOrder.id}</p>
                </div>
                <button
                  onClick={() => setTrackingOrder(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer font-bold border-0"
                >
                  ✕
                </button>
              </div>

              <div className="p-1 bg-neutral-900">
                <OrderTrackerMap
                  vendorLat={liveOrder.vendorLat || 6.6908}
                  vendorLng={liveOrder.vendorLng || 3.1501}
                  vendorName={liveOrder.vendorName}
                  customerLat={liveOrder.customerLat || 6.6908}
                  customerLng={liveOrder.customerLng || 3.1501}
                  customerAddress={liveOrder.customerAddress || 'Ogun State'}
                  riderName={liveOrder.riderName}
                  riderLat={liveOrder.riderLat}
                  riderLng={liveOrder.riderLng}
                  status={liveOrder.status}
                />
              </div>

              <div className="p-5 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-left w-full sm:w-auto">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">Current Status</p>
                  <span className="inline-block bg-emerald-100 text-emerald-850 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mt-0.5">
                    ● {liveOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-left sm:text-right text-xs w-full sm:w-auto">
                  <p className="font-bold text-slate-700">Rider: {liveOrder.riderName || 'Assigning Rider...'}</p>
                  <p className="text-slate-550 mt-0.5">Destination: {liveOrder.customerAddress}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
