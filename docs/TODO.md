# 📋 Instagram SNS 프로젝트 TODO

PRD 문서의 개발 순서를 기반으로 작성된 작업 체크리스트입니다.

---

## 1. 홈 피드 페이지

### 1-1. 기본 세팅

- [x] Next.js 프로젝트 생성 및 TypeScript 설정
- [x] Tailwind CSS 설정 (Instagram 컬러 스키마 적용)
  - [x] `globals.css`에 컬러 변수 정의 (--instagram-blue, --background, --card-background 등)
  - [x] 타이포그래피 설정
- [x] Clerk 인증 연동 및 한국어 설정
  - [x] 환경 변수 설정
  - [x] ClerkProvider 설정
  - [x] 로그인/회원가입 페이지 라우팅
- [x] Supabase 프로젝트 생성 및 연동
  - [x] 환경 변수 설정
  - [x] Supabase 클라이언트 설정 (`lib/supabase/`)
- [x] 데이터베이스 테이블 생성 (마이그레이션)
  - [x] `users` 테이블 (clerk_id, name, created_at 등)
  - [x] `posts` 테이블 (id, user_id, image_url, caption, created_at 등)
  - [x] `likes` 테이블 (id, post_id, user_id, created_at)
  - [x] `comments` 테이블 (id, post_id, user_id, content, created_at)
  - [x] `follows` 테이블 (id, follower_id, following_id, created_at)
  - [x] RLS 비활성화 (개발 환경)

### 1-2. 레이아웃 구조

- [x] Sidebar 컴포넌트 (`components/layout/Sidebar.tsx`)
  - [x] Desktop: 244px 너비, 아이콘 + 텍스트 메뉴
  - [x] Tablet: 72px 너비, 아이콘만 표시
  - [x] Hover 효과, Active 상태 스타일링
  - [x] 메뉴 항목: 홈, 검색, 만들기, 프로필
- [x] MobileHeader 컴포넌트 (`components/layout/Header.tsx`)
  - [x] 높이 60px
  - [x] 로고 + 알림/DM/프로필 아이콘
- [x] BottomNav 컴포넌트 (`components/layout/BottomNav.tsx`)
  - [x] 높이 50px
  - [x] 5개 아이콘 메뉴 (홈, 검색, 만들기, 좋아요, 프로필)
- [x] (main) Route Group 레이아웃 (`app/(main)/layout.tsx`)
  - [x] Sidebar + 메인 컨텐츠 레이아웃
  - [x] 반응형 처리 (Mobile/Tablet/Desktop)
  - [x] MobileHeader 및 BottomNav 조건부 렌더링

### 1-3. 홈 피드 - 게시물 목록

- [x] PostCard 컴포넌트 (`components/post/PostCard.tsx`)
  - [x] 헤더 섹션 (프로필 이미지 32px, 사용자명, 시간, ⋯ 메뉴)
  - [x] 이미지 영역 (1:1 정사각형 비율)
  - [x] 액션 버튼 (❤️ 좋아요, 💬 댓글, ✈️ 공유, 🔖 북마크)
  - [x] 컨텐츠 섹션 (좋아요 수, 캡션, 댓글 미리보기 2개)
  - [x] 캡션 "... 더 보기" 토글 기능
- [x] PostCardSkeleton 로딩 UI (`components/post/PostCardSkeleton.tsx`)
  - [x] Skeleton UI (회색 박스 애니메이션)
  - [x] Shimmer 효과
- [x] PostFeed 컴포넌트 (`components/post/PostFeed.tsx`)
  - [x] 게시물 목록 표시
  - [x] 로딩 상태 처리
- [x] 홈 피드 페이지 (`app/(main)/page.tsx`)
  - [x] PostFeed 컴포넌트 통합
  - [x] 배경색 #FAFAFA, 카드 배경 #FFFFFF (layout에서 처리)
  - [x] 최대 너비 630px 중앙 정렬 (layout에서 처리)
- [x] `/api/posts` GET API (`app/api/posts/route.ts`)
  - [x] 페이지네이션 (10개씩)
  - [x] 시간 역순 정렬
  - [x] 사용자 정보 JOIN (users 테이블)
  - [x] post_stats 뷰 활용 (좋아요 수, 댓글 수)
  - [x] 댓글 미리보기 최신 2개 조회

