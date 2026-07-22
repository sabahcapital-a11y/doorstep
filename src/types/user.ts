/** Types for users, portfolios, and subscriptions. */

export type SubscriptionTier = "investor_pro" | "broker_team" | "institutional";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing" | "expired";

export interface User {
  id: number;
  email: string;
  name: string;
  tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  /** Stripe customer ID */
  stripe_customer_id: string | null;
  /** Stripe subscription ID */
  stripe_subscription_id: string | null;
  /** Subscription end date */
  subscription_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioUnit {
  id: number;
  portfolio_id: number;
  unit_id: number;
  /** Actual purchase price (may differ from list) */
  purchase_price: number;
  purchase_date: string;
  notes: string | null;
  created_at: string;
}
