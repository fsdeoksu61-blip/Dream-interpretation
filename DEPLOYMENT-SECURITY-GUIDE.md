# 🔒 보안 배포 가이드

## ❌ **절대 업로드하면 안 되는 파일들**

### 1. 환경변수 파일
```
.env                    # 실제 API 키와 비밀번호 포함
.env.local
.env.production
.env.development
```

### 2. 데이터베이스 파일
```
server/database.db      # 사용자 데이터 포함
server/database.db-shm
server/database.db-wal
*.sqlite
```

### 3. 민감한 디렉토리
```
node_modules/           # 패키지 파일들 (서버에서 npm install로 설치)
.vscode/               # IDE 설정
.idea/                 # IDE 설정
logs/                  # 로그 파일들
tmp/                   # 임시 파일들
```

### 4. 개발 관련 파일
```
.git/                  # Git 히스토리 (소스 코드 노출 위험)
client/build/          # 로컬 빌드 파일 (서버에서 새로 빌드)
npm-debug.log*
yarn-error.log*
```

## ✅ **업로드해야 하는 파일들**

### 1. 필수 코드 파일
```
📁 client/
  └── src/             # React 소스 코드
  └── public/          # 정적 파일들
  └── package.json     # 의존성 정보

📁 server/
  └── routes/          # API 라우트
  └── models/          # 데이터베이스 모델
  └── middleware/      # 미들웨어
  └── index.js         # 서버 진입점
  └── package.json     # 의존성 정보

📄 .env.example        # 환경변수 템플릿 (실제 값 없음)
📄 .gitignore          # 보안 설정
📄 package.json        # 루트 의존성
```

## 🔐 **호스팅 서버에서 할 일**

### 1. 환경변수 설정
호스팅 서비스의 환경변수 설정에서:
```bash
OPENAI_API_KEY=sk-proj-실제키여기
JWT_SECRET=매우_긴_랜덤_문자열_최소_32자
PORT=5009
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
ADMIN_EMAIL=your_admin@email.com
ADMIN_PASSWORD=안전한_패스워드
```

### 2. 새로운 JWT_SECRET 생성
```javascript
// Node.js로 강력한 JWT 비밀키 생성
require('crypto').randomBytes(64).toString('hex')
```

### 3. 데이터베이스 초기화
- 새로운 빈 데이터베이스가 자동 생성됩니다
- 관리자 계정은 환경변수로 설정한 정보로 생성됩니다

## 🌐 **추천 호스팅 서비스**

### 1. **Vercel (권장)**
- 환경변수 UI 제공
- 자동 HTTPS
- Git 연동 배포

### 2. **Railway**
- 환경변수 관리 우수
- 데이터베이스 지원

### 3. **Render**
- 무료 플랜 제공
- 환경변수 보안 관리

## ⚠️ **중요 보안 체크리스트**

- [ ] .env 파일이 .gitignore에 포함되어 있는가?
- [ ] 실제 API 키가 코드에 하드코딩되지 않았는가?
- [ ] JWT_SECRET이 강력한 랜덤 문자열인가?
- [ ] 관리자 비밀번호가 안전한가?
- [ ] 데이터베이스 파일이 제외되었는가?
- [ ] HTTPS가 활성화되어 있는가?

## 📞 **문제 발생 시**
1. 서버 로그 확인
2. 환경변수 설정 재확인
3. 파일 권한 확인
4. 도메인/포트 설정 확인