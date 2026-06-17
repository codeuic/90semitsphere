/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, User, ShoppingBag, Truck, Shield, Sparkles, 
  MapPin, LogOut, RefreshCw, Layers, CheckCircle2,
  Bell, X, Eye, EyeOff
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import CustomerApp from './components/CustomerApp';
import VendorDashboard from './components/VendorDashboard';
import RiderApp from './components/RiderApp';
import AdminConsole from './components/AdminConsole';
import LoadingScreen from './components/LoadingScreen';
import StandaloneLegalPage from './components/StandaloneLegalPage';
import MapLocationPicker from './components/MapLocationPicker';
import { User as UserType } from './types';

function PortalLoginForm({ 
  role, 
  onLoginSuccess,
  onNavigateToSignup
}: { 
  role: 'vendor' | 'rider' | 'admin', 
  onLoginSuccess: (user: UserType, associatedId: string, token: string) => void,
  onNavigateToSignup: (role: 'vendor' | 'rider') => void
}) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Vendor signup states
  const [vendorBusinessName, setVendorBusinessName] = useState('');
  const [vendorOwnerName, setVendorOwnerName] = useState('');
  const [vendorCacRC, setVendorCacRC] = useState('');
  const [vendorTaxId, setVendorTaxId] = useState('');
  const [vendorCategory, setVendorCategory] = useState('Fast Food');
  const [vendorDescription, setVendorDescription] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [vendorAddress, setVendorAddress] = useState('Lagos Central, Lagos State, Nigeria');
  const [vendorLat, setVendorLat] = useState('6.5244');
  const [vendorLng, setVendorLng] = useState('3.3792');
  const [vendorBankName, setVendorBankName] = useState('Zenith Bank');
  const [vendorBankCode, setVendorBankCode] = useState('057');
  const [vendorAccountNumber, setVendorAccountNumber] = useState('');
  const [vendorAccountName, setVendorAccountName] = useState('');
  const [vendorHours, setVendorHours] = useState('08:00 - 22:00');

  // Rider signup states
  const [riderName, setRiderName] = useState('');
  const [riderEmail, setRiderEmail] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderPassword, setRiderPassword] = useState('');
  const [riderVehicleType, setRiderVehicleType] = useState('motorcycle');
  const [riderVehicleNumber, setRiderVehicleNumber] = useState('');
  const [riderGovernmentId, setRiderGovernmentId] = useState('');
  const [riderDriversLicense, setRiderDriversLicense] = useState('');
  const [riderBankName, setRiderBankName] = useState('Zenith Bank');
  const [riderBankCode, setRiderBankCode] = useState('057');
  const [riderAccountNumber, setRiderAccountNumber] = useState('');
  const [riderAccountName, setRiderAccountName] = useState('');
  const [riderAddress, setRiderAddress] = useState('Lagos Central, Lagos State, Nigeria');
  const [riderLat, setRiderLat] = useState('6.6908');
  const [riderLng, setRiderLng] = useState('3.1501');

  // OTP Verification
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Auto pre-fills context depending on role
  const quickFills = {
    vendor: [
      { name: 'Sizzle Burger & Grill', email: 'ade@sizzlegarden.com', desc: 'Vendor Partner' },
      { name: 'Spice & Wok Kitchen', email: 'mei@spicewok.com', desc: 'Vendor Partner' }
    ],
    rider: [
      { name: 'Tunde Ojo (Lagos Dispatcher)', email: 'tunde@delivoriders.com', desc: 'Rider Partner' },
      { name: 'Chioma Rider (Express)', email: 'chioma@delivoriders.com', desc: 'Rider Partner' }
    ],
    admin: [
      { name: 'System General Ops Admin', email: 'admin@delivo.com', desc: 'Superuser Account' },
      { name: '90s Metropolitan Admin', email: 'admin@emitsphere.com', desc: 'Supervisor Account' }
    ]
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please specify an email address.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'mock-auth-bypass', role })
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user, data.associatedId, data.token);
      } else {
        setErrorMsg(data.message || 'Login credentials incorrect for this specific database.');
      }
    } catch (err) {
      setErrorMsg('Failed to process response: local server offline.');
    } finally {
      setLoading(false);
    }
  };

  const handleInlineSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (role === 'vendor') {
      const payload = {
        businessName: vendorBusinessName,
        ownerName: vendorOwnerName,
        email: vendorEmail,
        phone: vendorPhone,
        password: vendorPassword,
        category: vendorCategory,
        description: vendorDescription,
        address: vendorAddress,
        lat: parseFloat(vendorLat) || 6.5244,
        lng: parseFloat(vendorLng) || 3.3792,
        cacRegistration: vendorCacRC || 'PENDING',
        taxId: vendorTaxId,
        otp: otpCode,
        bankAccount: {
          bankName: vendorBankName,
          bankCode: vendorBankCode,
          accountNumber: vendorAccountNumber,
          accountName: vendorAccountName
        },
        operatingHours: vendorHours
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
            setOtpRequired(true);
            setSuccessMsg('A security onboarding OTP code has been dispatched to your email coordinates.');
            setLoading(false);
            return;
          }
          setSuccessMsg('Account submitted securely! Autologin is launching now...');
          // Auto log in direct
          setTimeout(async () => {
            try {
              const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: vendorEmail, password: vendorPassword || 'mock-auth-bypass', role })
              });
              const loginData = await loginRes.json();
              if (loginRes.ok) {
                onLoginSuccess(loginData.user, loginData.associatedId, loginData.token);
              } else {
                setIsSignup(false);
                setEmail(vendorEmail);
                setPassword(vendorPassword);
              }
            } catch (err) {
              setIsSignup(false);
              setEmail(vendorEmail);
            }
          }, 2000);
        } else {
          setErrorMsg(data.message || 'Onboarding failed.');
        }
      } catch (err) {
        setErrorMsg('Network error while processing vendor onboarding form.');
      } finally {
        setLoading(false);
      }
    } else if (role === 'rider') {
      const payload = {
        name: riderName,
        email: riderEmail,
        phone: riderPhone,
        password: riderPassword,
        vehicleType: riderVehicleType,
        vehicleNumber: riderVehicleNumber,
        governmentId: riderGovernmentId,
        driversLicense: riderDriversLicense,
        otp: otpCode,
        bankAccount: {
          bankName: riderBankName,
          bankCode: riderBankCode,
          accountNumber: riderAccountNumber,
          accountName: riderAccountName
        },
        lat: parseFloat(riderLat) || 6.6908,
        lng: parseFloat(riderLng) || 3.1501
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
            setOtpRequired(true);
            setSuccessMsg('A security onboarding OTP code has been dispatched to your email coordinates.');
            setLoading(false);
            return;
          }
          setSuccessMsg('Rider application submitted securely! Auto-logging you into mobile dispatcher portal.');
          setTimeout(async () => {
            try {
              const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: riderEmail, password: riderPassword || 'mock-auth-bypass', role })
              });
              const loginData = await loginRes.json();
              if (loginRes.ok) {
                onLoginSuccess(loginData.user, loginData.associatedId, loginData.token);
              } else {
                setIsSignup(false);
                setEmail(riderEmail);
                setPassword(riderPassword);
              }
            } catch (err) {
              setIsSignup(false);
              setEmail(riderEmail);
            }
          }, 2000);
        } else {
          setErrorMsg(data.message || 'Onboarding registration failed.');
        }
      } catch (err) {
        setErrorMsg('Network error while executing courier onboarding system.');
      } finally {
        setLoading(false);
      }
    }
  };

  const roleMeta = {
    vendor: {
      title: 'Restaurant Vendor Hub',
      desc: 'Enter your partner credentials below to manage orders, catalog prices, and instant withdrawals.',
      color: 'from-orange-600 to-amber-600',
      textColor: 'text-[#FF5E2A]'
    },
    rider: {
      title: 'Dispatcher Logistics Control',
      desc: 'Login using dispatch credentials to monitor live routes, accept runs, and trace OTP security pins.',
      color: 'from-orange-600 to-amber-600',
      textColor: 'text-[#FF5E2A]'
    },
    admin: {
      title: 'Ops Center Super Admin',
      desc: 'Restricted administrative entry point. Authorized logistics officers only.',
      color: 'from-slate-900 via-slate-950 to-neutral-900',
      textColor: 'text-[#FF5E2A]'
    }
  }[role];

  return (
    <div className={`mx-auto my-16 px-4 transition-all duration-300 ${isSignup ? 'max-w-2xl' : 'max-w-md'}`}>
      <div className="bg-white border border-neutral-250 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300">
        
        {/* Portal Header */}
        <div className={`bg-gradient-to-r ${roleMeta.color} p-6 text-white text-left`}>
          <span className="text-[10px] uppercase font-black tracking-widest bg-white/20 px-2.5 py-1 rounded-full text-white inline-block mb-2">
            🔐 {isSignup ? 'PARTNER APPLICANT REGISTRATION' : 'Enrolled'} : {role.toUpperCase()} DB
          </span>
          <h3 className="text-xl font-black tracking-tight">
            {isSignup ? `Apply as a ${role === 'vendor' ? 'Kitchen Vendor' : 'Dispatch Courier'} Partner` : roleMeta.title}
          </h3>
          <p className="text-[11px] text-white/80 font-medium leading-relaxed mt-1.5">
            {isSignup ? `Fill in the self-onboarding ledger below to establish secure operational database files instantly.` : roleMeta.desc}
          </p>
        </div>

        {/* Feedback Messages */}
        <div className="px-6 pt-4 text-left">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl mb-2">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-bold rounded-xl mb-2">
              ✅ {successMsg}
            </div>
          )}
        </div>

        {!isSignup ? (
          /* TRADITIONAL LOGIN FORM */
          <form onSubmit={handleFormLogin} className="p-6 pt-2 space-y-4 text-left">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1 font-sans">Email Coordinates</label>
              <input
                type="email"
                placeholder="e.g. partner@emitsphere.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none transition-all duration-150 text-neutral-850"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1 font-sans">Passkey Code</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none transition-all duration-150 text-neutral-850"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 bg-transparent border-0 cursor-pointer p-0 flex items-center justify-center focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#08BE3B] hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-0 mt-2"
            >
              {loading ? 'Validating Database Credentials...' : 'Sign in to Operational Hub'}
            </button>
          </form>
        ) : (
          /* SINGLE PAGE ONBOARDING SIGNUP FORM */
          <form onSubmit={handleInlineSignup} className="p-6 pt-2 space-y-6 text-left">
            {role === 'vendor' ? (
              /* VENDOR FIELDS */
              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-widest font-black text-[#FF5E2A] bg-amber-50 px-2.5 py-1 rounded inline-block">General Shop Info</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Business Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sizzle Burger Garden"
                      value={vendorBusinessName}
                      onChange={(e) => setVendorBusinessName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Owner Legal Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Adekunle Sizzle"
                      value={vendorOwnerName}
                      onChange={(e) => setVendorOwnerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">CAC RC RC # Number</label>
                    <input
                      type="text"
                      placeholder="e.g. RC 924519"
                      value={vendorCacRC}
                      onChange={(e) => setVendorCacRC(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Tax ID Coordinates</label>
                    <input
                      type="text"
                      placeholder="e.g. TIN-951924"
                      value={vendorTaxId}
                      onChange={(e) => setVendorTaxId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Food Category</label>
                    <select
                      value={vendorCategory}
                      onChange={(e) => setVendorCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                    >
                      <option>Fast Food</option>
                      <option>Chinese & Asian</option>
                      <option>Traditional Soups & Swallows</option>
                      <option>Healthy Salads</option>
                      <option>Desserts & Shakes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Kitchen Specialities Description</label>
                  <textarea
                    placeholder="Describe your kitchen operation..."
                    value={vendorDescription}
                    onChange={(e) => setVendorDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none h-16 resize-none"
                    required
                  />
                </div>

                <span className="text-[10px] uppercase tracking-widest font-black text-[#FF5E2A] bg-amber-50 px-2.5 py-1 rounded inline-block">Credentials & Location</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Corporate Email</label>
                    <input
                      type="email"
                      placeholder="e.g. chef@sizzlegarden.com"
                      value={vendorEmail}
                      onChange={(e) => setVendorEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Mobile Details</label>
                    <input
                      type="tel"
                      placeholder="e.g. +23480333"
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Portal password</label>
                    <input
                      type="password"
                      placeholder="Enter safe password"
                      value={vendorPassword}
                      onChange={(e) => setVendorPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold text-neutral-500">Operating GPS Location</label>
                    <p className="text-[10px] text-neutral-400 -mt-1 leading-normal">Drag/pin or search the map coordinates of your physical kitchen location:</p>
                    <MapLocationPicker
                      initialLocation={{
                        address: vendorAddress,
                        lat: parseFloat(vendorLat) || 6.5244,
                        lng: parseFloat(vendorLng) || 3.3792
                      }}
                      onLocationChange={(loc) => {
                        setVendorAddress(loc.address);
                        setVendorLat(loc.lat.toString());
                        setVendorLng(loc.lng.toString());
                      }}
                      height="200px"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Resolved Business Address</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-xs font-semibold bg-neutral-100 border border-neutral-200 rounded-xl outline-none cursor-not-allowed"
                        value={vendorAddress}
                        readOnly
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Operating Hours</label>
                      <input
                        type="text"
                        placeholder="e.g. 08:00 - 22:00"
                        value={vendorHours}
                        onChange={(e) => setVendorHours(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <span className="text-[10px] uppercase tracking-widest font-black text-[#FF5E2A] bg-amber-50 px-2.5 py-1 rounded inline-block">Settlement Banking coordinates</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Settle Bank Name</label>
                    <select
                      value={vendorBankName}
                      onChange={(e) => {
                        const val = e.target.value;
                        let code = '058';
                        if (val.includes('Zenith')) code = '057';
                        if (val.includes('Access')) code = '044';
                        if (val.includes('First')) code = '011';
                        setVendorBankName(val);
                        setVendorBankCode(code);
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                    >
                      <option>Zenith Bank</option>
                      <option>Guaranty Trust Bank (GTB)</option>
                      <option>Access Bank</option>
                      <option>First Bank of Nigeria</option>
                      <option>United Bank for Africa (UBA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">NUBAN Account Number</label>
                    <input
                      type="text"
                      placeholder="10 digit NUBAN number"
                      maxLength={10}
                      value={vendorAccountNumber}
                      onChange={(e) => setVendorAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Account Holder Beneficiary Name</label>
                    <input
                      type="text"
                      placeholder="Exact banking name"
                      value={vendorAccountName}
                      onChange={(e) => setVendorAccountName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* RIDER FIELDS */
              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-widest font-black text-[#FF5E2A] bg-amber-50 px-2.5 py-1 rounded inline-block font-sans">Dispatcher Identity</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Full legal Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Babatunde Ojo"
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1 font-sans">Mobilization Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +234802"
                      value={riderPhone}
                      onChange={(e) => setRiderPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Dispatch Email</label>
                    <input
                      type="email"
                      placeholder="e.g. tunde@delivoriders.com"
                      value={riderEmail}
                      onChange={(e) => setRiderEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1 font-sans font-sans">Portal Password Code</label>
                    <input
                      type="password"
                      placeholder="Enter safe password"
                      value={riderPassword}
                      onChange={(e) => setRiderPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                </div>

                <span className="text-[10px] uppercase tracking-widest font-black text-[#FF5E2A] bg-amber-50 px-2.5 py-1 rounded inline-block font-sans">Dispatch Vehicle details</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Vehicle Classification</label>
                    <select
                      value={riderVehicleType}
                      onChange={(e) => setRiderVehicleType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none animate-none"
                    >
                      <option value="motorcycle">Motorcycle / Okada</option>
                      <option value="bicycle">Bicycle Logistics</option>
                      <option value="car">Delivery Sedan / minivan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">License Plate Number</label>
                    <input
                      type="text"
                      placeholder="e.g. LAG-325A"
                      value={riderVehicleNumber}
                      onChange={(e) => setRiderVehicleNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans animate-none">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">National NIN Number</label>
                    <input
                      type="text"
                      placeholder="e.g. NIN-82512"
                      value={riderGovernmentId}
                      onChange={(e) => setRiderGovernmentId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none animate-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1 font-sans">Rider Driving License ID</label>
                    <input
                      type="text"
                      placeholder="e.g. DL-23910"
                      value={riderDriversLicense}
                      onChange={(e) => setRiderDriversLicense(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                </div>

                <span className="text-[10px] uppercase tracking-widest font-black text-[#FF5E2A] bg-amber-50 px-2.5 py-1 rounded inline-block font-sans">Operating GPS Location</span>
                <div className="space-y-2 font-sans">
                  <label className="block text-[10px] uppercase font-bold text-neutral-500 font-sans">Search or pin your standby delivery base on the map</label>
                  <MapLocationPicker
                    initialLocation={{
                      address: riderAddress,
                      lat: parseFloat(riderLat) || 6.6908,
                      lng: parseFloat(riderLng) || 3.1501
                    }}
                    onLocationChange={(loc) => {
                      setRiderAddress(loc.address);
                      setRiderLat(loc.lat.toString());
                      setRiderLng(loc.lng.toString());
                    }}
                    height="200px"
                  />
                  <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 mb-2 font-sans">
                    📍 Pinned Base: {riderAddress}
                  </div>
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-[10px] font-semibold leading-relaxed font-sans">
                    🚨 <strong>Critical Onboarding Requirement:</strong> Your delivery application must be kept open and device GPS location tracking active to receive and complete delivery jobs.
                  </div>
                </div>

                <span className="text-[10px] uppercase tracking-widest font-black text-[#FF5E2A] bg-amber-50 px-2.5 py-1 rounded inline-block select-all animate-none font-sans">Standard Bank Settlement Accounts</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Settle Bank Name</label>
                    <select
                      value={riderBankName}
                      onChange={(e) => {
                        const val = e.target.value;
                        let code = '058';
                        if (val.includes('Zenith')) code = '057';
                        if (val.includes('Access')) code = '044';
                        if (val.includes('First')) code = '011';
                        setRiderBankName(val);
                        setRiderBankCode(code);
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                    >
                      <option>Zenith Bank</option>
                      <option>Guaranty Trust Bank (GTB)</option>
                      <option>Access Bank</option>
                      <option>First Bank of Nigeria</option>
                      <option>United Bank for Africa (UBA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1 font-sans">NUBAN account code</label>
                    <input
                      type="text"
                      placeholder="10 digit bank account Code"
                      maxLength={10}
                      value={riderAccountNumber}
                      onChange={(e) => setRiderAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Beneficiary Legal Name</label>
                    <input
                      type="text"
                      placeholder="Exact banking name"
                      value={riderAccountName}
                      onChange={(e) => setRiderAccountName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-neutral-50 border border-neutral-200 focus:border-[#FF5E2A] focus:bg-white rounded-xl outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Verification OTP Box (if generated/triggered) */}
            {otpRequired && (
              <div className="pt-4 border-t border-rose-100 bg-rose-50/50 p-4 rounded-2xl">
                <label className="block text-[10px] uppercase font-bold text-rose-600 mb-1.5 font-mono">Verify Onboarding Security Pin (Check email inbox)</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit verification code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-4 py-3 border border-rose-300 rounded-xl text-center font-bold tracking-[0.5em] focus:outline-rose-500 text-lg"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-[#FF5E2A] hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-0 mt-2 block"
            >
              {loading ? 'Transmitting Enrollment Data Coordinates...' : otpRequired ? 'Verify & Launch Operational Portal Desk' : 'Submit Application & Request Access'}
            </button>
          </form>
        )}

        {role !== 'admin' && (
          <div className="p-4 bg-neutral-50/50 border-t border-neutral-100 text-center">
            <span className="text-[10px] text-neutral-400 font-bold">
              {isSignup ? (
                <>
                  Already registered as partner?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsSignup(false);
                      setOtpRequired(false);
                    }}
                    className="text-[#FF5E2A] hover:underline font-extrabold"
                  >
                    Go to Login Panel
                  </a>
                </>
              ) : (
                <>
                  No account? Click to sign up & apply via the{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsSignup(true);
                      setOtpRequired(false);
                    }}
                    className="text-[#FF5E2A] hover:underline font-extrabold"
                  >
                    Onboarding Form
                  </a>
                </>
              )}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}

export default function App() {
  // Theme state defaulting to light
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return (localStorage.getItem('delivo_theme') as any) || 'light'; } catch { return 'light'; }
  });
  const [initialLandingTab, setInitialLandingTab] = useState<'home' | 'vendor' | 'rider' | 'faqs'>('home');

  const [isSimulatorUnlocked, setIsSimulatorUnlocked] = useState<boolean>(() => {
    try { return localStorage.getItem('delivo_simulator_unlocked') === 'true'; } catch { return false; }
  });
  const [simPassword, setSimPassword] = useState('');
  const [simError, setSimError] = useState(false);
  const [dbSimulatorPassword, setDbSimulatorPassword] = useState('emitsphere');

  // Simulator Superbar active state. Starts hidden unless url contains specific triggers/activators
  const [showSimulator, setShowSimulator] = useState<boolean>(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      const query = window.location.search.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      const hostname = window.location.hostname.toLowerCase();
      
      // If a real subdomain is active, hide simulator by default to keep the interface authentic
      const isSubdomain = hostname.startsWith('vendor.') || hostname.startsWith('rider.') || hostname.startsWith('admin.');
      const isDebugParam = hash.includes('sim') || hash.includes('emitsphere') || query.includes('sim') || query.includes('emitsphere');
      
      if (isSubdomain && !isDebugParam) {
        return false;
      }
      
      if (
        hash.includes('emitsphere') || 
        hash.includes('admin') || 
        hash.includes('sim') ||
        query.includes('sim') || 
        query.includes('emitsphere') ||
        pathname.includes('emitsphere') ||
        pathname.includes('admin')
      ) {
        localStorage.setItem('delivo_show_simulator', 'true');
        return true;
      }
      return localStorage.getItem('delivo_show_simulator') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleLocationCheck = () => {
      const hash = window.location.hash.toLowerCase();
      const query = window.location.search.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      const hostname = window.location.hostname.toLowerCase();
      
      const isSubdomain = hostname.startsWith('vendor.') || hostname.startsWith('rider.') || hostname.startsWith('admin.');
      const isDebugParam = hash.includes('sim') || hash.includes('emitsphere') || query.includes('sim') || query.includes('emitsphere');
      
      if (isSubdomain && !isDebugParam) {
        return;
      }
      
      if (
        hash.includes('emitsphere') || 
        hash.includes('admin') || 
        hash.includes('sim') ||
        query.includes('sim') || 
        query.includes('emitsphere') ||
        pathname.includes('emitsphere') ||
        pathname.includes('admin')
      ) {
        setShowSimulator(true);
        localStorage.setItem('delivo_show_simulator', 'true');
      }
    };
    window.addEventListener('hashchange', handleLocationCheck);
    handleLocationCheck();
    return () => window.removeEventListener('hashchange', handleLocationCheck);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('delivo_theme', theme); } catch (e) {}
  }, [theme]);

  // Dynamic public legal pages standalone states (separates cookies, terms, privacy completely)
  const [legalPage, setLegalPage] = useState<'none' | 'terms' | 'privacy' | 'cookies'>(() => {
    try {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash === '#/terms' || hash === '#/fulfillment' || path === '/terms' || path === '/fulfillment') return 'terms';
      if (hash === '#/privacy' || path === '/privacy') return 'privacy';
      if (hash === '#/cookies' || path === '/cookies') return 'cookies';
    } catch {}
    return 'none';
  });

  const [legalContent, setLegalContent] = useState({
    fulfillmentTerms: '',
    privacyPolicy: '',
    cookiesPolicy: ''
  });

  useEffect(() => {
    const handleRouteChange = () => {
      try {
        const hash = window.location.hash.toLowerCase();
        const path = window.location.pathname.toLowerCase();
        if (hash === '#/terms' || hash === '#/fulfillment' || path === '/terms' || path === '/fulfillment') setLegalPage('terms');
        else if (hash === '#/privacy' || path === '/privacy') setLegalPage('privacy');
        else if (hash === '#/cookies' || path === '/cookies') setLegalPage('cookies');
        else setLegalPage('none');
      } catch {}
    };
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Retro 90's.emitsphere loading states
  const [bootLoading, setBootLoading] = useState(true);
  const [quickSwitchLoading, setQuickSwitchLoading] = useState(false);

  // Perspective simulator (Massively beneficial for testing the complete multi-role system!)
  const [perspective, setPerspective] = useState<'public' | 'customer' | 'vendor' | 'rider' | 'admin'>(() => {
    try {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname.startsWith('vendor.')) return 'vendor';
      if (hostname.startsWith('rider.')) return 'rider';
      if (hostname.startsWith('admin.')) return 'admin';
      
      return (localStorage.getItem('delivo_perspective') as any) || 'public';
    } catch { return 'public'; }
  });
  
  // Current authenticated profile simulator
  const [activeUser, setActiveUser] = useState<UserType | null>(() => {
    try {
      const saved = localStorage.getItem('delivo_activeUser');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [associatedId, setAssociatedId] = useState(() => {
    try { return localStorage.getItem('delivo_associatedId') || ''; } catch { return ''; }
  });

  useEffect(() => {
    try {
      if (activeUser) {
        localStorage.setItem('delivo_activeUser', JSON.stringify(activeUser));
      } else {
        localStorage.removeItem('delivo_activeUser');
      }
    } catch (e) {}
  }, [activeUser]);

  useEffect(() => {
    try { localStorage.setItem('delivo_associatedId', associatedId); } catch (e) {}
  }, [associatedId]);

  useEffect(() => {
    try {
      const hostname = window.location.hostname.toLowerCase();
      const isSubdomain = hostname.startsWith('vendor.') || hostname.startsWith('rider.') || hostname.startsWith('admin.');
      if (!isSubdomain) {
        localStorage.setItem('delivo_perspective', perspective);
      }
    } catch (e) {}
  }, [perspective]);

  // Real-time In-App Notification Engine (At All Points!)
  const [toasts, setToasts] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef<boolean>(false);

  useEffect(() => {
    if (!activeUser) {
      setToasts([]);
      setNotificationsList([]);
      seenNotificationIds.current.clear();
      initialLoadDone.current = false;
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications/${activeUser.id}`);
        if (res.ok) {
          const list = await res.json();
          setNotificationsList(list);
          const newToasts: any[] = [];
          
          list.forEach((n: any) => {
            if (!seenNotificationIds.current.has(n.id)) {
              seenNotificationIds.current.add(n.id);
              if (initialLoadDone.current) {
                newToasts.push(n);
              }
            }
          });

          if (!initialLoadDone.current) {
            initialLoadDone.current = true;
          }

          if (newToasts.length > 0) {
            setToasts(prev => [...prev, ...newToasts]);
            
            // Automatically remove each toast after 5 seconds
            newToasts.forEach((toast) => {
              setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id));
              }, 5000);
            });
          }
        }
      } catch (err) {}
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2500);
    return () => clearInterval(interval);
  }, [activeUser]);

  const handleNotificationClick = async (notif: any) => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser?.id })
      });
      setNotificationsList(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    } catch (e) {}

    if (notif.orderId) {
      console.log("Dispatching notification nav event:", notif.orderId, notif.type);
      const event = new CustomEvent('navigate-to-order', {
        detail: {
          orderId: notif.orderId,
          type: notif.type
        }
      });
      window.dispatchEvent(event);
    }
  };
  
  // Platform stats snapshot
  const [stats, setStats] = useState({
    activeOrders: 0,
    onlineRiders: 0,
    approvedVendors: 0
  });

  useEffect(() => {
    fetchStats();
    // Poll stats occasionally to sync statuses across simulator perspectives
    const int = setInterval(fetchStats, 6000);
    return () => clearInterval(int);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/platform/stats');
      if (res.ok) {
        const d = await res.json();
        setStats({
          activeOrders: d.activeOrderCount,
          onlineRiders: d.onlineRiders,
          approvedVendors: d.approvedVendors
        });
        if (d.settings) {
          if (d.settings.simulatorPassword) {
            setDbSimulatorPassword(d.settings.simulatorPassword);
          }
          setLegalContent({
            fulfillmentTerms: d.settings.fulfillmentTerms || '',
            privacyPolicy: d.settings.privacyPolicy || '',
            cookiesPolicy: d.settings.cookiesPolicy || ''
          });
        }
      }
    } catch (e) {}
  };

  // Direct login simulator / credentials filling
  const handlePortalLogin = async (email: string, password = 'mock-auth-bypass', targetRole?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: targetRole })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) localStorage.setItem('delivo_token', data.token);
        setActiveUser(data.user);
        setAssociatedId(data.associatedId);
        
        // Force corresponding workspace perspective open
        if (data.user.role === 'customer') setPerspective('customer');
        else if (data.user.role === 'vendor') setPerspective('vendor');
        else if (data.user.role === 'rider') setPerspective('rider');
        else if (data.user.role === 'admin') setPerspective('admin');
      } else {
        alert(data.message || 'Login credentials incorrect');
      }
    } catch (e) {
      alert('Network error during login.');
    }
  };

  // Fast developer bypass to easily explore the workspace
  const handlePerspectiveBypass = (role: 'public' | 'customer' | 'vendor' | 'rider' | 'admin', customEmail?: string, autoLogin = false) => {
    setQuickSwitchLoading(true);
    if (role === 'public') {
      localStorage.removeItem('delivo_token');
      setActiveUser(null);
      setAssociatedId('');
      setPerspective('public');
      return;
    }

    if (role === 'customer' && customEmail === 'guest') {
      localStorage.removeItem('delivo_token');
      setActiveUser(null);
      setAssociatedId('');
      setPerspective('customer');
      return;
    }

    // Default to prompt login form unless explicitly bypassing, or after registering (which provides customEmail)
    if (!autoLogin && !customEmail) {
      localStorage.removeItem('delivo_token');
      setActiveUser(null);
      setAssociatedId('');
      setPerspective(role);
      return;
    }

    let defaultEmail = 'admin@emitsphere.com';
    if (role === 'customer') defaultEmail = 'isaac@theiredefoundation.org';
    else if (role === 'vendor') defaultEmail = customEmail || 'ade@sizzlegarden.com';
    else if (role === 'rider') defaultEmail = customEmail || 'tunde@delivoriders.com';
    
    handlePortalLogin(defaultEmail, 'mock-auth-bypass', role);
  };

  if (bootLoading) {
    return <LoadingScreen onComplete={() => setBootLoading(false)} speedMultiplier={1} />;
  }

  if (quickSwitchLoading) {
    return <LoadingScreen onComplete={() => setQuickSwitchLoading(false)} speedMultiplier={2.3} />;
  }

  return (
    <div id="app-wrapper" className={`min-h-screen flex flex-col font-sans transition-all duration-300 ${theme === 'dark' ? 'theme-dark bg-slate-950 text-slate-100' : 'theme-light bg-slate-50 text-slate-900'}`}>
      
      {/* PERSPECTIVE SWITCHING SUPERBAR */}
      {showSimulator && (
        <div className="bg-slate-900 text-slate-100 border-b border-slate-800 py-3.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="bg-purple-600 p-1.5 rounded-lg border border-purple-500/20 text-white animate-pulse">
                <Sparkles className="w-4 h-4 text-pink-300" />
              </span>
              <div>
                <p className="font-bold text-white uppercase tracking-wider text-[10.5px]">
                  90's.emitsphere • Retro-Futuristic Simulator {!isSimulatorUnlocked && '🔒 (Shielded)'}
                </p>
                <p className="text-[10.5px] text-slate-400 mt-0.5">
                  {!isSimulatorUnlocked 
                    ? 'This controls panel requires sandbox system administrator authorizations before releasing operational switches.'
                    : 'Quickly swap perspectives to test onboarding review cycles, live GPS coordinate routing, and instant payouts:'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-end">
              {!isSimulatorUnlocked ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (
                      simPassword.toLowerCase() === 'emitsphere' || 
                      simPassword.toLowerCase() === 'admin90s' || 
                      simPassword === 'admin123' ||
                      simPassword === dbSimulatorPassword ||
                      (dbSimulatorPassword && simPassword.toLowerCase() === dbSimulatorPassword.toLowerCase())
                    ) {
                      setIsSimulatorUnlocked(true);
                      localStorage.setItem('delivo_simulator_unlocked', 'true');
                      setSimError(false);
                    } else {
                      setSimError(true);
                    }
                  }}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  {simError && (
                    <span className="text-[10px] text-red-400 font-extrabold mr-1 shrink-0 animate-bounce">
                      ⚠️ Invalid Passcode
                    </span>
                  )}
                  <input
                    type="password"
                    placeholder="Auth Passcode..."
                    value={simPassword}
                    onChange={(e) => setSimPassword(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg outline-none focus:border-[#FF5E2A] w-36 placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    className="bg-[#FF5E2A] hover:bg-[#E04B1A] text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-transparent transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    Unlock Applet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSimulator(false);
                      localStorage.removeItem('delivo_show_simulator');
                      window.location.hash = '';
                    }}
                    className="bg-transparent hover:bg-slate-800 text-slate-400 p-1.5 rounded-lg border border-slate-800 text-xs shrink-0"
                    title="Close and hide simulator bar"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <button
                    onClick={() => handlePerspectiveBypass('public')}
                    className={`py-2 px-3 rounded-lg font-bold tracking-tight border transition-all ${perspective === 'public' ? 'bg-white text-slate-900 border-white' : 'bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                  >
                    Public Website
                  </button>
                  <button
                    id="btn-switch-customer"
                    onClick={() => handlePerspectiveBypass('customer')}
                    className={`py-2 px-3 rounded-lg font-bold tracking-tight border transition-all ${perspective === 'customer' ? 'bg-white text-slate-900 border-white font-black' : 'bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                  >
                    Customer App
                  </button>
                  <button
                    id="btn-switch-vendor"
                    onClick={() => handlePerspectiveBypass('vendor')}
                    className={`py-2 px-3 rounded-lg font-bold tracking-tight border transition-all ${perspective === 'vendor' ? 'bg-white text-slate-900 border-white' : 'bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                  >
                    Restaurant Vendor
                  </button>
                  <button
                    id="btn-switch-rider"
                    onClick={() => handlePerspectiveBypass('rider')}
                    className={`py-2 px-3 rounded-lg font-bold tracking-tight border transition-all ${perspective === 'rider' ? 'bg-white text-slate-900 border-white' : 'bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                  >
                    Rider Mobile App
                  </button>
                  <button
                    id="btn-switch-admin"
                    onClick={() => handlePerspectiveBypass('admin')}
                    className={`py-2 px-3 rounded-lg font-bold tracking-tight border transition-all ${perspective === 'admin' ? 'bg-white text-slate-900 border-white' : 'bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                  >
                    Ops Admin Console
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowSimulator(false);
                      localStorage.removeItem('delivo_show_simulator');
                      window.location.hash = '';
                    }}
                    className="py-2 px-2.5 rounded-lg font-black text-rose-400 hover:text-rose-300 hover:bg-rose-950/45 border border-rose-900/40 bg-transparent transition-all"
                    title="Hide standard simulator options"
                  >
                    ✕ Exit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE DASHBOARD RENDER FRAMEWORK */}
      <div className="flex-grow">
        {legalPage !== 'none' ? (
          <StandaloneLegalPage 
            page={legalPage} 
            content={legalContent} 
            theme={theme} 
            onBack={() => {
              window.location.hash = '';
              setLegalPage('none');
            }} 
          />
        ) : perspective === 'public' ? (
          <LandingPage onEnterPortal={handlePerspectiveBypass} theme={theme} initialTab={initialLandingTab} />
        ) : (
          <div>
            {/* Unified Inline Dashboard Navigation is used - Top utility header disabled for clean mobile view */}
            {false && activeUser && (
              <div className="bg-white border-b border-neutral-200 py-3 px-4 sm:px-6 lg:px-8 shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 justify-between items-start md:items-center text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                    <span className="text-neutral-500 font-medium hidden sm:inline">Testing Perspective:</span>
                    <strong className="text-[#FF5E2A] uppercase font-black text-[10px] bg-[#FF5E2A]/10 border border-[#FF5E2A]/20 rounded-md px-2 py-0.5">{activeUser.role}</strong>
                    <span className="text-neutral-300 hidden sm:inline">|</span>
                    <span className="text-neutral-600 font-medium break-all truncate max-w-[280px] sm:max-w-none">
                      Active: <strong>{activeUser.name}</strong> <span className="text-neutral-400 font-medium hidden xs:inline">({activeUser.email})</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-neutral-200 mt-1 md:mt-0">
                    {/* IN-APP NOTIFICATIONS BELL DROP-OVER */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setIsNotifOpen(!isNotifOpen);
                          if (!isNotifOpen) {
                            // Mark all as read when opening up
                            fetch('/api/notifications/read-all', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: activeUser.id })
                            }).then(() => {
                              setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
                            });
                          }
                        }}
                        className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 transition-all relative flex items-center justify-center cursor-pointer border border-neutral-200/60"
                        title="View Inbox Alerts"
                      >
                        <Bell className="w-4 h-4" />
                        {notificationsList.some(n => !n.isRead) && (
                          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-600 rounded-full animate-pulse"></span>
                        )}
                      </button>

                      {isNotifOpen && (
                        <div className="absolute right-0 mt-2.5 w-80 bg-white border border-neutral-250 rounded-2xl shadow-xl z-50 text-left overflow-hidden animate-fade-in font-sans">
                          <div className="p-3 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
                            <h4 className="font-black text-black text-[10px] uppercase tracking-wider">Inbox Alerts ({notificationsList.filter(n => !n.isRead).length})</h4>
                            <button
                              onClick={() => setIsNotifOpen(false)}
                              className="text-black hover:text-black font-black transition-colors text-[10px] uppercase border-0 bg-transparent cursor-pointer"
                            >
                              ✕ Close
                            </button>
                          </div>
                          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                            {notificationsList.length === 0 ? (
                              <div className="p-6 text-center text-neutral-400 text-[11px] font-semibold">
                                No messages received.
                              </div>
                            ) : (
                              notificationsList.map((notif) => (
                                <button
                                  key={notif.id}
                                  onClick={() => {
                                    handleNotificationClick(notif);
                                    setIsNotifOpen(false);
                                  }}
                                  className="w-full p-3.5 hover:bg-neutral-50 transition-all text-left block border-0 cursor-pointer space-y-1"
                                >
                                  <div className="flex justify-between items-start gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                                      {notif.title}
                                    </span>
                                    {!notif.isRead && (
                                      <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-1.5 py-0.25 rounded-full uppercase">
                                        New
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-neutral-600 font-semibold leading-relaxed">
                                    {notif.body}
                                  </p>
                                  <p className="text-[9px] text-neutral-400 font-medium">
                                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                  </p>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {activeUser.role === 'customer' ? (
                      <span className="text-slate-500 font-bold hidden sm:inline flex items-center gap-1.5">
                        🏦 Wallet: <span className="bg-amber-50 text-amber-700 text-[9.5px] font-bold py-0.5 px-2 rounded-xl uppercase border border-amber-200">Coming Soon</span>
                      </span>
                    ) : (
                      <span className="text-neutral-500 font-bold hidden sm:inline">🏦 Balance: ₦{activeUser.walletBalance ? activeUser.walletBalance.toLocaleString() : '0'}</span>
                    )}
                    <button
                      onClick={() => { 
                        fetch('/api/auth/logout', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: activeUser.id })
                        }).finally(() => {
                          localStorage.removeItem('delivo_token');
                          setActiveUser(null); 
                        });
                      }}
                      className="inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-900 font-bold uppercase text-[9.5px] cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Portal Sign out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOMER PERSPECTIVE */}
            {perspective === 'customer' && (
              <CustomerApp 
                currentUser={activeUser || null} 
                onLogin={(user) => setActiveUser(user)} 
                onLogout={() => {
                  fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: activeUser?.id })
                  }).finally(() => {
                    setActiveUser(null);
                  });
                }}
                theme={theme} 
                onThemeChange={setTheme}
              />
            )}

            {/* VENDOR PERSPECTIVE */}
            {perspective === 'vendor' && activeUser && (
              <VendorDashboard 
                vendorId={associatedId || 'ven_1'} 
                currentUser={activeUser} 
                onUserUpdate={(user) => setActiveUser(user)} 
                onLogout={() => {
                  fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: activeUser?.id })
                  }).finally(() => {
                    setActiveUser(null);
                  });
                }}
                theme={theme}
                onThemeChange={setTheme}
              />
            )}

            {/* RIDER PERSPECTIVE */}
            {perspective === 'rider' && activeUser && (
              <RiderApp 
                riderId={associatedId || 'rid_1'} 
                currentUser={activeUser} 
                onUserUpdate={(user) => setActiveUser(user)} 
                onLogout={() => {
                  fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: activeUser?.id })
                  }).finally(() => {
                    setActiveUser(null);
                  });
                }}
                theme={theme}
                onThemeChange={setTheme}
              />
            )}

            {/* ADMIN PERSPECTIVE */}
            {perspective === 'admin' && activeUser && (
              <AdminConsole 
                currentUser={activeUser} 
                onUserUpdate={(user) => setActiveUser(user)} 
                onLogout={() => {
                  fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: activeUser?.id })
                  }).finally(() => {
                    setActiveUser(null);
                  });
                }}
                theme={theme}
                onThemeChange={setTheme}
              />
            )}
            
            {/* PORTAL LOGIN FOR NON-CUSTOMER PERSPECTIVES */}
            {perspective !== 'customer' && !activeUser && (
              <PortalLoginForm 
                role={perspective as any} 
                onLoginSuccess={(user, associatedId, token) => {
                  if (token) localStorage.setItem('delivo_token', token);
                  setActiveUser(user);
                  setAssociatedId(associatedId);
                }} 
                onNavigateToSignup={(targetRole) => {
                  setInitialLandingTab(targetRole as any);
                  setPerspective('public');
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* TOAST CONTAINER FOR LANDING ON-SCREEN REAL-TIME ALERTS */}
      <div id="central-toast-container" className="fixed bottom-6 right-6 z-50 pointer-events-none space-y-3 max-w-sm w-full font-sans">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => {
              handleNotificationClick(toast);
              setToasts(prev => prev.filter(t => t.id !== toast.id));
            }}
            className="pointer-events-auto bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-2xl flex gap-3.5 items-start animate-fade-in hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
          >
            <div className="bg-blue-600/25 p-2 rounded-xl text-blue-400 border border-blue-500/10 mt-0.5">
              <Bell className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex justify-between items-start">
                <h5 className="font-extrabold text-[11px] tracking-tight text-white uppercase">{toast.title}</h5>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevent triggering the toast click
                    setToasts(prev => prev.filter(t => t.id !== toast.id));
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-2 border-0 bg-transparent p-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-semibold leading-relaxed">{toast.body || toast.message}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
