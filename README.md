# CTPOP Frontend

## 소개
CTPOP은 사용자들 간의 토크와 채팅을 중심으로 한 소셜 데이팅 앱입니다. 전화번호 인증을 통한 안전한 사용자 인증과 프로필 기반의 매칭 시스템을 제공합니다.

## 기술 스택
- React Native
- Expo
- Firebase (Firestore, Storage)
- React Navigation
- Zustand (상태 관리)
- AsyncStorage (로컬 스토리지)
- Twilio (SMS 인증)

## 개발 환경 설정
1. 의존성 설치
```bash
npm install
```

(**utils/discovery.js에 자신의 ip 주소 추가**)

2. 개발 서버 실행
```bash
npx expo start
```

## 주요 기능
- 전화번호 기반 JWT 인증
- 프로필 설정 및 관리
- 사용자 매칭 및 추천
- 실시간 채팅
- 커뮤니티 게시판(토크)
- 실시간 온라인 상태 및 마지막 접속 시간 표시

## 현재 개발 진척 상황
✅ 완료된 기능:
- 전화번호 인증(Twilio) 및 JWT 토큰 발급
- 프로필 생성 여부 확인
- 프로필 설정 화면 구현
- 메인 화면 진입 로직
- 실시간 온라인 상태 및 마지막 접속 시간 표시

🚧 진행 중인 기능:
- 최적화

## 앱 실행 로직

### 1. 앱 초기화 (App.js)
1. 초기 설정
   - Firebase 초기화
   - 서버 설정 초기화 (`utils/config.js`)
   - 서버 디스커버리 (`utils/discovery.js`)

2. 인증 상태 확인
   - AsyncStorage에서 JWT 토큰 확인
   - 토큰이 있으면 사용자 정보 조회
   - 토큰이 없으면 로그인 화면으로 이동

3. 프로필 상태 확인
   - Firestore에서 프로필 문서 조회
   - 프로필이 있으면 메인 화면으로 이동
   - 프로필이 없으면 프로필 설정 화면으로 이동

### 2. 데이터 흐름
1. API 레이어 (`api/`)
   - HTTP 요청 처리
   - 토큰 관리
   - 에러 처리

2. 서비스 레이어 (`services/`)
   - 비즈니스 로직 처리
   - 데이터 변환
   - 유효성 검사

3. 훅 레이어 (`hooks/`)
   - 상태 관리
   - 데이터 구독
   - 이벤트 핸들링

4. 화면 레이어 (`screens/`)
   - UI 렌더링
   - 사용자 입력 처리
   - 네비게이션

## 프로젝트 구조

### 1. API 레이어
```
api/
├── index.js           # API 엔드포인트 및 통신 로직
├── auth.js            # 인증 관련 API
├── profile.js         # 프로필 관련 API
├── chat.js            # 채팅 관련 API
└── notification.js    # 알림 관련 API
```

### 2. 서비스 레이어
```
services/
├── authService.js     # 인증 관련 서비스
├── profileService.js  # 프로필 관련 서비스
├── chatService.js     # 채팅 관련 서비스
└── notificationService.js # 알림 관련 서비스
```

### 3. 훅 레이어
```
hooks/
├── useAuth.js         # 인증 상태 관리
├── useProfileForm.js  # 프로필 폼 관리
├── usePhotoGrid.js    # 사진 그리드 관리
├── useChat.js         # 채팅 상태 관리
├── useOfflineQueue.js # 오프라인 큐 관리
└── useRealtime.js     # 실시간 데이터 관리
```

### 4. 화면 레이어
```
screens/
├── JwtPhoneLoginScreen.js    # 전화번호 인증 화면
├── ProfileSetupScreen.js     # 프로필 설정 화면
├── ProfileEditScreen.js      # 프로필 수정 화면
├── HomeScreen.js            # 홈 화면
├── MessageScreen.js         # 메시지 화면
├── SettingsScreen.js        # 설정 화면
└── BoardScreen.js           # 게시판 화면
```

## 주요 기능 구현

### 1. 인증 프로세스
1. API (`api/auth.js`)
   - `sendOtp`: OTP 전송
   - `verifyOtp`: OTP 검증
   - `refreshToken`: 토큰 갱신

2. 서비스 (`services/authService.js`)
   - `handleLogin`: 로그인 처리
   - `handleLogout`: 로그아웃 처리
   - `validateToken`: 토큰 검증

3. 훅 (`hooks/useAuth.js`)
   - `login`: 로그인 상태 관리
   - `logout`: 로그아웃 상태 관리
   - `checkAuth`: 인증 상태 확인

4. 화면 (`screens/JwtPhoneLoginScreen.js`)
   - 전화번호 입력
   - OTP 인증
     - 에러 처리

