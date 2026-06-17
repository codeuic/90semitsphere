/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin' | 'financial' | 'support';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  walletBalance: number;
  avatar?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
}

export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type RiderOnlineStatus = 'ONLINE' | 'OFFLINE' | 'BUSY';

export interface Vendor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  logoUrl: string;
  bannerUrl: string;
  cacRegistration: string;
  taxId?: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    recipientCode?: string;
  };
  operatingHours: string;
  approvedStatus: ApprovalStatus;
  rating: number;
  createdAt: string;
}

export interface Rider {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  governmentId: string;
  driversLicense: string;
  photoUrl: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    recipientCode?: string;
  };
  approvedStatus: ApprovalStatus;
  onlineStatus: RiderOnlineStatus;
  lat: number;
  lng: number;
  rating: number;
  createdAt: string;
}

export interface ProductAddOn {
  name: string;
  price: number;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  variants: string[];
  addOns: ProductAddOn[];
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedVariant?: string;
  selectedAddOns?: ProductAddOn[];
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'VENDOR_ACCEPTED'
  | 'VENDOR_PREPARING'
  | 'RIDER_ASSIGNED'
  | 'RIDER_AT_VENDOR'
  | 'PICKED_UP'
  | 'RIDER_ON_THE_WAY'
  | 'RIDER_ARRIVED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerLat: number;
  customerLng: number;
  vendorId: string;
  vendorName: string;
  vendorLat: number;
  vendorLng: number;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax?: number;
  discount: number;
  gatewayFee?: number;
  total: number;
  status: OrderStatus;
  otp: string;
  otpVerified: boolean;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
  ratingFromCustomer?: {
    foodRating: number;
    riderRating?: number;
    comment?: string;
  };
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'rider' | 'vendor' | 'admin';
  text: string;
  imageUrl?: string;
  timestamp: string;
  isRead: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  maxUsage: number;
  usageCount: number;
  expiresAt: string;
  isActive: boolean;
}

export interface WalletTransaction {
  id: string;
  walletOwnerId: string; // user id, vendor id or rider id
  walletOwnerRole: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: string;
  reference: string;
}

export interface SupportTicket {
  id: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  issue: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  replies: {
    id: string;
    senderName: string;
    senderRole: string;
    text: string;
    timestamp: string;
  }[];
}

export interface Notification {
  id: string;
  recipientId: string; // userId or all
  title: string;
  body: string;
  type: string;
  timestamp: string;
  isRead: boolean;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}
