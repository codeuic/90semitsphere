/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowLeft, Star, ShoppingBag, Trash2, X, AlertCircle, Check, 
  CreditCard, Loader2, Send, MessageCircle, AlertTriangle, Clock, MapPin, Sparkles,
  Menu, LogOut, Bell, Eye, EyeOff
} from 'lucide-react';
import { Vendor, Product, Order, ChatMessage, Coupon } from '../types';
import MapLocationPicker from './MapLocationPicker';
import SettingsPanel from './SettingsPanel';
import OrderTrackerMap from './OrderTrackerMap';
import { Compass } from 'lucide-react';

interface CustomerAppProps {
  currentUser: { id: string; name: string; email: string; phone?: string } | null;
  onLogin?: (user: { id: string; name: string; email: string; phone?: string }) => void;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export default function CustomerApp({ currentUser, onLogin, onLogout, theme = 'light', onThemeChange }: CustomerAppProps) {
  const [vendorsList, setVendorsList] = useState<Vendor[]>([]);
  
  // Sign up & Login popup states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);
  const [authForm, setAuthForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '', 
    otp: '',
    address: 'Bells University of Technology, Ota, Ogun State, Nigeria',
    lat: 6.6908,
    lng: 3.1501
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authOtpRequired, setAuthOtpRequired] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditingCheckoutLocation, setIsEditingCheckoutLocation] = useState(false);