### 2. 프로필 관리
1. API (`api/profile.js`)
   - `createProfile`: 프로필 생성
   - `updateProfile`: 프로필 수정
   - `getProfile`: 프로필 조회

2. 서비스 (`services/profileService.js`)
   - `validateProfile`: 프로필 검증
   - `handlePhotoUpload`: 사진 업로드
   - `updateProfileData`: 프로필 데이터 업데이트

3. 훅 (`hooks/useProfileForm.js`)
   - `handleSubmit`: 폼 제출
   - `handleChange`: 입력값 변경
   - `validateForm`: 폼 검증

4. 화면 (`screens/ProfileSetupScreen.js`, `screens/ProfileEditScreen.js`)
   - 프로필 정보 입력
   - 사진 업로드
   - 유효성 검사

### 3. 채팅 기능
1. API (`api/chat.js`)
   - `sendMessage`: 메시지 전송
   - `getMessages`: 메시지 조회
   - `updateReadStatus`: 읽음 상태 업데이트

2. 서비스 (`services/chatService.js`)
   - `handleMessage`: 메시지 처리
   - `syncMessages`: 메시지 동기화
   - `handleOffline`: 오프라인 처리

3. 훅 (`hooks/useChat.js`)
   - `sendMessage`: 메시지 전송
   - `subscribeToMessages`: 메시지 구독
   - `handleRead`: 읽음 처리

4. 화면 (`screens/MessageScreen.js`)
   - 채팅방 목록
   - 메시지 표시
   - 실시간 업데이트

## 데이터 모델

### 1. 프로필 모델
```json
{
  "profiles": {
    "{documentId}": {
      "uuid": "string",
      "nickname": "string",
      "age": "number",
      "height": "number",
      "weight": "number",
      "city": "string",
      "district": "string",
      "bio": "string",
      "orientation": "string",
      "mainPhotoURL": "string",
      "photoURLs": ["string"],
      "isActive": "boolean",
      "lastActive": "timestamp",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
}
```

### 2. 채팅 모델
```json
{
  "chats": {
    "{chatId}": {
      "participants": ["string"],
      "lastMessage": {
        "content": "string",
        "senderId": "string",
        "timestamp": "timestamp",
        "type": "text|image|system"
      },
      "unreadCount": {
        "{userId}": "number"
      },
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
}
```

### 3. 메시지 모델
```json
{
  "messages": {
    "{messageId}": {
      "chatId": "string",
      "content": "string",
      "senderId": "string",
      "timestamp": "timestamp",
      "isRead": "boolean",
      "type": "text|image|system",
      "metadata": {
        "imageUrl": "string",
        "imageSize": "number",
        "imageWidth": "number",
        "imageHeight": "number",
        "systemType": "string"
      },
      "status": "sending|sent|delivered|read|failed",
      "error": {
        "code": "string",
        "message": "string"
      }
    }
  }
}
```

### 4. 온라인 상태 관리
1. API (`api/socket.js`)
   - 웹소켓 연결 관리
   - 실시간 상태 동기화
   - 연결 해제 처리

2. 서비스 (`services/socketService.js`)
   - 하트비트 구현 (30초 간격)
   - 사용자 상태 변경 리스너 관리
   - 연결 해제 시 lastActive 업데이트

3. 훅 (`hooks/useSocket.js`)
   - 온라인 사용자 상태 관리
   - 컴포넌트 마운트 시 소켓 연결
   - 사용자별 상태 구독/구독해제

4. 화면 (`screens/HomeScreen.js`)
   - 온라인 상태에 따른 UI 표시
     - 온라인: 초록색 점 + "접속중" 표시
     - 오프라인: 마지막 접속 시간 표시 (예: "5분 전 접속")

### 구현 특징
1. **효율적인 상태 관리**
   - 실시간 상태는 웹소켓으로 관리 (메모리 사용)
   - DB 쓰기는 연결 해제 시에만 발생 (비용 최적화)
   - 하트비트로 연결 상태 유지

2. **데이터 흐름**
   - 앱 시작 → 웹소켓 연결 → 실시간 상태 구독
   - 연결 해제 → lastActive DB 업데이트
   - 상태 변경 → 실시간 UI 업데이트

3. **비용 최적화**
   - 실시간 상태는 메모리에서 관리
   - DB 쓰기는 연결 해제 시에만 발생
   - 불필요한 쿼리 조건 제거 (isActive 체크 제거)

## 주의사항
- Firebase 설정이 필요합니다
- 이미지 업로드를 위한 권한 설정이 필요합니다
- 위치 정보 사용을 위한 권한 설정이 필요합니다
- Twilio API 키 설정이 필요합니다

