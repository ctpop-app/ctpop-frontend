# CTPOP Frontend

## 소개
CTPOP은 사용자 매칭과 채팅을 중심으로 한 소셜 데이팅 앱입니다. 전화번호 인증을 통한 안전한 사용자 인증과 프로필 기반의 매칭 시스템을 제공합니다.

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

## 현재 개발 진척 상황
✅ 완료된 기능:
- 전화번호 인증(Twilio) 및 JWT 토큰 발급
- 프로필 생성 여부 확인
- 프로필 설정 화면 구현
- 메인 화면 진입 로직

🚧 진행 중인 기능:
- 프로필 수정 기능

## 기본 로직
1. 앱 실행 시 인증 상태 확인
   - JWT 토큰 존재 여부 확인
   - 토큰이 있으면 사용자 정보 조회
   - 토큰이 없으면 로그인 화면으로 이동

2. 프로필 상태 확인
   - 프로필이 있으면 메인 화면으로 이동
   - 프로필이 없으면 프로필 설정 화면으로 이동

3. 메인 화면 진입
   - 홈: 매칭 및 추천
   - 메시지: 채팅 목록
   - 토크: 게시판 기능
   - 설정: 프로필 수정 등

## 주의사항
- Firebase 설정이 필요합니다
- 이미지 업로드를 위한 권한 설정이 필요합니다
- 위치 정보 사용을 위한 권한 설정이 필요합니다
- Twilio API 키 설정이 필요합니다

## 프로젝트 구조

### 네비게이션 구조
```
App.js (최상위 네비게이션)
├── AuthNavigator (인증 관련 화면)
│   ├── Login (로그인 화면)
│   ├── ProfileSetup (프로필 설정 화면)
│   └── OtpVerification (OTP 인증 화면)
└── MainNavigator (메인 화면)
    └── MainStack
        ├── Home (홈 화면)
        ├── Messages (메시지 화면)
        ├── Settings (설정 화면)
        ├── ProfileTest (프로필 테스트 화면)
        ├── Board (게시판 화면)
        ├── ProfileEdit (프로필 수정 화면)
        ├── Chat (채팅 화면)
        ├── ChatList (채팅 목록 화면)
        └── Notifications (알림 화면)
```

### 상태 관리
- Zustand를 사용하여 전역 상태 관리
- AsyncStorage를 통한 상태 영속성 구현
- 주요 상태:
  - `user`: 현재 로그인한 사용자 정보
  - `userProfile`: 사용자 프로필 정보
  - `hasProfile`: 프로필 생성 여부 (false/true)

### 주요 기능
1. 인증
   - JWT 기반 로그인
   - 프로필 설정 (필수)
2. 메인 기능
   - 홈 화면
   - 메시지 기능
   - 설정 관리
   - 프로필 수정

### 기술 스택
- React Native
- React Navigation
- Zustand
- AsyncStorage
- Expo GO

### 개발 환경 설정
1. 의존성 설치
```bash
npm install
```

2. 개발 서버 실행
```bash
npm start
```

### 주의사항
- 프로필 설정은 필수이며, 프로필 생성 후에만 메인 화면 접근 가능
- 네비게이션은 App.js의 조건부 렌더링에 의해 제어됨
- 상태 변경은 반드시 Zustand store를 통해 수행
- 프로필 수정은 MainNavigator의 ProfileEdit 화면에서 수행

## 인증 및 토큰 관리

### JWT 토큰 구조
- 액세스 토큰 (Access Token)
  - 유효 기간: 30분
  - API 요청 시 인증에 사용
  - 만료 시 자동 갱신

- 리프레시 토큰 (Refresh Token)
  - 유효 기간: 30일
  - 액세스 토큰 갱신에 사용
  - AsyncStorage에 저장
  - 인증 상태 확인에 사용 (토큰 존재 및 만료 여부)

### 토큰 갱신 프로세스
1. 앱 시작 시 자동 갱신
   - `App.js`의 `initializeApp` 함수에서 처리
   - 인증된 사용자의 토큰 자동 갱신
   - 갱신 실패 시 로그인 화면으로 이동

2. API 요청 시 401 에러 발생 시 갱신
   - `apiClient.js`의 인터셉터에서 처리
   - 토큰 만료로 인한 401 에러 발생 시 자동 갱신
   - 갱신 성공 시 원래 요청 재시도

