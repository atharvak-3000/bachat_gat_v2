import { redirect } from "next/navigation"

export function checkSubscriptionAccess(org?: {
  subscription_status?: string | null
  subscriptionStatus?: string | null
  subscription_expires_at?: string | Date | null
  subscriptionExpiresAt?: string | Date | null
  trial_ends_at?: string | Date | null
  trialEndsAt?: string | Date | null
}) {
  if (!org) {
    redirect("/onboarding")
  }

  const status = org.subscription_status || org.subscriptionStatus
  const trialEnds = org.trial_ends_at || org.trialEndsAt
  const expiresAt = org.subscription_expires_at || org.subscriptionExpiresAt
  const now = new Date()

  // 1. If trial is active
  if (
    status === "TRIAL" &&
    trialEnds &&
    new Date(trialEnds) > now
  ) {
    return true
  }

  // 2. If subscription is active
  if (
    status === "ACTIVE" &&
    expiresAt &&
    new Date(expiresAt) > now
  ) {
    return true
  }

  // Otherwise, block and redirect to subscription payment screen
  redirect("/subscribe")
}

export function checkOnboardingGuard(org?: {
  subscription_status?: string | null
  subscriptionStatus?: string | null
  subscription_expires_at?: string | Date | null
  subscriptionExpiresAt?: string | Date | null
  trial_ends_at?: string | Date | null
  trialEndsAt?: string | Date | null
}) {
  if (!org) return // allow to stay to create organisation

  const status = org.subscription_status || org.subscriptionStatus
  const trialEnds = org.trial_ends_at || org.trialEndsAt
  const expiresAt = org.subscription_expires_at || org.subscriptionExpiresAt
  const now = new Date()

  const hasActiveTrial =
    status === "TRIAL" &&
    trialEnds &&
    new Date(trialEnds) > now

  const hasActiveSub =
    status === "ACTIVE" &&
    expiresAt &&
    new Date(expiresAt) > now

  if (hasActiveTrial || hasActiveSub) {
    redirect("/dashboard")
  }
}
