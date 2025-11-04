/**
 * @file components/post/PostCardSkeleton.tsx
 * @description Instagram 스타일 게시물 카드 Skeleton 로딩 UI
 *
 * 이 컴포넌트는 PostCard 컴포넌트와 동일한 레이아웃을 가진 Skeleton UI입니다.
 *
 * 주요 기능:
 * 1. PostCard와 동일한 레이아웃 구조
 * 2. 회색 박스 애니메이션 (Skeleton UI)
 * 3. Shimmer 효과
 *
 * @dependencies
 * - Tailwind CSS: 스타일링 및 애니메이션
 */

export default function PostCardSkeleton() {
  return (
    <article className="bg-white border border-[#dbdbdb] rounded-lg mb-4 animate-pulse">
      {/* 헤더 섹션 (60px) */}
      <header className="h-[60px] flex items-center justify-between px-4 border-b border-[#dbdbdb]">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 32px 원형 Skeleton */}
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
          {/* 사용자명 + 시간 Skeleton */}
          <div className="flex flex-col gap-1">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
        {/* ⋯ 메뉴 Skeleton */}
        <div className="w-5 h-5 bg-gray-200 rounded" />
      </header>

      {/* 이미지 영역 (1:1 정사각형) Skeleton */}
      <div className="relative aspect-square w-full bg-gray-200">
        {/* Shimmer 효과를 위한 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>

      {/* 액션 버튼 섹션 (48px) Skeleton */}
      <div className="h-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* 좋아요, 댓글, 공유 버튼 Skeleton */}
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
        </div>
        {/* 북마크 버튼 Skeleton */}
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </div>

      {/* 컨텐츠 섹션 Skeleton */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 Skeleton */}
        <div className="h-4 w-32 bg-gray-200 rounded" />

        {/* 캡션 Skeleton */}
        <div className="space-y-1">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>

        {/* 댓글 미리보기 Skeleton */}
        <div className="space-y-1">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 rounded" />
        </div>
      </div>
    </article>
  );
}
