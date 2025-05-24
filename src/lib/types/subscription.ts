// =====================================================
// Subscription System TypeScript Interfaces
// =====================================================

export interface SubscriptionPlan {
  id: string;
  name: 'Free' | 'Student' | 'Professional';
  price_monthly: number;
  price_yearly: number;
  max_upload_duration_minutes: number;
  monthly_credits: number; // -1 means unlimited
  can_save_notes: boolean;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  plan?: SubscriptionPlan;
}

export interface UserUsage {
  id: string;
  user_id: string;
  month: number;
  year: number;
  credits_used: number;
  total_upload_minutes: number;
  transcriptions_count: number;
  notes_generated_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  subscription_id?: string;
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled';
  payment_method?: string;
  description?: string;
  paid_at?: string;
  created_at: string;
}

export interface UserPlanLimits {
  plan_name: 'Free' | 'Student' | 'Professional';
  max_upload_duration_minutes: number;
  monthly_credits: number; // -1 means unlimited
  can_save_notes: boolean;
  credits_used_this_month: number;
  credits_remaining: number; // -1 means unlimited
}

// =====================================================
// Stripe-related Types
// =====================================================

export interface StripeSubscriptionData {
  price_id: string;
  billing_cycle: 'monthly' | 'yearly';
  success_url: string;
  cancel_url: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
    previous_attributes?: any;
  };
  created: number;
}

// =====================================================
// API Request/Response Types
// =====================================================

export interface CreateSubscriptionRequest {
  price_id: string;
  billing_cycle: 'monthly' | 'yearly';
}

export interface CreateSubscriptionResponse {
  url: string; // Stripe Checkout URL
}

export interface SubscriptionStatusResponse {
  subscription: UserSubscription | null;
  plan: SubscriptionPlan;
  usage: UserUsage;
  limits: UserPlanLimits;
}

export interface UpdateSubscriptionRequest {
  action: 'cancel' | 'resume' | 'change_plan';
  new_price_id?: string;
  billing_cycle?: 'monthly' | 'yearly';
}

// =====================================================
// UI Component Props Types
// =====================================================

export interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  isPopular?: boolean;
  onSelectPlan: (plan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly') => void;
}

export interface UsageDisplayProps {
  usage: UserUsage;
  limits: UserPlanLimits;
}

export interface BillingHistoryProps {
  payments: PaymentHistory[];
}

// =====================================================
// Upload Validation Types
// =====================================================

export interface UploadValidation {
  canUpload: boolean;
  reason?: 'no_credits' | 'duration_exceeded' | 'subscription_expired';
  maxDurationMinutes: number;
  creditsRemaining: number;
}

export interface UploadQuota {
  used: number;
  limit: number; // -1 means unlimited
  percentage: number; // 0-100, or -1 for unlimited
}

// =====================================================
// Feature Access Types
// =====================================================

export interface FeatureAccess {
  canSaveNotes: boolean;
  canUploadLongVideos: boolean;
  hasUnlimitedCredits: boolean;
  maxUploadDurationMinutes: number;
  monthlyCredits: number;
}

// =====================================================
// Error Types
// =====================================================

export interface SubscriptionError {
  code: 'PAYMENT_FAILED' | 'SUBSCRIPTION_EXPIRED' | 'INSUFFICIENT_CREDITS' | 'DURATION_EXCEEDED' | 'PLAN_NOT_FOUND';
  message: string;
  details?: any;
}

// =====================================================
// Utility Types
// =====================================================

export type PlanName = 'Free' | 'Student' | 'Professional';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid';
export type PaymentStatus = 'succeeded' | 'pending' | 'failed' | 'canceled'; 