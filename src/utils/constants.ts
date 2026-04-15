import type { SubscriptionTier } from '../types'

export const MAX_TOPICS: Record<SubscriptionTier, number> = {
  anonymous: 3,
  free: 5,
  premium: 10,
}

// Maximum number of daily topics (premium gets all)
export const MAX_DAILY_TOPICS: Record<SubscriptionTier, number> = {
  anonymous: 0,
  free: 1,
  premium: 999,
}

// ms intervals
export const UPDATE_INTERVAL_DAILY = 24 * 60 * 60 * 1000
export const UPDATE_INTERVAL_WEEKLY = 7 * 24 * 60 * 60 * 1000

// Firestore collections
export const COLLECTION_USERS = 'users'
export const COLLECTION_TOPICS = 'topics'

// Interest detection thresholds
export const LOW_INTEREST_WEEKLY_VIEWS = 1    // < this → low interest
export const LOW_INTEREST_MIN_AGE_DAYS = 14   // topic must be at least this old

// Analytics windows
export const ANALYTICS_WEEKLY_DAYS = 7
export const ANALYTICS_MONTHLY_DAYS = 30