### 1-4. 홈 피드 - 좋아요 기능

- [x] `likes` 테이블 생성 (마이그레이션)
  - [x] id, post_id, user_id, created_at
- [x] `/api/likes` POST API (`app/api/likes/route.ts`)
  - [x] 좋아요 추가
  - [x] 중복 체크
- [x] `/api/likes` DELETE API
  - [x] 좋아요 삭제
- [x] 좋아요 버튼 기능 (`components/post/PostCard.tsx`)
  - [x] 빈 하트 ↔ 빨간 하트 상태 전환
  - [x] 클릭 애니메이션 (scale 1.3 → 1, 0.15초)
  - [x] 좋아요 수 실시간 업데이트
- [x] 이미지 더블탭 좋아요 기능 (모바일)
  - [x] 더블탭 감지
  - [x] 큰 하트 등장 애니메이션 (fade in/out, 1초)

### 1-5. 공유 및 북마크 기능

#### 공유 기능 (Share)

- [x] 공유 버튼 기능 구현 (`components/post/PostCard.tsx`, `PostModal.tsx`)
  - [x] Web Share API 구현 (모바일 네이티브 공유)
  - [x] 클립보드 복사 기능 (데스크톱 대체)
  - [x] 공유 URL 생성 (`/post/{postId}`)
  - [x] 에러 처리 및 사용자 피드백
  - [x] 로그 추가 (디버깅용)

#### 북마크 기능 (Bookmark)

- [x] `bookmarks` 테이블 생성 (마이그레이션)
  - [x] id, post_id, user_id, created_at
  - [x] UNIQUE(post_id, user_id) 제약 조건
  - [x] 인덱스 생성
  - [x] RLS 비활성화 (개발 환경)
- [x] `/api/bookmarks` POST API (`app/api/bookmarks/route.ts`)
  - [x] 북마크 추가
  - [x] 중복 체크
  - [x] 에러 처리
- [x] `/api/bookmarks` DELETE API
  - [x] 북마크 삭제
  - [x] 권한 검증
- [x] 북마크 버튼 기능 (`components/post/PostCard.tsx`, `PostModal.tsx`)
  - [x] 빈 북마크 ↔ 채워진 북마크 상태 전환
  - [x] 클릭 시 API 호출 및 즉시 UI 업데이트
  - [x] 로딩 상태 처리
  - [x] 로그 추가 (디버깅용)
- [x] 타입 정의 업데이트 (`types/post.ts`)
  - [x] PostWithDetails에 user_bookmarked 필드 추가
- [x] `/api/posts` GET API 수정
  - [x] 북마크 여부(user_bookmarked) 조회 추가

---

## 2. 게시물 작성 & 댓글 기능

### 2-1. 게시물 작성 모달

- [x] CreatePostModal 컴포넌트 (`components/post/CreatePostModal.tsx`)
  - [x] Dialog 모달 (shadcn/ui)
  - [x] 이미지 선택 및 미리보기 UI
  - [x] 캡션 입력 필드 (최대 2,200자)
  - [x] 업로드 버튼
  - [x] 로딩 상태 처리

### 2-2. 게시물 작성 - 이미지 업로드

- [x] Supabase Storage 버킷 생성
  - [x] 버킷 이름: `uploads`
  - [x] 공개 읽기 설정 (RLS 정책 설정됨)
- [x] `/api/posts` POST API (`app/api/posts/route.ts`)
  - [x] 이미지 파일 업로드 (최대 5MB 검증)
  - [x] 파일 형식 검증 (jpg, png, webp 등)
  - [x] Supabase Storage에 업로드
  - [x] posts 테이블에 데이터 저장
  - [x] 에러 처리
- [x] 게시물 작성 완료 후 피드 새로고침
- [x] Sidebar "만들기" 버튼 클릭 시 모달 열기

### 2-3. 댓글 기능 - UI & 작성

- [x] `comments` 테이블 생성 (마이그레이션)
  - [x] id, post_id, user_id, content, created_at
- [x] CommentList 컴포넌트 (`components/comment/CommentList.tsx`)
  - [x] 댓글 목록 표시
  - [x] PostCard: 최신 2개 미리보기
  - [x] 상세 모달: 전체 댓글 + 스크롤
