/**
 * @file components/profile/ProfileHeaderSkeleton.tsx
 * @description 프로필 헤더 Skeleton 로딩 UI
 *
 * 이 컴포넌트는 ProfileHeader 컴포넌트와 동일한 레이아웃을 가진 Skeleton UI입니다.
 *
 * 주요 기능:
 * 1. ProfileHeader와 동일한 레이아웃 구조
 * 2. 회색 박스 애니메이션 (Skeleton UI)
 * 3. Shimmer 효과
 *
 * @dependencies
 * - Tailwind CSS: 스타일링 및 애니메이션
 */

export default function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 px-4 py-6 md:py-8 animate-pulse">
      {/* 프로필 이미지 Skeleton (150px Desktop / 90px Mobile) */}
      <div className="flex-shrink-0 flex justify-center md:justify-start">
        <div className="w-[90px] h-[90px] md:w-[150px] md:h-[150px] rounded-full bg-gray-200 flex-shrink-0" />
      </div>

      {/* 프로필 정보 Skeleton */}
      <div className="flex-1 flex flex-col gap-4">
        {/* 사용자명 + 버튼 Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* 사용자명 Skeleton */}
          <div className="h-7 md:h-8 w-32 bg-gray-200 rounded" />
          {/* 버튼 Skeleton */}
          <div className="h-8 w-20 bg-gray-200 rounded-md" />
        </div>

        {/* 통계 Skeleton (게시물 수, 팔로워 수, 팔로잉 수) */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-1">
            <div className="h-5 w-8 bg-gray-200 rounded" />
            <div className="h-4 w-12 bg-gray-200 rounded" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-5 w-8 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-5 w-8 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
        </div>

        {/* 전체 이름 Skeleton */}
        <div>
          <div className="h-5 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