### 인증 상태 확인
1. 토큰 존재 여부 확인
   - AsyncStorage에서 리프레시 토큰 조회
   - 토큰이 없으면 인증되지 않은 것으로 처리

2. 토큰 만료 여부 확인
   - JWT 디코딩으로 리프레시 토큰의 만료 시간 확인
   - 현재 시간과 비교하여 만료 여부 판단
   - 만료되지 않았다면 인증된 것으로 간주

3. 사용자 정보 확인
   - 인증된 경우 저장된 사용자 정보 조회
   - 프로필 존재 여부에 따라 적절한 화면으로 이동

### 프로필 상태 관리
1. 프로필 존재 여부 확인
   - Firestore의 users 컬렉션에서 사용자 문서 조회
   - 문서가 존재하면 프로필이 있는 것으로 간주
   - 문서가 없으면 프로필이 없는 것으로 간주

2. 프로필 상태 변화
   - 로그아웃 시: 프로필 상태 유지 (Firestore 문서는 그대로)
   - 회원탈퇴 시: 프로필 상태 초기화 (Firestore 문서 삭제)
   - 프로필 생성 시: Firestore에 사용자 문서 생성
   - 프로필 수정 시: Firestore 문서 업데이트

### 토큰 저장소
- AsyncStorage를 사용하여 토큰 저장
  - `auth_access_token`: 액세스 토큰
  - `auth_refresh_token`: 리프레시 토큰
  - `auth_phone_number`: 사용자 전화번호
  - `@auth_user`: 사용자 정보

### 보안 고려사항
- 토큰은 AsyncStorage에 암호화되지 않은 상태로 저장
- 앱 삭제 시 토큰 자동 삭제
- 로그아웃 시 서버에서 리프레시 토큰 무효화
- 리프레시 토큰 만료 시 자동 로그아웃

