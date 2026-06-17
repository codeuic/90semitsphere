/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, ChevronDown, CheckCircle2, ShoppingBag, Truck, MapPin, Search, Home, HelpCircle, Store, Eye, EyeOff } from 'lucide-react';
import MapLocationPicker from './MapLocationPicker';

interface LandingPageProps {
  onEnterPortal: (role: 'customer' | 'vendor' | 'rider' | 'admin', customEmail?: string) => void;
  theme?: 'light' | 'dark';
  initialTab?: 'home' | 'vendor' | 'rider' | 'faqs';
}

export default function LandingPage({ onEnterPortal, theme = 'light', initialTab = 'home' }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'vendor' | 'rider' | 'faqs' | 'terms' | 'privacy' | 'cookies'>(initialTab as any);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [showVendorPassword, setShowVendorPassword] = useState(false);
  const [showRiderPassword, setShowRiderPassword] = useState(false);

  // Vendor Registrations state
  const [vendorForm, setVendorForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    category: 'Fast Food',
    description: '',
    address: 'Bells University of Technology, Ota, Ogun State, Nigeria',
    lat: '6.6908',
    lng: '3.1501',
    cacRegistration: '',
    taxId: '',
    bankName: 'Guaranty Trust Bank (GTB)',
    bankCode: '058',
    accountNumber: '',
    accountName: '',
    operatingHours: '09:00 - 22:00'
  });

  // Rider Onboarding state
  const [riderForm, setRiderForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'Motorcycle (Delivery Box)',
    vehicleNumber: '',
    governmentId: '',
    driversLicense: '',
    bankName: 'Zenith Bank',
    bankCode: '057',
    accountNumber: '',
    accountName: '',
    lat: '6.6908',
    lng: '3.1501'
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [riderAddress, setRiderAddress] = useState('Bells University of Technology, Ota, Ogun State');
  const [loading, setLoading] = useState(false);
  const [vendorOtpRequired, setVendorOtpRequired] = useState(false);
  const [vendorOtp, setVendorOtp] = useState('');
  const [riderOtpRequired, setRiderOtpRequired] = useState(false);
  const [riderOtp, setRiderOtp] = useState('');

  // Quick select common Lagos sectors
  const lagosDistricts = [
    { name: 'Ikoyi / Victoria Island', lat: 6.4549, lng: 3.4246, address: 'Alfred Rewane Road, Lagos Island' },
    { name: 'Ikeja Capital', lat: 6.5960, lng: 3.3371, address: 'Allen Avenue, Ikeja, Lagos' },
    { name: 'Yaba / Sabo', lat: 6.5158, lng: 3.3764, address: 'Herbert Macaulay Way, Yaba, Lagos' },
    { name: 'Lekki Phase 1', lat: 6.4281, lng: 3.4219, address: 'Admiralty Way, Lekki, Lagos' }
  ];

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!vendorForm.address || vendorForm.address === 'Custom Pinned Map Location') {
      setMessage({ type: 'error', text: 'Please search or pin your actual business address on the map.' });
      setLoading(false);
      return;
    }

    const payload = {
      businessName: vendorForm.businessName,
      ownerName: vendorForm.ownerName,
      email: vendorForm.email,
      phone: vendorForm.phone,
      password: vendorForm.password,
      category: vendorForm.category,
      description: vendorForm.description,
      address: vendorForm.address,
      lat: vendorForm.lat,
      lng: vendorForm.lng,
      cacRegistration: vendorForm.cacRegistration,
      taxId: vendorForm.taxId,
      otp: vendorOtp,
      bankAccount: {
        bankName: vendorForm.bankName,
        bankCode: vendorForm.bankCode,
        accountNumber: vendorForm.accountNumber,
        accountName: vendorForm.accountName
      },
      operatingHours: vendorForm.operatingHours
    };

    try {
      const res = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresOtp) {
          setVendorOtpRequired(true);
          setMessage({ type: 'success', text: 'Verification Code (OTP) sent to your email! Please enter it to continue.' });
          setLoading(false);
          return;
        }
        setMessage({
          type: 'success',
          text: `You have registered! Admin has seen your shop profile. We will check it and approve you soon to start selling!`
        });
        // Scroll to top of window to see message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Auto sign in as vendor for developer experience
        setTimeout(() => {
          onEnterPortal('vendor', vendorForm.email);
        }, 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Registration failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server network error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      name: riderForm.name,
      email: riderForm.email,
      phone: riderForm.phone,
      password: riderForm.password,
      vehicleType: riderForm.vehicleType,
      vehicleNumber: riderForm.vehicleNumber,
      governmentId: riderForm.governmentId,
      driversLicense: riderForm.driversLicense,
      otp: riderOtp,
      bankAccount: {
        bankName: riderForm.bankName,
        bankCode: riderForm.bankCode,
        accountNumber: riderForm.accountNumber,
        accountName: riderForm.accountName
      },
      lat: riderForm.lat,
      lng: riderForm.lng
    };

    try {
      const res = await fetch('/api/rider/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresOtp) {
          setRiderOtpRequired(true);
          setMessage({ type: 'success', text: 'Verification Code (OTP) sent to your email! Please enter it to continue.' });
          setLoading(false);
          return;
        }
        setMessage({
          type: 'success',
          text: `You have registered! Admin will view your rider details and approve you soon. Once you are approved, you can start making deliveries!`
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          onEnterPortal('rider', riderForm.email);
        }, 3500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Registration failed.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server network error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="landing-root" className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-neutral-50 text-neutral-800'}`}>
      {/* Header element */}
      <nav id="landing-nav" className={`sticky top-0 z-50 border-b ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-neutral-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 font-black text-xl sm:text-2xl tracking-tight text-emerald-600 cursor-pointer" onClick={() => setActiveTab('home')}>
                <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
                <span className="hidden min-[380px]:inline">90's.emitsphere</span>
                <span className="inline min-[380px]:hidden text-[#FF5E2A]">90s</span>
              </div>
              <div className="hidden md:flex space-x-6 text-sm font-medium">
                <button 
                  onClick={() => setActiveTab('home')}
                  className={`py-2 transition duration-150 ${activeTab === 'home' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  Home
                </button>
                <button 
                  onClick={() => setActiveTab('vendor')}
                  className={`py-2 transition duration-150 ${activeTab === 'vendor' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  Sell Food
                </button>
                <button 
                  onClick={() => setActiveTab('rider')}
                  className={`py-2 transition duration-150 ${activeTab === 'rider' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  Deliver Food (Rider)
                </button>
                <button 
                  onClick={() => setActiveTab('faqs')}
                  className={`py-2 transition duration-150 ${activeTab === 'faqs' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                  How it Works (FAQs)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                id="btn-goto-customer"
                onClick={() => onEnterPortal('customer', 'guest')} 
                className="hidden sm:inline-flex px-4 py-2 border border-[#FF5E2A]/30 rounded-lg text-sm font-semibold text-[#E04B1A] hover:bg-neutral-100 transition duration-150"
              >
                Find Food (Guest Browser)
              </button>
              <button 
                id="btn-get-started"
                onClick={() => onEnterPortal('customer', 'guest')} 
                className="inline-flex px-3 sm:px-5 py-2 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white font-semibold rounded-lg text-xs sm:text-sm shadow-sm transition duration-150"
              >
                <span className="hidden sm:inline">Order Food Now</span>
                <span className="inline sm:hidden">Order</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Tab ribbon */}
      <div className="md:hidden sticky top-16 z-40 bg-white dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-800 py-2.5 px-4 overflow-x-auto scrollbar-none flex gap-1 sm:gap-2 justify-center">
        <button
          onClick={() => { setActiveTab('home'); setMessage(null); }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition duration-150 ${activeTab === 'home' ? 'bg-[#1D9D41] text-white shadow-sm border-transparent' : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-300'}`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => { setActiveTab('vendor'); setMessage(null); }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition duration-150 ${activeTab === 'vendor' ? 'bg-[#1D9D41] text-white shadow-sm border-transparent' : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-300'}`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Sell</span>
        </button>
        <button
          onClick={() => { setActiveTab('rider'); setMessage(null); }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition duration-150 ${activeTab === 'rider' ? 'bg-[#1D9D41] text-white shadow-sm border-transparent' : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-300'}`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Deliver</span>
        </button>
        <button
          onClick={() => { setActiveTab('faqs'); setMessage(null); }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition duration-150 ${activeTab === 'faqs' ? 'bg-[#1D9D41] text-white shadow-sm border-transparent' : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-300'}`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQs</span>
        </button>
      </div>

      {/* Main body wrapper */}
      <main className="pb-16">
        
        {/* Banner Display Messages */}
        {message && (
          <div className="max-w-4xl mx-auto mt-6 px-4">
            <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold">{message.type === 'success' ? 'All Done!' : 'Wait/Try Again'}</h4>
                  <p className="text-sm mt-1">{message.text}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'home' && (
          <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-emerald-100/50 via-white to-neutral-50 py-16 px-4 md:py-24">
              <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full text-emerald-800 text-xs font-semibold">
                    <span>⚡ Quick Food Delivery around Lagos</span>
                  </div>
                  <h1 className="text-4xl sm:text-6xl font-black text-neutral-900 tracking-tight leading-tight md:leading-tight">
                    Order delicious food, <span className="text-emerald-600">delivered right away.</span>
                  </h1>
                  <p className="text-lg text-neutral-600">
                    Buy food from local shops in Lagos. We deliver super fast, pay our riders immediately, and use secure PIN codes so your food is safe!
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button 
                      onClick={() => onEnterPortal('customer', 'guest')}
                      className="inline-flex justify-center items-center gap-2 px-8 py-4 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white font-bold rounded-xl shadow-lg transition duration-150 transform hover:-translate-y-0.5"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Order Food Delivery</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('vendor')}
                      className="inline-flex justify-center items-center gap-2 px-6 py-4 border border-neutral-300 hover:border-neutral-400 bg-white text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 transition duration-150"
                    >
                      <Truck className="w-5 h-5" />
                      <span>Register Your Food Shop</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-200 rounded-3xl filter blur-2xl opacity-35 transform rotate-6"></div>
                  <div className="relative bg-white border border-neutral-200 p-4 rounded-3xl shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80" 
                      alt="Gourmet Pizza"
                      className="w-full h-80 object-cover rounded-2xl"
                    />
                    <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-neutral-100 max-w-xs flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 rounded-xl text-emerald-800">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 font-semibold uppercase">Average Delivery Time</p>
                        <p className="text-lg font-black text-neutral-900">22 Minutes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Platform metrics info */}
            <section className="max-w-7xl mx-auto py-16 px-4">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Super Simple Food & Delivery</h2>
                <p className="text-neutral-600 mt-2">90's.emitsphere helps you find good food and gets local riders paid instantly.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="bg-white border border-neutral-200 p-8 rounded-2xl text-center space-y-4 shadow-sm">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">Order from Many Shops</h3>
                  <p className="text-neutral-600 text-sm">Pick any delicious food from different shops near you, right on your screen.</p>
                </div>
                
                <div className="bg-white border border-neutral-200 p-8 rounded-2xl text-center space-y-4 shadow-sm">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">Safe 6-PIN Code Lock</h3>
                  <p className="text-neutral-600 text-sm">Tell the rider your secure 6-digit PIN code only when you hold your food box.</p>
                </div>

                <div className="bg-white border border-neutral-200 p-8 rounded-2xl text-center space-y-4 shadow-sm">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                    <Truck className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">Instant Rider Payments</h3>
                  <p className="text-neutral-600 text-sm">Riders get credited immediately to their balance as soon as they drop off the food.</p>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* Became Vendor Register Section */}
        {activeTab === 'vendor' && (
          <section className="max-w-4xl mx-auto mt-8 px-4">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-lg">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Sell Your Food on 90's.emitsphere</h2>
                <p className="text-neutral-500 mt-2">Grow your food shop. Choose your location, list foods, and get daily payouts.</p>
              </div>

              <form onSubmit={handleVendorSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Business Information</h3>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Business Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="e.g. Sizzle Burger & Grill"
                        value={vendorForm.businessName}
                        onChange={(e) => setVendorForm({ ...vendorForm, businessName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Owner Full Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="e.g. Adekunle Sizzle"
                        value={vendorForm.ownerName}
                        onChange={(e) => setVendorForm({ ...vendorForm, ownerName: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">CAC Certificate RC #</label>
                      <input 
                        type="text" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="e.g. RC 924519"
                        value={vendorForm.cacRegistration}
                        onChange={(e) => setVendorForm({ ...vendorForm, cacRegistration: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Tax ID (Optional)</label>
                      <input 
                        type="text" 
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="e.g. T-951924"
                        value={vendorForm.taxId}
                        onChange={(e) => setVendorForm({ ...vendorForm, taxId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Business Category</label>
                      <select 
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        value={vendorForm.category}
                        onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                      >
                        <option>Fast Food</option>
                        <option>Chinese & Asian</option>
                        <option>Traditional Soups & Swallows</option>
                        <option>Healthy Salads</option>
                        <option>Desserts & Shakes</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-bold text-neutral-500 uppercase">Business Description</label>
                    <textarea 
                      className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600 h-20"
                      placeholder="List some popular categories your chef cooks..."
                      value={vendorForm.description}
                      onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                    />
                  </div>
                </div>

                {/* Secure Auth Details */}
                <div>
                  <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Credentials & Contact</h3>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Corporate Email</label>
                      <input 
                        type="email" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="ade@sizzlegarden.com"
                        value={vendorForm.email}
                        onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Mobile Number</label>
                      <input 
                        type="tel" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="+234800000"
                        value={vendorForm.phone}
                        onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Portal Password</label>
                      <div className="relative mt-1">
                        <input 
                          type={showVendorPassword ? "text" : "password"} 
                          required
                          className="w-full pr-10 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                          placeholder="••••••••"
                          value={vendorForm.password}
                          onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowVendorPassword(!showVendorPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-800 focus:outline-none"
                          title={showVendorPassword ? "Hide password" : "Show password"}
                        >
                          {showVendorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GPS Onboarding location Map selector */}
                <div>
                  <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Operating GPS Location</h3>
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Search or Pin on the Map</label>
                    <MapLocationPicker
                      initialLocation={{
                        address: vendorForm.address,
                        lat: parseFloat(vendorForm.lat) || 6.5,
                        lng: parseFloat(vendorForm.lng) || 3.3
                      }}
                      onLocationChange={(loc) => {
                        setVendorForm({
                          ...vendorForm,
                          address: loc.address,
                          lat: loc.lat.toString(),
                          lng: loc.lng.toString()
                        });
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-neutral-500 uppercase">Resolved Business Address</label>
                    <input 
                      type="text" 
                      required
                      className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-100 cursor-not-allowed"
                      value={vendorForm.address}
                      readOnly
                    />
                  </div>
                </div>

                {/* Bank Settlements details */}
                <div>
                  <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Settlement Bank Account Details</h3>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Beneficiary Bank</label>
                      <select 
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50"
                        value={vendorForm.bankName}
                        onChange={(e) => {
                          const val = e.target.value;
                          let code = '058';
                          if (val.includes('Zenith')) code = '057';
                          if (val.includes('Access')) code = '044';
                          if (val.includes('First')) code = '011';
                          setVendorForm({ ...vendorForm, bankName: val, bankCode: code })
                        }}
                      >
                        <option>Zenith Bank</option>
                        <option>Guaranty Trust Bank (GTB)</option>
                        <option>Access Bank</option>
                        <option>First Bank of Nigeria</option>
                        <option>United Bank for Africa (UBA)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Account Number</label>
                      <input 
                        type="text" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="10-digit account number"
                        value={vendorForm.accountNumber}
                        onChange={(e) => setVendorForm({...vendorForm, accountNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Exact Account Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="Corporate registered name"
                        value={vendorForm.accountName}
                        onChange={(e) => setVendorForm({...vendorForm, accountName: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {vendorOtpRequired && (
                  <div className="pt-4 border-t">
                    <label className="block text-xs font-bold text-rose-600 uppercase">Verification OTP (Check Email)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter 6-digit OTP"
                      value={vendorOtp}
                      onChange={(e) => setVendorOtp(e.target.value)}
                      className="w-full mt-1 px-3 py-3 border border-rose-300 rounded-xl text-center font-bold tracking-[0.5em] focus:outline-rose-500 bg-rose-50"
                    />
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white font-black text-center rounded-xl transition-all font-semibold shadow-md inline-flex items-center justify-center gap-2"
                  >
                    {loading ? 'Submitting Documents secure...' : vendorOtpRequired ? 'Verify & Complete Partner Registration' : 'Register as Partner Restaurant'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Became Rider Register Section */}
        {activeTab === 'rider' && (
          <section className="max-w-4xl mx-auto mt-8 px-4">
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-lg">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Register as a Delivery Rider</h2>
                <p className="text-neutral-500 mt-2">Work as a rider with 90's.emitsphere. Pick up food boxes, deliver them to customers, and get paid into your wallet immediately.</p>
              </div>

              <form onSubmit={handleRiderSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Your Information</h3>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Full Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="e.g. Tunde Ojo"
                        value={riderForm.name}
                        onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Mobile Phone</label>
                      <input 
                        type="tel" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="+2348000000"
                        value={riderForm.phone}
                        onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Secure Auth Details */}
                <div>
                  <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Credentials</h3>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Courier Email</label>
                      <input 
                        type="email" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="tunde@delivoriders.com"
                        value={riderForm.email}
                        onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Portal Password</label>
                      <div className="relative mt-1">
                        <input 
                          type={showRiderPassword ? "text" : "password"} 
                          required
                          className="w-full pr-10 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                          placeholder="••••••••"
                          value={riderForm.password}
                          onChange={(e) => setRiderForm({ ...riderForm, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRiderPassword(!showRiderPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-800 focus:outline-none"
                          title={showRiderPassword ? "Hide password" : "Show password"}
                        >
                          {showRiderPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logistical License detail */}
                <div>
                  <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Your Bike / Ride Details</h3>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Vehicle Type</label>
                      <select 
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50"
                        value={riderForm.vehicleType}
                        onChange={(e) => setRiderForm({ ...riderForm, vehicleType: e.target.value })}
                      >
                        <option>Motorcycle (Delivery Box)</option>
                        <option>E-Bike</option>
                        <option>Bicycle</option>
                        <option>Compact Car</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Bike Number Plate</label>
                      <input 
                        type="text" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="e.g. LA-195-YAB"
                        value={riderForm.vehicleNumber}
                        onChange={(e) => setRiderForm({ ...riderForm, vehicleNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">National ID (NIN) Number</label>
                      <input 
                        type="text" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="e.g. ID-519245"
                        value={riderForm.governmentId}
                        onChange={(e) => setRiderForm({ ...riderForm, governmentId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Drivers License Number</label>
                      <input 
                        type="text" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="e.g. DL-ZEN924"
                        value={riderForm.driversLicense}
                        onChange={(e) => setRiderForm({ ...riderForm, driversLicense: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* GPS selection with Map */}
                <div>
                  <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Operating GPS Location</h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-3">Drag or search to pin your current delivery base/standby coordinate on the map:</p>
                  <MapLocationPicker
                    initialLocation={{
                      address: riderAddress,
                      lat: parseFloat(riderForm.lat) || 6.6908,
                      lng: parseFloat(riderForm.lng) || 3.1501
                    }}
                    onLocationChange={(loc) => {
                      setRiderAddress(loc.address);
                      setRiderForm({
                        ...riderForm,
                        lat: loc.lat.toString(),
                        lng: loc.lng.toString()
                      });
                    }}
                  />
                  <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 mb-2">
                    📍 Pinned Base: {riderAddress}
                  </div>

                  {/* Operational requirement warning */}
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 text-xs font-bold space-y-1">
                    <p className="flex items-center gap-1 text-amber-800 uppercase tracking-wide text-[10px] font-black">
                      <span>⚠️ Critical Onboarding Requirement</span>
                    </p>
                    <p className="leading-relaxed font-semibold">
                      Your delivery application must be kept open and device GPS location tracking active to receive and complete delivery jobs. The system pushes real-time location coordinate updates to Customer tracking, Vendor dispatch portals, and Admin dashboards as you travel!
                    </p>
                  </div>
                </div>

                {/* Bank Settlements */}
                <div>
                  <h3 className="text-lg font-bold text-neutral-800 border-b pb-2">Bank Payout Credentials</h3>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Settlement Bank</label>
                      <select 
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50"
                        value={riderForm.bankName}
                        onChange={(e) => {
                          const val = e.target.value;
                          let code = '058';
                          if (val.includes('Zenith')) code = '057';
                          if (val.includes('Access')) code = '044';
                          if (val.includes('First')) code = '011';
                          setRiderForm({ ...riderForm, bankName: val, bankCode: code })
                        }}
                      >
                        <option>Zenith Bank</option>
                        <option>Guaranty Trust Bank (GTB)</option>
                        <option>Access Bank</option>
                        <option>First Bank of Nigeria</option>
                        <option>United Bank for Africa (UBA)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Recipient Account Number</label>
                      <input 
                        type="text" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="10-digit GTB/Zenith NUBAN"
                        value={riderForm.accountNumber}
                        onChange={(e) => setRiderForm({ ...riderForm, accountNumber: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase">Account Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:bg-white focus:outline-emerald-600"
                        placeholder="Exact NUBAN account name"
                        value={riderForm.accountName}
                        onChange={(e) => setRiderForm({ ...riderForm, accountName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {riderOtpRequired && (
                  <div className="pt-4 border-t">
                    <label className="block text-xs font-bold text-rose-600 uppercase">Verification OTP (Check Email)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter 6-digit OTP"
                      value={riderOtp}
                      onChange={(e) => setRiderOtp(e.target.value)}
                      className="w-full mt-1 px-3 py-3 border border-rose-300 rounded-xl text-center font-bold tracking-[0.5em] focus:outline-rose-500 bg-rose-50"
                    />
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white font-black text-center rounded-xl transition-all shadow-md inline-flex items-center justify-center"
                  >
                    {loading ? 'Validating ID credentials...' : riderOtpRequired ? 'Verify & Complete Rider Registration' : 'Register as Courier Rider'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* FAQs info tab */}
        {activeTab === 'faqs' && (
          <section className="max-w-4xl mx-auto mt-8 px-4">
            <h2 className="text-3xl font-black text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="bg-white border p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-lg text-neutral-900">How does the 6-Digit OTP secure verifying process work?</h3>
                <p className="text-sm text-neutral-600 mt-2">When a customer pays for an order, the system generates a random, secure 6-digit OTP code which is sent to their registered email address and displayed in the customer delivery portal. The rider, upon arriving, must ask the customer for the verification PIN. Once input and confirmed, the system verifies and credits the rider with the delivery payout instantly!</p>
              </div>
              <div className="bg-white border p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-lg text-neutral-900">What are the platform fees?</h3>
                <p className="text-sm text-neutral-600 mt-2">Standard platform settings are: a configurable flat service fee (default ₦350 per checkouts) and an estimated Paystack card gateway fee (default 1.5% of order subtotal). Our commission rate on restaurant sales is set to 5%.</p>
              </div>
              <div className="bg-white border p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-lg text-neutral-900">Are rider payouts immediate?</h3>
                <p className="text-sm text-neutral-600 mt-2">Yes! Riders earn the delivery fee instantly in their in-app wallet upon successful OTP verification. Riders can request bank settlements immediately with daily transfers.</p>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* Footer standard details */}
      <footer id="landing-footer" className="bg-neutral-950 text-neutral-400 py-12 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Company</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><span className="hover:text-white cursor-pointer" onClick={() => setActiveTab('home')}>About 90's.emitsphere</span></li>
              <li><span className="hover:text-white cursor-pointer" onClick={() => setActiveTab('faqs')}>Our Services</span></li>
              <li><span className="hover:text-white cursor-pointer" onClick={() => setActiveTab('faqs')}>Customer FAQs</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Join Us</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><span className="hover:text-white cursor-pointer" onClick={() => setActiveTab('vendor')}>Register Restaurant</span></li>
              <li><span className="hover:text-white cursor-pointer" onClick={() => setActiveTab('rider')}>Apply as Dispatch Rider</span></li>
            </ul>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mt-6">Partner Login</h4>
            <ul className="mt-2 space-y-2 text-sm">
              <li><span id="link-vendor-portal" className="hover:text-white cursor-pointer text-emerald-500 hover:underline" onClick={() => onEnterPortal('vendor')}>Restaurant Partner Login</span></li>
              <li><span id="link-rider-portal" className="hover:text-white cursor-pointer text-emerald-500 hover:underline" onClick={() => onEnterPortal('rider')}>Rider Agent Login</span></li>
              <li><span id="link-admin-portal" className="text-neutral-500 hover:text-white cursor-pointer block mt-3 text-xs" onClick={() => onEnterPortal('admin')}>Operations Admin Console</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Legal Framework</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><span className="hover:text-white cursor-pointer" onClick={() => { window.location.hash = '#/terms'; }}>Terms of Fulfillment Services</span></li>
              <li><span className="hover:text-white cursor-pointer" onClick={() => { window.location.hash = '#/privacy'; }}>Privacy Policy</span></li>
              <li><span className="hover:text-white cursor-pointer" onClick={() => { window.location.hash = '#/cookies'; }}>Cookies Policy</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Secure Operations</h4>
            <p className="mt-4 text-xs leading-relaxed">
              90's.emitsphere platform operations is safe and secure. Built with AES end-to-end OTP guarantees and Paystack gateway integrations.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-neutral-900 text-center text-xs text-neutral-600 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 90's.emitsphere Food Logistics. All rights reserved. Operating in Lagos State, Nigeria.</p>
          <button 
            id="btn-trigger-simulation-controls"
            onClick={() => {
              window.location.hash = 'emitsphere';
              const ev = new HashChangeEvent('hashchange');
              window.dispatchEvent(ev);
            }}
            className="text-neutral-700 hover:text-emerald-500 transition-colors cursor-pointer bg-transparent border-0 font-bold"
          >
            🎛️ Simulation Controls
          </button>
        </div>
      </footer>

      {/* Floating Error Card (Bottom Left) */}
      {message && message.type === 'error' && (
        <div id="floating-error-card-onboarding" className="fixed bottom-6 left-6 z-50 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl p-4 shadow-2xl max-w-sm flex items-start gap-4 border-l-4 border-l-rose-600 animate-bounce">
          <div className="flex-shrink-0 text-rose-600 bg-rose-100 rounded-full p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-955">Onboarding / OTP Error</h4>
            <p className="text-xs mt-1 font-semibold leading-normal text-rose-800">{message.text}</p>
          </div>
          <button 
            type="button"
            onClick={() => setMessage(null)}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-500 hover:text-rose-700 transition flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
