const PENDING_EMAIL_KEY = 'yanus-pending-verification-email'

export function setPendingVerificationEmail(email: string) {
  sessionStorage.setItem(PENDING_EMAIL_KEY, email)
}

export function getPendingVerificationEmail() {
  return sessionStorage.getItem(PENDING_EMAIL_KEY) ?? ''
}

export function clearPendingVerificationEmail() {
  sessionStorage.removeItem(PENDING_EMAIL_KEY)
}
