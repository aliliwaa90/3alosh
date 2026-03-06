
export interface UserState {
  id: string;
  name?: string; 
  photo_url?: string;
  username?: string;
  balance: number;
  energy: number;
  maxEnergy: number;
  referrals: number;
  joinDate: string;
  walletAddress: string;
  role: 'user' | 'admin'; 
  isBanned: boolean; 
  referredBy?: string; 
  ownedProducts: string[]; 
  completedTaskIds: string[]; 
  lastLoginDate?: string; 
  lastDailyBonusClaim?: number; 
  lastWheelSpin?: number;
  lastMiningActivation?: number;
  theme?: 'dark' | 'light';
  language?: 'ar' | 'en'; // Added Language Support
  notificationsEnabled?: boolean;
}

export interface P2POffer {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number; 
  priceUsd: number; 
  status: 'available' | 'pending' | 'completed' | 'disputed' | 'cancelled';
  paymentMethod: string; 
  createdAt: number;
  buyerId?: string;
  buyerName?: string;
  paymentProof?: string; 
  disputeReason?: string;
}

export interface P2PMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface DigitalProduct {
  id: string;
  name: string;
  description: string;
  pricePoints: number;      
  priceStars: number; 
  imageData?: string; 
  isFree: boolean;
  category: string; 
  earningRate: number; 
  allowPoints: boolean; 
  allowStars: boolean;  
}

export interface Task {
  id: string;
  title: string;
  reward: number;
  type: 'social' | 'ad' | 'daily';
  link?: string;
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PURCHASE = 'PURCHASE',
  P2P_SELL = 'P2P_SELL',
  P2P_BUY = 'P2P_BUY'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export interface Transaction {
  id: string;
  userId: string; 
  userName?: string; 
  type: TransactionType;
  amount: number; 
  usdAmount?: number; 
  status: TransactionStatus;
  date: string;
  timestamp: number; 
  method: string; 
  txId?: string; 
  destination?: string; 
}

export interface PaymentMethod {
  id: string;
  name: string;
  accountNumber: string;
  recipientName: string;
  note?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  isActive: boolean;
  type: 'info' | 'alert' | 'success';
}

declare global {
  interface Window {
    Telegram?: any;
  }
}
