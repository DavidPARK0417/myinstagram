"use client";

/**
 * @file components/profile/ProfileHeader.tsx
 * @description 프로필 헤더 컴포넌트
 *
 * 이 컴포넌트는 프로필 페이지의 헤더 섹션을 표시합니다.
 *
 * 주요 기능:
 * 1. 프로필 이미지 (150px Desktop / 90px Mobile)
 * 2. 사용자명, 전체 이름
 * 3. 통계 (게시물 수, 팔로워 수, 팔로잉 수)
 * 4. "팔로우" 또는 "팔로잉" 버튼 (다른 사람 프로필일 때)
 *
 * @dependencies
 * - next/image: 이미지 컴포넌트
 * - types/post: 타입 정의
 */

import Image from "next/image";
import { ProfileInfo } from "@/types/post";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  user: ProfileInfo;
  isOwnProfile: boolean;
  isFollowing: boolean;
}

export default function ProfileHeader({
  user,
  isOwnProfile,
  isFollowing,
}: ProfileHeaderProps) {
  /**
   * 팔로우 버튼 클릭 핸들러 (3-3에서 구현 예정)
   */
  const handleFollowClick = () => {
    console.log("[ProfileHeader] 팔로우 버튼 클릭:", {
      userId: user.id,
      isFollowing,
    });
    // TODO: 3-3에서 팔로우/언팔로우 기능 구현
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 px-4 py-6 md:py-8">
      {/* 프로필 이미지 (150px Desktop / 90px Mobile) */}
      <div className="flex-shrink-0 flex justify-center md:justify-start">
        <div className="w-[90px] h-[90px] md:w-[150px] md:h-[150px] rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          {user.image_url ? (
            <Image
              src={user.image_url}
              alt={user.name}
              width={150}
              height={150}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-2xl md:text-4xl font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* 프로필 정보 */}
      <div className="flex-1 flex flex-col gap-4">
        {/* 사용자명 + 버튼 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-[#262626]">
            {user.name}
          </h1>

          {/* 버튼 영역 */}
          {!isOwnProfile && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleFollowClick}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-semibold transition-all",
                  isFollowing
                    ? "bg-[#efefef] text-[#262626] hover:bg-[#dbdbdb] hover:border-[#ed4956] hover:text-[#ed4956] border border-transparent"
                    : "bg-[#0095f6] text-white hover:bg-[#1877f2]",
                )}
                onMouseEnter={(e) => {
                  if (isFollowing) {
                    e.currentTarget.textContent = "언팔로우";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isFollowing) {
                    e.currentTarget.textContent = "팔로잉";
                  }
                }}
              >
                {isFollowing ? "팔로잉" : "팔로우"}
              </button>
            </div>
          )}
        </div>

        {/* 통계 (게시물 수, 팔로워 수, 팔로잉 수) */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-[#262626]">
              {user.posts_count || 0}
            </span>
            <span className="text-[#8e8e8e]">게시물</span>
          </div>
          <button className="flex items-center gap-1 hover:opacity-50 transition-opacity">
            <span className="font-semibold text-[#262626]">
              {user.followers_count || 0}
            </span>
            <span className="text-[#8e8e8e]">팔로워</span>
          </button>
          <button className="flex items-center gap-1 hover:opacity-50 transition-opacity">
            <span className="font-semibold text-[#262626]">
              {user.following_count || 0}
            </span>
            <span className="text-[#8e8e8e]">팔로잉</span>
          </button>
        </div>

        {/* 전체 이름 (name 필드 사용) */}
        <div>
          <p className="font-semibold text-[#262626]">{user.name}</p>
        </div>
      </div>
    </div>
  );
}