- [x] CommentForm 컴포넌트 (`components/comment/CommentForm.tsx`)
  - [x] "댓글 달기..." 입력창
  - [x] Enter 또는 "게시" 버튼으로 제출
  - [x] 로딩 상태 처리
- [x] `/api/comments` POST API (`app/api/comments/route.ts`)
  - [x] 댓글 작성
  - [x] 입력 검증 (빈 댓글 방지)
- [x] PostCard에 댓글 미리보기 통합
- [x] 댓글 작성 후 실시간 업데이트

### 2-4. 댓글 기능 - 삭제 & 무한스크롤

- [x] `/api/comments` DELETE API (`app/api/comments/route.ts`)
  - [x] 댓글 삭제 (본인만 가능)
  - [x] 권한 검증
- [x] 댓글 삭제 버튼 (본인 댓글만 표시)
  - [x] ⋯ 메뉴 추가
  - [x] 삭제 확인 다이얼로그
- [x] PostFeed 무한 스크롤 구현
  - [x] Intersection Observer 사용
  - [x] 하단 도달 시 다음 10개 로드
  - [x] 로딩 상태 표시
  - [x] 마지막 페이지 처리

---

## 3. 프로필 페이지 & 팔로우 기능

### 3-1. 프로필 페이지 - 기본 정보

- [x] `/profile/[userId]` 동적 라우트 생성 (`app/(main)/profile/[userId]/page.tsx`)
- [x] 프로필 헤더 컴포넌트 (`components/profile/ProfileHeader.tsx`)
  - [x] 프로필 이미지 (150px Desktop / 90px Mobile)
  - [x] 사용자명, 전체 이름
  - [x] 통계 (게시물 수, 팔로워 수, 팔로잉 수)
  - [x] "팔로우" 또는 "팔로잉" 버튼 (다른 사람 프로필일 때)
  - [ ] "프로필 편집" 버튼 (내 프로필일 때, 1차 제외)
- [x] `/api/users/[userId]` GET API (`app/api/users/[userId]/route.ts`)
  - [x] 사용자 정보 조회
  - [x] user_stats 뷰 활용 (게시물 수, 팔로워 수, 팔로잉 수)
- [x] 내 프로필 페이지 (`/profile`)
  - [x] 현재 사용자 ID로 리다이렉트

### 3-2. 프로필 페이지 - 게시물 그리드

- [x] PostGrid 컴포넌트 (`components/profile/PostGrid.tsx`)
  - [x] 3열 그리드 레이아웃 (반응형)
  - [x] 1:1 정사각형 썸네일
  - [x] Hover 시 좋아요/댓글 수 표시
  - [x] 클릭 시 게시물 상세 모달/페이지 이동
- [x] `/api/posts` GET API에 userId 파라미터 추가
  - [x] 특정 사용자의 게시물만 조회
- [x] 프로필 페이지에 PostGrid 통합

### 3-3. 팔로우 기능

- [x] `follows` 테이블 생성 (마이그레이션)
  - [x] id, follower_id, following_id, created_at
  - [x] 중복 방지 (unique constraint)
- [x] `/api/follows` POST API (`app/api/follows/route.ts`)
  - [x] 팔로우 추가
  - [x] 중복 체크
  - [x] 자기 자신 팔로우 방지
- [x] `/api/follows` DELETE API
  - [x] 언팔로우 (팔로우 삭제)
  - [x] 권한 검증
- [x] 팔로우/언팔로우 버튼 구현
  - [x] 미팔로우: "팔로우" 버튼 (파란색)
  - [x] 팔로우 중: "팔로잉" 버튼 (회색)
  - [x] Hover 시 "언팔로우" 표시 (빨간 테두리)
  - [x] 클릭 시 즉시 API 호출 및 UI 업데이트
  - [x] 로딩 상태 처리
- [x] 팔로워/팔로잉 수 실시간 업데이트

### 3-4. 최종 마무리 & 배포

- [x] 게시물 상세 모달/페이지
  - [x] PostModal 컴포넌트 (`components/post/PostModal.tsx`)
  - [x] Desktop: 모달 (이미지 50% + 댓글 50%)
  - [x] Mobile: 전체 페이지 (`app/(main)/post/[postId]/page.tsx`)
