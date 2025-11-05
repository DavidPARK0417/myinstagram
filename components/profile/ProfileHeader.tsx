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
 * 5. 팔로우/언팔로우 기능
 *
 * @dependencies
 * - next/image: 이미지 컴포넌트
 * - types/post: 타입 정의
 */

import { useState } from "react";
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
  isFollowing: initialIsFollowing,
}: ProfileHeaderProps) {
  // 팔로우 상태 관리
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(
    user.followers_count || 0,
  );

  /**
   * 팔로우 버튼 클릭 핸들러
   */
  const handleFollowClick = async () => {
    if (isLoading) return;

    console.group(`[ProfileHeader] 팔로우 버튼 클릭 - user_id: ${user.id}`);
    console.log("현재 상태:", { isFollowing, followersCount });

    setIsLoading(true);

    try {
      const url = "/api/follows";
      const method = isFollowing ? "DELETE" : "POST";
      const body = JSON.stringify({ following_id: user.id });

      console.log(`API 호출: ${method} ${url}`, { following_id: user.id });

      // Optimistic Update: 즉시 UI 업데이트
      const newIsFollowing = !isFollowing;
      const newFollowersCount = newIsFollowing
        ? followersCount + 1
        : followersCount - 1;

      setIsFollowing(newIsFollowing);
      setFollowersCount(newFollowersCount);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      console.log("📡 응답 상태:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ API 호출 실패:", data);
        // 실패 시 롤백
        setIsFollowing(isFollowing);
        setFollowersCount(followersCount);
        throw new Error(data.message || "팔로우 처리 중 오류가 발생했습니다.");
      }

      console.log("✅ 상태 업데이트:", {
        isFollowing: newIsFollowing,
        followersCount: newFollowersCount,
      });
    } catch (error) {
      console.error("❌ 팔로우 처리 오류:", error);
      // 에러 발생 시 사용자에게 알림
      alert(
        error instanceof Error
          ? error.message
          : "팔로우 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
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
                disabled={isLoading}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-semibold transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isFollowing
                    ? "bg-[#efefef] text-[#262626] hover:bg-[#dbdbdb] hover:border-[#ed4956] hover:text-[#ed4956] border border-transparent"
                    : "bg-[#0095f6] text-white hover:bg-[#1877f2]",
                )}
                onMouseEnter={(e) => {
                  if (isFollowing && !isLoading) {
                    e.currentTarget.textContent = "언팔로우";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isFollowing && !isLoading) {
                    e.currentTarget.textContent = "팔로잉";
                  }
                }}
              >
                {isLoading ? "처리 중..." : isFollowing ? "팔로잉" : "팔로우"}
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
              {followersCount}
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
