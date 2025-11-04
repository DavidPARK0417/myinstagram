# 📋 Instagram SNS 프로젝트 TODO

PRD 문서의 개발 순서를 기반으로 작성된 작업 체크리스트입니다.

---

## 1. 홈 피드 페이지

### 1-1. 기본 세팅

- [ ] Next.js 프로젝트 생성 및 TypeScript 설정
- [ ] Tailwind CSS 설정 (Instagram 컬러 스키마 적용)
  - [ ] `globals.css`에 컬러 변수 정의 (--instagram-blue, --background, --card-background 등)
  - [ ] 타이포그래피 설정
- [ ] Clerk 인증 연동 및 한국어 설정
  - [ ] 환경 변수 설정
  - [ ] ClerkProvider 설정
  - [ ] 로그인/회원가입 페이지 라우팅
- [ ] Supabase 프로젝트 생성 및 연동
  - [ ] 환경 변수 설정
  - [ ] Supabase 클라이언트 설정 (`lib/supabase/`)
- [ ] 데이터베이스 테이블 생성 (마이그레이션)
  - [ ] `users` 테이블 (clerk_id, name, created_at 등)
  - [ ] `posts` 테이블 (id, user_id, image_url, caption, created_at 등)
  - [ ] RLS 비활성화 (개발 환경)

### 1-2. 레이아웃 구조

- [ ] Sidebar 컴포넌트 (`components/layout/Sidebar.tsx`)
  - [ ] Desktop: 244px 너비, 아이콘 + 텍스트 메뉴
  - [ ] Tablet: 72px 너비, 아이콘만 표시
  - [ ] Hover 효과, Active 상태 스타일링
  - [ ] 메뉴 항목: 홈, 검색, 만들기, 프로필
- [ ] MobileHeader 컴포넌트 (`components/layout/Header.tsx`)
  - [ ] 높이 60px
  - [ ] 로고 + 알림/DM/프로필 아이콘
- [ ] BottomNav 컴포넌트 (`components/layout/BottomNav.tsx`)
  - [ ] 높이 50px
  - [ ] 5개 아이콘 메뉴 (홈, 검색, 만들기, 좋아요, 프로필)
- [ ] (main) Route Group 레이아웃 (`app/(main)/layout.tsx`)
  - [ ] Sidebar + 메인 컨텐츠 레이아웃
  - [ ] 반응형 처리 (Mobile/Tablet/Desktop)
  - [ ] MobileHeader 및 BottomNav 조건부 렌더링

### 1-3. 홈 피드 - 게시물 목록

- [ ] PostCard 컴포넌트 (`components/post/PostCard.tsx`)
  - [ ] 헤더 섹션 (프로필 이미지 32px, 사용자명, 시간, ⋯ 메뉴)
  - [ ] 이미지 영역 (1:1 정사각형 비율)
  - [ ] 액션 버튼 (❤️ 좋아요, 💬 댓글, ✈️ 공유, 🔖 북마크)
  - [ ] 컨텐츠 섹션 (좋아요 수, 캡션, 댓글 미리보기 2개)
  - [ ] 캡션 "... 더 보기" 토글 기능
- [ ] PostCardSkeleton 로딩 UI (`components/post/PostCardSkeleton.tsx`)
  - [ ] Skeleton UI (회색 박스 애니메이션)
  - [ ] Shimmer 효과
- [ ] PostFeed 컴포넌트 (`components/post/PostFeed.tsx`)
  - [ ] 게시물 목록 표시
  - [ ] 로딩 상태 처리
- [ ] 홈 피드 페이지 (`app/(main)/page.tsx`)
  - [ ] PostFeed 컴포넌트 통합
  - [ ] 배경색 #FAFAFA, 카드 배경 #FFFFFF
  - [ ] 최대 너비 630px 중앙 정렬
- [ ] `/api/posts` GET API (`app/api/posts/route.ts`)
  - [ ] 페이지네이션 (10개씩)
  - [ ] 시간 역순 정렬
  - [ ] 사용자 정보 JOIN

### 1-4. 홈 피드 - 좋아요 기능