- [x] 게시물 삭제 기능
  - [x] ⋯ 메뉴에 삭제 옵션 (본인만)
  - [x] `/api/posts/[postId]` DELETE API
  - [x] Storage에서 이미지 삭제
  - [x] 관련 댓글, 좋아요도 삭제 (CASCADE)
- [x] 모바일/태블릿 반응형 테스트
  - [x] 브레이크포인트별 레이아웃 확인 문서 작성 (`docs/responsive-test-guide.md`)
  - [x] 터치 인터랙션 테스트 가이드 작성
- [x] 에러 핸들링
  - [x] API 에러 처리 확인 및 개선
  - [x] 사용자 친화적 에러 메시지 확인
  - [x] 에러 바운더리 추가 (`components/ErrorBoundary.tsx`)
- [x] Skeleton UI 전체 적용
  - [x] ProfileHeaderSkeleton 컴포넌트 생성 및 적용 (`components/profile/ProfileHeaderSkeleton.tsx`)
  - [x] PostDetailSkeleton 컴포넌트 생성 및 적용 (`components/post/PostDetailSkeleton.tsx`)
  - [x] Suspense를 사용한 로딩 상태 처리
- [x] Vercel 배포
  - [x] 환경 변수 체크리스트 작성 (`docs/vercel-deploy-guide.md`)
  - [x] 빌드 확인 가이드 작성
  - [x] 배포 절차 문서 작성

---

## 4. 추가 기능 (선택사항)

- [x] 게시물 상세 페이지에서 댓글 무한 스크롤
  - [x] `/api/comments` GET API 추가 (페이지네이션)
  - [x] `CommentList` 컴포넌트에 무한 스크롤 로직 추가
  - [x] `PostModal` 컴포넌트에서 초기 댓글만 로드하도록 수정
- [x] 이미지 최적화 (Next.js Image 컴포넌트)
  - [x] `next.config.ts`에 이미지 최적화 설정 추가 (AVIF, WebP)
  - [x] Image 컴포넌트에 quality, loading 속성 추가
- [x] 메타 태그 설정 (SEO)
  - [x] RootLayout 메타데이터 개선 (Open Graph, Twitter Card)
  - [x] 게시물 상세 페이지 동적 메타데이터 생성
  - [x] 프로필 페이지 동적 메타데이터 생성
- [x] PWA 설정 (manifest, service worker)
  - [x] `public/manifest.json` 생성
  - [x] RootLayout에 manifest 링크 추가
  - [x] Service Worker 설정 (`public/sw.js`, `app/register-sw.tsx`)
- [x] 검색 기능
  - [x] 검색 페이지 생성 (`app/(main)/search/page.tsx`)
    - [x] 검색 입력 필드 (Instagram 스타일)
    - [x] 검색 결과 영역
    - [x] 로딩 상태 처리
    - [x] 검색 결과 없음 상태 처리
  - [x] `/api/search` GET API (`app/api/search/route.ts`)
    - [x] 사용자 검색 (이름, 사용자명으로 검색)
    - [x] 검색어 파라미터 처리 (`?q=검색어`)
    - [x] 페이지네이션 지원 (선택사항)
    - [x] 에러 처리
  - [x] 검색 UI 컴포넌트 (`components/search/SearchPage.tsx`)
    - [x] 검색 입력 필드
    - [x] 실시간 검색 (debounce 적용, 300ms)
    - [x] 검색 결과 목록 표시
    - [x] 로딩 스켈레톤 UI
  - [x] 사용자 검색 결과 아이템 (`components/search/UserSearchResult.tsx`)
    - [x] 프로필 이미지 (원형)
    - [x] 사용자명, 전체 이름 표시
    - [x] 클릭 시 프로필 페이지로 이동
    - [x] Hover 효과
  - [x] 타입 정의 (`types/search.ts`)
    - [x] SearchResult 인터페이스
    - [x] UserSearchResult 인터페이스
  - [ ] (선택) 게시물 검색 기능
    - [ ] 캡션으로 게시물 검색
    - [ ] 검색 결과에 게시물 미리보기 표시
    - [ ] 클릭 시 게시물 상세 페이지로 이동

---

**참고**: 이 TODO 리스트는 `docs/prd.md`의 개발 순서를 기반으로 작성되었습니다.
