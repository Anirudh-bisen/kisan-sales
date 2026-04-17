export type LeadStage = 
  | 'Outreach Initiated'
  | 'Product & Pricing Shared'
  | 'Interested / Inquiry'
  | 'Negotiation'
  | 'Order Confirmed'
  | 'Delivery Scheduled'
  | 'Order Fulfilled'
  | 'Follow-up / Repeat Opportunity';

export type OrderStatus = 
  | 'Pending'
  | 'Confirmed'
  | 'In Transit'
  | 'Delivered'
  | 'Cancelled';

export type InteractionType = 'WhatsApp' | 'Call' | 'Note' | 'Email';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  stage: LeadStage;
  leadSource?: string;
  lastInteractionAt: string; // ISO Date String
  nextFollowUpAt: string; // ISO Date String
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
  totalValue: number;
  uid: string; // Owner ID
}

export interface Order {
  id: string;
  leadId: string;
  product: string;
  quantity: number;
  unit: string;
  value: number;
  deliveryLocation: string;
  expectedDeliveryDate: string; // ISO Date String
  status: OrderStatus;
  createdAt: string; // ISO Date String
  uid: string; // Owner ID
}

export interface Interaction {
  id: string;
  leadId: string;
  type: InteractionType;
  content: string;
  timestamp: string; // ISO Date String
  uid: string; // Owner ID
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  createdAt: string;
}