- [ ] `likes` 테이블 생성 (마이그레이션)
  - [ ] id, post_id, user_id, created_at
- [ ] `/api/likes` POST API (`app/api/likes/route.ts`)
  - [ ] 좋아요 추가
  - [ ] 중복 체크
- [ ] `/api/likes` DELETE API
  - [ ] 좋아요 삭제
- [ ] 좋아요 버튼 기능 (`components/post/PostCard.tsx`)
  - [ ] 빈 하트 ↔ 빨간 하트 상태 전환
  - [ ] 클릭 애니메이션 (scale 1.3 → 1, 0.15초)
  - [ ] 좋아요 수 실시간 업데이트
- [ ] 이미지 더블탭 좋아요 기능 (모바일)
  - [ ] 더블탭 감지
  - [ ] 큰 하트 등장 애니메이션 (fade in/out, 1초)

---

## 2. 게시물 작성 & 댓글 기능

### 2-1. 게시물 작성 모달

- [ ] CreatePostModal 컴포넌트 (`components/post/CreatePostModal.tsx`)
  - [ ] Dialog 모달 (shadcn/ui)
  - [ ] 이미지 선택 및 미리보기 UI
  - [ ] 캡션 입력 필드 (최대 2,200자)
  - [ ] 업로드 버튼
  - [ ] 로딩 상태 처리

### 2-2. 게시물 작성 - 이미지 업로드

- [ ] Supabase Storage 버킷 생성
  - [ ] 버킷 이름: `posts` 또는 `uploads`
  - [ ] 공개 읽기 설정
- [ ] `/api/posts` POST API (`app/api/posts/route.ts`)
  - [ ] 이미지 파일 업로드 (최대 5MB 검증)
  - [ ] 파일 형식 검증 (jpg, png, webp 등)
  - [ ] Supabase Storage에 업로드
  - [ ] posts 테이블에 데이터 저장
  - [ ] 에러 처리
- [ ] 게시물 작성 완료 후 피드 새로고침
- [ ] Sidebar "만들기" 버튼 클릭 시 모달 열기

### 2-3. 댓글 기능 - UI & 작성

- [ ] `comments` 테이블 생성 (마이그레이션)
  - [ ] id, post_id, user_id, content, created_at
- [ ] CommentList 컴포넌트 (`components/comment/CommentList.tsx`)
  - [ ] 댓글 목록 표시
  - [ ] PostCard: 최신 2개 미리보기
  - [ ] 상세 모달: 전체 댓글 + 스크롤
- [ ] CommentForm 컴포넌트 (`components/comment/CommentForm.tsx`)
  - [ ] "댓글 달기..." 입력창
  - [ ] Enter 또는 "게시" 버튼으로 제출
  - [ ] 로딩 상태 처리
- [ ] `/api/comments` POST API (`app/api/comments/route.ts`)
  - [ ] 댓글 작성
  - [ ] 입력 검증 (빈 댓글 방지)
- [ ] PostCard에 댓글 미리보기 통합
- [ ] 댓글 작성 후 실시간 업데이트

### 2-4. 댓글 기능 - 삭제 & 무한스크롤

- [ ] `/api/comments` DELETE API (`app/api/comments/route.ts`)
  - [ ] 댓글 삭제 (본인만 가능)
  - [ ] 권한 검증
- [ ] 댓글 삭제 버튼 (본인 댓글만 표시)
  - [ ] ⋯ 메뉴 추가
  - [ ] 삭제 확인 다이얼로그
- [ ] PostFeed 무한 스크롤 구현
  - [ ] Intersection Observer 사용
  - [ ] 하단 도달 시 다음 10개 로드
  - [ ] 로딩 상태 표시
  - [ ] 마지막 페이지 처리

---

## 3. 프로필 페이지 & 팔로우 기능

### 3-1. 프로필 페이지 - 기본 정보