  // Real-time In-App Notification Engine inside Customer portal
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setNotificationsList([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications/${currentUser.id}`);
        if (res.ok) {
          const list = await res.json();
          setNotificationsList(list);
        }
      } catch (err) {}
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2500);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleNotificationClickLocal = async (notif: any) => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      });
      setNotificationsList(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    } catch (e) {}

    if (notif.orderId) {
      const event = new CustomEvent('navigate-to-order', {
        detail: {
          orderId: notif.orderId,
          type: notif.type
        }
      });
      window.dispatchEvent(event);
      // Automatically switch to track tab if order info received
      setActiveTab('orders');
      // If of Type ORDER_ASSIGNED / PICKED_UP / DELIVERED etc, try to select that order automatically!
      const foundOrder = activeOrders.find(ord => ord.id === notif.orderId);
      if (foundOrder) {
        setSelectedOrder(foundOrder);
      } else {
        // Fetch to find it
        fetch('/api/orders/my-orders?userId=' + currentUser?.id)
          .then(res => res.json())
          .then(list => {
            const upToDateOrder = list.find((o: any) => o.id === notif.orderId);
            if (upToDateOrder) {
              setSelectedOrder(upToDateOrder);
            }
          }).catch(() => {});
      }
    }
  };
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Cart state
  const [cart, setCart] = useState<{
    product: Product;
    quantity: number;
    selectedVariant: string;
    selectedAddOns: { name: string; price: number }[];
  }[]>([]);
  const [cartVendor, setCartVendor] = useState<Vendor | null>(null);
  const [showVendorClearWarning, setShowVendorClearWarning] = useState(false);
  const [pendingVendorToLoad, setPendingVendorToLoad] = useState<Vendor | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'cart' | 'checkout' | 'orders' | 'settings'>('discover');

  // Modal active products configuration
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [modalVariant, setModalVariant] = useState('');
  const [modalAddOns, setModalAddOns] = useState<{ name: string; price: number }[]>([]);

  // Checkout promotion coupon
  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Paystack checkout modal simulations
  const [showPaystack, setShowPaystack] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '5061 9245 1025 8195',
    expiry: '12/28',
    cvv: '394',
    pin: '1234'
  });

  // Dynamic platform configuration stats
  const [platformConfig, setPlatformConfig] = useState({
    platformFeeType: 'flat',
    fixedServiceFee: 350,
    paystackFeeType: 'percentage',
    paystackFeePercent: 1.5,
    deliveryFeeType: 'flat',
    baseDeliveryFee: 800,
    taxType: 'percentage',
    taxPercent: 5.0,
    paystackPublicKey: ''
  });

  const fetchPlatformStats = async () => {
    try {
      const res = await fetch('/api/platform/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setPlatformConfig({
            platformFeeType: data.settings.platformFeeType || 'flat',
            fixedServiceFee: data.settings.fixedServiceFee ?? 350,
            paystackFeeType: data.settings.paystackFeeType || 'percentage',
            paystackFeePercent: data.settings.paystackFeePercent ?? 1.5,
            deliveryFeeType: data.settings.deliveryFeeType || 'flat',
            baseDeliveryFee: data.settings.baseDeliveryFee ?? 800,
            taxType: data.settings.taxType || 'percentage',
            taxPercent: data.settings.taxPercent ?? 5.0,
            paystackPublicKey: data.settings.paystackPublicKey || ''
          });
        }
      }
    } catch(e) {}
  };

  // Current order being tracked
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Chat rooms
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatText, setNewChatText] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [supportIssue, setSupportIssue] = useState('');
  
  // Rating feedback state
  const [foodRating, setFoodRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Simulation values for Nigeria/Ogun/Ota coordinates checkouts
  const [customerCoordinates, setCustomerCoordinates] = useState({
    address: 'Bells University of Technology, Ota, Ogun State',
    lat: 6.6908,
    lng: 3.1501
  });

  useEffect(() => {
    if (currentUser) {
      setCustomerCoordinates({
        address: (currentUser as any).address || 'Bells University of Technology, Ota, Ogun State',
        lat: (currentUser as any).lat !== undefined ? (currentUser as any).lat : 6.6908,
        lng: (currentUser as any).lng !== undefined ? (currentUser as any).lng : 3.1501
      });
    }
  }, [currentUser]);

  useEffect(() => {
    fetchVendors();
    if (currentUser?.id) {
      fetchActiveOrders();
    }
    fetchPlatformStats();
  }, [activeTab, currentUser?.id]);

  useEffect(() => {
    // Dynamically load the official Paystack Inline SDK
    const scriptId = 'paystack-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    let orderInterval: NodeJS.Timeout;
    if (currentUser?.id && selectedOrder && (
      selectedOrder.status !== 'DELIVERED' && 
      selectedOrder.status !== 'CANCELLED' && 
      selectedOrder.status !== 'REFUNDED'
    )) {
      // Poll active order state every 3 seconds for coordinates & parcel shifts
      orderInterval = setInterval(() => {
        refreshOrderProgress(selectedOrder.id);
      }, 3000);
    }
    return () => clearInterval(orderInterval);
  }, [selectedOrder, currentUser?.id]);

  useEffect(() => {
    const handleNav = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { orderId } = customEvent.detail || {};
      if (orderId && currentUser?.id) {
        setActiveTab('orders');
        try {
          const res = await fetch(`/api/orders?customerId=${currentUser.id}`);
          if (res.ok) {
            const data = await res.json();
            setActiveOrders(data);
            const found = data.find((o: any) => o.id === orderId);
            if (found) {
              setSelectedOrder(found);
            }
          }
        } catch (err) {}
      }
    };
    window.addEventListener('navigate-to-order', handleNav);
    return () => window.removeEventListener('navigate-to-order', handleNav);
  }, [currentUser?.id]);

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors');
      if (res.ok) {
        const data = await res.json();
        setVendorsList(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActiveOrders = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/orders?customerId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Solid poll mechanism
  const refreshOrderProgress = async (orderId: string) => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/orders?customerId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveOrders(data);
        const updated = data.find((o: Order) => o.id === orderId);
        if (updated) {
          setSelectedOrder(updated);
        }
      }
    } catch (err) {}
  };

  const loadVendorProducts = async (vendor: Vendor) => {
    if (cart.length > 0 && cartVendor && cartVendor.id !== vendor.id) {
      setPendingVendorToLoad(vendor);
      setShowVendorClearWarning(true);
    } else {
      setSelectedVendor(vendor);
      try {
        const res = await fetch(`/api/vendors/${vendor.id}/products`);
        if (res.ok) {
          const data = await res.json();
          setProductsList(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleConfirmClearBasketAndSwitch = async () => {
    if (pendingVendorToLoad) {
      setCart([]);
      setCartVendor(pendingVendorToLoad);
      setSelectedVendor(pendingVendorToLoad);
      setShowVendorClearWarning(false);
      try {
        const res = await fetch(`/api/vendors/${pendingVendorToLoad.id}/products`);
        if (res.ok) {
          const data = await res.json();
          setProductsList(data);
        }
      } catch (e) {
        console.error(e);
      }
      setPendingVendorToLoad(null);
    }
  };

  const handleOpenProductModal = (product: Product) => {
    setActiveProduct(product);
    setModalVariant(product.variants[0] || '');
    setModalAddOns([]);
  };

  const toggleModalAddOn = (addon: { name: string; price: number }) => {
    if (modalAddOns.some(a => a.name === addon.name)) {
      setModalAddOns(modalAddOns.filter(a => a.name !== addon.name));
    } else {
      setModalAddOns([...modalAddOns, addon]);
    }
  };

  const handleAddToCart = () => {
    if (!activeProduct) return;
    
    if (cart.length > 0 && cartVendor && cartVendor.id !== activeProduct.vendorId) {
      alert("You have items from another restaurant in your basket! Clear your cart or complete that order first.");
      return;
    }

    if (cart.length === 0 && selectedVendor) {
      setCartVendor(selectedVendor);
    }

    // Add to state
    setCart([
      ...cart,
      {
        product: activeProduct,
        quantity: 1,
        selectedVariant: modalVariant,
        selectedAddOns: modalAddOns
      }
    ]);
    setActiveProduct(null);
  };

  const handleRemoveFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    if (updatedCart.length === 0) {
      setCartVendor(null);
    }
  };

  // Pricing math calculation
  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      let itemTotal = item.product.price;
      item.selectedAddOns.forEach(a => {
        itemTotal += a.price;
      });
      // Extract numeric differences from variants if specified
      if (item.selectedVariant) {
        const addedValue = item.selectedVariant.match(/\+\u20A6(\d+)/);
        if (addedValue && addedValue[1]) {
          itemTotal += parseInt(addedValue[1]);
        }
      }
      return total + itemTotal * item.quantity;
    }, 0);
  };

  const getDeliveryFee = () => {
    if (!selectedVendor || cart.length === 0) return 0;
    if (platformConfig.deliveryFeeType === 'percentage') {
      return Math.round((getSubtotal() * (platformConfig.baseDeliveryFee ?? 0)) / 100);
    }
    return platformConfig.baseDeliveryFee ?? 800;
  };

  const getDiscount = () => {
    const sub = getSubtotal();
    if (!activeCoupon) return 0;
    if (activeCoupon.discountType === 'percentage') {
      return Math.round((sub * activeCoupon.value) / 100);
    }
    return activeCoupon.value;
  };

  const getServiceFee = () => {
    if (cart.length === 0) return 0;
    
    let platform = 0;
    if (platformConfig.platformFeeType === 'percentage') {
      platform = Math.round((getSubtotal() * (platformConfig.fixedServiceFee ?? 0)) / 100);
    } else {
      platform = platformConfig.fixedServiceFee ?? 350;
    }
    
    // Combine gateway fee into service fee
    const tempSubtotal = Math.max(0, getSubtotal() + getDeliveryFee() + platform + getTax() - getDiscount());
    let gateway = 0;
    if (platformConfig.paystackFeeType === 'percentage') {
      gateway = Math.round((tempSubtotal * (platformConfig.paystackFeePercent ?? 1.5)) / 100);
    } else {
      gateway = platformConfig.paystackFeePercent ?? 0;
    }
    
    return platform + gateway;
  };

  const getTax = () => {
    if (cart.length === 0) return 0;
    if (platformConfig.taxType === 'percentage') {
      return Math.round((getSubtotal() * (platformConfig.taxPercent ?? 5.0)) / 100);
    }
    return platformConfig.taxPercent ?? 0;
  };

  const getOrderTotal = () => {
    return Math.max(0, getSubtotal() + getDeliveryFee() + getServiceFee() + getTax() - getDiscount());
  };

  const handleValidateCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveCoupon(data);
      } else {
        setCouponError(data.message || 'Coupon invalid');
      }
    } catch (e) {
      setCouponError('Network error validation');
    }
  };

  const handleInitiatePayment = () => {
    if (cart.length === 0 || !selectedVendor) return;
    if (!currentUser) {
      setAuthTab('signup');
      setAuthError('');
      setShowAuthModal(true);
      return;
    }
    if (platformConfig.paystackPublicKey) {
      handlePaystackExecute();
    } else {
      setShowPaystack(true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authTab === 'signup' ? '/api/auth/register' : '/api/auth/login';
    const payload = authTab === 'signup' 
      ? { 
          name: authForm.name, 
          email: authForm.email, 
          phone: authForm.phone, 
          password: authForm.password, 
          otp: authForm.otp,
          address: authForm.address || 'Bells University of Technology, Ota, Ogun State, Nigeria',
          lat: authForm.lat !== undefined ? authForm.lat : 6.6908,
          lng: authForm.lng !== undefined ? authForm.lng : 3.1501
        }
      : { email: authForm.email, password: authForm.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresOtp) {
          setAuthOtpRequired(true);
          setAuthLoading(false);
          return;
        }
        const resolvedUser = data.user || data.userObj;
        if (data.token) {
           localStorage.setItem('delivo_token', data.token);
        }
        if (onLogin && resolvedUser) {
          onLogin(resolvedUser);
        }
        setShowAuthModal(false);
        setAuthOtpRequired(false);
        setAuthForm({ name: '', email: '', phone: '', password: '', otp: '' });
        
        // Auto trigger checkout paystack payment popup
        setTimeout(() => {
          if (platformConfig.paystackPublicKey) {
            handlePaystackExecute();
          } else {
            setShowPaystack(true);
          }
        }, 450);
      } else {
        setAuthError(data.message || 'Error occurred during authorization');
      }
    } catch (err) {
      setAuthError('Network connection failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePaystackExecute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setCheckoutLoading(true);
    
    // Prepare items schema format suitable for backend
    const checkoutItems = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant,
      selectedAddOns: item.selectedAddOns
    }));

    const checkoutPayload = {
      customerId: currentUser.id,
      customerAddress: customerCoordinates.address,
      customerLat: customerCoordinates.lat,
      customerLng: customerCoordinates.lng,
      vendorId: selectedVendor.id,
      items: checkoutItems,
      couponCode: activeCoupon?.code || undefined
    };

    try {
      // Step 1: Create local order ticket in PENDING_PAYMENT status
      const orderRes = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload)
      });
      const orderData = await orderRes.json();
      
      if (!orderRes.ok) {
        alert(orderData.message || 'Failed to place order ticket.');
        setCheckoutLoading(false);
        return;
      }

      const orderId = orderData.order.id;
      const orderTotal = getOrderTotal();
      const PaystackPop = (window as any).PaystackPop;

      if (PaystackPop && platformConfig.paystackPublicKey) {
        setShowPaystack(false);
        setCheckoutLoading(false);

        console.log(`[Paystack SDK] Opening real inline payment modal. Amount: ₦${orderTotal}`);
        
        try {
          const handler = PaystackPop.setup({
            key: platformConfig.paystackPublicKey,
            email: currentUser.email,
            amount: Math.round(orderTotal * 100), // convert to Nigerian Kobo
            currency: 'NGN',
            ref: `delivo_${orderId}_${Date.now()}`,
            callback: function(response: any) {
              const refCode = response.reference || response.trxref;
              console.log(`[Paystack SDK Success] Captured reference: ${refCode}`);
              setCheckoutLoading(true);
              
              fetch('/api/orders/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  orderId: orderId,
                  reference: refCode
                })
              })
              .then(function(payRes) {
                return payRes.json().then(function(payData) {
                  if (payRes.ok) {
                    setCart([]);
                    setCartVendor(null);
                    setActiveCoupon(null);
                    setCouponCode('');
                    setSelectedOrder(payData.order);
                    setActiveTab('orders');
                  } else {
                    alert(`Paystack verification failed: ${payData.message || 'Payment could not be settled.'}`);
                  }
                });
              })
              .catch(function(err) {
                console.error(err);
                alert('Error verifying payment reference.');
              })
              .finally(function() {
                setCheckoutLoading(false);
              });
            },
            onClose: function() {
              console.log('[Paystack SDK] Transaction popup dismissed by user.');
              alert('Payment window closed. Your cart remains active; you can click proceed to try paying again.');
            }
          });
          handler.openIframe();
        } catch (handlerErr: any) {
          console.error('[Paystack Initialization Error]', handlerErr);
          alert('Failed to launch Paystack popup window. Please check your Paystack keys.');
        }
      } else {
        // Step 2: Trigger payment simulation confirmation (Simulator mode fallback)
        const payRes = await fetch('/api/orders/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderId })
        });
        const payData = await payRes.json();
        
        if (payRes.ok) {
          // Success checkout flow completes
          setCart([]);
          setCartVendor(null);
          setShowPaystack(false);
          setActiveCoupon(null);
          setCouponCode('');
          
          // Switch tab directly to order status screen
          setSelectedOrder(payData.order);
          setActiveTab('orders');
        } else {
          alert(payData.message || 'Failed to complete transaction.');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Message chat channel
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
    if (!selectedOrder) {
      setChatMessages([]);
      return;
    }
    fetchChats(selectedOrder.id);
    const orderChatInterval = setInterval(() => {
      fetchChats(selectedOrder.id);
    }, 3000);
    return () => clearInterval(orderChatInterval);
  }, [selectedOrder?.id]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newChatText.trim()) return;

    try {
      const res = await fetch('/api/chats/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: 'customer',
          text: newChatText
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages([...chatMessages, data.message]);
        setNewChatText('');
      }
    } catch (e) {}
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportIssue.trim()) return;

    try {
      const res = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder?.id || undefined,
          customerName: currentUser.name,
          customerEmail: currentUser.email,
          issue: supportIssue
        })
      });
      if (res.ok) {
        setSupportIssue('');
        setShowSupport(false);
        alert('Admin has seen your problem! We will call you soon to help.');
      }
    } catch(e) {}
  };

  // Submit delivery reviews
  const handleSubmitReview = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch('/api/orders/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          foodRating,
          riderRating,
          comment: reviewComment
        })
      });
      if (res.ok) {
        alert('Feedback review uploaded. Thank you!');
        // Refresh Order profile locally
        const updated = { ...selectedOrder, ratingFromCustomer: { foodRating, riderRating, comment: reviewComment } };
        setSelectedOrder(updated);
        setReviewComment('');
      }
    } catch(e) {}
  };

  // ==========================================
  // METROPOLITAN LAGOS COORDINATES SCALER
  // Projects actual Lat/Lng on to visual SVG canvas grid
  // ==========================================
  const scaleLatX = (lat: number) => {
    const minLat = 6.41;
    const maxLat = 6.62;
    return 40 + ((lat - minLat) / (maxLat - minLat)) * 420;
  };
  
  const scaleLngY = (lng: number) => {
    const minLng = 3.31;
    const maxLng = 3.45;
    return 230 - ((lng - minLng) / (maxLng - minLng)) * 180;
  };

  // Fetch orders when checking lists
  const handleQueryMyOrders = async () => {
    setSelectedOrder(null);
    try {
      const res = await fetch('/api/admin/onboardings');
      const d = await res.json();
      
      // Look up our active customer orders in memory database on server.ts
      const matched = d.allVendors; // arbitrary system trigger
      // We will perform system logs pull
      const logsRes = await fetch('/api/admin/audit-logs');
      const apiStats = await fetch('/api/platform/stats');
    } catch(e) {}
  };

  const handleTabClick = (tabId: 'discover' | 'cart' | 'checkout' | 'orders' | 'settings') => {
    if (!currentUser && (tabId === 'checkout' || tabId === 'orders' || tabId === 'settings')) {
      setAuthTab('signup');
      setAuthError('');
      setShowAuthModal(true);
      return;
    }
    setActiveTab(tabId);
    if (tabId === 'orders') {
      handleQueryMyOrders();
    }
    setMobileMenuOpen(false);
  };

  return (
    <div id="customer-view-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      {/* Tab select bar - Bento style with Mobile Hamburger toggle */}
      <div className="bg-slate-950 text-slate-100 rounded-3xl p-4 mb-8 border border-neutral-800 shadow-xl relative">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF5E2A]/20 flex items-center justify-center text-[#FF5E2A] font-extrabold border border-[#FF5E2A]/30">
              🛒
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight block">90's.emitsphere Hub</span>
              <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                {cartVendor ? `Basket Locked: ${cartVendor.name}` : "Multi-Kitchen Retro Cuisine Market"}
              </span>
            </div>
          </div>
          
          {/* Hamburger toggle for mobile screens - Icon ONLY, no text */}
          <div className="sm:hidden absolute top-4 right-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 bg-slate-900 hover:bg-[#E04B1A] border border-slate-800 text-[#FF5E2A] rounded-xl flex items-center justify-center transition-all cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 font-black" /> : <Menu className="w-5 h-5 font-black" />}
            </button>
          </div>

          <nav className={`sm:flex flex-wrap items-center gap-1.5 ${mobileMenuOpen ? 'flex flex-col mt-3 pb-2 w-full' : 'hidden sm:flex'}`}>
            <button
              onClick={() => handleTabClick('discover')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center transition-all flex items-center gap-1.5 ${activeTab === 'discover' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'} w-full sm:w-auto`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Discover</span>
            </button>
            <button
              onClick={() => handleTabClick('cart')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center relative transition-all flex items-center gap-1.5 bg-[#1D9D41] hover:bg-[#168234] text-white shadow-md border border-transparent w-full sm:w-auto`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Basket</span>
              {cart.length > 0 && (
                <span className="ml-1 bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {cart.length}
                </span>
              )}
            </button>
            <button
              disabled={cart.length === 0}
              onClick={() => handleTabClick('checkout')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center transition-all flex items-center gap-1.5 ${cart.length === 0 ? 'opacity-40 cursor-not-allowed' : ''} ${activeTab === 'checkout' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'} w-full sm:w-auto`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Checkout</span>
            </button>
            <button
              onClick={() => handleTabClick('orders')}
              className={`px-4 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center transition-all flex items-center gap-1.5 ${activeTab === 'orders' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'} w-full sm:w-auto`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Track</span>
            </button>
            {currentUser && (
              <button
                onClick={() => handleTabClick('settings')}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center transition-all flex items-center gap-1.5 ${activeTab === 'settings' ? 'bg-[#1D9D41] text-white shadow-md border-transparent' : 'bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white'} w-full sm:w-auto`}
              >
                <span>⚙️ Settings</span>
              </button>
            )}

            {/* HIGH FIDELITY THEME DYNAMIC TOGGLE */}
            <button
              onClick={() => onThemeChange?.(theme === 'light' ? 'dark' : 'light')}
              className="px-4 py-2 text-xs font-bold uppercase rounded-xl text-left sm:text-center transition-all bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white flex items-center gap-1.5 w-full sm:w-auto cursor-pointer border border-neutral-800"
              title="Toggle theme style"
            >
              <span>{theme === 'light' ? '🌙 Dark' : '☀️ Light'}</span>
            </button>

            {/* INTEGRATED NOTIFICATIONS BELL DROPDOWN */}
            {currentUser && (
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    if (!isNotifOpen) {
                      // Mark all as read when opening up
                      fetch('/api/notifications/read-all', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser.id })
                      }).then(() => {
                        setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
                      });
                    }
                  }}
                  className="px-4 py-2 bg-[#FF5E2A] text-white hover:bg-[#E04B1A] hover:text-white text-xs font-bold uppercase rounded-xl transition-all relative flex items-center gap-1.5 cursor-pointer border border-neutral-800 w-full sm:w-auto"
                  title="View Inbox Alerts"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Alerts</span>
                  {notificationsList.some(n => !n.isRead) && (
                    <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                      {notificationsList.filter(n => !n.isRead).length}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 text-left overflow-hidden animate-fade-in font-sans">
                    <div className="p-3 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
                      <h4 className="font-black text-black text-[10px] uppercase tracking-wider">Inbox Alerts ({notificationsList.filter(n => !n.isRead).length})</h4>
                      <button
                        onClick={() => setIsNotifOpen(false)}
                        className="text-black font-black transition-colors text-[10px] uppercase border-0 bg-transparent cursor-pointer"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 bg-white">
                      {notificationsList.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-[11px] font-semibold">
                          No messages received.
                        </div>
                      ) : (
                        notificationsList.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => {
                              handleNotificationClickLocal(notif);
                              setIsNotifOpen(false);
                            }}
                            className="w-full p-3.5 hover:bg-neutral-50 transition-all text-left block border-0 cursor-pointer space-y-1 bg-transparent"
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-black">
                                {notif.title}
                              </span>
                              {!notif.isRead && (
                                <span className="bg-rose-950/80 border border-rose-800 text-rose-400 text-[8px] font-black px-1.5 py-0.25 rounded-full uppercase">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                              {notif.body}
                            </p>
                            <p className="text-[9px] text-slate-500 font-medium">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ACTIVE CUSTOMER LABEL */}
            {currentUser && (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs font-bold w-full sm:w-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="truncate max-w-[120px]">👤 {currentUser.name}</span>
              </div>
            )}

            {/* INTEGRATED PORTAL SIGN OUT BUTTON */}
            {currentUser && onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-[#FF5E2A] text-white hover:bg-[#E04B1A] border-transparent text-xs font-semibold uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto justify-center sm:justify-start"
                title="Sign out of customer portal"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {activeTab === 'discover' && (
        <div className="animate-fade-in">
          {!selectedVendor ? (
            <div>
              {/* Header discovery list banner */}
              <div className={`rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sm:gap-6 border ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 border-slate-755 text-white shadow-md'}`}>
                <div className="space-y-1 sm:space-y-2 text-left">
                  <h2 className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tight scale-y-95 leading-tight ${theme === 'light' ? 'text-blue-900' : 'text-white'}`}>Delicious Food • Quick Delivery</h2>
                  <p className={`text-xs sm:text-sm max-w-md leading-relaxed font-semibold ${theme === 'light' ? 'text-slate-500' : 'text-blue-100'}`}>Pick any clean food shop in Lagos. We bring your meals super fast, or you get your money back.</p>
                </div>
                <div className="relative w-full max-w-sm">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 border shadow-sm ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400' : 'bg-slate-900/50 backdrop-blur-md text-white border-slate-700/60 placeholder:text-slate-400'}`}
                    placeholder="Search for food shops..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Vendor catalog displays */}
              <h3 className="text-lg font-black text-slate-950 tracking-tight mb-5 uppercase text-[11px] font-mono">Our Food Shops</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendorsList
                  .filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((vendor) => (
                    <div
                      key={vendor.id}
                      onClick={() => loadVendorProducts(vendor)}
                      className="group bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full hover:border-blue-500"
                    >
                      <div className="relative h-48 overflow-hidden bg-neutral-100">
                        <img
                          src={vendor.bannerUrl}
                          alt={vendor.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm shadow-sm py-1 px-2.5 rounded-lg text-blue-600 text-xs font-bold flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                          <span>{vendor.rating} Rating</span>
                        </div>
                      </div>

                      <div className="p-5 flex-grow flex flex-col">
                        <div className="flex items-center gap-3">
                          <img
                            src={vendor.logoUrl}
                            alt=""
                            className="w-10 h-10 object-cover rounded-md border border-neutral-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h4 className="font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">{vendor.name}</h4>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">{vendor.category}</p>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500 mt-3.5 line-clamp-2 leading-relaxed flex-grow">{vendor.description}</p>
                        
                        <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                          <span>📍 {vendor.address.split(',')[1]}</span>
                          <span className="text-emerald-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                            ACTIVE
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Restaurant Menu Header */}
              <button
                onClick={() => { setSelectedVendor(null); }}
                className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-slate-900 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Partner Kitchens</span>
              </button>

              <div className="relative rounded-2xl overflow-hidden bg-slate-950 text-white p-5 sm:p-8 md:p-12 mb-6 sm:mb-8 border border-slate-800">
                <div className="absolute inset-0 opacity-30">
                  <img
                    src={selectedVendor.bannerUrl}
                    alt=""
                    className="w-full h-full object-cover filter blur-xs"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="relative z-10 max-w-2xl space-y-2 sm:space-y-3 text-left">
                  <div className="inline-flex items-center gap-1 bg-white/10 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
                    <span>{selectedVendor.category}</span>
                  </div>
                  <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight">{selectedVendor.name}</h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{selectedVendor.description}</p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 pt-2 sm:pt-4 text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">⏱️ {selectedVendor.operatingHours}</span>
                    <span className="flex items-center gap-1.5">🌟 {selectedVendor.rating} Rating</span>
                    <span className="flex items-center gap-1.5 break-words">📍 {selectedVendor.address}</span>
                  </div>
                </div>
              </div>

              {/* Culinary craft menu grid */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-base font-black text-slate-950 uppercase tracking-wider font-mono">Culinary Craft Menu</h3>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 rounded-lg px-2.5 py-1">{productsList.length} specialties</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productsList.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleOpenProductModal(product)}
                      className="bg-white border text-left border-slate-200/80 rounded-2xl overflow-hidden flex flex-col justify-between h-auto min-h-[14rem] p-4 shadow-xs hover:shadow-md hover:border-[#FF5E2A] transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex gap-4">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-xl border border-slate-100 shrink-0 group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1 select-none">
                          <h4 className="font-bold text-sm text-neutral-900 leading-tight group-hover:text-[#FF5E2A] transition-colors">{product.name}</h4>
                          <p className="text-[11px] text-neutral-400 line-clamp-4 leading-relaxed">{product.description}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <span className="font-black text-[#FF5E2A] text-base">₦{product.price.toLocaleString()}</span>
                        <div
                          className="px-4.5 py-2 bg-[#FF5E2A] hover:bg-[#d4700d] text-white text-xs font-black uppercase rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          Order
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STANDALONE CART VIEW PAGE */}
      {activeTab === 'cart' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 pb-4 gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Your Food Basket</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {cartVendor ? `Sending your order to ${cartVendor.name}` : "Pick some delicious food to get started."}
              </p>
            </div>
            <span className="bg-blue-50 text-blue-800 text-xs font-extrabold px-3.5 py-1.5 rounded-xl uppercase tracking-wider">
              {cart.length} items
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="py-20 text-center bg-white border rounded-3xl space-y-4 max-w-xl mx-auto shadow-sm p-8">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 border">
                <ShoppingBag className="w-8 h-8 stroke-1 text-slate-400" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-neutral-800">Your basket is currently empty</h4>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">Check out our food shops to find tasty food to buy.</p>
              </div>
              <button
                onClick={() => setActiveTab('discover')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow"
              >
                Go Find Food
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-extrabold text-neutral-900 text-[11px] font-mono uppercase tracking-wider">Selected Deliveries</h3>
                
                <div className="divide-y divide-neutral-100">
                  {cart.map((item, idx) => (
                    <div key={idx} className="py-4 flex gap-4 first:pt-0 last:pb-0 justify-between items-start">
                      <div className="flex gap-4">
                        <img
                          src={item.product.imageUrl}
                          alt=""
                          className="w-16 h-16 object-cover border rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1">
                          <p className="font-bold text-neutral-950 text-sm">{item.product.name}</p>
                          <p className="text-[11px] text-neutral-400 line-clamp-1">{item.product.description}</p>
                          
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.selectedVariant && (
                              <span className="inline-block text-[10px] bg-slate-100 text-slate-700 font-mono font-medium px-2 py-0.5 rounded-lg border">
                                Variant: {item.selectedVariant}
                              </span>
                            )}
                            {item.selectedAddOns.map((a, i) => (
                              <span key={i} className="inline-block text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-lg border border-emerald-100">
                                + Extra topping: {a.name} (+₦{a.price.toLocaleString()})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="font-black text-neutral-900 text-sm">₦{item.product.price.toLocaleString()}</span>
                        <button
                          onClick={() => handleRemoveFromCart(idx)}
                          className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-all border border-transparent hover:border-rose-100 font-bold"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t flex justify-between items-center text-xs font-black uppercase">
                  <button
                    onClick={() => { setCart([]); setCartVendor(null); }}
                    className="text-neutral-400 hover:text-[#E04B1A] transition-colors uppercase tracking-wider text-[10px]"
                  >
                    Empty Basket
                  </button>
                  <button
                    onClick={() => {
                      if (cartVendor) {
                        setSelectedVendor(cartVendor);
                      }
                      setActiveTab('discover');
                    }}
                    className="text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider text-[10px]"
                  >
                    + Add More Dishes
                  </button>
                </div>
              </div>

              {/* Estimate summary panel */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="font-black text-[10px] tracking-widest uppercase text-slate-400 font-mono">Order Pricing Estimate</h4>
                </div>
                
                <div className="space-y-3.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-white text-sm">₦{getSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Logistics Fee</span>
                    <span className="text-white font-medium">₦{getDeliveryFee().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Service Charge</span>
                    <span className="text-white font-medium">₦{getServiceFee().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-850 pt-3 text-sm text-white font-black">
                    <span>Total Amount</span>
                    <span>₦{(getSubtotal() + getDeliveryFee() + getServiceFee()).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                    * Final gateway settlement processing fee of 1.5% is added dynamically inside checkout panel.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('checkout')}
                  className="w-full py-4 bg-[#1D9D41] hover:bg-[#168234] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md mt-4 text-center block"
                >
                  Proceed to Checkout Page
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STANDALONE CHECKOUT VIEW PAGE */}
      {activeTab === 'checkout' && (
        <div className="space-y-6 animate-fade-in">
          <div className="border-b border-neutral-200 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Logistics Checkout & Payment</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">Secure payment must be authorized directly to verify coordinates.</p>
          </div>

          {cart.length === 0 ? (
            <div className="py-20 text-center bg-white border rounded-3xl max-w-md mx-auto p-12">
              <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-sm font-bold text-slate-900 mb-2">There are no items to checkout</p>
              <p className="text-xs text-slate-400 mb-4">Empty checkout log found. Back to kitchens explore.</p>
              <button
                onClick={() => setActiveTab('discover')}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Discover Food Menu
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6 text-left">
                {/* Delivery details banner */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex justify-between items-center border-b pb-2.5">
                    <h3 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider font-mono">1. Delivery Destination Dispatch</h3>
                    <span className="text-[9px] text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">Interactive Options</span>
                  </div>

                  <div className="space-y-4 font-sans">
                    {!isEditingCheckoutLocation ? (
                      <div className="bg-[#f0f9ff]/60 border border-sky-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sky-800 font-extrabold uppercase tracking-wide font-mono">
                            <MapPin className="w-4.5 h-4.5 text-[#FF5E2A]" />
                            <span>Saved Delivery Destination</span>
                          </div>
                          <p className="text-[#334155] font-bold text-sm leading-relaxed mt-1">
                            {customerCoordinates.address || 'Bells University of Technology, Ota, Ogun State'}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono tracking-tight">
                            Coordinates: {customerCoordinates.lat?.toFixed(5) || '6.69080'}, {customerCoordinates.lng?.toFixed(5) || '3.15010'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingCheckoutLocation(true)}
                          className="shrink-0 px-4 py-2.5 bg-[#FF5E2A] text-white text-xs font-black uppercase rounded-xl hover:bg-[#FF5E2A] shadow-sm transition-all cursor-pointer text-center"
                        >
                          ✏️ Change Location
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-extrabold text-[#E04B1A] uppercase tracking-widest font-mono">Adjust Map Pin Target</span>
                          <button
                            type="button"
                            onClick={() => setIsEditingCheckoutLocation(false)}
                            className="px-3.5 py-1.5 bg-[#FF5E2A] text-white text-[10px] uppercase font-black rounded-lg hover:bg-[#E04B1A] shadow-sm transition-all cursor-pointer border border-[#FF5E2A]"
                          >
                            ✓ Save Location
                          </button>
                        </div>
                        <MapLocationPicker
                          initialLocation={{
                            address: customerCoordinates.address,
                            lat: customerCoordinates.lat || 6.6908,
                            lng: customerCoordinates.lng || 3.1501
                          }}
                          onLocationChange={(loc) => setCustomerCoordinates({
                            address: loc.address,
                            lat: loc.lat,
                            lng: loc.lng
                          })}
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">Resolved Delivery Address</label>
                      <input
                        type="text"
                        value={customerCoordinates.address}
                        readOnly
                        placeholder="Type any custom address..."
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-neutral-500 shadow-xs font-bold cursor-not-allowed"
                        id="address-input-field"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Logistics Gate Password & Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="Add apartment codes, directions notes, color of fence, or instructions for rapid delivery dispatch..."
                      className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-lg text-xs text-neutral-800 focus:outline-blue-600 shadow-xs"
                    ></textarea>
                  </div>
                </div>

                {/* Coupon Promos block */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider border-b pb-2.5 font-mono">2. Secure Coupon Code</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. DELIVOFIRST"
                      className="bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs w-full focus:outline-blue-600 uppercase"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      onClick={handleValidateCoupon}
                      className="px-4 py-2 bg-neutral-950 hover:bg-black text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Apply
                    </button>
                  </div>
                  {activeCoupon && (
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      ✓ Coupon Applied: {activeCoupon.code} (-₦{getDiscount().toLocaleString()})
                    </p>
                  )}
                  {couponError && (
                    <p className="text-xs text-rose-600 font-semibold">{couponError}</p>
                  )}
                </div>
              </div>

              {/* Grand summary checklist sidebar */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-left">
                <h3 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider border-b pb-2 font-mono">3. Payment Authorization</h3>
                
                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">₦{getSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Logistics Delivery Fee</span>
                    <span className="font-bold text-slate-900">₦{getDeliveryFee().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Service Fee</span>
                    <span className="font-bold text-slate-900">₦{getServiceFee().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span className="font-bold text-slate-900">₦{getTax().toLocaleString()}</span>
                  </div>
                  {getDiscount() > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Coupon Discount</span>
                      <span>-₦{getDiscount().toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-950 text-base font-black pt-2 border-t">
                    <span>Settlement Total</span>
                    <span className="text-lg">₦{getOrderTotal().toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl text-[11px] text-slate-600 leading-relaxed font-medium">
                  <strong className="block text-slate-800 uppercase text-[9px] font-black tracking-wider mb-0.5">Direct Settlement Gate</strong>
                  <span>Pay with simulated secured cards to dispatch the order instantly. Users pay before getting orders. In-app topup wallet balance is pre-deactivated.</span>
                </div>

                <button
                  onClick={handleInitiatePayment}
                  className="w-full py-4 bg-[#FF5E2A] hover:bg-[#E04B1A] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₦{getOrderTotal().toLocaleString()}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRACK AND LOGISTICS STATUS SECTION */}
      {activeTab === 'orders' && (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Order listing navigation list */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-neutral-900 text-lg">My Fulfillment History</h4>
            
            <div className="space-y-3">
              {activeOrders.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-xs font-bold">No fulfillment history found.</p>
                  <p className="text-[10px] mt-1 text-slate-500">Your placed orders will show up here to track live.</p>
                </div>
              ) : (
                activeOrders.map((order) => (
                  <button 
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full border p-4 rounded-xl text-left flex justify-between items-center transition-all ${selectedOrder?.id === order.id ? 'border-blue-500 bg-blue-50/50' : 'bg-neutral-50 hover:bg-neutral-100 border-slate-200'}`}
                  >
                    <div>
                      <h5 className="font-bold text-sm text-neutral-950">📦 Order from {order.vendorName}</h5>
                      <p className="text-xs text-neutral-500 mt-0.5">Reference: {order.id}</p>
                      <p className="text-xs text-neutral-600 mt-2 font-black">₦{order.total?.toLocaleString()} • {order.status.replace(/_/g, ' ')}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800 animate-pulse'}`}>
                      {order.status === 'DELIVERED' ? 'Completed' : 'Tracking'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ACTIVE DISPATCH LOGISTICS GPS MAP TRACKER */}
          <div className="lg:col-span-2">
            {!selectedOrder ? (
              <div className="bg-white border rounded-2xl p-12 text-center text-neutral-400 space-y-3 shadow-sm">
                <Clock className="w-10 h-10 mx-auto stroke-1" />
                <h4 className="font-bold text-neutral-800 text-lg">No active dispatch route selected</h4>
                <p className="text-sm">Place an order or select an entry in your history ledger to track real-time coordinates.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Visual order phase trackers */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Order Fulfillment Stage</span>
                      <h4 className="text-lg sm:text-2xl font-black text-neutral-900 tracking-tight mt-0.5">{selectedOrder.status.replace('_', ' ')}</h4>
                    </div>

                    {/* Prominent secure OTP box */}
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex items-center gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-yellow-800 uppercase tracking-widest">Security Pin Verification</p>
                        <h4 className="text-lg sm:text-2xl font-mono font-black text-yellow-900 tracking-wider mt-0.5">{selectedOrder.otp}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Flow tracker steps */}
                  <div className="grid grid-cols-4 gap-2 text-center pt-2">
                    <div className="space-y-1">
                      <div className={`h-2 rounded-full ${['PAYMENT_CONFIRMED', 'VENDOR_ACCEPTED', 'VENDOR_PREPARING', 'RIDER_ASSIGNED', 'RIDER_AT_VENDOR', 'PICKED_UP', 'RIDER_ON_THE_WAY', 'RIDER_ARRIVED', 'DELIVERED'].includes(selectedOrder.status) ? 'bg-[#FF5E2A]' : 'bg-neutral-200'}`}></div>
                      <span className="text-[9px] font-bold text-neutral-500 uppercase">Paid</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`h-2 rounded-full ${['VENDOR_PREPARING', 'RIDER_ASSIGNED', 'RIDER_AT_VENDOR', 'PICKED_UP', 'RIDER_ON_THE_WAY', 'RIDER_ARRIVED', 'DELIVERED'].includes(selectedOrder.status) ? 'bg-[#FF5E2A]' : 'bg-neutral-200'}`}></div>
                      <span className="text-[9px] font-bold text-neutral-500 uppercase">Cooking</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`h-2 rounded-full ${['PICKED_UP', 'RIDER_ON_THE_WAY', 'RIDER_ARRIVED', 'DELIVERED'].includes(selectedOrder.status) ? 'bg-[#FF5E2A]' : 'bg-neutral-200'}`}></div>
                      <span className="text-[9px] font-bold text-neutral-500 uppercase">En Route</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`h-2 rounded-full ${selectedOrder.status === 'DELIVERED' ? 'bg-[#FF5E2A]' : 'bg-neutral-200'}`}></div>
                      <span className="text-[9px] font-bold text-neutral-500 uppercase">Arrived</span>
                    </div>
                  </div>
                </div>

                {/* 2D REAL GOOGLE/COMPOSITE GEOGRAPHIC DISPATCH TRACKER */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md">
                  <div className="bg-neutral-50 border-b p-4 flex justify-between items-center">
                    <h4 className="font-extrabold text-sm text-neutral-900 flex items-center gap-1.5 uppercase tracking-wider font-sans">
                      <Compass className="w-4.5 h-4.5 text-[#FF5E2A] animate-spin" style={{ animationDuration: '6s' }} />
                      <span>Live 2D Dispatch Location Routing</span>
                    </h4>
                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                      Interactive Live View
                    </span>
                  </div>

                  <OrderTrackerMap
                    vendorLat={selectedOrder.vendorLat || 6.6908}
                    vendorLng={selectedOrder.vendorLng || 3.1501}
                    vendorName={selectedOrder.vendorName}
                    customerLat={selectedOrder.customerLat || 6.6908}
                    customerLng={selectedOrder.customerLng || 3.1501}
                    customerAddress={selectedOrder.customerAddress || 'Ogun State'}
                    riderName={selectedOrder.riderName}
                    riderLat={selectedOrder.riderLat}
                    riderLng={selectedOrder.riderLng}
                    status={selectedOrder.status}
                  />

                  {/* Live delivery ETA drawer */}
                  <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-lg shadow-inner">
                        ⏱️
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[#E04B1A] uppercase tracking-wider">Estimated Dropoff ETA</p>
                        <h5 className="font-extrabold text-neutral-900 text-sm">
                          {selectedOrder.status === 'DELIVERED' ? 'Successfully Delivered' : '15-20 Minutes'}
                        </h5>
                      </div>
                    </div>
                    {selectedOrder.riderId ? (
                      <div className="text-right text-xs">
                        <p className="font-black text-neutral-950">🛵 Courier: {selectedOrder.riderName}</p>
                        <p className="text-neutral-500 font-semibold mt-0.5">{selectedOrder.riderPhone || 'Ogun Dispatcher'}</p>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl uppercase border border-amber-200">Queue Dispatching...</span>
                    )}
                  </div>
                </div>

                {/* INTERACTIVE MESSAGE CHAT DRAWERS */}
                {selectedOrder && (
                  <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <h4 className="font-bold text-neutral-900 text-base flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                        <span>Ecosystem Open Chat Room</span>
                      </h4>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">Secure Gateway</span>
                    </div>

                    <div className="h-44 overflow-y-auto space-y-3 pr-2 border-b pb-4">
                      {chatMessages.length === 0 ? (
                        <p className="text-xs text-neutral-400 py-12 text-center">No messages exchanged yet. Send a note to coordinate delivery or ask questions.</p>
                      ) : (
                        chatMessages.map((m) => {
                          const isCustomer = m.senderRole === 'customer';
                          const isSupport = m.senderRole === 'admin';
                          const isVendor = m.senderRole === 'vendor';
                          const isRider = m.senderRole === 'rider';
                          
                          let bubbleStyle = 'bg-neutral-100 text-neutral-800';
                          let label = m.senderName;
                          
                          if (isCustomer) {
                            bubbleStyle = 'bg-[#FF5E2A] text-white';
                            label = 'You';
                          } else if (isSupport) {
                            bubbleStyle = 'bg-amber-100 text-amber-950 border border-amber-300';
                            label = 'Customer Care';
                          } else if (isVendor) {
                            bubbleStyle = 'bg-purple-100 text-purple-950 border border-purple-200';
                            label = `${m.senderName} (Vendor)`;
                          } else if (isRider) {
                            bubbleStyle = 'bg-blue-100 text-blue-950 border border-blue-200';
                            label = `${m.senderName} (Rider)`;
                          }
                          
                          return (
                            <div key={m.id} className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}>
                              <div className={`p-3 rounded-2xl text-xs max-w-xs ${bubbleStyle}`}>
                                <p className="font-extrabold block mb-0.5 text-[9px] uppercase tracking-wider opacity-90">{label}</p>
                                <p className="font-semibold leading-relaxed">{m.text}</p>
                              </div>
                              <span className="text-[8px] text-neutral-400 mt-1">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendChatMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type a message to coordinate with Rider or Restaurant..."
                        className="bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-emerald-600"
                        value={newChatText}
                        onChange={(e) => setNewChatText(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="p-2.5 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white rounded-lg cursor-pointer flex items-center justify-center border-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* LEAVE RATING AND REVIEWS PANEL (Displays only when complete) */}
                {selectedOrder.status === 'DELIVERED' && (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-3xl p-6 space-y-4">
                    <h4 className="font-extrabold text-neutral-900 text-lg flex items-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                      <span>Culinary & Logistics Review</span>
                    </h4>
                    <p className="text-sm text-neutral-600 leading-relaxed">Let us know how Sizzle Burger cooked your meal and how your dispatch courier behaved! Your reviews directly affect visibility metrics.</p>
                    
                    <div className="grid md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-white border p-4 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-neutral-500 uppercase">Rate Food Culinary</label>
                        <select 
                          className="w-full bg-neutral-50 border px-3 py-1.5 rounded-lg text-sm"
                          value={foodRating}
                          onChange={(e) => setFoodRating(parseInt(e.target.value))}
                        >
                          <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                          <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                          <option value="3">⭐⭐⭐ 3 Stars</option>
                        </select>
                      </div>

                      <div className="bg-white border p-4 rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-neutral-500 uppercase">Rate Delivery Logistics</label>
                        <select 
                          className="w-full bg-neutral-50 border px-3 py-1.5 rounded-lg text-sm"
                          value={riderRating}
                          onChange={(e) => setRiderRating(parseInt(e.target.value))}
                        >
                          <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                          <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                          <option value="3">⭐⭐⭐ 3 Stars</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-white border p-4 rounded-xl space-y-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase w-full">Comments or Suggestions</label>
                      <input
                        type="text"
                        placeholder="e.g. Incredibly hot and neat packaging."
                        className="w-full bg-neutral-50 border px-3 py-2 rounded-lg text-sm focus:outline-emerald-600"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleSubmitReview}
                      className="w-full py-3 bg-neutral-900 hover:bg-[#FF5E2A] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                      Process Reviews Feedback
                    </button>
                  </div>
                )}

                {/* SECURE SUPPORT / DISPUTE TICKET SYSTEM */}
                <div className="bg-neutral-900 text-white rounded-3xl p-6">
                  <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                    <h5 className="font-extrabold text-sm uppercase tracking-wider text-neutral-400">Report a Food / Rider Problem</h5>
                    <button
                      onClick={() => setShowSupport(!showSupport)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/15 text-white text-xs rounded-lg font-bold"
                    >
                      Ask for Help
                    </button>
                  </div>
                  
                  {showSupport && (
                    <form onSubmit={handleCreateSupportTicket} className="space-y-4 mt-4">
                      <p className="text-xs text-neutral-400">Did something go wrong with your food or rider? Write it below and we will help you fix it right away!</p>
                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-black">What is the problem? Write it here</label>
                        <input
                          type="text"
                          required
                          placeholder="My food was cold, or my food bag was missing items..."
                          className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-sm text-white focus:outline-none placeholder:text-neutral-500"
                          value={supportIssue}
                          onChange={(e) => setSupportIssue(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-[#FF5E2A] text-white font-bold text-xs uppercase rounded-lg"
                      >
                        Send Problem to Admin
                      </button>
                    </form>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && currentUser && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left">
          <SettingsPanel 
            currentUser={{
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              phone: currentUser.phone || '',
              avatar: (currentUser as any).avatar || '',
              role: 'customer',
              walletBalance: 0
            }} 
            onUserUpdate={(updated) => {
              if (onLogin) {
                onLogin({
                  id: updated.id,
                  name: updated.name,
                  email: updated.email,
                  phone: updated.phone,
                  avatar: (updated as any).avatar
                } as any);
              }
            }} 
          />
        </div>
      )}

      {/* ==========================================
      MODAL PRODUCT CONFIGURATION DRAWER (Variants/Add-ons)
      ========================================== */}
      {activeProduct && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-auto flex flex-col max-h-[92vh]">
            <div className="relative h-36 sm:h-48 bg-neutral-100 shrink-0">
              <img
                src={activeProduct.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setActiveProduct(null)}
                className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-sm text-neutral-800 z-10 hover:bg-white transition-all transform hover:scale-105"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto min-h-0 [scrollbar-width:thin] text-left">
              <div className="space-y-1">
                <span className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg mb-1">{activeProduct.category}</span>
                <h4 className="font-extrabold text-lg sm:text-xl text-neutral-900 leading-tight">{activeProduct.name}</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">{activeProduct.description}</p>
              </div>

              {/* Variants Selector */}
              {activeProduct.variants.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Select Serving Variant</span>
                  <div className="grid grid-cols-1 gap-2">
                    {activeProduct.variants.map((v) => (
                      <label
                        key={v}
                        className={`flex items-center gap-3 border p-3 rounded-xl cursor-pointer text-sm font-semibold transition-all ${modalVariant === v ? 'border-[#FF5E2A] bg-amber-50/30' : 'border-neutral-200 hover:border-neutral-300'}`}
                        onClick={() => setModalVariant(v)}
                      >
                        <input
                          type="radio"
                          name="variant-group"
                          checked={modalVariant === v}
                          onChange={() => setModalVariant(v)}
                          className="text-[#FF5E2A] focus:ring-[#FF5E2A]"
                        />
                        <span>{v}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons Checklist */}
              {activeProduct.addOns.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Configure Toppings & Extras</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeProduct.addOns.map((addon) => (
                      <label
                        key={addon.name}
                        className={`flex items-center justify-between border p-3 rounded-xl cursor-pointer text-xs font-semibold transition-all ${modalAddOns.some(a => a.name === addon.name) ? 'border-emerald-600 bg-emerald-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={modalAddOns.some(a => a.name === addon.name)}
                            onChange={() => toggleModalAddOn(addon)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{addon.name}</span>
                        </div>
                        <span className="text-emerald-700 font-bold">+₦{addon.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-neutral-100 shrink-0">
              <button
                onClick={handleAddToCart}
                className="w-full py-3.5 bg-[#1D9D41] hover:bg-[#168234] text-white font-black text-center text-sm rounded-xl transition-all shadow-md cursor-pointer border border-[#168234]/20"
              >
                Add Meal selection to Basket • ₦{activeProduct.price.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
      PAYSTACK POPUP SECURE GATEWAY SIMULATOR
      ========================================== */}
      {showPaystack && selectedVendor && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-neutral-100 my-auto">
            <div className="bg-emerald-950 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 w-3 h-3 rounded-full animate-pulse"></span>
                <span className="text-xs font-black tracking-widest uppercase">Paystack Secure Gateway</span>
              </div>
              <button
                onClick={() => setShowPaystack(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaystackExecute} className="p-6 space-y-4 text-sm">
              <div className="text-center pb-2">
                <p className="text-xs text-neutral-400 uppercase font-black tracking-wider">Settlement Transfer Amount To {selectedVendor.name}</p>
                <h4 className="text-xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">₦{getOrderTotal().toLocaleString()}</h4>
              </div>

              <div className="bg-neutral-50 p-4 rounded-xl border space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase">Secure Client Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="5061 9245 1025..."
                    className="w-full bg-white border rounded-lg px-3 py-2 text-sm text-neutral-800 tracking-wider font-mono"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase">Expiry Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      className="w-full bg-white border rounded-lg px-3 py-2 text-sm text-neutral-800"
                      value={paymentData.expiry}
                      onChange={(e) => setPaymentData({ ...paymentData, expiry: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase">CVV Card Security</label>
                    <input
                      type="password"
                      maxLength={3}
                      required
                      placeholder="•••"
                      className="w-full bg-white border rounded-lg px-3 py-2 text-sm text-neutral-800"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase">Card 4-Digit PIN Security</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="••••"
                    className="w-full bg-white border rounded-lg px-3 py-2 text-sm text-neutral-800 font-mono tracking-widest text-center"
                    value={paymentData.pin}
                    onChange={(e) => setPaymentData({ ...paymentData, pin: e.target.value })}
                  />
                </div>
              </div>

              <div className="text-center py-2 text-xs text-neutral-400 flex items-center justify-center gap-1.5 font-semibold">
                <span>🔒 Secured with AES end-to-end platform tokens</span>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full py-3.5 bg-[#FF5E2A] hover:bg-[#FF5E2A] text-white font-bold rounded-xl transition-all shadow-md inline-flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Resolving tokenized gateway ledger...</span>
                  </>
                ) : (
                  <span>Verify Card and Complete Order Payment</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING CART BUTTON */}
      {cart.length > 0 && activeTab !== 'cart' && (
        <button
          onClick={() => setActiveTab('cart')}
          className="fixed bottom-6 right-6 z-40 bg-[#08BE3B] hover:opacity-90 text-white p-4 rounded-full shadow-2xl flex items-center justify-center gap-2 group transition-all duration-300 hover:scale-105 active:scale-95 border border-[#08BE3B]/10 cursor-pointer"
          id="floating-cart-button"
        >
          <ShoppingBag className="w-6 h-6 animate-pulse text-white" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out font-black text-[10px] uppercase tracking-wider block">
            View Basket
          </span>
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow animate-bounce">
            {cart.length}
          </span>
        </button>
      )}

      {/* CROSS-SHOP CLEAR BASKET CONFIRMATION MODAL */}
      {showVendorClearWarning && pendingVendorToLoad && cartVendor && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in text-left">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-neutral-100 p-6 space-y-5 my-auto">
            <div className="flex items-start gap-3.5 text-amber-500">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-neutral-950 text-base">Replace basket items?</h4>
                <p className="text-[9px] text-neutral-400 font-bold uppercase font-mono tracking-wider">Multi-shop order policy</p>
              </div>
            </div>
            
            <p className="text-xs text-neutral-600 leading-relaxed text-left">
              You already have delicious dishes from <strong className="text-slate-900">{cartVendor.name}</strong> inside your active basket. 
              To order from <strong className="text-slate-900">{pendingVendorToLoad.name}</strong> instead, empty your current basket or complete that order first.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => { setShowVendorClearWarning(false); setPendingVendorToLoad(null); }}
                className="w-full sm:w-auto flex-1 py-3 bg-[#1D9D41] hover:bg-[#168234] text-white text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
              >
                Keep Current Basket
              </button>
              <button
                onClick={handleConfirmClearBasketAndSwitch}
                className="w-full sm:w-auto flex-1 py-3 bg-[#1D9D41] hover:bg-[#168234] text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer text-center"
              >
                Empty Basket & Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 90'S.EMITSPHERE SECURE SIGNUP / LOGIN PROMPT MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 overflow-y-auto animate-fade-in text-left">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border-4 border-[#FF5E2A] p-6 space-y-5 my-auto">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-[#E04B1A] text-lg">90's.emitsphere</h3>
                <p className="text-[10px] text-[#FF5E2A] font-extrabold uppercase tracking-widest leading-none mt-0.5">Account Setup Required To Order</p>
              </div>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthForm({ name: '', email: '', phone: '', password: '' });
                  setAuthError('');
                }}
                className="p-1 px-2 text-xs font-bold text-neutral-400 hover:text-neutral-900"
              >
                ✕ Close
              </button>
            </div>

            {/* Tabs for fast switching */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setAuthTab('signup'); setAuthError(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'signup' ? 'bg-[#F28316] text-white shadow-sm border-transparent' : 'text-neutral-600 hover:bg-neutral-200'}`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setAuthError(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${authTab === 'login' ? 'bg-[#08BE3B] text-white shadow-sm border-transparent' : 'text-neutral-600 hover:bg-neutral-200'}`}
              >
                Log In
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                ⚠️ {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authTab === 'signup' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#E04B1A] block">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Isaac Olawale"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#FF5E2A] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#E04B1A] block">Phone Contact</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 08034567890"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#FF5E2A] outline-none"
                    />
                  </div>

                  {/* Customer Signup Map location picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#E04B1A] block mb-2">Pin Your Default Delivery Location (Map)</label>
                    <MapLocationPicker
                      initialLocation={{
                        address: authForm.address || 'Bells University of Technology, Ota, Ogun State, Nigeria',
                        lat: authForm.lat || 6.6908,
                        lng: authForm.lng || 3.1501
                      }}
                      onLocationChange={(loc) => {
                        setAuthForm({
                          ...authForm,
                          address: loc.address,
                          lat: loc.lat,
                          lng: loc.lng
                        });
                      }}
                      height="170px"
                    />
                    <div className="text-[10px] bg-slate-50 p-2 border border-slate-100 rounded-lg text-neutral-600 font-semibold leading-normal">
                      📍 Selected: {authForm.address || 'Bells University of Technology, Ota, Ogun State, Nigeria'}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#E04B1A] block">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. you@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#FF5E2A] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#E04B1A] block">Password</label>
                <div className="relative">
                  <input
                    type={showCustomerPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#FF5E2A] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 focus:outline-none"
                    title={showCustomerPassword ? "Hide password" : "Show password"}
                  >
                    {showCustomerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authOtpRequired && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block">Verification OTP (Check Email)</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit OTP"
                    value={authForm.otp}
                    onChange={(e) => setAuthForm({ ...authForm, otp: e.target.value })}
                    className="w-full bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-rose-500 outline-none text-center tracking-[0.5em]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className={`w-full py-3 text-white font-extrabold uppercase text-xs tracking-widest rounded-xl transition-all shadow-md mt-2 border-0 cursor-pointer ${
                  authTab === 'signup' 
                    ? 'bg-[#F28316] hover:opacity-90' 
                    : 'bg-[#08BE3B] hover:opacity-90'
                }`}
              >
                {authLoading ? 'Verifying coordinates...' : authTab === 'signup' ? 'Create Account & Continue ↵' : 'Log in & Continue ↵'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating auth or OTP errors (Bottom Left) */}
      {authError && (
        <div id="floating-error-card-customer-auth" className="fixed bottom-6 left-6 z-[100] bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl p-4 shadow-2xl max-w-sm flex items-start gap-4 border-l-4 border-l-rose-600 animate-bounce">
          <div className="flex-shrink-0 text-rose-600 bg-rose-100 rounded-full p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-955">Credentials / OTP Error</h4>
            <p className="text-xs mt-1 font-semibold leading-normal text-rose-800">{authError}</p>
          </div>
          <button 
            type="button"
            onClick={() => setAuthError('')}
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
