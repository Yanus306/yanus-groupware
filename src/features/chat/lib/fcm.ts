import { registerDeviceToken } from '../../../shared/api/chatApi'

// Firebase 웹 설정 (env 미설정 시 FCM 비활성 — 골격 상태)
const env = import.meta.env as Record<string, string | undefined>
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}
const vapidKey = env.VITE_FIREBASE_VAPID_KEY

export function isFcmConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && vapidKey)
}

/**
 * FCM 푸시를 초기화하고 디바이스 토큰을 서버에 등록한다.
 * - env 키가 없으면(골격) 아무것도 하지 않음
 * - firebase는 선택적 의존성이라 키가 있을 때만 동적 로드 (설치: npm i firebase)
 * 자세한 설정은 docs/chat-fcm-frontend.md 참고.
 */
export async function initFcmMessaging(): Promise<void> {
  if (!isFcmConfigured()) return
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    const appPkg = 'firebase/app'
    const messagingPkg = 'firebase/messaging'
    const { initializeApp } = await import(/* @vite-ignore */ appPkg)
    const { getMessaging, getToken, onMessage } = await import(/* @vite-ignore */ messagingPkg)

    const app = initializeApp(firebaseConfig)
    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
    if (token) {
      await registerDeviceToken(token)
    }
    onMessage(messaging, (payload: unknown) => {
      // 포그라운드 수신 — 필요 시 토스트/배지 처리로 확장
      console.debug('[FCM] foreground message', payload)
    })
  } catch (error) {
    console.warn('[FCM] 초기화를 건너뜁니다 (firebase 미설치 또는 설정 오류):', error)
  }
}
