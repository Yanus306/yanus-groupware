/* eslint-disable */
// Firebase Cloud Messaging service worker (골격)
// 백그라운드 푸시 수신용. 아래 config를 실제 Firebase 웹 설정값으로 채워야 동작합니다.
// (service worker는 import.meta.env를 읽을 수 없어 값을 직접 넣거나 빌드시 주입해야 함)

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || '새 메시지'
  const body = (payload.notification && payload.notification.body) || ''
  self.registration.showNotification(title, {
    body,
    data: payload.data,
    icon: '/pwa-192x192.png',
  })
})

// 알림 클릭 시 해당 채널로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const channelId = event.notification.data && event.notification.data.channelId
  const target = channelId ? `/chat?channel=${channelId}` : '/chat'
  event.waitUntil(self.clients.openWindow(target))
})
