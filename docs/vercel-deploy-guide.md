# Vercel 배포 가이드

이 문서는 Instagram SNS 프로젝트를 Vercel에 배포하는 방법을 안내합니다.

## 사전 준비

### 1. Vercel 계정 생성

- [Vercel](https://vercel.com)에 가입하거나 로그인
- GitHub 계정과 연동 권장

### 2. GitHub 저장소 준비

- 프로젝트를 GitHub 저장소에 푸시
- `main` 또는 `master` 브랜치를 메인 브랜치로 설정

## 환경 변수 설정

### Clerk 환경 변수

다음 환경 변수들을 Vercel 프로젝트 설정에 추가해야 합니다:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

**설명**:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk 대시보드에서 발급받은 Publishable Key
- `CLERK_SECRET_KEY`: Clerk 대시보드에서 발급받은 Secret Key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: 로그인 페이지 경로 (기본값: `/sign-in`)
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`: 로그인 후 리다이렉트 URL (기본값: `/`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`: 회원가입 후 리다이렉트 URL (기본값: `/`)

### Supabase 환경 변수

다음 환경 변수들을 Vercel 프로젝트 설정에 추가해야 합니다:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STORAGE_BUCKET=uploads
```

**설명**:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon (공개) Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key (서버 사이드 전용)
- `NEXT_PUBLIC_STORAGE_BUCKET`: Storage 버킷 이름 (기본값: `uploads`)

### 환경 변수 체크리스트

배포 전 다음 환경 변수들이 모두 설정되어 있는지 확인하세요:

#### 필수 환경 변수

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_STORAGE_BUCKET`

#### 선택적 환경 변수

- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` (기본값 사용 시 생략 가능)
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` (기본값 사용 시 생략 가능)
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` (기본값 사용 시 생략 가능)

## Vercel 배포 절차

### 방법 1: Vercel 대시보드에서 배포

1. **프로젝트 가져오기**

   - [Vercel 대시보드](https://vercel.com/dashboard) 접속
   - "Add New..." 버튼 클릭
   - "Project" 선택
   - GitHub 저장소 선택 및 Import

2. **프로젝트 설정**

   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `pnpm build` (기본값)
   - **Output Directory**: `.next` (기본값)
   - **Install Command**: `pnpm install` (기본값)

3. **환경 변수 설정**

   - "Environment Variables" 섹션에서 위의 환경 변수들을 추가
   - 각 환경(Production, Preview, Development)에 맞게 설정

4. **배포**
   - "Deploy" 버튼 클릭
   - 배포 완료까지 대기 (약 2-5분)

### 방법 2: Vercel CLI로 배포

1. **Vercel CLI 설치**

   ```bash
   npm i -g vercel
   ```

2. **Vercel 로그인**

   ```bash
   vercel login
   ```

3. **프로젝트 배포**

   ```bash
   vercel
   ```

4. **프로덕션 배포**
   ```bash
   vercel --prod
   ```

## 빌드 확인

### 로컬 빌드 테스트

배포 전 로컬에서 빌드가 성공하는지 확인하세요:

```bash
# 의존성 설치
pnpm install

# 프로덕션 빌드
pnpm build

# 빌드 결과 확인
pnpm start
```

### 빌드 에러 해결

빌드 중 에러가 발생하면 다음을 확인하세요:

1. **환경 변수 누락**

   - 모든 필수 환경 변수가 설정되어 있는지 확인
   - `.env.local` 파일에 환경 변수가 있는지 확인

2. **TypeScript 에러**

   ```bash
   pnpm run lint
   ```

   - 린터 에러를 수정

3. **의존성 문제**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### 빌드 최적화 확인

- [ ] 이미지 최적화가 활성화되어 있는지 확인
- [ ] 불필요한 파일이 빌드에 포함되지 않는지 확인
- [ ] 빌드 크기가 적절한지 확인 (최대 100MB 권장)

## 배포 후 확인 사항

### 1. 배포 상태 확인

- [ ] Vercel 대시보드에서 배포가 성공했는지 확인
- [ ] 배포 로그에 에러가 없는지 확인

### 2. 환경 변수 확인

- [ ] Vercel 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
- [ ] 프로덕션 환경에 맞는 환경 변수인지 확인

### 3. 기능 테스트

- [ ] 홈 페이지 접속 확인
- [ ] 로그인/회원가입 기능 확인
- [ ] 게시물 작성 기능 확인
- [ ] 게시물 조회 기능 확인
- [ ] 좋아요/댓글 기능 확인
- [ ] 프로필 페이지 확인

### 4. 성능 확인

- [ ] 페이지 로딩 속도 확인
- [ ] 이미지 로딩 속도 확인
- [ ] API 응답 속도 확인

## 도메인 연결

### 커스텀 도메인 추가

1. **Vercel 대시보드에서 도메인 추가**

   - 프로젝트 설정 → Domains
   - "Add Domain" 버튼 클릭
   - 도메인 이름 입력

2. **DNS 설정**

   - Vercel에서 제공하는 DNS 레코드를 도메인 제공업체에 추가
   - A 레코드 또는 CNAME 레코드 설정

3. **SSL 인증서**
   - Vercel이 자동으로 SSL 인증서를 발급 (약 1-2분 소요)

## 자동 배포 설정

### GitHub 연동

Vercel에 GitHub 저장소를 연결하면 자동으로 배포가 설정됩니다:

- **Push to `main` branch**: 프로덕션 배포
- **Pull Request**: Preview 배포
- **다른 브랜치 Push**: Preview 배포

### 배포 설정 커스터마이징

`vercel.json` 파일을 생성하여 배포 설정을 커스터마이징할 수 있습니다:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["icn1"]
}
```

## 문제 해결

### 일반적인 문제

#### 1. 빌드 실패

- **원인**: 환경 변수 누락, TypeScript 에러, 의존성 문제
- **해결**: 로컬 빌드 테스트로 에러 확인 후 수정

#### 2. 환경 변수 불일치

- **원인**: 프로덕션과 개발 환경의 환경 변수 차이
- **해결**: Vercel 대시보드에서 환경 변수 확인 및 수정

#### 3. API 요청 실패

- **원인**: CORS 설정, 환경 변수 누락
- **해결**: Supabase 및 Clerk 설정 확인

#### 4. 이미지 로딩 실패

- **원인**: Supabase Storage 설정 문제
- **해결**: Storage 버킷 공개 설정 확인

### 지원

문제가 해결되지 않으면:

1. Vercel 대시보드의 배포 로그 확인
2. Vercel 문서 참조: https://vercel.com/docs
3. GitHub Issues에 문제 보고

## 배포 체크리스트

### 배포 전

- [ ] 모든 환경 변수가 설정되어 있는지 확인
- [ ] 로컬 빌드가 성공하는지 확인
- [ ] TypeScript 에러가 없는지 확인
- [ ] 린터 에러가 없는지 확인
- [ ] 주요 기능이 정상 작동하는지 확인

### 배포 후

- [ ] 배포가 성공했는지 확인
- [ ] 프로덕션 사이트 접속 확인
- [ ] 로그인/회원가입 기능 확인
- [ ] 게시물 작성/조회 기능 확인
- [ ] 좋아요/댓글 기능 확인
- [ ] 프로필 페이지 확인
- [ ] 반응형 디자인 확인

## 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Clerk 배포 가이드](https://clerk.com/docs/deployments)
- [Supabase 배포 가이드](https://supabase.com/docs/guides/getting-started)