- [ ] `/profile/[userId]` 동적 라우트 생성 (`app/(main)/profile/[userId]/page.tsx`)
- [ ] 프로필 헤더 컴포넌트 (`components/profile/ProfileHeader.tsx`)
  - [ ] 프로필 이미지 (150px Desktop / 90px Mobile)
  - [ ] 사용자명, 전체 이름
  - [ ] 통계 (게시물 수, 팔로워 수, 팔로잉 수)
  - [ ] "팔로우" 또는 "팔로잉" 버튼 (다른 사람 프로필일 때)
  - [ ] "프로필 편집" 버튼 (내 프로필일 때, 1차 제외)
- [ ] `/api/users/[userId]` GET API (`app/api/users/[userId]/route.ts`)
  - [ ] 사용자 정보 조회
  - [ ] 게시물 수, 팔로워 수, 팔로잉 수 계산
- [ ] 내 프로필 페이지 (`/profile`)
  - [ ] 현재 사용자 ID로 리다이렉트

### 3-2. 프로필 페이지 - 게시물 그리드

- [ ] PostGrid 컴포넌트 (`components/profile/PostGrid.tsx`)
  - [ ] 3열 그리드 레이아웃 (반응형)
  - [ ] 1:1 정사각형 썸네일
  - [ ] Hover 시 좋아요/댓글 수 표시
  - [ ] 클릭 시 게시물 상세 모달/페이지 이동
- [ ] `/api/posts` GET API에 userId 파라미터 추가
  - [ ] 특정 사용자의 게시물만 조회
- [ ] 프로필 페이지에 PostGrid 통합

### 3-3. 팔로우 기능

- [ ] `follows` 테이블 생성 (마이그레이션)
  - [ ] id, follower_id, following_id, created_at
  - [ ] 중복 방지 (unique constraint)
- [ ] `/api/follows` POST API (`app/api/follows/route.ts`)
  - [ ] 팔로우 추가
  - [ ] 중복 체크
- [ ] `/api/follows` DELETE API
  - [ ] 언팔로우 (팔로우 삭제)
- [ ] 팔로우/언팔로우 버튼 구현
  - [ ] 미팔로우: "팔로우" 버튼 (파란색)
  - [ ] 팔로우 중: "팔로잉" 버튼 (회색)
  - [ ] Hover 시 "언팔로우" 표시 (빨간 테두리)
  - [ ] 클릭 시 즉시 API 호출 및 UI 업데이트
- [ ] 팔로워/팔로잉 수 실시간 업데이트

### 3-4. 최종 마무리 & 배포

- [ ] 게시물 상세 모달/페이지
  - [ ] PostModal 컴포넌트 (`components/post/PostModal.tsx`)
  - [ ] Desktop: 모달 (이미지 50% + 댓글 50%)
  - [ ] Mobile: 전체 페이지 (`app/(main)/post/[postId]/page.tsx`)
- [ ] 게시물 삭제 기능
  - [ ] ⋯ 메뉴에 삭제 옵션 (본인만)
  - [ ] `/api/posts/[postId]` DELETE API
  - [ ] Storage에서 이미지 삭제
  - [ ] 관련 댓글, 좋아요도 삭제 (CASCADE)
- [ ] 모바일/태블릿 반응형 테스트
  - [ ] 브레이크포인트별 레이아웃 확인
  - [ ] 터치 인터랙션 테스트
- [ ] 에러 핸들링
  - [ ] API 에러 처리
  - [ ] 사용자 친화적 에러 메시지
  - [ ] 에러 바운더리 추가
- [ ] Skeleton UI 전체 적용
  - [ ] 모든 로딩 상태에 Skeleton 적용
- [ ] Vercel 배포
  - [ ] 환경 변수 설정
  - [ ] 빌드 확인
  - [ ] 프로덕션 테스트

---

## 4. 추가 기능 (선택사항)

- [ ] 게시물 상세 페이지에서 댓글 무한 스크롤
- [ ] 이미지 최적화 (Next.js Image 컴포넌트)
- [ ] 메타 태그 설정 (SEO)
- [ ] PWA 설정 (manifest, service worker)

---

**참고**: 이 TODO 리스트는 `docs/prd.md`의 개발 순서를 기반으로 작성되었습니다.
