# 🌙 꿈해몽 - Dream Interpretation Website

AI 기반 꿈 해석 서비스로, OpenAI API를 활용하여 사용자의 꿈을 심리학적 관점에서 해석해주는 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🤖 AI 꿈 해석
- OpenAI GPT를 활용한 전문적인 꿈 해석
- 심리학적, 상징적 관점에서의 분석
- 긍정적이고 건설적인 해석 제공

### 👥 사용자 시스템
- **비회원 이용**: 회원가입 없이도 서비스 이용 가능
- **회원 시스템**: 가입 시 모든 기록 영구 보관
- **이력 연동**: 비회원 이용 기록이 회원가입 시 자동 연동

### 📝 꿈 기록 관리
- 개인 꿈 해석 이력 저장
- 해석 결과 상세 보기
- 꿈과 해석 내용 검색

### 🌐 커뮤니티 기능
- 꿈 해석 공유 게시판
- 다른 사용자와의 소통
- 댓글 및 좋아요 기능

### 🛡️ 관리자 기능
- 사용자 관리
- 게시물 관리
- 통계 및 모니터링

## 🛠️ 기술 스택

### Backend
- **Node.js** & **Express.js** - 서버 프레임워크
- **SQLite** - 데이터베이스
- **OpenAI API** - AI 꿈 해석
- **JWT** - 사용자 인증
- **bcryptjs** - 비밀번호 암호화

### Frontend
- **React** - UI 라이브러리
- **React Router** - 클라이언트 라우팅
- **Axios** - HTTP 클라이언트
- **CSS3** - 스타일링

## 📦 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone [repository-url]
cd dream-interpretation
```

### 2. 의존성 설치
```bash
# 루트 디렉토리에서 백엔드 의존성 설치
npm install

# 클라이언트 의존성 설치
cd client
npm install
cd ..
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음과 같이 설정:

```env
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
ADMIN_EMAIL=admin@dreaminterpretation.com
ADMIN_PASSWORD=admin123456
```

**중요**: 실제 OpenAI API 키를 발급받아 `OPENAI_API_KEY`에 설정해주세요.

### 4. 애플리케이션 실행

#### 개발 모드 (권장)
```bash
# 백엔드와 프론트엔드를 동시에 실행
npm run dev
```

#### 개별 실행
```bash
# 백엔드만 실행
npm run server

# 새 터미널에서 프론트엔드 실행
npm run client
```

### 5. 접속
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000

## 🗂️ 프로젝트 구조

```
dream-interpretation/
├── server/                 # 백엔드
│   ├── index.js           # 메인 서버 파일
│   ├── models/            # 데이터베이스 모델
│   │   └── database.js
│   ├── routes/            # API 라우트
│   │   ├── auth.js
│   │   ├── dreams.js
│   │   ├── posts.js
│   │   └── admin.js
│   ├── middleware/        # 미들웨어
│   │   └── auth.js
│   └── utils/             # 유틸리티
│       └── openai.js
├── client/                # 프론트엔드
│   ├── src/
│   │   ├── components/    # 재사용 컴포넌트
│   │   │   └── Navigation.js
│   │   ├── contexts/      # React Context
│   │   │   ├── AuthContext.js
│   │   │   └── SessionContext.js
│   │   ├── pages/         # 페이지 컴포넌트
│   │   │   ├── Home.js
│   │   │   ├── DreamInput.js
│   │   │   ├── DreamResult.js
│   │   │   ├── MyDreams.js
│   │   │   ├── SharedPosts.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── AdminDashboard.js
│   │   └── utils/         # 유틸리티
│   │       └── api.js
│   └── public/
├── package.json
├── .env
└── README.md
```

## 📖 API 엔드포인트

### 인증 관련
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `GET /api/auth/me` - 현재 사용자 정보
- `POST /api/auth/verify` - 토큰 검증

### 꿈 해석 관련
- `POST /api/dreams/interpret` - 꿈 해석 요청
- `GET /api/dreams/my-dreams` - 내 꿈 기록 조회
- `GET /api/dreams/:id` - 특정 해석 조회
- `POST /api/dreams/:id/share` - 꿈 공유

### 게시판 관련
- `GET /api/posts` - 공유된 게시물 목록
- `GET /api/posts/:id` - 게시물 상세 조회
- `POST /api/posts/:id/comments` - 댓글 작성
- `POST /api/posts/:id/like` - 좋아요 토글

### 관리자 관련
- `GET /api/admin/stats` - 통계 조회
- `GET /api/admin/users` - 사용자 목록
- `GET /api/admin/interpretations` - 모든 해석 목록
- `DELETE /api/admin/users/:id` - 사용자 삭제
- `DELETE /api/admin/interpretations/:id` - 해석 삭제

## 🎨 주요 특징

### 반응형 디자인
- 모바일, 태블릿, 데스크톱 모든 기기에서 최적화된 UI

### 사용자 친화적 인터페이스
- 직관적이고 깔끔한 디자인
- 로딩 상태 및 에러 처리
- 실시간 피드백

### 보안
- JWT 기반 인증
- 비밀번호 암호화
- Rate Limiting
- CORS 설정

### 성능 최적화
- 효율적인 데이터베이스 쿼리
- API 응답 최적화
- 컴포넌트 재사용

## 🔧 개발 가이드

### 새로운 기능 추가
1. 백엔드 API 라우트 작성
2. 프론트엔드 페이지/컴포넌트 구현
3. API 클라이언트 함수 추가
4. 라우팅 설정 업데이트

### 데이터베이스 스키마 수정
- `server/models/database.js`에서 테이블 구조 수정
- 기존 데이터베이스 파일 삭제 후 재시작 (개발 환경)

### 환경 변수 추가
1. `.env.example` 파일에 예시 추가
2. 실제 `.env` 파일에 값 설정
3. 코드에서 `process.env.VARIABLE_NAME`으로 사용

## 🤝 기여하기

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 있으시거나 질문이 있으시면 이슈를 생성해주세요.

---

**⚠️ 중요 공지**
- 실제 운영 환경에서는 OpenAI API 키를 안전하게 관리하세요
- 프로덕션 환경에서는 JWT_SECRET을 강력한 값으로 설정하세요
- 데이터베이스는 실제 운영 시 PostgreSQL이나 MySQL 사용을 권장합니다