## 프로젝트 구조
ctpop-frontend/
├── api/                    # API 통신 관련 모듈
│   ├── index.js           # API 엔드포인트 및 통신 로직
│   ├── auth.js            # 인증 관련 API
│   ├── profile.js         # 프로필 관련 API
│   ├── chat.js            # 채팅 관련 API
│   └── notification.js    # 알림 관련 API
├── assets/                # 이미지, 폰트 등 정적 파일
├── components/            # 재사용 가능한 컴포넌트
│   ├── auth/             # 인증 관련 컴포넌트
│   │   ├── PhoneInput.js  # 전화번호 입력 컴포넌트
│   │   ├── OtpInput.js    # OTP 입력 컴포넌트
│   │   ├── AuthButton.js  # 인증 버튼 컴포넌트
│   │   └── AuthHeader.js  # 인증 화면 헤더 컴포넌트
│   ├── chat/             # 채팅 관련 컴포넌트
│   │   ├── ChatRoom.js    # 채팅방 컴포넌트
│   │   ├── MessageBubble.js # 메시지 버블 컴포넌트
│   │   ├── ImageMessage.js  # 이미지 메시지 컴포넌트
│   │   └── MessageInput.js  # 메시지 입력 컴포넌트
│   ├── profile-setup/    # 프로필 설정 관련 컴포넌트
│   │   ├── common/       # 공통 컴포넌트
│   │   │   ├── ProfileHeader.js  # 프로필 헤더 컴포넌트
│   │   │   └── SaveButton.js     # 저장 버튼 컴포넌트
│   │   ├── form-inputs/  # 폼 입력 컴포넌트
│   │   │   ├── FormInput.js      # 기본 입력 컴포넌트
│   │   │   ├── OptionSelector.js # 옵션 선택 컴포넌트
│   │   │   └── LocationSelector.js # 위치 선택 컴포넌트
│   │   ├── photo-grid/   # 사진 그리드 컴포넌트
│   │   │   ├── PhotoGrid.js      # 사진 그리드 컴포넌트
│   │   │   └── PhotoItem.js      # 사진 아이템 컴포넌트
│   │   └── constants.js  # 상수 정의
│   └── Button.js         # 공통 버튼 컴포넌트
├── hooks/                 # 커스텀 훅
│   ├── useAuth.js        # 인증 상태 관리
│   ├── useProfileForm.js # 프로필 폼 관리
│   ├── usePhotoGrid.js   # 사진 그리드 관리
│   ├── useChat.js        # 채팅 상태 관리
│   ├── useOfflineQueue.js # 오프라인 큐 관리
│   └── useRealtime.js    # 실시간 데이터 관리
├── models/               # 데이터 모델
│   ├── User.js          # 사용자 모델
│   ├── Profile.js       # 프로필 모델
│   ├── Chat.js          # 채팅 모델
│   └── Message.js       # 메시지 모델
├── navigation/           # 네비게이션 관련
│   ├── AuthNavigator.js # 인증 관련 네비게이션
│   ├── MainNavigator.js # 메인 화면 네비게이션
│   ├── MainTabs.js     # 메인 탭 네비게이션
│   └── constants.js     # 라우트 상수
├── screens/             # 화면 컴포넌트
│   ├── JwtPhoneLoginScreen.js    # 전화번호 인증 화면
│   ├── ProfileSetupScreen.js     # 프로필 설정 화면
│   ├── ProfileEditScreen.js      # 프로필 수정 화면
│   ├── ProfileTestScreen.js      # 프로필 테스트 화면
│   ├── SettingsScreen.js         # 설정 화면
│   ├── SplashScreen.js           # 스플래시 화면
│   ├── MessageScreen.js          # 메시지 화면
│   ├── HomeScreen.js             # 홈 화면
│   └── BoardScreen.js            # 게시판 화면
├── services/           # 비즈니스 로직
│   ├── locationService.js
│   ├── profileService.js
│   └── userService.js
├── store/              # 상태 관리
│   └── userStore.js    # 사용자 상태 관리
├── utils/              # 유틸리티 함수
│   ├── authService.js  # 인증 관련 유틸리티
│   ├── constants.js    # 상수 정의
│   ├── discovery.js    # 디스커버리 관련 유틸리티
│   ├── config.js       # 설정 관련 유틸리티
│   ├── encryption.js   # 암호화 관련 유틸리티
│   ├── errorHandler.js # 에러 처리 유틸리티
│   ├── offlineQueue.js # 오프라인 큐 유틸리티
│   ├── realtimeService.js # 실시간 동기화 유틸리티
│   └── imageService.js # 이미지 처리 유틸리티
├── App.js             # 앱 진입점
├── firebase.js        # Firebase 설정
└── package.json       # 의존성 관리
```

## 앱 실행 로직

### 1. 앱 초기화
1. `App.js` (루트 디렉토리)
   - 앱의 진입점
   - 초기 설정 및 상태 관리
     - `useAuth` 훅을 통해 인증 상태 관리
     - `userStore`를 통해 사용자 정보 관리
     - `LogBox.ignoreLogs`로 특정 경고 메시지 무시 설정
   - 서버 설정 및 디스커버리
     - `initializeConfig`로 서버 설정 초기화
     - `discoverServer`로 API URL 업데이트
   - 인증 상태 확인 및 화면 분기
     - `checkAuth`로 인증 상태 확인
     - 인증 상태와 프로필 존재 여부에 따라 적절한 네비게이터 선택
       - 인증되지 않은 경우: `AuthNavigator`
       - 인증되었지만 프로필이 없는 경우: `AuthNavigator`의 `ProfileSetupScreen`
       - 인증되었고 프로필이 있는 경우: `MainNavigator`

2. `screens/SplashScreen.js`
   - 초기 로딩 화면 표시
   - 서버 설정 초기화 (`utils/config.js`의 `initializeConfig`)
   - 서버 디스커버리 (`utils/discovery.js`의 `discoverServer`)
   - API URL 업데이트
   - 로딩 중에는 `ActivityIndicator` 표시

3. `hooks/useAuth.js`
   - 인증 상태 확인 (`checkAuth`)
     - JWT 액세스 토큰 확인
       - `AUTH_KEYS.ACCESS_TOKEN` 키로 저장된 토큰 조회
       - 토큰이 없으면 `isAuthenticated`를 false로 설정
     - 토큰이 있으면 저장된 사용자 정보 조회
       - `getStoredUser` 함수로 `AUTH_KEYS.USER` 키의 데이터 조회
       - JSON.parse로 사용자 정보 객체 변환
     - 사용자 정보가 있으면 `authState` 업데이트
       - `isAuthenticated`: true
       - `phoneNumber`: 저장된 전화번호
       - `hasProfile`: false (초기값)
     - 오류 발생 시 에러 메시지 저장 및 false 반환

### 2. 네비게이션 구조
1. `navigation/AuthNavigator.js`
   - 인증 관련 화면들의 스택 네비게이션 관리
   - 화면 구성
     - `JwtPhoneLoginScreen`: 전화번호 인증 화면
     - `ProfileSetupScreen`: 프로필 설정 화면
   - 네비게이션 옵션
     - 헤더 스타일: `HEADER_OPTIONS.AUTH` 적용
     - 화면별 타이틀 설정
   - 라우트 파라미터 처리
     - 전화번호 전달
     - 프로필 설정 모드 (신규/수정)

2. `navigation/MainNavigator.js`
   - 메인 기능 화면들의 스택 네비게이션 관리
   - 화면 구성
     - `HomeScreen`: 홈 화면
     - `MessageScreen`: 메시지 화면
     - `BoardScreen`: 게시판 화면
   - 네비게이션 옵션
     - 헤더 스타일: `HEADER_OPTIONS.MAIN` 적용
     - 화면별 타이틀 설정
   - 탭 네비게이션 통합
     - `MainTabs.js`와 연동
     - 탭별 화면 스택 관리

3. `navigation/MainTabs.js`
   - 메인 탭 네비게이션 관리
   - 탭 구성
     - 홈 탭: `HomeScreen`
     - 메시지 탭: `MessageScreen`
     - 게시판 탭: `BoardScreen`
   - 탭 옵션
     - 아이콘 설정
     - 라벨 설정
     - 스타일링

4. `navigation/constants.js`
   - 네비게이션 관련 상수 정의
   - 라우트 이름
     - `ROUTES.AUTH.*`: 인증 관련 라우트
     - `ROUTES.MAIN.*`: 메인 기능 라우트
   - 헤더 옵션
     - `HEADER_OPTIONS.AUTH`: 인증 화면 헤더 스타일
     - `HEADER_OPTIONS.MAIN`: 메인 화면 헤더 스타일

### 3. 인증 프로세스
1. `screens/JwtPhoneLoginScreen.js`
   - 전화번호 입력
     - `components/auth/PhoneInput.js` 컴포넌트 사용
     - 전화번호 유효성 검사 (`utils/authService.js`의 `isValidPhoneNumber`)
       - 010으로 시작하는 11자리
       - +82로 시작하는 12자리
   - Twilio Verify 서비스를 통한 SMS OTP 전송
     - `api/auth.js`의 `sendOtp` 함수 호출
     - 전화번호를 E.164 형식으로 변환
     - Twilio API를 통해 OTP 발송
     - Redis에 OTP 상태 저장 (5분 유효)

2. `components/auth/OtpInput.js`
   - OTP 인증
     - SMS로 전송된 인증번호 확인
     - OTP 코드 유효성 검사 (`utils/authService.js`의 `isValidOtpCode`)
       - 6자리 숫자
     - Twilio Verify 서비스로 OTP 검증
     - 검증 성공 시 JWT 토큰 발급
       - 액세스 토큰 저장 (`AUTH_KEYS.ACCESS_TOKEN`)
       - 리프레시 토큰 저장 (`AUTH_KEYS.REFRESH_TOKEN`)
       - 전화번호 저장 (`AUTH_KEYS.PHONE_NUMBER`)

3. `api/auth.js`
   - 토큰 관리
     - 액세스 토큰 만료 시 자동 갱신
       - `refreshToken` 함수로 새 액세스 토큰 요청
       - 갱신 실패 시 로그아웃 처리
     - API 요청 시 토큰 자동 첨부
       - 요청 헤더에 `Authorization: Bearer {token}` 추가
     - 로그아웃 시 토큰 삭제
       - `logout` 함수 호출
       - 액세스 토큰 삭제
       - 리프레시 토큰 삭제
       - 전화번호 삭제

### 4. 프로필 설정
1. `ProfileSetupScreen`에서 프로필 정보 입력
   - UI 구성
     - 상단 고정 헤더
       - 프로필 생성 타이틀
       - 서브타이틀
       - 뒤로가기 버튼
       - 하단 구분선으로 시각적 분리
     - 스크롤 가능한 컨텐츠 영역
   - 기본 정보 (닉네임, 나이, 키, 체중)
   - 성향 및 지역 선택
   - 프로필 사진 업로드 (최대 6장)
     - `PhotoGrid` 컴포넌트를 통한 사진 관리
       - 순차적 사진 추가 (빈 슬롯은 순서대로만 채울 수 있음)
       - 마지막 추가된 사진 다음 위치에만 새로운 사진 추가 가능
       - 추가 불가능한 빈 슬롯은 시각적으로 구분 (연한 회색)
     - 이미지 URI 처리 시 객체 구조 일관성 유지
     - 사진 순서 변경 및 삭제 기능
       - 드래그 앤 드롭으로 순서 변경 (기존 사진들 사이에서만 가능)
       - 마지막 추가된 사진 이후의 빈 슬롯으로는 이동 불가
   - 키보드 처리 및 UI/UX 개선
     - `KeyboardAvoidingView`를 통한 키보드 대응
       - iOS: 'padding' behavior 적용
       - Android: 'height' behavior 적용
     - 키보드가 떠있을 때도 스크롤 가능
       - `keyboardShouldPersistTaps="handled"` 설정
       - 키보드와 겹치지 않는 여백 자동 조정
     - 저장하기 버튼 위치 최적화
       - 키보드와 겹치지 않는 하단 여백 설정
       - iOS: 100px, Android: 80px 여백 적용
2. 프로필 정보 저장
   - Firebase Storage에 이미지 업로드
   - Firestore에 프로필 데이터 저장

### 5. 메인 기능
1. `HomeScreen`
   - 사용자 매칭 및 추천
   - 프로필 카드 스와이프
2. `MessageScreen`
   - 매칭된 사용자와의 채팅
   - 실시간 메시지 동기화
3. `BoardScreen`
   - 커뮤니티 게시판
   - 게시글 작성 및 조회

### 6. 설정 및 관리
1. `SettingsScreen`
   - 프로필 수정
   - 알림 설정
   - 계정 관리
2. `ProfileTestScreen`
   - 프로필 테스트 및 디버깅

### 7. 오프라인 지원
1. 오프라인 큐 시스템 (`utils/offlineQueue.js`)
   - 작업 큐 관리
     - AsyncStorage를 사용한 작업 저장
     - 네트워크 연결 시 자동 처리
     - 최대 재시도 횟수 설정 (3회)
   - 작업 타입별 처리
     - 메시지 전송
     - 이미지 업로드
     - 프로필 업데이트
   - 작업 상태 관리
     - 진행 중인 작업 모니터링
     - 실패한 작업 재시도
     - 작업 제거 및 초기화

2. 오프라인 큐 훅 (`hooks/useOfflineQueue.js`)
   - 네트워크 상태 모니터링
     - NetInfo를 통한 연결 상태 감지
     - 연결 복구 시 자동 동기화
   - 큐 상태 관리
     - 실시간 상태 업데이트
     - 작업 추가/제거
     - 큐 초기화
   - 작업 처리
     - 작업 ID 생성
     - 작업 실행 함수 관리
     - 에러 처리

3. 에러 처리 (`utils/errorHandler.js`)
   - 에러 타입 분류
     - 네트워크 에러
     - 인증 에러
     - 유효성 검사 에러
     - 권한 에러
   - 사용자 친화적 메시지
     - 에러 타입별 메시지 매핑
     - Alert를 통한 알림
   - 재시도 로직
     - 최대 재시도 횟수 설정
     - 재시도 간격 설정
     - 재시도 조건 설정
   - 네트워크 에러 처리
     - 네트워크 상태 확인
     - 자동 재시도
     - 사용자 피드백

4. 실시간 동기화 (`utils/realtimeService.js`)
   - Firestore 실시간 구독
     - 컬렉션 구독
     - 문서 구독
     - 쿼리 구독
   - 연결 상태 관리
     - 네트워크 상태 모니터링
     - 재연결 처리
     - 오프라인 지원
   - 구독 관리
     - 구독 추가/제거
     - 구독 상태 관리
     - 에러 처리

5. 실시간 훅 (`hooks/useRealtime.js`)
   - 컬렉션 구독
     - 실시간 데이터 업데이트
     - 로딩 상태 관리
     - 에러 처리
   - 문서 구독
     - 단일 문서 실시간 업데이트
     - 상태 관리
     - 에러 처리
   - 연결 상태 관리
     - 네트워크 상태 모니터링
     - 재연결 처리
     - 오프라인 지원

## 주요 기능

### 1. 프로필 설정
- 프로필 정보 입력 (닉네임, 나이, 키, 체중, 성향, 지역, 자기소개)
- 프로필 사진 업로드 (최대 6장)
- 위치 정보 선택 (시/도, 구/군)

### 2. API 통신
- Firebase Firestore를 사용한 데이터 저장
- 프로필, 사용자, 위치 정보 관리
- 이미지 업로드 및 관리
- 채팅 및 알림 기능

### 3. 상태 관리
- 사용자 정보 관리
- 프로필 데이터 관리
- 폼 상태 관리


## 주의사항
- Firebase 설정이 필요합니다
- 이미지 업로드를 위한 권한 설정이 필요합니다
- 위치 정보 사용을 위한 권한 설정이 필요합니다

## 문제 해결
- 이미지 업로드 실패 시 Firebase Storage 권한 확인
- 위치 정보 로드 실패 시 API 응답 확인
- 네비게이션 오류 시 라우트 상수 확인 
## 추가 요구사항

### 1. 에러 처리
- 모든 API 호출에 try-catch 블록 적용
- 에러 발생 시 사용자에게 Alert로 알림
- 네트워크 오류 시 재시도 메커니즘 구현
- 토큰 만료 시 자동 로그아웃 처리

### 2. 상태 관리
- Zustand persist 미들웨어로 상태 영구 저장
- AsyncStorage 키 충돌 방지를 위한 네임스페이스 사용
- 상태 변경 시 디버그 로깅 추가
- 상태 초기화 시 모든 관련 데이터 정리

### 3. 성능 최적화
- 불필요한 리렌더링 방지를 위한 메모이제이션
- 이미지 캐싱 및 최적화
- 네트워크 요청 캐싱
- 대용량 데이터 처리 시 페이지네이션 적용

### 4. 보안
- 민감한 정보 암호화 저장
- 토큰 갱신 메커니즘 구현
- API 요청 시 CSRF 토큰 사용
- 입력값 sanitization 적용

## 데이터베이스 구조

### 1. 사용자 컬렉션 (`users`)
```json
{
  "users": {
    "{documentId}": {               // Firestore 문서 ID
      "uid": "string",              // 전화번호 (인증용)
      "uuid": "string",             // 고유 식별자
      "firstAuthAt": "timestamp",   // 최초 인증 시간
      "lastAuthAt": "timestamp",    // 마지막 인증 시간
      "isActive": "boolean"         // 계정 활성화 상태
    }
  }
}
```

### 2. 프로필 컬렉션 (`profiles`)
```json
{
  "profiles": {
    "{documentId}": {               // Firestore 문서 ID
      "uuid": "string",             // 사용자 UUID (User와 연결)
      "nickname": "string",         // 닉네임
      "age": "number",              // 나이 (18-100)
      "height": "number",           // 키 (140-220cm)
      "weight": "number",           // 체중 (30-200kg)
      "city": "string",             // 시/도
      "district": "string",         // 구/군
      "bio": "string",              // 자기소개
      "orientation": "string",      // 성향
      "mainPhotoURL": "string",     // 메인 프로필 사진 URL
      "photoURLs": ["string"],      // 추가 사진 URL 배열 (최대 5장)
      "isActive": "boolean",        // 프로필 활성화 상태
      "createdAt": "timestamp",     // 생성 시간
      "updatedAt": "timestamp",     // 수정 시간
      "lastActive": "timestamp"     // 마지막 활동 시간
    }
  }
}
```

### 3. 채팅 컬렉션 (`chats`)
```json
{
  "chats": {
    "{chatId}": {                   // Firestore 문서 ID (uuid)
      "participants": ["string"],   // 참여자 uuid 배열
      "lastMessage": {              // 마지막 메시지 정보
        "content": "string",        // 메시지 내용
        "senderId": "string",       // 발신자 uuid
        "timestamp": "timestamp",   // 전송 시간
        "type": "string"           // 메시지 타입 (text|image|system)
      },
      "unreadCount": {             // 읽지 않은 메시지 수
        "{userId}": "number"       // 사용자별 미읽음 수
      },
      "createdAt": "timestamp",     // 생성 시간
      "updatedAt": "timestamp"      // 수정 시간
    }
  }
}
```

### 4. 메시지 컬렉션 (`messages`)
```json
{
  "messages": {
    "{messageId}": {               // Firestore 문서 ID (uuid)
      "chatId": "string",          // 채팅방 ID (uuid)
      "content": "string",         // 메시지 내용 (텍스트 또는 이미지 URL)
      "senderId": "string",        // 발신자 uuid
      "timestamp": "timestamp",    // 전송 시간
      "isRead": "boolean",         // 읽음 상태
      "type": "string",            // 메시지 타입 (text|image|system)
      "metadata": {                // 메시지 메타데이터
        "imageUrl": "string",      // 이미지 URL (이미지 메시지인 경우)
        "imageSize": "number",     // 이미지 크기 (bytes)
        "imageWidth": "number",    // 이미지 너비
        "imageHeight": "number",   // 이미지 높이
        "systemType": "string"     // 시스템 메시지 타입 (join|leave|etc)
      },
      "status": "string",          // 메시지 상태 (sending|sent|delivered|read|failed)
      "error": {                   // 에러 정보 (실패한 경우)
        "code": "string",          // 에러 코드
        "message": "string"        // 에러 메시지
      }
    }
  }
}
```

### 데이터 유효성 검사
1. 프로필 데이터
   - 닉네임: 필수
   - 메인 사진: 필수
   - 지역: 필수
   - 성향: 필수
   - 나이: 18세 이상 100세 이하
   - 키: 140cm 이상 220cm 이하
   - 체중: 30kg 이상 200kg 이하
   - 추가 사진: 최대 5장

2. 사용자 데이터
   - 전화번호: 유효한 형식 (010으로 시작하는 11자리 또는 +82로 시작하는 12자리)
   - 활성화 상태: 기본값 true

3. 채팅 데이터
   - 참여자: 최소 2명
   - 마지막 메시지: 선택적

4. 메시지 데이터
   - 내용: 필수 (텍스트 또는 이미지 URL)
   - 발신자: 필수 (uuid)
   - 채팅방 ID: 필수
   - 타입: 필수 (text, image)
   - 상태: 필수 (sending, sent, delivered, read) 

## 구현 요구사항

### 1. 채팅 기능 구현
1. `api/chat.js`
   - 채팅방 생성/조회/삭제 API
   - 메시지 전송/조회/삭제 API
   - 읽음 상태 업데이트 API

2. `screens/MessageScreen.js`
   - 채팅방 목록 표시
   - 실시간 메시지 동기화
   - 읽지 않은 메시지 표시
   - 마지막 메시지 미리보기

3. `components/chat/`
   - `ChatRoom.js`: 채팅방 UI
   - `MessageBubble.js`: 메시지 버블 컴포넌트
   - `ImageMessage.js`: 이미지 메시지 컴포넌트
   - `MessageInput.js`: 메시지 입력 컴포넌트

4. `hooks/useChat.js`
   - 실시간 메시지 구독
   - 메시지 상태 관리
   - 읽음 상태 업데이트
   - 메시지 전송 로직

### 2. 이미지 처리
1. `utils/imageService.js`
   - 이미지 업로드 및 최적화
   - 이미지 URI 처리
     - 객체 구조: `{ uri: string, type: string, name: string }`
     - URI 유효성 검사
     - 이미지 타입 검증
2. `components/profile-setup/photo-grid/`
   - `PhotoGrid.js`: 사진 그리드 컴포넌트
     - 이미지 URI 올바른 처리
     - 순차적 사진 추가 관리
       - `getLastUsedIndex` 함수로 마지막 사용된 사진 위치 추적
       - `isAddable` 속성으로 추가 가능한 위치 표시
     - 드래그 앤 드롭으로 순서 변경
       - 기존 사진들 사이에서만 순서 변경 가능
       - 마지막 추가된 사진 이후로는 이동 불가
     - 최대 6장 제한
   - `PhotoItem.js`: 개별 사진 컴포넌트
     - 이미지 미리보기
     - 삭제 기능
     - 메인 사진 표시
     - 추가 가능 여부에 따른 시각적 피드백
       - 추가 가능: 진한 회색(+) 아이콘
       - 추가 불가: 연한 회색(+) 아이콘

### 3. 프로필 사진 관리
- 최대 6장까지 등록 가능 (대표사진 필수)
- 사진은 순차적으로만 추가 가능
  - 마지막 추가된 사진 다음 위치에만 새로운 사진 추가 가능
  - 추가 불가능한 빈 슬롯은 시각적으로 구분 (연한 회색)
- 드래그 앤 드롭으로 순서 변경 가능
  - 기존 사진들 사이에서만 순서 변경 가능
  - 마지막 추가된 사진 이후의 빈 슬롯으로는 이동 불가
- Firebase Storage에 저장되며 UUID 기반으로 관리
  - 프로필 사진 경로: `profiles/{uuid}/{timestamp}_{filename}`
  - 이미지 URI 객체 구조: `{ uri: string, type: string, name: string }`

