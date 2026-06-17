/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, Check, X, AlertOctagon, Settings, Database, ListCollapse, 
  MessageCircle, BarChart3, AlertTriangle, Play, Sparkles, Loader2, DollarSign, MessageSquare,
  Menu, Compass, MapPin
} from 'lucide-react';
import { Vendor, Rider, Order, SupportTicket, AuditLog, ChatMessage } from '../types';
import SettingsPanel from './SettingsPanel';
import OrderTrackerMap from './OrderTrackerMap';

interface AdminConsoleProps {
  currentUser?: any;
  onUserUpdate?: (user: any) => void;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export default function AdminConsole({ currentUser, onUserUpdate, onLogout, theme = 'light', onThemeChange }: AdminConsoleProps) {
  const [pendingVendors, setPendingVendors] = useState<Vendor[]>([]);
  const [pendingRiders, setPendingRiders] = useState<Rider[]>([]);
  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [allRiders, setAllRiders] = useState<Rider[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  
  // Profile Edits
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editingVendorData, setEditingVendorData] = useState<Partial<Vendor>>({});
  const [editingRiderId, setEditingRiderId] = useState<string | null>(null);
  const [editingRiderData, setEditingRiderData] = useState<Partial<Rider>>({});
  
  // Products Management
  const [vendorProductsModalId, setVendorProductsModalId] = useState<string | null>(null);
  const [adminVendorProducts, setAdminVendorProducts] = useState<any[]>([]);
  const [adminProductForm, setAdminProductForm] = useState<any>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatText, setNewChatText] = useState('');
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  
  // Payout Settlements state
  const [payoutBatches, setPayoutBatches] = useState<any[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [approvingBatches, setApprovingBatches] = useState<Record<string, string>>({});

  // Config parameters
  const [settings, setSettings] = useState({
    platformFeeType: 'flat',
    fixedServiceFee: 350,
    paystackFeeType: 'percentage',
    paystackFeePercent: 1.5,
    deliveryFeeType: 'flat',
    baseDeliveryFee: 800,
    taxType: 'percentage',
    taxPercent: 5.0,
    restaurantCommissionPercent: 5.0,
    minimumDispatchRangeKm: 8,
    paystackPublicKey: '',
    paystackSecretKey: '',
    simulatorPassword: 'emitsphere',
    fulfillmentTerms: '',
    privacyPolicy: '',
    cookiesPolicy: ''
  });

  // Coupons lists & generators
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    value: 10,
    maxUsage: 100,
    expiresAt: '2026-12-31'
  });

  // Date range filters for custom search analysis
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-12-31');

  // Active navigation panels
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'approvals' | 'finances' | 'payouts' | 'logs' | 'ai-report' | 'deliveries' | 'settings'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Server side analytical logs state
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // SMTP state metrics
  const [smtp, setSmtp] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    sender: '',
    adminEmail: ''
  });
  const [testRecipient, setTestRecipient] = useState('');
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [testMailLoading, setTestMailLoading] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  const [smtpSuccess, setSmtpSuccess] = useState('');

  // Sandbox Database accounts management state
  const [sandboxUsers, setSandboxUsers] = useState<any[]>([]);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [newSandboxAcct, setNewSandboxAcct] = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });
  const [editingSandboxUserId, setEditingSandboxUserId] = useState<string | null>(null);
  const [editingSandboxFields, setEditingSandboxFields] = useState<any>({});
  const [sandboxActionStatus, setSandboxActionStatus] = useState('');

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true);
    setSmtpError('');
    setSmtpSuccess('');
    try {
      const res = await fetch('/api/admin/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtp)
      });
      const data = await res.json();
      if (res.ok) {
        setSmtpSuccess('SMTP configuration parameters committed and updated successfully.');
      } else {
        setSmtpError(data.message || 'Failed to update SMTP configurations.');
      }
    } catch (err) {
      setSmtpError('Failed to communicate with SMTP admin endpoints.');
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) {
      alert('Please specify a recipient email to receive the test verification.');
      return;
    }
    setTestMailLoading(true);
    setSmtpError('');
    setSmtpSuccess('');
    try {
      const res = await fetch('/api/admin/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: testRecipient })
      });
      const data = await res.json();
      if (res.ok) {
        setSmtpSuccess(data.message || 'Test connection successfully verified! Check recipient mailbox.');
      } else {
        setSmtpError(data.message || 'Failed to verify SMTP parameters.');
      }
    } catch (err) {
      setSmtpError('Failure response during SMTP server connection handshake.');
    } finally {
      setTestMailLoading(false);
    }
  };

  const handleSaveVendorEdit = async (vId: string) => {
    try {
      const res = await fetch('/api/admin/vendors/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vId, ...editingVendorData })
      });
      if (res.ok) {
        setEditingVendorId(null);
        fetchAdminData();
      } else {
        const d = await res.json();
        alert(d.message || 'Update failed');
      }
    } catch (err) {
      alert('Network error while saving vendor profile');
    }
  };

  const handleSaveRiderEdit = async (rId: string) => {
    try {
      const res = await fetch('/api/admin/riders/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rId, ...editingRiderData })
      });
      if (res.ok) {
        setEditingRiderId(null);
        fetchAdminData();
      } else {
        const d = await res.json();
        alert(d.message || 'Update failed');
      }
    } catch (err) {
      alert('Network error while saving rider profile');
    }
  };

  const loadVendorProductsForAdmin = async (vId: string) => {
    setVendorProductsModalId(vId);
    try {
      const res = await fetch(`/api/vendors/${vId}/products`);
      if (res.ok) {
        const d = await res.json();
        setAdminVendorProducts(d);
      }
    } catch(err) {
      console.log('Error fetching vendor products');
    }
  };

  const handleAdminProductUpsert = async () => {
    if (!adminProductForm) return;
    try {
      const payload = {
        vendorId: vendorProductsModalId,
        ...adminProductForm
      };
      const res = await fetch('/api/products/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAdminProductForm(null);
        if (vendorProductsModalId) {
          loadVendorProductsForAdmin(vendorProductsModalId);
        }
      } else {
        const d = await res.json();
        alert(d.message || 'Failed saving product');
      }
    } catch(err) {
      alert('Error connecting');
    }
  };

  const handleAdminProductDelete = async (pid: string) => {
    if(!confirm('Are you sure you want to delete this specific product feature?')) return;
    try {
      const res = await fetch(`/api/products/${pid}`, { method: 'DELETE' });
      if (res.ok) {
        if (vendorProductsModalId) {
           loadVendorProductsForAdmin(vendorProductsModalId);
        }
      }
    } catch(e) {
      alert('Deletion error');
    }
  };

  const handleResetEthereal = async () => {
    setSmtpLoading(true);
    setSmtpError('');
    setSmtpSuccess('');
    try {
      const res = await fetch('/api/admin/smtp/reset-ethereal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSmtp({
          host: data.settings.host || '',
          port: data.settings.port || 587,
          secure: !!data.settings.secure,
          user: data.settings.user || '',
          password: data.settings.password || '',
          sender: data.settings.sender || '',
          adminEmail: data.settings.adminEmail || ''
        });
        setSmtpSuccess(data.message || 'Successfully generated fresh Ethereal credentials.');
      } else {
        setSmtpError(data.message || 'Failed to auto-provision Ethereal credentials.');
      }
    } catch (err) {
      setSmtpError('Failure to communicate with Ethereal provisioning endpoint.');
    } finally {
      setSmtpLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const timer = setInterval(fetchAdminData, 4000);
    return () => clearInterval(timer);
  }, [activeTab]);

  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { orderId } = customEvent.detail || {};
      if (orderId) {
        setActiveTab('deliveries');
        setActiveChatOrderId(orderId);
      }
    };
    window.addEventListener('navigate-to-order', handleNav);
    return () => window.removeEventListener('navigate-to-order', handleNav);
  }, []);

  const fetchSandboxUsers = async () => {
    try {
      const res = await fetch('/api/admin/sandbox-users');
      if (res.ok) {
        const data = await res.json();
        setSandboxUsers(data.users || []);
      }
    } catch (e) {}
  };

  const fetchAdminData = async () => {
    try {
      fetchSandboxUsers();
      const res = await fetch('/api/admin/onboardings');
      if (res.ok) {
        const d = await res.json();
        setPendingVendors(d.pendingVendors);
        setPendingRiders(d.pendingRiders);
        setAllVendors(d.allVendors);
        setAllRiders(d.allRiders);
      }

      // Fetch Audit logs
      const logRes = await fetch('/api/admin/audit-logs');
      if (logRes.ok) {
        const dLogs = await logRes.json();
        setAuditLogs(dLogs);
      }

      const ticketRes = await fetch('/api/tickets');
      if (ticketRes.ok) {
        const tkLogs = await ticketRes.json();
        setTickets(tkLogs);
      }

      // Fetch all system orders
      const orderRes = await fetch('/api/orders');
      if (orderRes.ok) {
        const dOrders = await orderRes.json();
        setAllOrders(dOrders);
      }

      // Fetch all coupons
      const couponsRes = await fetch('/api/admin/coupons');
      if (couponsRes.ok) {
        const cpData = await couponsRes.json();
        setCoupons(cpData);
      }

      // Fetch SMTP settings
      const smtpRes = await fetch('/api/admin/smtp');
      if (smtpRes.ok) {
        const smtpData = await smtpRes.json();
        if (smtpData.settings) {
          setSmtp({
            host: smtpData.settings.host || '',
            port: smtpData.settings.port || 587,
            secure: !!smtpData.settings.secure,
            user: smtpData.settings.user || '',
            password: smtpData.settings.password || '',
            sender: smtpData.settings.sender || '',
            adminEmail: smtpData.settings.adminEmail || ''
          });
        }
      }

      // Get configurations
      const configRes = await fetch('/api/platform/stats');
      if (configRes.ok) {
        const cData = await configRes.json();
        setSettings({
          platformFeeType: cData.settings.platformFeeType || 'flat',
          fixedServiceFee: cData.settings.fixedServiceFee ?? 350,
          paystackFeeType: cData.settings.paystackFeeType || 'percentage',
          paystackFeePercent: cData.settings.paystackFeePercent ?? 1.5,
          deliveryFeeType: cData.settings.deliveryFeeType || 'flat',
          baseDeliveryFee: cData.settings.baseDeliveryFee ?? 800,
          taxType: cData.settings.taxType || 'percentage',
          taxPercent: cData.settings.taxPercent ?? 5.0,
          restaurantCommissionPercent: cData.settings.restaurantCommissionPercent ?? 5.0,
          minimumDispatchRangeKm: cData.settings.minimumDispatchRangeKm ?? 8,
          paystackPublicKey: cData.settings.paystackPublicKey || '',
          paystackSecretKey: cData.settings.paystackSecretKey || '',
          simulatorPassword: cData.settings.simulatorPassword || '',
          fulfillmentTerms: cData.settings.fulfillmentTerms || '',
          privacyPolicy: cData.settings.privacyPolicy || '',
          cookiesPolicy: cData.settings.cookiesPolicy || ''
        });
      }
      
      const payoutRes = await fetch('/api/admin/payouts/batches');
      if (payoutRes.ok) {
        const payoutData = await payoutRes.json();
        setPayoutBatches(payoutData);
      }
    } catch(e) {}
  };

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
          senderId: 'admin',
          senderName: 'Super Admin Staff',
          senderRole: 'admin',
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

  const handleReviewOnboarding = async (entityId: string, targetPool: 'vendors' | 'riders', flag: 'APPROVED' | 'REJECTED' | 'SUSPENDED') => {
    try {
      const res = await fetch('/api/admin/onboarding/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, targetPool, flag })
      });
      if (res.ok) {
        alert(`Account onboarding classification shifted to: ${flag}`);
        fetchAdminData();
      }
    } catch(e) {}
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon)
      });
      if (res.ok) {
        alert(`Special Promotional Code '${newCoupon.code.toUpperCase()}' officially created and in-service.`);
        setNewCoupon({
          code: '',
          discountType: 'percentage',
          value: 10,
          maxUsage: 100,
          expiresAt: '2026-12-31'
        });
        fetchAdminData();
      } else {
        const d = await res.json();
        alert(d.message || 'Error occurred while establishing promotion.');
      }
    } catch(e) {}
  };

  const handleApproveBatch = async (batchId: string, amount: number, entityName: string) => {
    if (!confirm(`Payout ₦${amount} to ${entityName}?`)) return;
    
    const setStatus = (msg: string) => {
      setApprovingBatches(prev => ({ ...prev, [batchId]: msg }));
    };

    try {
      setStatus('Resolving bank coordinates...');
      await new Promise(r => setTimeout(r, 600));

      setStatus('Authorising Paystack Test API...');
      await new Promise(r => setTimeout(r, 650));

      setStatus('Transmitting settlement...');
      await new Promise(r => setTimeout(r, 500));

      setStatus('Processing wallet records...');
      
      const r = await fetch('/api/admin/payouts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchIds: [batchId], adminId: currentUser.id })
      });
      
      if (r.ok) {
        setStatus('Settlement Done!');
        await new Promise(r => setTimeout(r, 850));
        fetchAdminData();
      } else {
        const errD = await r.json().catch(() => ({}));
        setStatus(`Error: ${errD.message || 'Rejected'}`);
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (e) {
      setStatus('Network timeout');
      await new Promise(r => setTimeout(r, 1500));
    } finally {
      setApprovingBatches(prev => {
        const nextB = { ...prev };
        delete nextB[batchId];
        return nextB;
      });
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      const res = await fetch('/api/admin/coupons/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch(e) {}
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/platform/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert('Global platform commission settings saved.');
        fetchAdminData();
      }
    } catch(e) {}
    setLoading(false);
  };

  const handleTriggerAiReport = async () => {
    setAiLoading(true);
    setAiReport('');
    try {
      const res = await fetch('/api/admin/ai-analytics', { method: 'POST' });
      const d = await res.json();
      if (res.ok) {
        setAiReport(d.report);
      } else {
        setAiReport(d.message || 'Gemini error');
      }
    } catch (e) {
      setAiReport('Failed to connect to AI server endpoints. Ensure process.env.GEMINI_API_KEY is active.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div id="admin-view-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      
      {/* Page Header - Bento styled with mobile Hamburger support */}
      <div className={`rounded-3xl p-6 mb-8 border shadow-xl relative ${theme === 'light' ? 'bg-white border-slate-200 text-slate-905 shadow-md' : 'bg-slate-950 text-white border-neutral-850 shadow-xl'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5E2A]/20 flex items-center justify-center border border-[#FF5E2A]/30">
              <Shield className="w-6 h-6 text-[#FF5E2A]" />
            </div>
            <div>
              <h2 className={`text-xl font-black tracking-tight ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Super Admin Operations Center</h2>
              <p className={`text-[11px] font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>90's.emitsphere Logistics Monitor</p>
            </div>
          </div>

          {/* Hamburger toggle for mobile screens - Icon ONLY */}
          <div className="md:hidden absolute top-6 right-6">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2.5 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-[#FF5E2A] hover:bg-slate-100' : 'bg-slate-900 border-slate-800 text-[#FF5E2A] hover:bg-[#E04B1A]'}`}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 font-black" /> : <Menu className="w-5 h-5 font-black" />}
            </button>
          </div>

          <nav className={`md:flex gap-1.5 ${mobileMenuOpen ? 'flex flex-col mt-4 w-full' : 'hidden md:flex'}`}>
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-xl text-left md:text-center transition-all ${activeTab === 'dashboard' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-xl text-left md:text-center transition-all ${activeTab === 'analytics' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              🔍 Query
            </button>
            <button
              onClick={() => { setActiveTab('approvals'); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-xl text-left md:text-center transition-all ${activeTab === 'approvals' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              👥 Users ({allVendors.length + allRiders.length})
            </button>
            <button
              onClick={() => { setActiveTab('finances'); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-xl text-left md:text-center transition-all ${activeTab === 'finances' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A]'}`}
            >
              🎟️ Setup
            </button>
            <button
              onClick={() => { setActiveTab('payouts'); fetchAdminData(); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-xl text-left md:text-center transition-all ${activeTab === 'payouts' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              🏦 Payouts ({payoutBatches.filter(b => b.status === 'awaiting_approval').length})
            </button>
            <button
              onClick={() => { setActiveTab('deliveries'); fetchAdminData(); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-xl text-left md:text-center transition-all ${activeTab === 'deliveries' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              🚚 Dispatch ({allOrders.length})
            </button>
            <button
              onClick={() => { setActiveTab('ai-report'); handleTriggerAiReport(); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-xl text-left md:text-center flex items-center gap-1 transition-all ${activeTab === 'ai-report' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:opacity-90 shadow-sm'}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Analyst</span>
            </button>
            <button
              onClick={() => { setActiveTab('logs'); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-xl text-left md:text-center transition-all ${activeTab === 'logs' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              📋 Logs
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-xl text-left md:text-center transition-all ${activeTab === 'settings' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'}`}
            >
              ⚙️ Settings
            </button>

            {/* HIGH FIDELITY THEME DYNAMIC TOGGLE */}
            <button
              type="button"
              onClick={() => { onThemeChange?.(theme === 'light' ? 'dark' : 'light'); setMobileMenuOpen(false); }}
              className="px-3 py-1.5 text-[11px] font-black uppercase rounded-xl text-left md:text-center transition-all bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white cursor-pointer border border-neutral-800"
              title="Toggle theme style"
            >
              <span>{theme === 'light' ? '🌙 Dark' : '☀️ Light'}</span>
            </button>
            
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-[11px] font-black uppercase rounded-xl text-left md:text-center transition-all bg-[#FF5E2A] text-white hover:bg-[#E04B1A] shadow-md flex items-center justify-center gap-1.5 cursor-pointer border border-rose-500"
              >
                <span>🚪 Exit</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Summing functions for dashboard */}
      {(() => {
        const getSubtotalsSum = () => allOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0);
        const getDeliveryFeesSum = () => allOrders.reduce((acc, o) => acc + (o.deliveryFee || 0), 0);
        const getServiceFeesSum = () => allOrders.reduce((acc, o) => acc + (o.serviceFee || 0), 0);
        const getTaxesSum = () => allOrders.reduce((acc, o) => acc + (o.tax || 0), 0);
        const getDiscountsSum = () => allOrders.reduce((acc, o) => acc + (o.discount || 0), 0);
        const getGrandTotalsSum = () => allOrders.reduce((acc, o) => acc + (o.total || 0), 0);

        const getFilteredOrders = () => {
          return allOrders.filter(o => {
            const d = o.createdAt ? o.createdAt.substring(0, 10) : '';
            return (!startDate || d >= startDate) && (!endDate || d <= endDate);
          });
        };

        const filteredOrders = getFilteredOrders();
        const fSubtotal = filteredOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0);
        const fDeliveryFee = filteredOrders.reduce((acc, o) => acc + (o.deliveryFee || 0), 0);
        const fServiceFee = filteredOrders.reduce((acc, o) => acc + (o.serviceFee || 0), 0);
        const fTax = filteredOrders.reduce((acc, o) => acc + (o.tax || 0), 0);
        const fDiscount = filteredOrders.reduce((acc, o) => acc + (o.discount || 0), 0);
        const fGatewayFee = filteredOrders.reduce((acc, o) => acc + (o.gatewayFee || 0), 0);
        const fGrandTotal = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);

        return (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in pb-12 font-sans text-left">
                {/* Metrics grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Orders</span>
                    <span className="text-xl font-black text-slate-950 mt-1 block">{allOrders.length}</span>
                    <span className="block text-[8.5px] text-slate-400 mt-1 font-mono">Ecosystem requests</span>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs animate-pulse">
                    <span className="block text-[10px] text-blue-600 font-bold uppercase">Active Runs</span>
                    <span className="text-xl font-black text-blue-600 mt-1 block">{allOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length}</span>
                    <span className="block text-[8.5px] text-blue-500 mt-1 font-mono">Live dispatch transiting</span>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Food Value</span>
                    <span className="text-xl font-black text-slate-950 mt-1 block font-mono">₦{getSubtotalsSum().toLocaleString()}</span>
                    <span className="block text-[8.5px] text-slate-400 mt-1 font-mono">Vendor menu split</span>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Delivery Fees</span>
                    <span className="text-xl font-black text-slate-950 mt-1 block font-mono">₦{getDeliveryFeesSum().toLocaleString()}</span>
                    <span className="block text-[8.5px] text-slate-400 mt-1 font-mono">Rider earnings</span>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Service Charge</span>
                    <span className="text-xl font-black text-slate-950 mt-1 block font-mono">₦{getServiceFeesSum().toLocaleString()}</span>
                    <span className="block text-[8.5px] text-slate-400 mt-1 font-mono">SaaS operational ledger</span>
                  </div>
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
                    <span className="block text-[10px] text-emerald-600 font-bold uppercase">Taxes</span>
                    <span className="text-xl font-black text-emerald-600 mt-1 block font-mono">₦{getTaxesSum().toLocaleString()}</span>
                    <span className="block text-[8.5px] text-emerald-500 mt-1 font-mono">Platform taxes sum</span>
                  </div>
                </div>

                {/* Quick status summary cards */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-3 border-slate-150">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest font-mono">Live Central Order registry ({allOrders.length})</h4>
                      <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">Summary of all incoming checkout deliveries across Lago Island grid.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Responsive Mobile View: Cards */}
                    <div className="block md:hidden space-y-4">
                      {allOrders.map(o => (
                        <div key={o.id} className="bg-slate-55 border border-slate-200/80 p-4 rounded-2xl relative text-left text-xs space-y-3 shadow-xs">
                          <div className="flex justify-between items-center pb-2.5 border-b border-neutral-100">
                            <div>
                              <span className="font-mono font-black text-blue-600">ID: {o.id.substring(0, 8)}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                              o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' : 'bg-amber-50 text-amber-800 border border-amber-150'
                            }`}>
                              ● {o.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <span className="block text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wide">Customer</span>
                              <p className="font-extrabold text-neutral-800 text-xs">👤 {o.customerName}</p>
                            </div>
                            <div>
                              <span className="block text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wide">Restaurant partner</span>
                              <p className="font-bold text-neutral-600 text-xs">🏢 {o.vendorName}</p>
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-neutral-100 grid grid-cols-3 gap-2 text-[11px]">
                            <div>
                              <span className="block text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wide">Products</span>
                              <span className="font-bold text-neutral-800 font-mono">₦{o.subtotal?.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="block text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wide">Fulfillment</span>
                              <p className="text-[10px] text-slate-500">🏍️ ₦{o.deliveryFee?.toLocaleString()}</p>
                              <p className="text-[9px] text-slate-400">⚙️ ₦{o.serviceFee?.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="block text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wide">Taxes</span>
                              <span className="font-bold text-neutral-850 font-mono">₦{o.tax?.toLocaleString() || 0}</span>
                            </div>
                          </div>

                          <div className="pt-2 px-1">
                            <button
                              onClick={() => setTrackingOrder(o)}
                              className="w-full py-2 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer border-0"
                            >
                              <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
                              <span>Track Live Dispatch</span>
                            </button>
                          </div>

                          <div className="pt-2.5 border-t border-neutral-100 flex justify-between items-center bg-slate-50 -mx-4 -mb-4 p-3 rounded-b-2xl border-t mt-1">
                            <span className="block text-[9px] text-slate-500 font-black uppercase tracking-wider">Net settlement value</span>
                            <span className="font-black text-slate-900 font-mono text-sm">₦{o.total?.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Laptop View: Pristine Structured Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                            <th className="py-3 px-4 bg-slate-50/70 rounded-l-xl">Order ID</th>
                            <th className="py-3 px-2 bg-slate-50/70">Parties Involved</th>
                            <th className="py-3 px-2 bg-slate-50/70 font-mono">Produce Subtotal</th>
                            <th className="py-3 px-2 bg-slate-50/70 font-mono">Fulfillment Fees</th>
                            <th className="py-3 px-2 bg-slate-50/70 font-mono">Platform Tax</th>
                            <th className="py-3 px-2 bg-slate-50/70 font-mono">Gross Settlement</th>
                            <th className="py-3 px-4 bg-slate-50/70 rounded-r-xl">Logistics Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                          {allOrders.map(o => (
                            <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-4 px-4 font-mono font-black text-blue-600">#{o.id.substring(0, 8)}</td>
                              <td className="py-4 px-2">
                                <p className="font-extrabold text-slate-900">👤 {o.customerName}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">🏢 {o.vendorName}</p>
                              </td>
                              <td className="py-4 px-2 font-mono font-extrabold text-slate-800">₦{o.subtotal?.toLocaleString()}</td>
                              <td className="py-4 px-2 font-mono text-[11px] text-slate-500 space-y-0.5">
                                <p className="font-bold text-slate-700">🏍️ Deliv: ₦{o.deliveryFee?.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-405">⚙️ Serv: ₦{o.serviceFee?.toLocaleString()}</p>
                              </td>
                              <td className="py-4 px-2 font-mono text-slate-650">₦{o.tax?.toLocaleString() || 0}</td>
                              <td className="py-4 px-2 font-mono font-black text-neutral-900 text-sm">₦{o.total?.toLocaleString()}</td>
                              <td className="py-4 px-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                                    o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                    <span className={`w-1 h-1 rounded-full ${o.status === 'DELIVERED' ? 'bg-emerald-550' : 'bg-amber-550'}`}></span>
                                    <span>{o.status.replace(/_/g, ' ')}</span>
                                  </span>
                                  <button
                                    onClick={() => setTrackingOrder(o)}
                                    className="px-2.5 py-1.5 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all shadow-xs cursor-pointer border-0"
                                  >
                                    <Compass className="w-3.5 h-3.5" />
                                    <span>Track Run</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fade-in pb-12 font-sans text-left">
                {/* Query Form */}
                <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-extrabold text-sm uppercase tracking-wide text-blue-400 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-blue-400" />
                        <span>Date Range Ledger Query</span>
                      </h4>
                      <p className="text-[10.5px] text-slate-400 mt-1">Formulate custom reporting criteria across any operational time envelope.</p>
                    </div>
                    <span className="text-[10.5px] font-mono bg-blue-950 border border-blue-800 text-blue-400 font-bold px-2.5 py-0.5 rounded-full">Database: SECURE LIVE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-450 uppercase font-black tracking-wider">Start Date Filter</label>
                      <input
                        type="date"
                        className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white font-mono focus:outline-none focus:border-blue-500"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-450 uppercase font-black tracking-wider">End Date Filter</label>
                      <input
                        type="date"
                        className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white font-mono focus:outline-none focus:border-blue-500"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Aggregated query outcomes */}
                <div className="grid lg:grid-cols-3 gap-6 items-start">
                  <div className="bg-white border rounded-2xl p-6 lg:col-span-2 space-y-6">
                    <div>
                      <span className="text-xs text-blue-600 uppercase tracking-widest font-bold">Consolidated ledger report</span>
                      <h4 className="font-black text-sm text-neutral-950 tracking-tight mt-0.5">Matching Query Matrix (From {startDate || 'all'} to {endDate || 'all'})</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-b border-slate-100 pb-5 text-left">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="block text-[9.5px] text-slate-400 font-bold uppercase">Orders inside span</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block">{filteredOrders.length}</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="block text-[9.5px] text-slate-400 font-bold uppercase">Produce (Food subtotal)</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block font-mono">₦{fSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="block text-[9.5px] text-slate-400 font-bold uppercase">Logistics delivery</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block font-mono">₦{fDeliveryFee.toLocaleString()}</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="block text-[9.5px] text-slate-400 font-bold uppercase">System Service charges</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block font-mono">₦{fServiceFee.toLocaleString()}</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="block text-[9.5px] text-slate-400 font-bold uppercase">Government Tax</span>
                        <span className="text-lg font-black text-slate-900 mt-1 block font-mono">₦{fTax.toLocaleString()}</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="block text-[9.5px] text-blue-600 font-bold uppercase">Gross Settlements</span>
                        <span className="text-lg font-black text-blue-600 mt-1 block font-mono">₦{fGrandTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                        <p className="text-xs font-bold font-sans">No transactions recorded inside chosen timeframe envelope.</p>
                      </div>
                    ) : (
                      <div>
                        {/* Responsive Mobile View: Cards */}
                        <div className="block md:hidden space-y-4 text-xs font-medium">
                          {filteredOrders.map(o => (
                            <div key={o.id} className="bg-slate-55 border border-slate-200/80 p-4 rounded-xl text-left space-y-2.5">
                              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <span className="font-mono font-black text-blue-600 block">ID: {o.id.substring(0, 8)}</span>
                                <span className="font-black text-slate-900 font-mono">₦{o.total?.toLocaleString()}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <span className="block text-[8.5px] text-slate-400 font-extrabold uppercase">Buyer</span>
                                  <span className="font-bold">👤 {o.customerName}</span>
                                </div>
                                <div>
                                  <span className="block text-[8.5px] text-slate-400 font-extrabold uppercase">Seller</span>
                                  <span className="font-bold">🏢 {o.vendorName}</span>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <span className="block text-[8.5px] text-slate-400 font-extrabold uppercase">Food Value</span>
                                  <span className="font-mono font-bold">₦{o.subtotal?.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="block text-[8.5px] text-slate-400 font-extrabold uppercase">Fulfillment Fees</span>
                                  <span className="block text-slate-500 font-mono text-[10px]">🏍️ ₦{o.deliveryFee?.toLocaleString()}</span>
                                  <span className="block text-slate-400 font-mono text-[9px]">⚙️ ₦{o.serviceFee?.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Laptop/Desktop View: Table */}
                        <div className="hidden md:block overflow-x-auto text-xs leading-normal">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                                <th className="py-3 px-3 bg-slate-50/70 rounded-l-lg">Order ID</th>
                                <th className="py-3 px-2 bg-slate-50/70">Parties Involved</th>
                                <th className="py-3 px-2 bg-slate-50/70 font-mono">Subtotal</th>
                                <th className="py-3 px-2 bg-slate-50/70 font-mono">Logistics & Service</th>
                                <th className="py-3 px-3 bg-slate-50/70 rounded-r-lg font-mono">Grand Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-705">
                              {filteredOrders.map(o => (
                                <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-3 px-3 font-mono text-blue-600 font-black">#{o.id.substring(0, 8)}</td>
                                  <td className="py-3 px-2">
                                    <p className="font-extrabold text-slate-900">👤 {o.customerName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">🏢 {o.vendorName}</p>
                                  </td>
                                  <td className="py-3 px-2 font-mono text-slate-800">₦{o.subtotal?.toLocaleString()}</td>
                                  <td className="py-3 px-2 text-[10.5px] text-slate-500 space-y-0.5">
                                    <p className="font-bold">🏍️ Fee: ₦{o.deliveryFee?.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-405">⚙️ Service: ₦{o.serviceFee?.toLocaleString()}</p>
                                  </td>
                                  <td className="py-3 px-3 font-mono font-black text-slate-900 text-sm">₦{o.total?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div>
                      <p className="text-[9.5px] uppercase font-bold text-blue-450 tracking-wider font-mono">NET REVENUE DISBURSEMENTS</p>
                      <h4 className="font-extrabold text-sm text-white">Matching Settlement splits</h4>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-400">Vendor Net payout:</span>
                          <strong className="text-white font-mono">₦{(fSubtotal - fDiscount - Math.round(fSubtotal * 0.05)).toLocaleString()}</strong>
                        </div>
                        <p className="text-[9.5px] text-slate-500 leading-snug">Total food value less 5% platform commissions.</p>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-400">Rider Logistics payout:</span>
                          <strong className="text-emerald-400 font-mono text-emerald-400">₦{fDeliveryFee.toLocaleString()}</strong>
                        </div>
                        <p className="text-[9.5px] text-slate-500 leading-snug">Delivery fees allocated to logistics drivers.</p>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                        <div className="flex justify-between font-bold text-blue-450">
                          <span>Admin Net platform fee:</span>
                          <strong className="font-mono text-blue-400">₦{(fServiceFee + fGatewayFee + Math.round(fSubtotal * 0.05)).toLocaleString()}</strong>
                        </div>
                        <p className="text-[9.5px] text-slate-500 leading-snug">SaaS processing, service fees, plus 5% automated commissions.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {activeTab === 'approvals' && (
        <div className="space-y-8 animate-fade-in pb-12">
          
          {/* Restaurant Onboard reviewer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-250 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Restaurant Partners ({allVendors.length})</h3>
              <span className="text-xs text-slate-400 font-medium">Manage restaurant approvals and suspensions</span>
            </div>
            
            {allVendors.length === 0 ? (
              <div className="bento-card justify-center items-center py-12">
                <p className="text-sm text-slate-400 font-medium">No partner restaurant applications found.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {allVendors.map((v) => (
                  <div key={v.id} className="bento-card space-y-4 relative">
                    <span className={`absolute top-0 right-0 py-1.5 px-3 rounded-bl-xl border-l border-b border-slate-100 text-[9.5px] font-bold uppercase tracking-wider ${
                      v.approvedStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                      v.approvedStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                      v.approvedStatus === 'SUSPENDED' ? 'bg-neutral-100 text-neutral-600' :
                      'bg-amber-50 text-amber-800'
                    }`}>
                      {v.approvedStatus.replace(/_/g, ' ')}
                    </span>
                    
                    {editingVendorId === v.id ? (
                      <div className="space-y-3">
                        <input className="w-full text-xs p-2 border rounded" placeholder="Name" value={editingVendorData.name || ''} onChange={e => setEditingVendorData({...editingVendorData, name: e.target.value})} />
                        <input className="w-full text-xs p-2 border rounded" placeholder="CAC" value={editingVendorData.cacRegistration || ''} onChange={e => setEditingVendorData({...editingVendorData, cacRegistration: e.target.value})} />
                        <input className="w-full text-xs p-2 border rounded" placeholder="Address" value={editingVendorData.address || ''} onChange={e => setEditingVendorData({...editingVendorData, address: e.target.value})} />
                        <input className="w-full text-xs p-2 border rounded" placeholder="Bank Name" value={editingVendorData.bankAccount?.bankName || ''} onChange={e => setEditingVendorData({...editingVendorData, bankAccount: {...editingVendorData.bankAccount!, bankName: e.target.value}})} />
                        <input className="w-full text-xs p-2 border rounded" placeholder="Account Number" value={editingVendorData.bankAccount?.accountNumber || ''} onChange={e => setEditingVendorData({...editingVendorData, bankAccount: {...editingVendorData.bankAccount!, accountNumber: e.target.value}})} />
                        <div className="flex gap-2">
                           <button onClick={() => handleSaveVendorEdit(v.id)} className="px-3 py-1 bg-green-600 text-white font-bold text-xs rounded">Save</button>
                           <button onClick={() => setEditingVendorId(null)} className="px-3 py-1 bg-slate-300 text-slate-800 font-bold text-xs rounded">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">RESTAURANT FRANCHISE</p>
                          <h4 className="font-extrabold text-slate-850 text-base pr-20">{v.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 font-medium">Business Owner Contact: {v.email}</p>
                        </div>

                        <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600 font-medium">
                          <p className="flex justify-between"><span>📁 CAC RC Number:</span> <span className="font-bold text-slate-800 font-mono text-[11px]">{v.cacRegistration}</span></p>
                          <p className="flex justify-between"><span>📍 Hub Address:</span> <span className="text-slate-800 font-bold max-w-[200px] truncate text-right">{v.address}</span></p>
                          <p className="flex justify-between"><span>🏦 Bank settlements:</span> <span className="font-bold text-slate-800">{v.bankAccount.bankName} ({v.bankAccount.accountNumber})</span></p>
                        </div>
                      </>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100 mt-2">
                       <button
                         onClick={() => loadVendorProductsForAdmin(v.id)}
                         className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl"
                       >
                         Manage Products
                       </button>
                       <button 
                         onClick={() => { setEditingVendorId(v.id); setEditingVendorData(v); }}
                         className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                       >
                         Edit Details
                       </button>
                      {v.approvedStatus !== 'APPROVED' && (
                        <button
                          onClick={() => handleReviewOnboarding(v.id, 'vendors', 'APPROVED')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                        >
                          Approve License
                        </button>
                      )}
                      {v.approvedStatus !== 'SUSPENDED' && v.approvedStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleReviewOnboarding(v.id, 'vendors', 'SUSPENDED')}
                          className="px-3.5 py-2 bg-[#FF5E2A] hover:bg-[#E04B1A] text-white font-bold text-xs rounded-xl transition-all"
                        >
                          Suspend Account
                        </button>
                      )}
                      {v.approvedStatus === 'PENDING_APPROVAL' && (
                         <button
                         onClick={() => handleReviewOnboarding(v.id, 'vendors', 'REJECTED')}
                         className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all"
                       >
                         Decline
                       </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rider Onboard reviewer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-250 pb-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Courier Rider Accounts ({allRiders.length})</h3>
              <span className="text-xs text-slate-400 font-medium">Manage logistics accounts and verify licenses</span>
            </div>
            
            {allRiders.length === 0 ? (
              <div className="bento-card justify-center items-center py-12">
                <p className="text-sm text-slate-400 font-medium">No logistical rider submissions found.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {allRiders.map((r) => (
                  <div key={r.id} className="bento-card space-y-4 relative">
                    <span className={`absolute top-0 right-0 py-1.5 px-3 rounded-bl-xl border-l border-b border-slate-100 text-[9.5px] font-bold uppercase tracking-wider ${
                      r.approvedStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                      r.approvedStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                      r.approvedStatus === 'SUSPENDED' ? 'bg-neutral-100 text-neutral-600' :
                      'bg-amber-50 text-amber-800'
                    }`}>
                      {r.approvedStatus.replace(/_/g, ' ')}
                    </span>
                    
                    {editingRiderId === r.id ? (
                      <div className="space-y-3">
                        <input className="w-full text-xs p-2 border rounded" placeholder="Name" value={editingRiderData.name || ''} onChange={e => setEditingRiderData({...editingRiderData, name: e.target.value})} />
                        <input className="w-full text-xs p-2 border rounded" placeholder="Vehicle Type" value={editingRiderData.vehicleType || ''} onChange={e => setEditingRiderData({...editingRiderData, vehicleType: e.target.value})} />
                        <input className="w-full text-xs p-2 border rounded" placeholder="Vehicle Number" value={editingRiderData.vehicleNumber || ''} onChange={e => setEditingRiderData({...editingRiderData, vehicleNumber: e.target.value})} />
                        <input className="w-full text-xs p-2 border rounded" placeholder="Bank Name" value={editingRiderData.bankAccount?.bankName || ''} onChange={e => setEditingRiderData({...editingRiderData, bankAccount: {...editingRiderData.bankAccount!, bankName: e.target.value}})} />
                        <input className="w-full text-xs p-2 border rounded" placeholder="Account Number" value={editingRiderData.bankAccount?.accountNumber || ''} onChange={e => setEditingRiderData({...editingRiderData, bankAccount: {...editingRiderData.bankAccount!, accountNumber: e.target.value}})} />
                        <div className="flex gap-2">
                           <button onClick={() => handleSaveRiderEdit(r.id)} className="px-3 py-1 bg-green-600 text-white font-bold text-xs rounded">Save</button>
                           <button onClick={() => setEditingRiderId(null)} className="px-3 py-1 bg-slate-300 text-slate-800 font-bold text-xs rounded">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">COURIER DISPATCH PARTNER</p>
                          <h4 className="font-extrabold text-slate-850 text-base pr-20">{r.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 font-medium">Logistical Courier Mobile: {r.phone}</p>
                        </div>

                        <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600 font-medium">
                          <p className="flex justify-between"><span>🛵 Vehicle:</span> <span className="font-bold text-slate-800">{r.vehicleNumber} ({r.vehicleType})</span></p>
                          <p className="flex justify-between"><span>🪪 Driver License No:</span> <span className="font-bold text-slate-800 font-mono">{r.driversLicense}</span></p>
                          <p className="flex justify-between"><span>👤 Government NIN ID:</span> <span className="font-bold text-slate-800 font-mono">{r.governmentId}</span></p>
                        </div>
                      </>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100 mt-2">
                       <button 
                         onClick={() => { setEditingRiderId(r.id); setEditingRiderData(r); }}
                         className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                       >
                         Edit Details
                       </button>
                       {r.approvedStatus !== 'APPROVED' && (
                        <button
                          onClick={() => handleReviewOnboarding(r.id, 'riders', 'APPROVED')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                        >
                          Approve License
                        </button>
                      )}
                      {r.approvedStatus !== 'SUSPENDED' && r.approvedStatus !== 'REJECTED' && (
                        <button
                          onClick={() => handleReviewOnboarding(r.id, 'riders', 'SUSPENDED')}
                          className="px-3.5 py-2 bg-[#FF5E2A] hover:bg-[#E04B1A] text-white font-bold text-xs rounded-xl transition-all"
                        >
                          Suspend Account
                        </button>
                      )}
                      {r.approvedStatus === 'PENDING_APPROVAL' && (
                         <button
                         onClick={() => handleReviewOnboarding(r.id, 'riders', 'REJECTED')}
                         className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all"
                       >
                         Decline
                       </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="space-y-6 animate-fade-in pb-12 font-sans text-slate-800">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Finance Module</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Enterprise Merchant Wallet Payouts</h3>
              <p className="text-xs text-slate-500 max-w-2xl mt-1">Review custom partner merchant and dispatch rider wallet clearance requests. Approving will execute real-time bank transfers through Paystack APIs directly to their external bank accounts.</p>
            </div>
            
            <button
               onClick={async () => {
                 const awbs = payoutBatches.filter(b => b.status === 'awaiting_approval').map(b => b.id);
                 if (!awbs.length) return alert('No pending payout batches.');
                 if (!confirm(`Are you sure you want to approve ${awbs.length} settlement(s) and transmit external bank fund transfers?`)) return;
                 setIsApproving(true);
                 try {
                   const r = await fetch('/api/admin/payouts/approve', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ batchIds: awbs, adminId: currentUser.id })
                   });
                   if (r.ok) {
                     alert('Settlements Processed!');
                     fetchAdminData();
                   }
                 } finally { setIsApproving(false); }
               }}
               disabled={isApproving || payoutBatches.filter(b => b.status === 'awaiting_approval').length === 0}
               className="bg-[#1D9D41] hover:bg-[#15803d] disabled:opacity-50 text-white font-extrabold uppercase text-xs px-5 py-3 rounded-xl shadow-md transition-all"
            >
              {isApproving ? 'Processing...' : 'Approve ALL Pending'}
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="font-bold text-slate-700 text-sm">Settlement Action Queue</h4>
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">{payoutBatches.length} Total Groups</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {payoutBatches.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-medium text-sm">No pending withdrawal requests found in queue.</div>
              ) : (
                payoutBatches.map(batch => (
                  <div key={batch.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${batch.entityRole === 'vendor' ? 'bg-indigo-100 text-indigo-700' : 'bg-fuchsia-100 text-fuchsia-700'}`}>{batch.entityRole}</span>
                         <span className="font-bold text-sm text-slate-900">{batch.entityName}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium tracking-tight">Batch ID: {batch.id} • {batch.itemIds && batch.itemIds.length ? `Contains ${batch.itemIds.length} orders` : 'Custom Wallet Clearance Withdrawal'} • Requested on {new Date(batch.createdAt).toLocaleString()}</p>
                      
                      {batch.status !== 'awaiting_approval' && (
                        <p className="text-[10px] text-zinc-500 mt-2">
                          <strong className="text-zinc-700 font-bold uppercase">Paystack Trx Info:</strong> {batch.transferReference || 'N/A'} {batch.transferCompletedAt ? `• Processed ${new Date(batch.transferCompletedAt).toLocaleString()}` : ''}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-end gap-5">
                       <div className="text-right">
                         <p className="text-sm font-black text-slate-900">₦{batch.amount.toLocaleString()}</p>
                         <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${
                           batch.status === 'awaiting_approval' ? 'text-amber-500' : 
                           batch.status === 'approved' ? 'text-green-500' : 
                           batch.status === 'success' ? 'text-green-600' : 'text-slate-500'}`}>{batch.status}</p>
                       </div>
                       
                       {batch.status === 'awaiting_approval' && (
                         <button 
                            onClick={async () => {
                               handleApproveBatch(batch.id, batch.amount, batch.entityName); return;
                               const r = await fetch('/api/admin/payouts/approve', {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ batchIds: [batch.id], adminId: currentUser.id })
                               });
                               if (r.ok) fetchAdminData();
                            }}
                            className="bg-[#FF5E2A] hover:bg-[#E04B1A] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-80 flex items-center justify-center gap-1.5"
                         >
                           {approvingBatches[batch.id] ? `🌀 ${approvingBatches[batch.id]}` : 'Approve Run'}
                         </button>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PARAMETERS AND GLOBAL SAAS SYSTEM FEE CONFIGURATIONS */}
      {activeTab === 'finances' && (
        <div className="space-y-6 animate-fade-in pb-12 text-left font-sans text-slate-800">
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            
            <div className="lg:col-span-2 bento-card space-y-6 bg-white p-6 rounded-2xl border">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">PLATFORM LOGISTICAL FORMULA CONFIG</p>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Ecosystem Ledger core parameters</h3>
                <p className="text-xs text-slate-500 mt-1">Configure baseline values that drive checkout fee equations for clients city-wide.</p>
              </div>
              
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-5">
                  <div className="space-y-1.5 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-tight flex justify-between">
                      <span>Platform Service Fee</span>
                      <select 
                        value={settings.platformFeeType} 
                        onChange={(e) => setSettings({ ...settings, platformFeeType: e.target.value })}
                        className="text-[9px] border border-slate-300 rounded px-1 ml-2 outline-none"
                      >
                        <option value="flat">Flat (₦)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                      value={settings.fixedServiceFee}
                      onChange={(e) => setSettings({ ...settings, fixedServiceFee: parseFloat(e.target.value) })}
                    />
                    <span className="block text-[9px] text-slate-400 leading-snug">SaaS operation fee applied generally.</span>
                  </div>

                  <div className="space-y-1.5 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-tight flex justify-between">
                      <span>Delivery Fee</span>
                      <select 
                        value={settings.deliveryFeeType} 
                        onChange={(e) => setSettings({ ...settings, deliveryFeeType: e.target.value })}
                        className="text-[9px] border border-slate-300 rounded px-1 ml-2 outline-none"
                      >
                        <option value="flat">Flat (₦)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </label>
                    <input
                      type="number"
                      required
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                      value={settings.baseDeliveryFee}
                      onChange={(e) => setSettings({ ...settings, baseDeliveryFee: parseFloat(e.target.value) })}
                    />
                    <span className="block text-[9px] text-slate-400 leading-snug">Fee allocated directly to delivery riders.</span>
                  </div>

                  <div className="space-y-1.5 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-tight flex justify-between">
                      <span>Government Tax Rate</span>
                      <select 
                        value={settings.taxType} 
                        onChange={(e) => setSettings({ ...settings, taxType: e.target.value })}
                        className="text-[9px] border border-slate-300 rounded px-1 ml-2 outline-none"
                      >
                        <option value="flat">Flat (₦)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                      value={settings.taxPercent}
                      onChange={(e) => setSettings({ ...settings, taxPercent: parseFloat(e.target.value) })}
                    />
                    <span className="block text-[9px] text-slate-400 leading-snug">State consumption tax applied to items.</span>
                  </div>

                  <div className="space-y-1.5 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-tight flex justify-between">
                      <span>Restaurant Commission (%)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                      value={settings.restaurantCommissionPercent}
                      onChange={(e) => setSettings({ ...settings, restaurantCommissionPercent: parseFloat(e.target.value) })}
                    />
                    <span className="block text-[9px] text-slate-400 leading-snug">Percentage taken from restaurant sales automatically.</span>
                  </div>

                  <div className="space-y-1.5 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-tight flex justify-between">
                      <span>Hidden Gateway processing</span>
                      <select 
                        value={settings.paystackFeeType} 
                        onChange={(e) => setSettings({ ...settings, paystackFeeType: e.target.value })}
                        className="text-[9px] border border-slate-300 rounded px-1 ml-2 outline-none"
                      >
                        <option value="flat">Flat (₦)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500"
                      value={settings.paystackFeePercent}
                      onChange={(e) => setSettings({ ...settings, paystackFeePercent: parseFloat(e.target.value) })}
                    />
                    <span className="block text-[9px] text-slate-400 leading-snug">Merged dynamically into Service Fee. Hidden from customer.</span>
                  </div>

                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2">💳 Live Paystack Checkout Credentials</h4>
                    <p className="text-[10.5px] text-slate-500 mb-4 font-normal">Input your platform test or live API keys to trigger the official Paystack inline transaction modal for real customer collections. Leave empty to use fallback sandbox checkout.</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold text-slate-500">Paystack Public Key</label>
                        <input
                          type="text"
                          placeholder="e.g. pk_test_... or pk_live_..."
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-slate-800"
                          value={settings.paystackPublicKey}
                          onChange={(e) => setSettings({ ...settings, paystackPublicKey: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase font-bold text-slate-500">Paystack Secret Key</label>
                        <input
                          type="password"
                          placeholder="e.g. sk_test_... or sk_live_..."
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono text-slate-800"
                          value={settings.paystackSecretKey}
                          onChange={(e) => setSettings({ ...settings, paystackSecretKey: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2">🔒 Simulation Controls Passcode</h4>
                    <p className="text-[10.5px] text-slate-500 mb-4 font-normal">Modify the gatekeeping passcode required to unlock the Retro-Futuristic Simulator controls superbar for internal operational diagnostics.</p>
                    
                    <div className="max-w-xs space-y-1.5">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Simulator Passcode</label>
                      <input
                        type="text"
                        placeholder="e.g. emitsphere"
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 font-mono text-[#E04B1A]"
                        value={settings.simulatorPassword || ''}
                        onChange={(e) => setSettings({ ...settings, simulatorPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 border-t pt-4 mt-2 space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2 mb-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">📄 Dynamic Legal Documents Content (Firebase Synchronized)</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Update the public legal documents instantly. These support standard plain-text spacing and are persisted to Firestore.</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-tight">Terms of Fulfillment Services</label>
                      <textarea
                        rows={6}
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 font-sans text-slate-800 leading-relaxed"
                        placeholder="Enter the official terms of fulfillment services..."
                        value={settings.fulfillmentTerms || ''}
                        onChange={(e) => setSettings({ ...settings, fulfillmentTerms: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-tight">Privacy & Data Security Policy</label>
                      <textarea
                        rows={6}
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 font-sans text-slate-800 leading-relaxed"
                        placeholder="Enter the custom privacy policy..."
                        value={settings.privacyPolicy || ''}
                        onChange={(e) => setSettings({ ...settings, privacyPolicy: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-tight">Cookies Session Tracking Policy</label>
                      <textarea
                        rows={6}
                        className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 font-sans text-slate-800 leading-relaxed"
                        placeholder="Enter the public cookie policy..."
                        value={settings.cookiesPolicy || ''}
                        onChange={(e) => setSettings({ ...settings, cookiesPolicy: e.target.value })}
                      />
                    </div>
                  </div>

                </div>

                <div className="pt-3 border-t">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer border-0"
                  >
                    {loading ? 'Committing configurations...' : 'Save Parameters'}
                  </button>
                </div>
              </form>
            </div>

            <div className={`rounded-2xl p-6 space-y-5 border shadow-sm ${theme === 'light' ? 'bg-white border-slate-205 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'}`}>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">SETTLEMENT RULES</p>
                <h4 className={`font-bold text-base ${theme === 'light' ? 'text-slate-850' : 'text-white'}`}>Ecosystem Split Ledger</h4>
              </div>
              
              <ul className={`text-xs space-y-3 border-b pb-4 ${theme === 'light' ? 'border-slate-100 text-slate-600' : 'border-slate-880 text-slate-305'}`}>
                <li className="flex justify-between items-center">
                  <span>Restaurant commission:</span> 
                  <strong className="text-blue-500 dark:text-blue-400 font-mono">{settings.restaurantCommissionPercent.toFixed(1)}% flat</strong>
                </li>
                <li className="flex justify-between items-center">
                  <span>Logistics Rider share:</span> 
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono">100.0% of delivery fee</strong>
                </li>
              </ul>
              <p className={`text-[11px] leading-relaxed font-normal ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Platform splits are automated server-side right on customer verified secure delivery OTP checkouts, rendering fast settlement loops dynamically.
              </p>
            </div>
          </div>

          {/* COUPONS GENERATOR PANEL */}
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="bento-card space-y-5 bg-white p-6 rounded-2xl border">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">RELEASE CHANNELS</span>
                <h4 className="font-black text-sm text-neutral-900 tracking-tight">Sponsor Promo Campaigns</h4>
                <p className="text-xs text-slate-500">Produce client-facing promotional codes and coupon values.</p>
              </div>

              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-500 font-bold">Promo Coupon Code</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500 text-slate-800 focus:bg-white uppercase"
                    placeholder="e.g. SUMMER20"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase text-slate-500 font-bold">Reduction Mode</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-700"
                      value={newCoupon.discountType}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Naira (₦)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase text-slate-500 font-bold">Discount value</label>
                    <input
                      type="number"
                      required
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500 text-slate-800 focus:bg-white"
                      value={newCoupon.value}
                      onChange={(e) => setNewCoupon({ ...newCoupon, value: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-slate-500 font-bold">Maximum uses limit</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-blue-500 text-slate-800 focus:bg-white"
                    value={newCoupon.maxUsage}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxUsage: parseInt(e.target.value) })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer border-0"
                >
                  Create & Launch Promo Code
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bento-card space-y-4 bg-white p-6 rounded-2xl border">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">GLOBAL REGISTRY</span>
                <h4 className="font-black text-sm text-neutral-900 tracking-tight">Active & Expired Promo Codes</h4>
                <p className="text-xs text-slate-500">Deactivate active coupons globally or track user consumption limits.</p>
              </div>

              {coupons.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-slate-50 border border-dashed rounded-xl">
                  <p className="text-xs font-medium">No live promotional codes logged in database yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {coupons.map((c) => (
                    <div key={c.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-blue-600 uppercase font-mono bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md text-[11px] tracking-wide">{c.code}</span>
                          <span className="text-[10px] text-slate-405 font-bold">({c.discountType === 'percentage' ? `${c.value}% Reduction` : `₦${c.value} Flat Off`})</span>
                        </div>
                        <p className="text-[10px] text-slate-500">Usage: <strong>{c.usages}</strong> used of <strong>{c.maxUsage}</strong> total entries</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full ${c.active ? 'bg-[#1D9D41] text-white border-transparent' : 'bg-[#FF5E2A] text-white border-transparent'}`}>
                          {c.active ? 'Active' : 'Stopped'}
                        </span>
                        <button
                          onClick={() => handleToggleCoupon(c.id)}
                          className={`px-3 py-1.5 font-bold text-[10px] rounded-lg tracking-wider uppercase transition-all cursor-pointer border ${c.active ? 'bg-[#FF5E2A] hover:bg-[#E04B1A] text-white border-transparent' : 'bg-[#1D9D41] hover:bg-[#168234] text-white border-transparent'}`}
                        >
                          {c.active ? 'Stop Code' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SMTP OPERATIONAL TRANSMISSION SETTINGS */}
          <div className="grid lg:grid-cols-3 gap-6 items-start border-t border-slate-200 pt-8 mt-6">
            <div className="lg:col-span-2 bento-card space-y-6 bg-white p-6 rounded-2xl border text-left">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#FF5E2A] font-bold mb-1">TRANSACTIONAL COMMUNICATIONS GATEWAY</p>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">SMTP Mail Server Settings</h3>
                <p className="text-xs text-slate-500 mt-1">Configure SMTP credentials to transmit customer verification pins, transit receipts, and carrier live alerts automatically.</p>
              </div>

              {smtpSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl animate-fade-in">
                  ✓ {smtpSuccess}
                </div>
              )}

              {smtpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl animate-fade-in">
                  ⚠️ {smtpError}
                </div>
              )}

              <form onSubmit={handleSaveSmtp} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">SMTP Host Outgoer</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. smtp.gmail.com"
                      className="w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-550 text-slate-800"
                      value={smtp.host}
                      onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-500">Port Number</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 587"
                        className="w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-bold font-mono focus:bg-white focus:outline-none focus:border-blue-550 text-slate-800"
                        value={smtp.port}
                        onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) || 587 })}
                      />
                    </div>

                    <div className="space-y-1 flex flex-col justify-end pb-2">
                      <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-slate-350 rounded focus:ring-blue-500 cursor-pointer"
                          checked={smtp.secure}
                          onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })}
                        />
                        <span>Secure SSL/TLS</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">SMTP Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. user@emitsphere.com"
                      className="w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-550 text-slate-850"
                      value={smtp.user}
                      onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">SMTP Server Passkey</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-550 text-slate-850"
                      value={smtp.password}
                      onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Sender Identity String</label>
                    <input
                      type="text"
                      required
                      placeholder='e.g. "Delivo Logistics" <noreply@delivo.com>'
                      className="w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-550 text-slate-850"
                      value={smtp.sender}
                      onChange={(e) => setSmtp({ ...smtp, sender: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Admin Notification Email Copy</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. logs@delivo.com"
                      className="w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-blue-550 text-slate-850"
                      value={smtp.adminEmail}
                      onChange={(e) => setSmtp({ ...smtp, adminEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <button
                    type="submit"
                    disabled={smtpLoading}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer border-0"
                  >
                    {smtpLoading ? 'Commiting credentials...' : 'Save SMTP Settings'}
                  </button>
                </div>
              </form>
            </div>

            <div className={`border rounded-2xl p-6 space-y-5 shadow-sm text-left ${theme === 'light' ? 'bg-white border-slate-205 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'}`}>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-1">CONNECTIVITY VERIFICATION TOOL</p>
                <h4 className={`font-extrabold text-base ${theme === 'light' ? 'text-slate-850' : 'text-white'}`}>SMTP Gateway Diagnostics</h4>
                <p className={`text-[11px] mt-1 leading-normal ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Send a custom transactional verification email on the spot to prove credentials validate correctly with your host.</p>
              </div>

              <form onSubmit={handleTestSmtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={`block text-[10px] uppercase font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-350'}`}>Recipient Test Mail Address</label>
                  <input
                    type="email"
                    required
                    placeholder="manager@emitsphere.com"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 border ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500'}`}
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={testMailLoading}
                  className="w-full py-2.5 bg-[#FF5E2A] hover:bg-[#FF5E2A] disabled:bg-slate-300 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer border-0"
                >
                  {testMailLoading ? 'Sending operational test email...' : 'Trigger SMTP Test'}
                </button>

                <div className="pt-2 border-t border-dashed border-slate-250">
                  <p className={`text-[10px] mb-2 leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-450'}`}>
                    <strong>Credentials connection failing?</strong> If your custom SMTP coordinates fail with authentication errors (e.g., Google 535) or socket timeouts, click below to instantly provision a sandbox SMTP mail server that works automatically.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetEthereal}
                    disabled={smtpLoading}
                    className="w-full py-2 bg-[#FF5E2A] hover:bg-[#FF5E2A] disabled:bg-slate-300 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer border-0 flex items-center justify-center gap-1.5"
                  >
                    <span>🔄 Auto-Fix: Reset to Ethereal Sandbox</span>
                  </button>
                </div>
              </form>

              <div className={`text-[11px] p-4 border rounded-xl space-y-2 leading-relaxed font-sans ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-650' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <span className={`block font-black text-[10px] uppercase tracking-wider ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>💡 Active Mail Server:</span>
                <p className="font-mono text-[10.5px] truncate">Host: <strong className="text-blue-500 dark:text-blue-400">{smtp.host || 'smtp.ethereal.email'}</strong></p>
                <p className="font-mono text-[10.5px]">Port: <strong>{smtp.port || 587}</strong> ({smtp.secure ? 'SSL/Secure' : 'Unsecured/TLS'})</p>
                <p className="font-mono text-[10.5px] truncate">User: <strong>{smtp.user || 'None'}</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT SEQUENTIAL LOG STREAMS */}
      {activeTab === 'logs' && (
        <div className="bento-card space-y-4 animate-fade-in pb-8">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">SYSTEM HISTORY FLOW</p>
            <h3 className="text-lg font-bold text-slate-850 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              <span>Audit Action Trails</span>
            </h3>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 border border-slate-100 p-3 rounded-xl bg-slate-50 font-sans">
            {auditLogs.map((log) => (
              <div key={log.id} className="border-b border-slate-200/60 pb-2.5 flex justify-between items-start last:border-0 last:pb-0">
                <div className="space-y-1 max-w-lg">
                  <p className="text-xs text-slate-800 font-bold">{log.action}</p>
                  <p className="text-[11px] text-slate-500 font-mono tracking-tight leading-normal">{log.details}</p>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-400">
                  <p className="font-bold text-slate-700">{log.actor}</p>
                  <p className="mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GEMINI AI ANALYTICAL REPORT */}
      {activeTab === 'ai-report' && (
        <div className="bento-card space-y-6 animate-fade-in pb-12">
          <div className="flex justify-between items-center border-b border-slate-150 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">GEMINI INTEL AGENT</p>
                <h3 className="font-bold text-lg text-slate-850">AI Operations Analyst</h3>
              </div>
            </div>
            
            <button
              onClick={handleTriggerAiReport}
              disabled={aiLoading}
              className="px-3.5 py-1.5 bg-slate-900 border border-slate-855 text-white hover:bg-slate-800 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Refresh Matrix</span>}
            </button>
          </div>

          {aiLoading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">Constructing live neural metrics report...</p>
              <p className="text-xs text-slate-400">Polling spatial city routes, average delivery turnarounds, and driver logs with Gemini Pro...</p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/75 p-5 rounded-xl leading-relaxed space-y-4">
              {aiReport ? (
                <div className="prose prose-blue max-w-none text-slate-700 whitespace-pre-line text-sm leading-relaxed font-sans">
                  {aiReport}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2.5">
                  <AlertOctagon className="w-8 h-8 text-slate-400" />
                  <p className="font-semibold text-slate-700">AI Intelligence Analyst Offline</p>
                  <p className="max-w-md">Provide a valid GEMINI_API_KEY environment variable in your AI Studio secrets board to activate automated city dispatch strategy report generation.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ECOSYSTEM ACTIVE DISPATCH & MESSAGE LOG INTERCEPTS TAB */}
      {activeTab === 'deliveries' && (
        <div className="space-y-6 animate-fade-in pb-12 font-sans">
          <div className="bg-white border p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">Central Ecosystem Logs</span>
              <h3 className="text-lg font-black text-neutral-900 tracking-tight mt-0.5">Live Delivery Runs & Chats</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders Feed */}
            <div className="lg:col-span-1 space-y-3 max-h-[500px] overflow-y-auto pr-1">
              <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-2 border-b pb-1 font-mono">Platform Orders ({allOrders.length})</h4>
              {allOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white border rounded-2xl">
                  <p className="text-xs font-bold font-sans">No registered orders found.</p>
                  <p className="text-[10px] text-slate-500 mt-1">Once customers place orders, they will list here.</p>
                </div>
              ) : (
                allOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setActiveChatOrderId(order.id)}
                    className={`w-full border p-4 rounded-xl text-left flex justify-between items-center transition-all bg-white hover:bg-slate-50 cursor-pointer ${
                      activeChatOrderId === order.id ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider font-mono">{order.id}</p>
                      <h5 className="font-extrabold text-sm text-neutral-950">📦 From {order.vendorName}</h5>
                      <p className="text-xs text-neutral-600 font-sans">To {order.customerName} | {order.customerPhone}</p>
                      {order.riderId && <p className="text-[10px] text-neutral-500 font-medium font-sans">🏍️ Assigned Rider: {order.riderName} | {order.riderPhone}</p>}
                      <p className="text-[10px] font-mono text-slate-400">{order.customerAddress.slice(0, 30)}...</p>
                      <div className="pt-1.5 flex gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800 animate-pulse'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        {order.riderId && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-mono">
                            🏍️ {order.riderName}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Chat Inspector Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[500px]">
                {activeChatOrderId ? (
                  <>
                    {/* Active Order Header */}
                    <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#24d9c7] font-mono">Central Support Wiretap Buffer</span>
                        <h4 className="font-black text-sm text-white mt-0.5">Order ID: #{activeChatOrderId}</h4>
                        {allOrders.find(o => o.id === activeChatOrderId) && (
                          <p className="text-xs text-slate-400 font-medium">
                            Restaurant: <strong>{allOrders.find(o => o.id === activeChatOrderId)?.vendorName}</strong> | Courier: <strong>{allOrders.find(o => o.id === activeChatOrderId)?.riderName || 'Awaiting Assignee'}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-50">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 space-y-1.55">
                          <p className="text-sm font-bold font-sans text-slate-500">No correspondence logged on this wiretap run yet.</p>
                          <p className="text-xs text-slate-400">Once the customer, driver, or restaurant staff posts to this order's queue, they will populate here in real-time.</p>
                        </div>
                      ) : (
                        chatMessages.map((m) => {
                          let badgeStyle = 'bg-slate-100 text-slate-600 border border-slate-200';
                          let displaySenderName = m.senderName;
                          if (m.senderRole === 'rider') {
                            badgeStyle = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                            displaySenderName = `${m.senderName} (Rider)`;
                          }
                          if (m.senderRole === 'customer') {
                            badgeStyle = 'bg-blue-100 text-blue-800 border border-blue-200';
                            displaySenderName = `${m.senderName} (Customer)`;
                          }
                          if (m.senderRole === 'vendor') {
                            badgeStyle = 'bg-purple-100 text-purple-800 border border-purple-200';
                            displaySenderName = `${m.senderName} (Vendor)`;
                          }
                          if (m.senderRole === 'admin') {
                            badgeStyle = 'bg-amber-100 text-amber-800 border border-amber-200 font-bold';
                            displaySenderName = 'Customer Care';
                          }

                          return (
                            <div key={m.id} className="bg-white border border-slate-150 p-4 rounded-xl shadow-xs space-y-1 text-left">
                              <div className="flex justify-between items-center border-b pb-1.5 border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-neutral-900 text-xs">{displaySenderName}</span>
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full font-mono ${badgeStyle}`}>
                                    {m.senderRole === 'admin' ? 'Support' : m.senderRole}
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(m.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 font-semibold leading-relaxed pt-1.5 whitespace-pre-wrap">{m.text}</p>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Intervene Input */}
                    <form onSubmit={handleSendChatMessage} className="p-4 border-t bg-white flex gap-2">
                      <input
                        type="text"
                        placeholder="Intervene in message thread. Post warning or resolution comment to all parties..."
                        className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-blue-600 text-slate-800"
                        value={newChatText}
                        onChange={(e) => setNewChatText(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase px-5 py-2.5 rounded-xl transition-all font-sans cursor-pointer border-0"
                      >
                        Intervene
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-32 text-slate-400 space-y-2 flex flex-col items-center justify-center">
                    <MessageSquare className="w-10 h-10 stroke-1 text-slate-300" />
                    <h5 className="font-bold text-slate-700 text-sm mt-3">No Delivery Logs Wiretap Selected</h5>
                    <p className="text-xs max-w-sm">Select an active logistics run or order reference on the left to inspect the secure communication wiretap stream in real-time.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && currentUser && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl text-left">
            <SettingsPanel 
              currentUser={{
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone || '',
                avatar: (currentUser as any).avatar || '',
                role: 'admin',
                walletBalance: 0
              }} 
              onUserUpdate={(updated) => {
                if (onUserUpdate) {
                  onUserUpdate(updated);
                }
              }} 
            />
          </div>

          {/* Sandbox Core Database Accounts Manager */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl text-left font-sans text-slate-800 space-y-6">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#FF5E2A] font-bold mb-1">🔐 Sandbox Database Engine</p>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Active Core Sandbox Accounts</h3>
              <p className="text-xs text-slate-500 mt-1 font-normal">Directly explore, add, delete, and modify user credentials within the system databases. All changes are propagated instantly across perspectives.</p>
            </div>

            {sandboxActionStatus && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl flex items-center justify-between">
                <span>⚡ {sandboxActionStatus}</span>
                <button type="button" onClick={() => setSandboxActionStatus('')} className="text-blue-500 hover:text-blue-800 text-xs font-bold bg-transparent border-0 cursor-pointer">✕ Close</button>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* LIST AND EDIT COLUMN */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <span className="text-xs font-black text-slate-700">Database Records ({sandboxUsers.length})</span>
                  <button 
                    type="button"
                    onClick={fetchSandboxUsers}
                    className="text-[11px] font-bold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    🔄 Refresh Cache
                  </button>
                </div>

                <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white max-h-[480px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                        <th className="p-3">User & Contact</th>
                        <th className="p-3">Credentials</th>
                        <th className="p-3">Status/Role</th>
                        <th className="p-3">Wallet</th>
                        <th className="p-3 text-right border-0">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-xs font-medium text-slate-700">
                      {sandboxUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">Loading databases...</td>
                        </tr>
                      ) : (
                        sandboxUsers.map((u) => {
                          const isEditing = editingSandboxUserId === u.id;
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/50">
                              <td className="p-3 whitespace-normal">
                                {isEditing ? (
                                  <div className="space-y-1 max-w-[140px]">
                                    <input 
                                      type="text" 
                                      className="border rounded px-2 py-1 text-xs w-full font-bold" 
                                      value={editingSandboxFields.name || ''} 
                                      onChange={(e) => setEditingSandboxFields({ ...editingSandboxFields, name: e.target.value })}
                                      placeholder="Full Name"
                                    />
                                    <input 
                                      type="tel" 
                                      className="border rounded px-2 py-1 text-[11px] w-full" 
                                      value={editingSandboxFields.phone || ''} 
                                      onChange={(e) => setEditingSandboxFields({ ...editingSandboxFields, phone: e.target.value })}
                                      placeholder="Phone"
                                    />
                                  </div>
                                ) : (
                                  <div className="max-w-[150px] truncate">
                                    <h4 className="font-bold text-slate-900 truncate">{u.name}</h4>
                                    <p className="text-[10px] text-slate-405 leading-none mt-1 truncate">{u.phone || 'No Phone contact'}</p>
                                    <p className="text-[9px] font-mono text-slate-400 font-bold leading-normal mt-0.5 truncate">{u.id}</p>
                                  </div>
                                )}
                              </td>
                              <td className="p-3 whitespace-normal">
                                {isEditing ? (
                                  <div className="space-y-1 max-w-[160px]">
                                    <input 
                                      type="email" 
                                      className="border rounded px-2 py-1 text-xs w-full" 
                                      value={editingSandboxFields.email || ''} 
                                      onChange={(e) => setEditingSandboxFields({ ...editingSandboxFields, email: e.target.value })}
                                      placeholder="Email"
                                    />
                                    <input 
                                      type="text" 
                                      className="border rounded px-2 py-1 text-xs w-full font-mono" 
                                      value={editingSandboxFields.password || ''} 
                                      onChange={(e) => setEditingSandboxFields({ ...editingSandboxFields, password: e.target.value })}
                                      placeholder="Passkey"
                                    />
                                  </div>
                                ) : (
                                  <div className="max-w-[180px] truncate">
                                    <div className="text-[11px] font-semibold text-slate-800 truncate">{u.email}</div>
                                    <div className="text-[10px] text-slate-500 mt-1 truncate">🗝️ Passcode: <code className="bg-slate-100 px-1 py-0.5 rounded font-black text-[#E04B1A]">{u.password || 'delivo123'}</code></div>
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="space-y-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    u.role === 'customer' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                                    u.role === 'vendor' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                                    u.role === 'rider' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                    'bg-slate-100 text-slate-600 border border-slate-300'
                                  }`}>
                                    {u.role}
                                  </span>
                                  {isEditing ? (
                                    <div className="mt-1">
                                      <select
                                        className="border rounded text-[10px] p-1 bg-white font-bold"
                                        value={editingSandboxFields.status || u.status || 'ACTIVE'}
                                        onChange={(e) => setEditingSandboxFields({ ...editingSandboxFields, status: e.target.value })}
                                      >
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="SUSPENDED">SUSPENDED</option>
                                      </select>
                                    </div>
                                  ) : (
                                    u.status === 'SUSPENDED' && (
                                      <div className="mt-1">
                                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                                          SUSPENDED
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-950">
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    className="border rounded px-2 py-1 text-xs w-20 font-bold" 
                                    value={editingSandboxFields.walletBalance || 0} 
                                    onChange={(e) => setEditingSandboxFields({ ...editingSandboxFields, walletBalance: parseFloat(e.target.value) || 0 })}
                                  />
                                ) : (
                                  <span>₦{(u.walletBalance || 0).toLocaleString()}</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {isEditing ? (
                                  <div className="space-x-1 inline-flex">
                                    <button 
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          setSandboxLoading(true);
                                          const res = await fetch('/api/admin/sandbox-users/edit', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ id: u.id, ...editingSandboxFields })
                                          });
                                          const data = await res.json();
                                          if (res.ok) {
                                            setSandboxActionStatus(`Updated credentials for '${u.name}'`);
                                            setEditingSandboxUserId(null);
                                            fetchSandboxUsers();
                                          } else {
                                            alert(data.message || 'Failed to update credentials.');
                                          }
                                        } catch (e) {
                                          alert('Communication error.');
                                        } finally {
                                          setSandboxLoading(false);
                                        }
                                      }}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-wide rounded cursor-pointer border-0"
                                    >
                                      Save
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => setEditingSandboxUserId(null)}
                                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded cursor-pointer border-0"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-x-3 inline-flex items-center">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setEditingSandboxUserId(u.id);
                                        setEditingSandboxFields({
                                          name: u.name,
                                          email: u.email,
                                          phone: u.phone || '',
                                          password: u.password || 'delivo123',
                                          walletBalance: u.walletBalance || 0
                                        });
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-transparent cursor-pointer border-0 p-0"
                                      title="Edit this sandbox account parameters"
                                    >
                                      Edit
                                    </button>
                                    
                                    {/* Prevent self delete */}
                                    {u.email !== currentUser.email && (
                                      <button 
                                        type="button"
                                        onClick={async () => {
                                          if (confirm(`Are you absolutely sure you want to completely erase the sandbox account for ${u.name}? This will delete their connected dispatcher/rider properties as well.`)) {
                                            try {
                                              setSandboxLoading(true);
                                              const res = await fetch('/api/admin/sandbox-users/delete', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ id: u.id })
                                              });
                                              if (res.ok) {
                                                setSandboxActionStatus(`Successfully purged user account '${u.name}' completely.`);
                                                fetchSandboxUsers();
                                              }
                                            } catch (e) {
                                              alert('Communication error.');
                                            } finally {
                                              setSandboxLoading(false);
                                            }
                                          }
                                        }}
                                        className="text-red-500 hover:text-red-700 text-xs font-bold bg-transparent cursor-pointer border-0 p-0"
                                        title="Purge completely from sandbox database"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CREATE SANDBOX USER COLUMN */}
              <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                <span className="text-xs font-black text-slate-800 uppercase tracking-widest block">🐣 Create Sandbox User</span>
                
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newSandboxAcct.name || !newSandboxAcct.email || !newSandboxAcct.password) {
                      alert('Please specify name, email Coordinates, and required passcode.');
                      return;
                    }
                    try {
                      setSandboxLoading(true);
                      const res = await fetch('/api/admin/sandbox-users/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newSandboxAcct)
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setSandboxActionStatus(`Added sandbox account '${newSandboxAcct.name}' successfully!`);
                        setNewSandboxAcct({ name: '', email: '', phone: '', password: '', role: 'customer' });
                        fetchSandboxUsers();
                      } else {
                        alert(data.message || 'Error occurred.');
                      }
                    } catch (e) {
                      alert('Network connection error.');
                    } finally {
                      setSandboxLoading(false);
                    }
                  }}
                  className="space-y-3 text-left"
                >
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Legal Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Kolawole Davies"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 outline-none"
                      value={newSandboxAcct.name}
                      onChange={(e) => setNewSandboxAcct({ ...newSandboxAcct, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email coordinate</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. kolade@gmail.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 outline-none"
                      value={newSandboxAcct.email}
                      onChange={(e) => setNewSandboxAcct({ ...newSandboxAcct, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phone number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +2348011223344"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 outline-none"
                      value={newSandboxAcct.phone}
                      onChange={(e) => setNewSandboxAcct({ ...newSandboxAcct, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Passcode / password</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. tunde90s"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-600 outline-none font-mono"
                      value={newSandboxAcct.password}
                      onChange={(e) => setNewSandboxAcct({ ...newSandboxAcct, password: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Database Role</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:border-blue-600 outline-none"
                      value={newSandboxAcct.role}
                      onChange={(e) => setNewSandboxAcct({ ...newSandboxAcct, role: e.target.value })}
                    >
                      <option value="customer">Customer Role (User client)</option>
                      <option value="vendor">Vendor Role (Restaurant Partner)</option>
                      <option value="rider">Rider Role (Logistics Dispatcher)</option>
                      <option value="admin">Operations Admin (Staff Console)</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    disabled={sandboxLoading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] tracking-wider uppercase rounded-xl transition-all shadow-md cursor-pointer border-0 mt-2"
                  >
                    {sandboxLoading ? 'Adding Account...' : 'Deploy Sandbox Account'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Vendor Products overlay */}
      {vendorProductsModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-950 p-4 shrink-0 flex justify-between items-center text-white">
               <div>
                 <h2 className="text-sm font-bold uppercase tracking-wider">Vendor Catalog Settings</h2>
               </div>
               <button onClick={() => {setVendorProductsModalId(null); setAdminProductForm(null);}} className="text-white hover:text-rose-400 bg-white/10 px-3 py-1 rounded-full text-xs font-bold transition-colors">Close</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
              {/* Product Form */}
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 uppercase mb-4">{adminProductForm?.id ? 'Edit Product Item' : 'Add New Product'}</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <input type="text" placeholder="Product Name" className="border p-2 rounded text-xs w-full" value={adminProductForm?.name || ''} onChange={e => setAdminProductForm({...adminProductForm, name: e.target.value})} />
                  <input type="number" placeholder="Price (NGN)" className="border p-2 rounded text-xs w-full" value={adminProductForm?.price || ''} onChange={e => setAdminProductForm({...adminProductForm, price: e.target.value})} />
                  <input type="text" placeholder="Category" className="border p-2 rounded text-xs w-full" value={adminProductForm?.category || ''} onChange={e => setAdminProductForm({...adminProductForm, category: e.target.value})} />
                  <input type="text" placeholder="Description" className="border p-2 rounded text-xs w-full" value={adminProductForm?.description || ''} onChange={e => setAdminProductForm({...adminProductForm, description: e.target.value})} />
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={adminProductForm?.isAvailable !== false} onChange={e => setAdminProductForm({...adminProductForm, isAvailable: e.target.checked })} />
                      Item Available in Stock
                    </label>
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                     <button onClick={handleAdminProductUpsert} className="px-4 py-2 bg-[#FF5E2A] text-white text-xs font-bold rounded-xl">{adminProductForm?.id ? 'Save Edit' : 'Create Product'}</button>
                     {adminProductForm && <button onClick={() => setAdminProductForm(null)} className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl">Clear Form</button>}
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 uppercase mb-4">Existing Products List ({adminVendorProducts.length})</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {adminVendorProducts.map(p => (
                    <div key={p.id} className={`border rounded-xl p-3 text-left relative ${p.isAvailable ? 'bg-white' : 'bg-slate-50 opacity-75'}`}>
                      <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                      <p className="text-[#FF5E2A] font-black text-xs mt-1">₦{p.price}</p>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <button onClick={() => setAdminProductForm(p)} className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">Edit Content</button>
                        <button onClick={() => handleAdminProductDelete(p.id)} className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer">Delete</button>
                      </div>
                    </div>
                  ))}
                  {adminVendorProducts.length === 0 && (
                     <p className="text-xs text-slate-400">No products assigned directly to this specific identifier yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {trackingOrder && (() => {
        const liveOrder = allOrders.find(o => o.id === trackingOrder.id) || trackingOrder;
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full border border-slate-200">
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <Compass className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span>Real-Time Admin Dispatch map</span>
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

              <div className="p-1 bg-neutral-900 border-b border-neutral-850">
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
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase animate-pulse">Current Logistics Status</p>
                  <span className="inline-block bg-emerald-100 text-emerald-850 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mt-0.5">
                    ● {liveOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-left sm:text-right text-xs w-full sm:w-auto">
                  <p className="font-bold text-slate-700 font-sans">Active Courier: {liveOrder.riderName || 'Assigning Rider...'}</p>
                  <p className="text-slate-550 mt-0.5">Drop-off: {liveOrder.customerAddress}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
