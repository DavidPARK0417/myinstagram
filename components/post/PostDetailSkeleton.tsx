/**
 * @file components/post/PostDetailSkeleton.tsx
 * @description 게시물 상세 Skeleton 로딩 UI
 *
 * 이 컴포넌트는 PostModal과 동일한 레이아웃을 가진 Skeleton UI입니다.
 *
 * 주요 기능:
 * 1. PostModal과 동일한 레이아웃 구조 (이미지 50% + 댓글 50%)
 * 2. 회색 박스 애니메이션 (Skeleton UI)
 * 3. Shimmer 효과
 *
 * @dependencies
 * - Tailwind CSS: 스타일링 및 애니메이션
 */

export default function PostDetailSkeleton() {
  return (
    <div className="max-w-5xl w-full h-[90vh] p-0 flex flex-col sm:flex-row animate-pulse">
      {/* 이미지 영역 Skeleton (50%) */}
      <div className="w-full sm:w-1/2 h-full bg-gray-200 flex items-center justify-center">
        {/* Shimmer 효과를 위한 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>

      {/* 댓글 영역 Skeleton (50%) */}
      <div className="w-full sm:w-1/2 h-full flex flex-col bg-white">
        {/* 헤더 Skeleton */}
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

        {/* 댓글 목록 영역 Skeleton (스크롤 가능) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* 캡션 Skeleton */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
          </div>

          {/* 댓글 목록 Skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 및 좋아요 수 Skeleton */}
        <div className="border-t border-[#dbdbdb] px-4 py-3 space-y-2">
          {/* 액션 버튼 Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 bg-gray-200 rounded" />
              <div className="w-6 h-6 bg-gray-200 rounded" />
              <div className="w-6 h-6 bg-gray-200 rounded" />
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded" />
          </div>

          {/* 좋아요 수 Skeleton */}
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>

        {/* 댓글 작성 폼 Skeleton */}
        <div className="border-t border-[#dbdbdb] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-8 bg-gray-200 rounded" />
            <div className="w-12 h-8 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
