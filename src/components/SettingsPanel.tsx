/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Mail, Phone, Shield, RefreshCw, Check, AlertTriangle, Key, Landmark, Clipboard, Eye, EyeOff
} from 'lucide-react';
import { User as UserType } from '../types';
import ImageUploadWithCrop from './ImageUploadWithCrop';

interface SettingsPanelProps {
  currentUser: UserType;
  onUserUpdate: (updatedUser: UserType) => void;
}

export default function SettingsPanel({ currentUser, onUserUpdate }: SettingsPanelProps) {
  // Split names
  const nameParts = (currentUser?.name || '').trim().split(' ');
  const initFirst = nameParts[0] || '';
  const initLast = nameParts.slice(1).join(' ') || '';

  // Standard states
  const [firstName, setFirstName] = useState(initFirst);
  const [lastName, setLastName] = useState(initLast);
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  
  // Custom Account details states (for riders / vendors)
  const [vendorDetails, setVendorDetails] = useState({
    businessName: '',
    category: 'General Food',
    description: '',
    address: '',
    cacRegistration: '',
    taxId: '',
    bannerUrl: '',
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountName: ''
    },
    operatingHours: ''
  });

  const [riderDetails, setRiderDetails] = useState({
    vehicleType: 'bicycle',
    vehicleNumber: '',
    governmentId: '',
    driversLicense: '',
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountName: ''
    }
  });

  // Password change states
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email change states
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Status and loading indicators
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);

  // Messages
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [emailMessage, setEmailMessage] = useState({ type: '', text: '' });

  // Fetch specialized vendor/rider info upon mount
  useEffect(() => {
    const fetchExtraInfo = async () => {
      try {
        const res = await fetch('/api/admin/onboardings');
        if (res.ok) {
          const d = await res.json();
          if (currentUser.role === 'vendor') {
            const v = (d.allVendors || []).find((x: any) => x.userId === currentUser.id);
            if (v) {
              setVendorDetails({
                businessName: v.name || '',
                category: v.category || 'General Food',
                description: v.description || '',
                address: v.address || '',
                cacRegistration: v.cacRegistration || '',
                taxId: v.taxId || '',
                bannerUrl: v.bannerUrl || '',
                bankAccount: v.bankAccount || { bankName: '', accountNumber: '', accountName: '' },
                operatingHours: v.operatingHours || ''
              });
            }
          } else if (currentUser.role === 'rider') {
            const r = (d.allRiders || []).find((x: any) => x.userId === currentUser.id);
            if (r) {
              setRiderDetails({
                vehicleType: r.vehicleType || 'bicycle',
                vehicleNumber: r.vehicleNumber || '',
                governmentId: r.governmentId || '',
                driversLicense: r.driversLicense || '',
                bankAccount: r.bankAccount || { bankName: '', accountNumber: '', accountName: '' }
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching extra profile details:', err);
      }
    };

    fetchExtraInfo();
  }, [currentUser]);

  // Handle profile updates (Names, phone, account details like banking, vehicle, business ect)
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const activeAccountDetails = currentUser.role === 'vendor' ? vendorDetails : (currentUser.role === 'rider' ? riderDetails : {});
      const res = await fetch('/api/settings/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          role: currentUser.role,
          firstName,
          lastName,
          phone,
          avatar,
          accountDetails: activeAccountDetails
        })
      });

      const data = await res.json();

      if (res.ok) {
        setProfileMessage({ type: 'success', text: data.message || 'Credentials successfully updated!' });
        onUserUpdate(data.user);
      } else {
        setProfileMessage({ type: 'error', text: data.message || 'Failed to update credentials.' });
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: 'Server network error.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password changes
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (passwordState.newPassword.length < 4) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 4 characters.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          role: currentUser.role,
          currentPassword: passwordState.currentPassword,
          newPassword: passwordState.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordMessage({ type: 'success', text: data.message || 'Password successfully saved!' });
        setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage({ type: 'error', text: data.message || 'Profile old password validation failed.' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'System check offline.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Trigger Email change OTP Dispatch
  const handleRequestEmailOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setEmailMessage({ type: 'error', text: 'Please specify a valid new email address.' });
      return;
    }

    setEmailOtpLoading(true);
    setEmailMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings/request-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          role: currentUser.role,
          newEmail
        })
      });

      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setEmailMessage({ type: 'success', text: data.message || 'OTP PIN sent successfully.' });
      } else {
        setEmailMessage({ type: 'error', text: data.message || 'Failed to dispatch verification PIN.' });
      }
    } catch (err) {
      setEmailMessage({ type: 'error', text: 'OTP service offline.' });
    } finally {
      setEmailOtpLoading(false);
    }
  };

  // Submit and verify email change OTP
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtp || emailOtp.length < 4) {
      setEmailMessage({ type: 'error', text: 'Please input the 6-digit verification security PIN.' });
      return;
    }

    setEmailVerifyLoading(true);
    setEmailMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          role: currentUser.role,
          newEmail,
          otp: emailOtp
        })
      });

      const data = await res.json();

      if (res.ok) {
        setEmailMessage({ type: 'success', text: data.message || 'Email registered successfully!' });
        onUserUpdate(data.user);
        setOtpSent(false);
        setNewEmail('');
        setEmailOtp('');
      } else {
        setEmailMessage({ type: 'error', text: data.message || 'PIN validation rejected.' });
      }
    } catch (err) {
      setEmailMessage({ type: 'error', text: 'Verification service offline.' });
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-6 text-slate-100 font-sans">
      
      {/* Title section info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Shield className="text-[#FF5E2A] w-6 h-6" /> User Profile settings
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Manage credentials, secure passwords, modify email coordinates (secured via OTP dispatch), and format account details.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-left">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">Portal Designation</span>
          <span className="text-xs font-black text-[#FF5E2A] uppercase">{currentUser.role} Account</span>
        </div>
      </div>

      {/* Grid of panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Profile and Account Information Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <User className="text-[#FF5E2A] w-4 h-4" /> General Identity Details
            </h3>

            {profileMessage.text && (
              <div className={`p-3 rounded-xl text-xs font-semibold mb-4 border flex items-center gap-2 ${
                profileMessage.type === 'success' 
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
                  : 'bg-rose-950/40 border-rose-800 text-rose-450'
              }`}>
                {profileMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="py-2">
                <ImageUploadWithCrop
                  label="Profile Photograph / Logo"
                  aspectRatio="1:1"
                  radiusType="circle"
                  initialValue={avatar}
                  onUploadSuccess={(url) => setAvatar(url)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Mobile Contact Phone</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="e.g. +234..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all font-mono"
                  />
                </div>
              </div>

              {/* Special Vendor Account Details */}
              {currentUser.role === 'vendor' && (
                <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-4 text-left">
                  <h4 className="text-xs font-bold text-[#FF5E2A] uppercase tracking-wider flex items-center gap-1.5">
                    <Clipboard className="w-3.5 h-3.5" /> Restaurant Onboarding Profile
                  </h4>

                  <div className="py-2 bg-slate-900/40 p-4 border border-slate-800 rounded-2xl">
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Store Cover Picture</label>
                    <ImageUploadWithCrop
                      label="Store Photo (Customer Visible)"
                      aspectRatio="4:3"
                      radiusType="square"
                      initialValue={vendorDetails.bannerUrl}
                      onUploadSuccess={(url) => setVendorDetails({ ...vendorDetails, bannerUrl: url })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Business Store Name</label>
                    <input
                      type="text"
                      value={vendorDetails.businessName}
                      onChange={(e) => setVendorDetails({ ...vendorDetails, businessName: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Business Category</label>
                      <input
                        type="text"
                        value={vendorDetails.category}
                        onChange={(e) => setVendorDetails({ ...vendorDetails, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Operating Hours</label>
                      <input
                        type="text"
                        value={vendorDetails.operatingHours}
                        onChange={(e) => setVendorDetails({ ...vendorDetails, operatingHours: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white"
                        placeholder="e.g. 08:00 - 22:00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Restaurant Bio Description</label>
                    <textarea
                      value={vendorDetails.description}
                      onChange={(e) => setVendorDetails({ ...vendorDetails, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Store Dispatch Location/Address</label>
                    <input
                      type="text"
                      value={vendorDetails.address}
                      onChange={(e) => setVendorDetails({ ...vendorDetails, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800/40 pt-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">CAC Registration</label>
                      <input
                        type="text"
                        value={vendorDetails.cacRegistration}
                        onChange={(e) => setVendorDetails({ ...vendorDetails, cacRegistration: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-950 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Corporate Tax ID</label>
                      <input
                        type="text"
                        value={vendorDetails.taxId || ''}
                        onChange={(e) => setVendorDetails({ ...vendorDetails, taxId: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-950 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Financial Settlement parameters */}
                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3 mt-2 text-left">
                    <span className="text-[9.5px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                      <Landmark className="w-3 h-3 text-[#FF5E2A]" /> Settlement Bank Coordinates
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Bank Name</label>
                        <input
                          type="text"
                          value={vendorDetails.bankAccount.bankName}
                          onChange={(e) => setVendorDetails({
                            ...vendorDetails,
                            bankAccount: { ...vendorDetails.bankAccount, bankName: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-800 focus:border-[#FF5E2A] rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Account Number</label>
                        <input
                          type="text"
                          value={vendorDetails.bankAccount.accountNumber}
                          onChange={(e) => setVendorDetails({
                            ...vendorDetails,
                            bankAccount: { ...vendorDetails.bankAccount, accountNumber: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-800 focus:border-[#FF5E2A] rounded-lg text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Account Name</label>
                        <input
                          type="text"
                          value={vendorDetails.bankAccount.accountName}
                          onChange={(e) => setVendorDetails({
                            ...vendorDetails,
                            bankAccount: { ...vendorDetails.bankAccount, accountName: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-800 focus:border-[#FF5E2A] rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Rider Account Details */}
              {currentUser.role === 'rider' && (
                <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-4 text-left">
                  <h4 className="text-xs font-bold text-[#FF5E2A] uppercase tracking-wider flex items-center gap-1.5">
                    <Clipboard className="w-3.5 h-3.5" /> Dispatcher Carrier Coordinates
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Vehicle Classification</label>
                      <select
                        value={riderDetails.vehicleType}
                        onChange={(e) => setRiderDetails({ ...riderDetails, vehicleType: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-semibold bg-slate-900 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white scrollbar-thin"
                      >
                        <option value="bicycle">Bicycle</option>
                        <option value="motorcycle">Motorcycle / Okada</option>
                        <option value="electric_scooter">Electric Scooter</option>
                        <option value="car">Delivery Vehicle / Car</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Plate / Registration Code</label>
                      <input
                        type="text"
                        value={riderDetails.vehicleNumber}
                        onChange={(e) => setRiderDetails({ ...riderDetails, vehicleNumber: e.target.value })}
                        placeholder="e.g. LAG-520-XW"
                        className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800/40 pt-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Government ID Number</label>
                      <input
                        type="text"
                        value={riderDetails.governmentId}
                        onChange={(e) => setRiderDetails({ ...riderDetails, governmentId: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-950 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Driver License Code</label>
                      <input
                        type="text"
                        value={riderDetails.driversLicense}
                        onChange={(e) => setRiderDetails({ ...riderDetails, driversLicense: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-950 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Rider Settlement bank Account */}
                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3 mt-2 text-left">
                    <span className="text-[9.5px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                      <Landmark className="w-3 h-3 text-[#FF5E2A]" /> Settlement Bank Coordinates
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Bank Name</label>
                        <input
                          type="text"
                          value={riderDetails.bankAccount.bankName}
                          onChange={(e) => setRiderDetails({
                            ...riderDetails,
                            bankAccount: { ...riderDetails.bankAccount, bankName: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-800 focus:border-[#FF5E2A] rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Account Number</label>
                        <input
                          type="text"
                          value={riderDetails.bankAccount.accountNumber}
                          onChange={(e) => setRiderDetails({
                            ...riderDetails,
                            bankAccount: { ...riderDetails.bankAccount, accountNumber: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-800 focus:border-[#FF5E2A] rounded-lg text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Account Name</label>
                        <input
                          type="text"
                          value={riderDetails.bankAccount.accountName}
                          onChange={(e) => setRiderDetails({
                            ...riderDetails,
                            bankAccount: { ...riderDetails.bankAccount, accountName: e.target.value }
                          })}
                          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-800 focus:border-[#FF5E2A] rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-2.5 bg-[#FF5E2A] hover:bg-[#a65d14] disabled:opacity-50 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {profileLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />}
                {profileLoading ? 'Storing credentials...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Security Password & Verified Email updates */}
        <div className="lg:col-span-5 space-y-6 text-left">
          
          {/* Verified Email Update Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Mail className="text-[#FF5E2A] w-4 h-4" /> Change Verified Email
            </h3>
            <p className="text-slate-400 text-[10.5px] leading-relaxed mb-4">
              Requires a valid OTP verification code sent directly to your targeted new email address to complete verification.
            </p>

            {emailMessage.text && (
              <div className={`p-3 rounded-xl text-xs font-semibold mb-4 border flex items-center gap-2 ${
                emailMessage.type === 'success' 
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
                  : 'bg-rose-950/40 border-rose-800 text-rose-450'
              }`}>
                {emailMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {emailMessage.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Current Registered Email</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-950/40 border border-slate-850 rounded-xl outline-none text-slate-500 font-mono"
                />
              </div>

              {!otpSent ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Target New Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. code@emitsphere.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestEmailOtp}
                    disabled={emailOtpLoading}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all shadow border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {emailOtpLoading ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5 text-[#FF5E2A]" />}
                    {emailOtpLoading ? 'Sending OTP code...' : 'Apply & Dispatch Email OTP Code'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyEmail} className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-850 relative">
                  <div className="space-y-1">
                    <span className="block text-[10px] uppercase font-black text-[#FF5E2A] tracking-wider animate-pulse">🔒 Awaiting Verification Code</span>
                    <p className="text-[10px] text-slate-400">PIN sent to <strong>{newEmail}</strong>. Enter code below.</p>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold tracking-wider text-slate-400 mb-1">6-Digit Verification Pin</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="XXXXXX"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      className="w-full text-center tracking-[0.5em] px-3 py-2.5 text-lg font-black bg-slate-950 border border-slate-800 focus:border-[#FF5E2A] rounded-xl outline-none text-white font-mono"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-1/3 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold text-[10px] uppercase border border-slate-800 rounded-lg transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={emailVerifyLoading}
                      className="w-2/3 py-2 bg-[#FF5E2A] hover:bg-[#E04B1A] disabled:opacity-50 text-white font-bold text-[10px] uppercase rounded-lg transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {emailVerifyLoading ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      {emailVerifyLoading ? 'Verifying...' : 'Verify Change'}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>

          {/* Password Security Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="text-[#FF5E2A] w-4 h-4" /> Change Portal Password
            </h3>

            {passwordMessage.text && (
              <div className={`p-3 rounded-xl text-xs font-semibold mb-4 border flex items-center gap-2 ${
                passwordMessage.type === 'success' 
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' 
                  : 'bg-rose-950/40 border-rose-800 text-rose-450'
              }`}>
                {passwordMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Current Password</label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordState.currentPassword}
                    onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                    className="w-full pl-9 pr-10 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white focus:outline-none"
                    title={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">New Secure Password</label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="e.g. Min 4 characters"
                    value={passwordState.newPassword}
                    onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                    className="w-full pl-9 pr-10 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white focus:outline-none"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordState.confirmPassword}
                    onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-10 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-[#FF5E2A] rounded-xl outline-none text-white transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white focus:outline-none"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2 bg-[#FF5E2A] hover:bg-[#a65d14] disabled:opacity-50 text-white font-bold text-[10px] uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {passwordLoading ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {passwordLoading ? 'Saving updated passkey...' : 'Commit Password Change'}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
