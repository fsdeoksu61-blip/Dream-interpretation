# 🚀 꿈해몽 웹사이트 설치 및 실행 가이드

이 가이드는 꿈해몽 웹사이트를 처음부터 설치하고 실행하는 방법을 단계별로 안내합니다.

## 📋 시작하기 전에

### 필수 요구사항
- **Node.js** (버전 14 이상) - [다운로드](https://nodejs.org/)
- **npm** (Node.js와 함께 설치됨)
- **OpenAI API 키** - [발급받기](https://platform.openai.com/api-keys)

### 확인방법
```bash
node --version  # v14.0.0 이상이어야 함
npm --version   # 6.0.0 이상 권장
```

## 🛠️ 단계별 설치 가이드

### 1단계: 프로젝트 다운로드
프로젝트를 원하는 위치에 복사하거나 다운로드합니다.

### 2단계: 의존성 패키지 설치

#### 2-1. 백엔드 패키지 설치
```bash
# 프로젝트 루트 디렉토리로 이동
cd dream-interpretation

# 백엔드 의존성 설치
npm install
```

#### 2-2. 프론트엔드 패키지 설치
```bash
# 클라이언트 디렉토리로 이동
cd client

# 프론트엔드 의존성 설치
npm install

# 다시 루트 디렉토리로 돌아가기
cd ..
```

### 3단계: 환경 변수 설정

#### 3-1. .env 파일 수정
프로젝트 루트에 있는 `.env` 파일을 열고 다음 값들을 설정:

```env
# OpenAI API 키 (필수) - 실제 키로 교체하세요
OPENAI_API_KEY=your_actual_openai_api_key_here

# JWT 시크릿 키 (보안을 위해 복잡한 문자열 사용)
JWT_SECRET=your_very_long_and_random_secret_key_here_123456789

# 서버 포트 (기본값 사용 권장)
PORT=5000

# 개발/운영 환경 설정
NODE_ENV=development

# 클라이언트 URL (기본값 사용 권장)
CLIENT_URL=http://localhost:3000

# 관리자 계정 설정 (원하는 값으로 변경)
ADMIN_EMAIL=admin@dreaminterpretation.com
ADMIN_PASSWORD=your_admin_password_here
```

#### 3-2. OpenAI API 키 발급받기
1. [OpenAI 플랫폼](https://platform.openai.com/)에 가입
2. API Keys 메뉴에서 새로운 API 키 생성
3. 생성된 키를 `.env` 파일의 `OPENAI_API_KEY`에 설정

### 4단계: 애플리케이션 실행

#### 방법 1: 동시 실행 (권장)
```bash
# 프로젝트 루트 디렉토리에서 실행
npm run dev
```

이 명령어는 백엔드와 프론트엔드를 동시에 실행합니다.

#### 방법 2: 개별 실행
```bash
# 터미널 1: 백엔드 실행
npm run server

# 터미널 2: 프론트엔드 실행 (새 터미널 창에서)
npm run client
```

### 5단계: 웹사이트 접속

실행이 완료되면 다음 URL로 접속할 수 있습니다:

- **웹사이트**: http://localhost:3000
- **API 서버**: http://localhost:5000

## ✅ 정상 동작 확인

### 1. 웹사이트 접속 확인
- 브라우저에서 http://localhost:3000 접속
- 메인 페이지가 정상적으로 로드되는지 확인

### 2. 기본 기능 테스트
1. **꿈 해석 테스트**:
   - "꿈 해석하기" 버튼 클릭
   - 간단한 꿈 내용 입력 (예: "하늘을 날고 있었다")
   - 해석 결과가 정상적으로 나오는지 확인

2. **회원가입/로그인 테스트**:
   - 회원가입 페이지에서 새 계정 생성
   - 로그인이 정상적으로 되는지 확인

3. **관리자 기능 테스트**:
   - `.env`에 설정한 관리자 계정으로 로그인
   - 상단 네비게이션에 "관리자" 메뉴가 나타나는지 확인

## 🚨 문제 해결

### 자주 발생하는 문제들

#### 1. "Cannot find module" 오류
```bash
# 의존성 재설치
npm install
cd client && npm install && cd ..
```

#### 2. OpenAI API 오류
- API 키가 올바르게 설정되었는지 확인
- OpenAI 계정에 크레딧이 있는지 확인
- API 키가 유효한지 확인

#### 3. 포트 충돌 오류
- 3000번 또는 5000번 포트가 이미 사용 중인 경우
- 다른 프로그램을 종료하거나 `.env`에서 포트 번호 변경

#### 4. 데이터베이스 관련 오류
```bash
# 데이터베이스 파일 삭제 후 재시작
rm server/database.db
npm run server
```

### 로그 확인하기
문제 발생 시 터미널의 오류 메시지를 확인하세요:

```bash
# 백엔드 로그 확인
npm run server

# 프론트엔드 로그 확인  
npm run client
```

## 📱 사용법 가이드

### 비회원 사용자
1. 메인페이지에서 "꿈 해석 시작하기" 클릭
2. 꿈 내용을 자세히 입력
3. "꿈 해석하기" 버튼 클릭
4. 해석 결과 확인
5. "내 꿈 기록" 메뉴에서 이전 기록 확인 가능

### 회원 사용자
1. 회원가입 또는 로그인
2. 모든 꿈 기록이 계정에 영구 저장
3. 꿈 해석 결과를 다른 사용자와 공유 가능
4. 공유 게시판에서 다른 사람의 꿈 구경

### 관리자
1. 관리자 계정으로 로그인
2. 상단 메뉴에서 "관리자" 클릭
3. 사용자 관리 및 게시물 관리 가능

## 🔧 고급 설정

### 데이터베이스 백업
```bash
# SQLite 데이터베이스 파일 복사
cp server/database.db server/database_backup.db
```

### 프로덕션 환경 설정
```env
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
```

### HTTPS 설정 (프로덕션 환경)
실제 운영 환경에서는 SSL 인증서를 설정하여 HTTPS를 사용하세요.

## 📞 추가 도움이 필요한 경우

- 설치 과정에서 문제가 발생하면 터미널의 전체 오류 메시지를 확인
- Node.js와 npm이 최신 버전인지 확인
- 방화벽이 3000번과 5000번 포트를 차단하고 있지 않은지 확인

---

이제 꿈해몽 웹사이트를 성공적으로 실행할 수 있습니다! 🎉