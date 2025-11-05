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
 * 5. "프로필 편집" 버튼 (내 프로필일 때)
 * 6. 팔로우/언팔로우 기능
 *
 * @dependencies
 * - next/image: 이미지 컴포넌트
 * - types/post: 타입 정의
 * - components/profile/EditProfileModal: 프로필 편집 모달
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { ProfileInfo } from "@/types/post";
import { cn } from "@/lib/utils";
import EditProfileModal from "./EditProfileModal";
import FollowListModal from "./FollowListModal";

interface ProfileHeaderProps {
  user: ProfileInfo;
  isOwnProfile: boolean;
  isFollowing: boolean;
}

export default function ProfileHeader({
  user,
  isOwnProfile: initialIsOwnProfile,
  isFollowing: initialIsFollowing,
}: ProfileHeaderProps) {
  // Clerk 사용자 정보로 이중 확인
  const { user: clerkUser } = useUser();
  const [isOwnProfile, setIsOwnProfile] = useState(initialIsOwnProfile);

  // 클라이언트 측에서도 본인 프로필 확인 (이중 방어)
  useEffect(() => {
    if (clerkUser) {
      // Clerk ID를 사용한 추가 확인
      const isOwn = user.clerk_id === clerkUser.id;

      console.log("🔍 [ProfileHeader] 프로필 소유자 확인:", {
        profileClerkId: user.clerk_id,
        currentClerkId: clerkUser.id,
        initialIsOwnProfile,
        calculatedIsOwnProfile: isOwn,
        mismatch: initialIsOwnProfile !== isOwn,
      });

      if (initialIsOwnProfile !== isOwn) {
        console.warn(
          "⚠️ [ProfileHeader] isOwnProfile 값 불일치 감지! 클라이언트 측 값으로 수정합니다.",
        );
        setIsOwnProfile(isOwn);
      } else {
        setIsOwnProfile(initialIsOwnProfile);
      }
    }
  }, [clerkUser, user.clerk_id, initialIsOwnProfile]);

  // 팔로우 상태 관리
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(
    user.followers_count || 0,
  );

  // user.id가 변경될 때 (다른 프로필로 이동) 상태 리셋
  useEffect(() => {
    console.log("🔄 [ProfileHeader] 사용자 변경 감지 - 상태 리셋:", {
      userId: user.id,
      initialIsFollowing,
      initialFollowersCount: user.followers_count,
    });
    setIsFollowing(initialIsFollowing);
    setFollowersCount(user.followers_count || 0);
  }, [user.id, initialIsFollowing, user.followers_count]);

  // initialIsFollowing prop이 변경될 때 상태 업데이트 (같은 프로필 재접근 시)
  useEffect(() => {
    console.log("🔄 [ProfileHeader] 팔로우 상태 동기화:", {
      initialIsFollowing,
      currentIsFollowing: isFollowing,
      mismatch: initialIsFollowing !== isFollowing,
    });

    // 항상 prop 값으로 동기화 (조건문 제거)
    if (initialIsFollowing !== isFollowing) {
      console.log("✅ [ProfileHeader] 팔로우 상태 업데이트:", {
        from: isFollowing,
        to: initialIsFollowing,
      });
      setIsFollowing(initialIsFollowing);
    }
  }, [initialIsFollowing]);

  // 프로필 편집 모달 상태 관리
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<ProfileInfo>(user);

  // 팔로워/팔로잉 모달 상태 관리
  const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
  const [followListModalTab, setFollowListModalTab] = useState<
    "followers" | "following"
  >("followers");

  // 사용자 정보 업데이트 핸들러
  const handleUserUpdate = (updatedUser: ProfileInfo) => {
    setCurrentUser(updatedUser);
  };

  // 팔로워 버튼 클릭 핸들러
  const handleFollowersClick = () => {
    if (!isOwnProfile) return; // 내 프로필에서만 클릭 가능
    console.log("🔄 [ProfileHeader] 팔로워 버튼 클릭");
    setFollowListModalTab("followers");
    setIsFollowListModalOpen(true);
  };

  // 팔로잉 버튼 클릭 핸들러
  const handleFollowingClick = () => {
    if (!isOwnProfile) return; // 내 프로필에서만 클릭 가능
    console.log("🔄 [ProfileHeader] 팔로잉 버튼 클릭");
    setFollowListModalTab("following");
    setIsFollowListModalOpen(true);
  };

  // 언팔로우 후 콜백 (팔로잉 수 업데이트)
  const handleUnfollow = () => {
    // 팔로잉 수 감소
    const currentFollowingCount = user.following_count || 0;
    // 실제로는 서버에서 받은 값으로 업데이트되지만, 즉시 UI 업데이트를 위해
    // 여기서는 페이지 새로고침으로 처리 (모달에서 이미 router.refresh() 호출)
  };

  /**
   * 팔로우 버튼 클릭 핸들러
   */
  const handleFollowClick = async () => {
    if (isLoading) return;

    // 자기 자신 팔로우 방지 (클라이언트 측 방어)
    if (isOwnProfile) {
      console.warn("⚠️ 자기 자신을 팔로우할 수 없습니다.");
      return;
    }

    console.group(`[ProfileHeader] 팔로우 버튼 클릭 - user_id: ${user.id}`);
    console.log("현재 상태:", { isFollowing, followersCount, isOwnProfile });

    setIsLoading(true);

    // 원래 상태 저장 (롤백용)
    const originalIsFollowing = isFollowing;
    const originalFollowersCount = followersCount;

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

      // 응답 본문 파싱
      let data: any = {};
      try {
        const responseText = await response.text();
        console.log("📄 응답 본문 (raw):", responseText);

        if (responseText) {
          try {
            data = JSON.parse(responseText);
            console.log("📦 파싱된 데이터:", data);
          } catch (parseError) {
            console.error("❌ JSON 파싱 실패:", parseError);
            // 파싱 실패 시에도 상태 코드로 에러 판단
            if (!response.ok) {
              throw new Error("서버 응답을 파싱할 수 없습니다.");
            }
          }
        } else {
          console.warn("⚠️ 응답 본문이 비어있습니다.");
        }
      } catch (textError) {
        console.error("❌ 응답 본문 읽기 실패:", textError);
        // 응답 본문 읽기 실패 시에도 상태 코드로 판단
        if (!response.ok) {
          throw new Error("서버 응답을 읽을 수 없습니다.");
        }
      }

      if (!response.ok) {
        console.error("❌ API 호출 실패:", {
          status: response.status,
          statusText: response.statusText,
          data,
        });

        // 실패 시 원래 상태로 롤백
        setIsFollowing(originalIsFollowing);
        setFollowersCount(originalFollowersCount);

        // 에러 메시지 추출
        const errorMessage =
          data?.message ||
          data?.error ||
          (response.status === 400 && "잘못된 요청입니다.") ||
          (response.status === 401 && "로그인이 필요합니다.") ||
          (response.status === 404 && "사용자를 찾을 수 없습니다.") ||
          (response.status === 409 && "이미 팔로우 중입니다.") ||
          `팔로우 처리 중 오류가 발생했습니다. (${response.status})`;

        throw new Error(errorMessage);
      }

      console.log("✅ 상태 업데이트:", {
        isFollowing: newIsFollowing,
        followersCount: newFollowersCount,
      });
    } catch (error) {
      console.error("❌ 팔로우 처리 오류:", error);

      // 에러 발생 시 원래 상태로 롤백 (이중 방어)
      setIsFollowing(originalIsFollowing);
      setFollowersCount(originalFollowersCount);

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
          {currentUser.image_url ? (
            <Image
              src={currentUser.image_url}
              alt={currentUser.name}
              width={150}
              height={150}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-2xl md:text-4xl font-semibold">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* 프로필 정보 */}
      <div className="flex-1 flex flex-col gap-4">
        {/* 사용자명 + 버튼 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-[#262626]">
            {currentUser.name}
          </h1>

          {/* 버튼 영역 */}
          {isOwnProfile ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-semibold transition-all",
                  "bg-[#efefef] text-[#262626] hover:bg-[#dbdbdb]",
                  "border border-[#dbdbdb]",
                )}
              >
                프로필 편집
              </button>
            </div>
          ) : (
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
          <button
            onClick={handleFollowersClick}
            disabled={!isOwnProfile}
            className={cn(
              "flex items-center gap-1 transition-opacity",
              isOwnProfile
                ? "hover:opacity-50 cursor-pointer"
                : "cursor-default opacity-100",
            )}
          >
            <span className="font-semibold text-[#262626]">
              {followersCount}
            </span>
            <span className="text-[#8e8e8e]">팔로워</span>
          </button>
          <button
            onClick={handleFollowingClick}
            disabled={!isOwnProfile}
            className={cn(
              "flex items-center gap-1 transition-opacity",
              isOwnProfile
                ? "hover:opacity-50 cursor-pointer"
                : "cursor-default opacity-100",
            )}
          >
            <span className="font-semibold text-[#262626]">
              {user.following_count || 0}
            </span>
            <span className="text-[#8e8e8e]">팔로잉</span>
          </button>
        </div>

        {/* 전체 이름 (name 필드 사용) */}
        <div>
          <p className="font-semibold text-[#262626]">{currentUser.name}</p>
        </div>
      </div>

      {/* 프로필 편집 모달 */}
      <EditProfileModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        user={currentUser}
        onUpdate={handleUserUpdate}
      />

      {/* 팔로워/팔로잉 목록 모달 */}
      {isOwnProfile && (
        <FollowListModal
          open={isFollowListModalOpen}
          onOpenChange={setIsFollowListModalOpen}
          userId={user.id}
          initialTab={followListModalTab}
          onUnfollow={handleUnfollow}
        />
      )}
    </div>
  );
}
