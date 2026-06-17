/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Truck, Shield, Navigation2, CheckCircle, Smartphone, DollarSign, 
  MapPin, Clock, Key, AlertTriangle, Send, MessageSquare, Loader2
} from 'lucide-react';
import { Rider, Order, ChatMessage } from '../types';
import SettingsPanel from './SettingsPanel';

interface RiderAppProps {
  riderId: string;
  currentUser: any;
  onUserUpdate?: (user: any) => void;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export default function RiderApp({ riderId, currentUser, onUserUpdate, onLogout, theme = 'light', onThemeChange }: RiderAppProps) {
  const [riderProfile, setRiderProfile] = useState<Rider | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Order[]>([]);
  
  // Tab panels: jobs, status tracker, wallet, history runs
  const [activeTab, setActiveTab] = useState<'status' | 'wallet' | 'history' | 'settings'>('status');
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [simulationProgress, setSimulationProgress] = useState(0);

  // Interactive coordinates & OTP
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Interactive message channels
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatText, setNewChatText] = useState('');

  const fetchChats = async (orderId: string) => {
    try {
      const res = await fetch(`/api/chats/${orderId}`);
      if (res.ok) {
        const d = await res.json();
        setChatMessages(d);
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (!activeOrder) {
      setChatMessages([]);
      return;
    }
    fetchChats(activeOrder.id);
    const orderChatInterval = setInterval(() => {
      fetchChats(activeOrder.id);
    }, 3000);
    return () => clearInterval(orderChatInterval);
  }, [activeOrder?.id]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !newChatText.trim()) return;

    try {
      const res = await fetch('/api/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          senderId: riderId,
          senderName: currentUser.name,
          senderRole: 'rider',
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
    fetchRiderData();
    fetchRiderOrders();
    const interval = setInterval(fetchRiderOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // Reset simulation when order ID changes
  useEffect(() => {
    setSimulationProgress(0);
  }, [activeOrder?.id, activeOrder?.status]);

  // Periodic emulator of coordinate progress
  useEffect(() => {
    if (!activeOrder || !riderProfile || riderProfile.onlineStatus !== 'ONLINE') {
      return;
    }

    const timer = setInterval(() => {
      setSimulationProgress((p) => {
        if (p >= 1) return 1;
        return Number((p + 0.05).toFixed(2)); // Move 5% closer every 3 seconds
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [activeOrder?.id, activeOrder?.status, riderProfile?.onlineStatus]);

  // Push coordinates update to the server based on progress
  useEffect(() => {
    if (!activeOrder || !riderProfile) return;

    let targetLat = riderProfile.lat || 6.6908;
    let targetLng = riderProfile.lng || 3.1501;

    const vLat = activeOrder.vendorLat || 6.6908;
    const vLng = activeOrder.vendorLng || 3.1501;
    const cLat = activeOrder.customerLat || 6.6908;
    const cLng = activeOrder.customerLng || 3.1501;

    if (activeOrder.status === 'RIDER_ASSIGNED') {
      // Moving from current position to restaurant
      const startLat = riderProfile.lat || 6.6908;
      const startLng = riderProfile.lng || 3.1501;
      targetLat = startLat + (vLat - startLat) * simulationProgress;
      targetLng = startLng + (vLng - startLng) * simulationProgress;
    } else if (activeOrder.status === 'RIDER_AT_VENDOR' || activeOrder.status === 'VENDOR_PREPARING') {
      targetLat = vLat;
      targetLng = vLng;
    } else if (activeOrder.status === 'PICKED_UP' || activeOrder.status === 'RIDER_ON_THE_WAY') {
      // Moving from restaurant to customer dropoff
      targetLat = vLat + (cLat - vLat) * simulationProgress;
      targetLng = vLng + (cLng - vLng) * simulationProgress;
    } else if (activeOrder.status === 'RIDER_ARRIVED') {
      targetLat = cLat;
      targetLng = cLng;
    }

    // Set updated values locally on profile to reflect
    setRiderProfile((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        lat: targetLat,
        lng: targetLng
      };
    });

    // Notify backend
    fetch('/api/rider/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        riderId,
        onlineStatus: riderProfile.onlineStatus,
        lat: targetLat,
        lng: targetLng
      })
    }).catch(() => {});

  }, [activeOrder?.id, activeOrder?.status, simulationProgress]);

  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { orderId } = customEvent.detail || {};
      if (orderId) {
        setActiveTab('status');
      }
    };
    window.addEventListener('navigate-to-order', handleNav);
    return () => window.removeEventListener('navigate-to-order', handleNav);
  }, []);

  const fetchRiderData = async () => {
    try {
      const res = await fetch('/api/admin/onboardings');
      const d = await res.json();
      const p = d.allRiders.find((r: Rider) => r.id === riderId);
      if (p) {
        setRiderProfile(p);
      }
    } catch(e) {}
  };

  const fetchRiderOrders = async () => {
    try {
      const res = await fetch(`/api/orders?riderId=${riderId}`);
      if (res.ok) {
        const orderList = await res.json();
        setHistoryOrders(orderList || []);
        const active = orderList.find((o: Order) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
        if (active) {
          setActiveOrder(active);
          return;
        } else {
          setActiveOrder(null);
        }
      }

      // Query unassigned matching orders in the Lagos area
      const allRes = await fetch('/api/orders');
      if (allRes.ok) {
        const allOrders = await allRes.json();
        const openJobs = allOrders.filter((o: Order) => 
          o.status === 'VENDOR_PREPARING' && 
          (!o.riderId || o.riderId === '')
        );
        setAvailableJobs(openJobs);
      }
    } catch(e) {}
  };

  const handleToggleOnline = async () => {
    if (!riderProfile) return;
    const nextStatus = riderProfile.onlineStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    
    try {
      const res = await fetch('/api/rider/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId,
          onlineStatus: nextStatus,
          // Shared coordinates Lagos Island Surulere axis for matching
          lat: 6.518,
          lng: 3.374
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRiderProfile(data.rider);
      } else {
        alert(data.message || 'Verification pending approval');
      }
    } catch(e) {}
  };

  const handleClaimOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/rider/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, riderId })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveOrder(data.order);
        setAvailableJobs(prev => prev.filter(j => j.id !== orderId));
      } else {
        alert(data.message || 'Failed to claim gig');
      }
    } catch(e) {
      alert('Error updating logistics networks');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchOrderDetails = async () => {
    await fetchRiderOrders();
  };

  // Move delivery stages
  const handleRiderUpdateStatus = async (endpoint: string) => {
    if (!activeOrder) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/rider/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: activeOrder.id })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveOrder(data.order);
      }
    } catch(e) {}
    setLoading(false);
  };

  const handleRejectGg = () => {
    setActiveOrder(null);
  };

  // Verify OTP Complete secure payout split
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !enteredOtp) return;
    setOtpError('');
    setLoading(true);

    try {
      const res = await fetch('/api/orders/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          otp: enteredOtp
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('🎉 Delivery Verified Successfully! Wallet credited ₦' + activeOrder.deliveryFee);
        setActiveOrder(null);
        setEnteredOtp('');
        fetchRiderData();
      } else {
        setOtpError(data.message || 'Invalid verification PIN');
      }
    } catch(err) {
      setOtpError('Error connecting verification system APIs');
    } finally {
      setLoading(false);
    }
  };

  // Withdraw requests
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !riderProfile) return;
    setLoading(true);

    try {
      const res = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: riderProfile.userId,
          role: 'rider',
          entityId: riderId,
          amount: withdrawAmount
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Your withdrawal request has been submitted successfully and is awaiting Admin approval!');
        setWithdrawAmount('');
        fetchRiderData();
      } else {
        alert(data.message || 'Payout failed');
      }
    } catch (err) {
      alert('Error payouts network backend');
    } finally {
      setLoading(false);
    }
  };

  if (riderProfile && riderProfile.approvedStatus !== 'APPROVED') {
    return (
      <div id="rider-mobile-root" className="max-w-md mx-auto bg-neutral-900 text-white min-h-[92vh] flex flex-col justify-center font-sans border-x border-neutral-800 shadow-2xl rounded-2xl overflow-hidden mt-4 p-6 text-center">
        <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-white mb-2">Account Not Active</h2>
        <p className="text-neutral-400 mb-6 text-xs leading-relaxed">
          Your rider account details cannot access delivery jobs at this time. Your account is either undergoing verification, declined, or currently suspended by platform operations.
        </p>
        <span className="px-4 py-2 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-xl uppercase tracking-wider inline-block">
          STATUS: {riderProfile.approvedStatus.replace(/_/g, ' ')}
        </span>
      </div>
    );
  }

  return (
    <div id="rider-mobile-root" className="max-w-md mx-auto bg-neutral-900 text-white h-[88vh] sm:h-[92vh] flex flex-col justify-between font-sans border-x border-neutral-800 shadow-2xl rounded-2xl overflow-hidden mt-4">
      {/* Rider custom status bar */}
      <header className="bg-neutral-950 p-5 border-b border-neutral-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Truck className="w-6 h-6 text-emerald-500" />
          <div>
            <h4 className="font-extrabold text-sm tracking-tight text-white">{currentUser.name}</h4>
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Approved Courier</span>
          </div>
        </div>

        {riderProfile && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onThemeChange?.(theme === 'light' ? 'dark' : 'light')}
              className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white transition-all text-xs cursor-pointer flex items-center justify-center"
              title="Toggle theme style"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              onClick={handleToggleOnline}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${riderProfile.onlineStatus === 'ONLINE' ? 'bg-[#FF5E2A] text-white' : 'bg-neutral-800 text-neutral-400'}`}
            >
              {riderProfile.onlineStatus === 'ONLINE' ? '● Online and Ready' : 'Offline'}
            </button>
          </div>
        )}
      </header>

      {/* Main interaction panels wrapper */}
      <main className="p-5 flex-grow overflow-y-auto">
        
        {activeTab === 'status' && (
          <div className="space-y-6 animate-fade-in">
            {!activeOrder ? (
              <div className="space-y-6">
                
                {/* Available runs */}
                <div className="bg-neutral-800/60 p-6 rounded-2xl border border-neutral-800/80 text-center space-y-4">
                  <Smartphone className="w-10 h-10 text-emerald-500 mx-auto opacity-75 animate-pulse" />
                  <div>
                    <h5 className="font-black text-white text-base">New Delivery Jobs</h5>
                    <p className="text-xs text-neutral-400 mt-1">Ready to deliver food? Tap the button below to see new delivery jobs near you.</p>
                  </div>
                  
                  <button
                    onClick={handleFetchOrderDetails}
                    className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    id="scan-gigs-btn"
                  >
                    Check for New Jobs
                  </button>
                </div>

                <div className="space-y-3.5">
                  <h6 className="font-extrabold text-[10.5px] uppercase tracking-wider text-neutral-400">Available Jobs ({availableJobs.length})</h6>
                  {availableJobs.length === 0 ? (
                    <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-850 text-center">
                      <p className="text-xs text-neutral-400 font-semibold">No new jobs right now.</p>
                      <p className="text-[10px] text-neutral-500 mt-1">Once a customer buys food and the shop accepts it, you will see it here!</p>
                    </div>
                  ) : (
                    availableJobs.map((job) => (
                      <div key={job.id} className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3 text-left">
                        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                          <span className="text-[10px] font-bold text-emerald-400 font-mono">Job Code: {job.id.substring(0, 6)}</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase">{job.status === 'VENDOR_PREPARING' ? 'READY FOR RIDER' : job.status}</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <p className="text-[9px] text-neutral-500 font-black uppercase">🏢 Food Shop</p>
                            <p className="font-extrabold text-white">{job.vendorName}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-neutral-500 font-black uppercase">🏡 Customer House</p>
                            <p className="font-bold text-white">{job.customerAddress}</p>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold pt-1 text-emerald-400">
                            <span>Money You Will Get</span>
                            <span>₦{job.deliveryFee.toLocaleString()}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleClaimOrder(job.id)}
                          className="w-full py-2.5 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                          id={`claim-btn-${job.id}`}
                        >
                          ⚡ Accept This Job
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                
                {/* Active logistic details */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="text-[10px] font-extrabold text-emerald-500 font-mono">Run: {activeOrder.id}</span>
                    <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full uppercase">{activeOrder.status}</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-[10px] text-neutral-400 font-black uppercase">🏢 Restaurant Pickup</p>
                      <p className="font-bold text-white mt-0.5">{activeOrder.vendorName}</p>
                      <p className="text-neutral-400 text-[11px] mt-0.5">{activeOrder.vendorAddress}</p>
                    </div>

                    <div className="border-t border-neutral-800/50 pt-3">
                      <p className="text-[10px] text-neutral-400 font-black uppercase">🏡 Customer Dropoff Point</p>
                      <p className="font-bold text-white mt-0.5">{activeOrder.customerName} ({activeOrder.customerPhone})</p>
                      <p className="text-neutral-400 text-[11px] mt-0.5">{activeOrder.customerAddress}</p>
                    </div>

                    <div className="border-t border-neutral-800/50 pt-2 flex justify-between items-center text-sm font-extrabold text-emerald-400">
                      <span>Premium Delivery Rate</span>
                      <span>₦{activeOrder.deliveryFee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Milestones transitions action triggers */}
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Logistic Progression Milestones</span>
                  
                  {activeOrder.status === 'RIDER_ASSIGNED' && (
                    <button
                      onClick={() => handleRiderUpdateStatus('arrived-vendor')}
                      className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      I have arrived at Vendor
                    </button>
                  )}

                  {activeOrder.status === 'RIDER_AT_VENDOR' && (
                    <button
                      onClick={() => handleRiderUpdateStatus('pickup')}
                      className="w-full py-4 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all animate-pulse"
                    >
                      Parcels Loaded • Start Delivery
                    </button>
                  )}

                  {(activeOrder.status === 'PICKED_UP' || activeOrder.status === 'RIDER_ON_THE_WAY') && (
                    <button
                      onClick={() => handleRiderUpdateStatus('arrived-override')}
                      className="w-full py-4 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Arrived Outside Customer Residence
                    </button>
                  )}

                  {activeOrder.status === 'RIDER_ARRIVED' && (
                    <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl flex items-start gap-2 text-xs">
                        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="leading-relaxed">Verify Pin: Prompt the customer for the 6-digit email confirmation OTP. Financial split and rider credits unlock immediately upon correct entry.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase">Input 6-Digit Delivery OTP</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="e.g. 614859"
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-center font-bold tracking-widest text-white focus:outline-emerald-500 font-mono"
                          value={enteredOtp}
                          onChange={(e) => setEnteredOtp(e.target.value)}
                        />
                      </div>

                      {otpError && (
                        <p className="text-xs text-rose-500 font-semibold">{otpError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all inline-flex items-center justify-center gap-2"
                      >
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                        <span>Verify PIN and Finalize Delivery</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* INTERACTIVE MESSAGE CHAT SECTION */}
                <div id="rider-chat-section" className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3.5 text-left font-sans">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <h5 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <MessageSquare className="w-4 h-4 text-emerald-500" />
                      <span>Customer Live Chat</span>
                    </h5>
                    <span className="text-[9px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase font-mono">
                      Direct Channel
                    </span>
                  </div>

                  {/* Chat messages list */}
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1 bg-neutral-900 border border-neutral-800 rounded-xl p-3 font-sans">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-6 text-neutral-500">
                        <p className="text-xs font-bold text-neutral-400">No correspondence logged.</p>
                        <p className="text-[10px] mt-0.5 text-neutral-500">Send a friendly greeting to begin the delivery run.</p>
                      </div>
                    ) : (
                      chatMessages.map((m) => {
                        const isMe = m.senderRole === 'rider';
                        const isSupport = m.senderRole === 'admin';
                        const isVendor = m.senderRole === 'vendor';
                        const isCustomer = m.senderRole === 'customer';
                        
                        let label = m.senderName;
                        let bubbleStyle = 'bg-neutral-800 text-neutral-100 rounded-tl-none border border-neutral-700';
                        
                        if (isMe) {
                          bubbleStyle = 'bg-[#FF5E2A] text-white rounded-tr-none';
                          label = 'You';
                        } else if (isSupport) {
                          bubbleStyle = 'bg-amber-500/20 text-amber-200 rounded-tl-none border border-amber-500/30';
                          label = 'Customer Care';
                        } else if (isVendor) {
                          bubbleStyle = 'bg-purple-950/40 text-purple-200 rounded-tl-none border border-purple-500/20';
                          label = `${m.senderName} (Vendor)`;
                        } else if (isCustomer) {
                          label = `${m.senderName} (Customer)`;
                        }

                        return (
                          <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-wider">
                                {label}
                              </span>
                              <span className="text-[8px] text-neutral-500 font-mono">
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={`px-3 py-2 rounded-2xl text-xs font-semibold max-w-[85%] leading-relaxed ${bubbleStyle}`}>
                              {m.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Send chat form */}
                  <form onSubmit={handleSendChatMessage} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message to the customer..."
                      className="flex-grow bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-emerald-500 placeholder-neutral-500 focus:outline transition-all"
                      value={newChatText}
                      onChange={(e) => setNewChatText(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white p-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center flex-shrink-0 border-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleRejectGg}
                    className="w-full py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 text-xs font-bold rounded-lg border border-neutral-800"
                  >
                    Reject Task
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINANCIAL RIDER WALLET PANEL */}
        {activeTab === 'wallet' && riderProfile && (
          <div className="space-y-6 animate-fade-in">
            <div className={`p-6 rounded-2xl border space-y-3 shadow-md ${theme === 'light' ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-gradient-to-br from-neutral-800 to-neutral-950 border-neutral-700/50 text-white shadow-md'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-550' : 'text-neutral-400'}`}>Cleared Logistical Earnings</span>
              <h3 className={`text-3xl font-black ${theme === 'light' ? 'text-emerald-700' : 'text-white'}`}>₦{(riderProfile.balance || 8200).toLocaleString()}</h3>
              <p className={`text-[11px] leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Delivery fees are transferred instantly to your configured bank account card details.</p>
            </div>

            {/* Withdraw form */}
            <div className={`border rounded-2xl p-5 space-y-4 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-850' : 'bg-neutral-950 border-neutral-800 text-white'}`}>
              <h5 className={`font-bold text-sm ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Request Bank Cashout</h5>
              
              <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-neutral-900 border-neutral-800 text-neutral-400'}`}>
                <p className={`font-black text-[8px] uppercase ${theme === 'light' ? 'text-slate-400' : 'text-neutral-200'}`}>Destination bank coordinates</p>
                <p>🏦 Bank: <strong>{riderProfile.bankAccount.bankName}</strong></p>
                <p>💳 Account: <strong>{riderProfile.bankAccount.accountNumber}</strong></p>
                <p>👤 Beneficiary: <strong>{riderProfile.bankAccount.accountName}</strong></p>
              </div>

              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div className="space-y-1">
                  <label className={`block text-[10px] uppercase font-bold ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Payout Amount (₦)</label>
                  <input
                    type="number"
                    required
                    className={`w-full px-3 py-2 rounded-lg text-sm font-bold focus:outline-emerald-500 border ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-700 text-white'}`}
                    placeholder="e.g. 5000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white hover:bg-neutral-100 text-black border border-neutral-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                  style={{ color: '#000000' }}
                >
                  {loading ? 'Initiating central bank APIS...' : 'Send Payout Transfer'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* HISTORY THE RUNS OVER TIME */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-neutral-800">
                <h5 className="font-extrabold text-sm text-neutral-100 uppercase tracking-wide">Historical Delivery Runs</h5>
                <span className="text-xs bg-[#FF5E2A] text-white font-mono font-bold px-2.5 py-0.5 rounded-full">{historyOrders.length} Trips</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-neutral-800">
                <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800/80">
                  <span className="block text-[9px] text-neutral-400 font-extrabold uppercase mb-0.5">Total Trips Completed</span>
                  <span className="text-xl font-black text-white">{historyOrders.filter(o => o.status === 'DELIVERED').length}</span>
                </div>
                <div className="p-3.5 bg-neutral-900 rounded-xl border border-neutral-800/80">
                  <span className="block text-[9px] text-neutral-400 font-extrabold uppercase mb-0.5">Cumulative earnings</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">₦{historyOrders.filter(o => o.status === 'DELIVERED').reduce((acc, o) => acc + (o.deliveryFee || 0), 0).toLocaleString()}</span>
                </div>
              </div>

              {historyOrders.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 space-y-1">
                  <Clock className="w-8 h-8 text-neutral-600 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-neutral-400">No previous logs recorded.</p>
                  <p className="text-[10px] text-neutral-500">Pick up dynamic dispatch gigs to populate your log sheet over time.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {historyOrders.map((o) => {
                    const isDelivered = o.status === 'DELIVERED';
                    const isCancelled = o.status === 'CANCELLED' || o.status === 'REFUNDED';
                    return (
                      <div key={o.id} className="p-3.5 bg-neutral-900/65 border border-neutral-800 rounded-xl space-y-2 last:mb-0 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-neutral-500 font-mono font-bold">#{o.id.substring(0, 8)}</span>
                            <h6 className="font-extrabold text-neutral-200 mt-0.5">{o.vendorName}</h6>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isDelivered ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : isCancelled ? 'bg-rose-950 text-rose-400 border border-rose-900' : 'bg-blue-950 text-blue-400 border border-blue-900'}`}>
                            {o.status === 'DELIVERED' ? 'Delivered' : o.status}
                          </span>
                        </div>
                        
                        <div className="text-neutral-400 text-[11px] leading-snug">
                          <p>📍 Delivery address: <strong className="text-neutral-300 font-normal">{o.customerAddress}</strong></p>
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-mono border-t border-neutral-850 pt-2 text-neutral-400">
                          <span>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Today'}</span>
                          <span className="font-bold text-emerald-400">Payout: +₦{(o.deliveryFee || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left space-y-4">
            <SettingsPanel 
              currentUser={{
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                phone: currentUser.phone || '',
                avatar: (currentUser as any).avatar || '',
                role: 'rider',
                walletBalance: 0
              }} 
              onUserUpdate={(updated) => {
                if (onUserUpdate) {
                   onUserUpdate(updated);
                }
              }} 
            />

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full py-3.5 bg-[#FF5E2A] text-white hover:bg-[#E04B1A] font-black text-xs uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-6"
                title="Sign out of courier terminal"
              >
                <span>🚪 Sign Out from Terminal</span>
              </button>
            )}
          </div>
        )}

      </main>

      {/* Persistent mobile tab footer */}
      <footer className="bg-neutral-950 p-3 border-t border-neutral-800 grid grid-cols-4 gap-1.5 sticky bottom-0 z-50">
        <button
          onClick={() => { setActiveTab('status'); fetchRiderOrders(); }}
          className={`py-2 text-[11px] font-bold rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${activeTab === 'status' ? 'bg-[#1D9D41] text-white font-black border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A]'}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Active</span>
        </button>
        <button
          onClick={() => { setActiveTab('history'); fetchRiderOrders(); }}
          className={`py-2 text-[11px] font-bold rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${activeTab === 'history' ? 'bg-[#1D9D41] text-white font-black border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A]'}`}
        >
          <Clock className="w-4 h-4" />
          <span>Trips</span>
        </button>
        <button
          onClick={() => { setActiveTab('wallet'); fetchRiderData(); }}
          className={`py-2 text-[11px] font-bold rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${activeTab === 'wallet' ? 'bg-[#1D9D41] text-white font-black border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A]'}`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Wallet</span>
        </button>
        <button
          onClick={() => { setActiveTab('settings'); }}
          className={`py-2 text-[11px] font-bold rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${activeTab === 'settings' ? 'bg-[#1D9D41] text-white font-black border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A]'}`}
        >
          <Truck className="w-4 h-4 text-[#FF5E2A]" />
          <span>Settings</span>
        </button>
      </footer>
    </div>
  );
}
