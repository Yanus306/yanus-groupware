# 채팅 실시간(SSE) / 푸시(FCM) 프론트 설정

## SSE (온라인 실시간 수신)
- 별도 설정 불필요. 로그인 상태에서 `ChatProvider`가 `GET {VITE_API_BASE_URL}/channels/subscribe?token=<accessToken>`을 EventSource로 구독한다.
- EventSource는 Authorization 헤더를 못 실어 토큰을 쿼리로 전달하며, 백엔드가 해당 경로에 한해 쿼리 토큰을 허용한다.
- 수신한 `message` 이벤트(백엔드 MessageResponse)를 파싱해 메시지 목록에 즉시 반영(중복 id 무시).

## FCM (오프라인 푸시) — 골격
키가 설정되면 자동 활성화된다. 미설정 시 `initFcmMessaging()`은 아무 동작도 하지 않는다.

### 1. 의존성 설치
```bash
npm i firebase
```

### 2. 환경변수 (`.env`)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...        # 웹 푸시 인증서(Cloud Messaging > 웹 구성)
```

### 3. service worker
- `public/firebase-messaging-sw.js`의 `firebase.initializeApp({...})` 값을 실제 설정으로 채운다.
  (service worker는 `import.meta.env`를 읽을 수 없어 값을 직접 넣어야 함)

### 동작
- 로그인 시 권한 요청 → 토큰 발급 → `POST /api/v1/fcm/tokens`로 등록
- 백그라운드 수신은 service worker의 `onBackgroundMessage`에서 알림 표시 + 클릭 시 `/chat?channel=...` 이동
- 포그라운드 수신은 `onMessage` 콜백에서 처리(현재 debug 로그, 토스트 등으로 확장 가능)

백엔드 연동/발송은 `new-yanus-be/docs/chat-fcm-setup.md` 참고.
