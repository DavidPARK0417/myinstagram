"use client";

/**
 * @file components/profile/FollowListModal.tsx
 * @description 팔로워/팔로잉 목록 모달 컴포넌트
 *
 * 이 컴포넌트는 Instagram 스타일의 팔로워/팔로잉 목록 모달을 제공합니다.
 *
 * 주요 기능:
 * 1. 탭으로 "팔로워" / "팔로잉" 전환
 * 2. 사용자 목록 표시
 * 3. 팔로잉 목록에서 언팔로우 버튼 표시
 * 4. 언팔로우 기능 구현
 * 5. 로딩 상태 및 에러 처리
 *
 * @dependencies
 * - components/ui/dialog: Dialog 모달 컴포넌트
 * - components/ui/button: Button 컴포넌트
 * - next/image: 이미지 컴포넌트
 * - next/link: 링크 컴포넌트
 * - types/post: 타입 정의
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, FollowListResponse } from "@/types/post";

interface FollowListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialTab?: "followers" | "following";
  onUnfollow?: () => void;
  isOwnProfile?: boolean; // 내 프로필에서 열렸는지 여부
}

export default function FollowListModal({
  open,
  onOpenChange,
  userId,
  initialTab = "followers",
  onUnfollow,
  isOwnProfile = false,
}: FollowListModalProps) {
  const { user: clerkUser } = useUser();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    initialTab,
  );
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
  const [unfollowingUserId, setUnfollowingUserId] = useState<string | null>(
    null,
  );
  const router = useRouter();

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (open) {
      if (activeTab === "followers" && followers.length === 0) {
        loadFollowers();
      } else if (activeTab === "following" && following.length === 0) {
        loadFollowing();
      }
    }
  }, [open, activeTab]);

  // 모달이 열릴 때 초기 탭 설정
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  // 팔로워 목록 로드
  const loadFollowers = async () => {
    setIsLoadingFollowers(true);
    console.group("[FollowListModal] 팔로워 목록 로드 시작");

    try {
      const response = await fetch(`/api/users/${userId}/followers`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API 호출 실패:", errorData);
        throw new Error(
          errorData.message || "팔로워 목록을 불러오는데 실패했습니다.",
        );
      }

      const data: FollowListResponse = await response.json();
      console.log("✅ 팔로워 목록 로드 성공:", data);
      setFollowers(data.users);
    } catch (error) {
      console.error("❌ 팔로워 목록 로드 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "팔로워 목록을 불러오는데 실패했습니다.",
      );
    } finally {
      setIsLoadingFollowers(false);
      console.groupEnd();
    }
  };

  // 팔로잉 목록 로드
  const loadFollowing = async () => {
    setIsLoadingFollowing(true);
    console.group("[FollowListModal] 팔로잉 목록 로드 시작");

    try {
      const response = await fetch(`/api/users/${userId}/following`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API 호출 실패:", errorData);
        throw new Error(
          errorData.message || "팔로잉 목록을 불러오는데 실패했습니다.",
        );
      }

      const data: FollowListResponse = await response.json();
      console.log("✅ 팔로잉 목록 로드 성공:", data);
      setFollowing(data.users);
    } catch (error) {
      console.error("❌ 팔로잉 목록 로드 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "팔로잉 목록을 불러오는데 실패했습니다.",
      );
    } finally {
      setIsLoadingFollowing(false);
      console.groupEnd();
    }
  };

  // 언팔로우 핸들러
  const handleUnfollow = async (targetUserId: string) => {
    if (unfollowingUserId) return; // 이미 처리 중인 경우

    console.group(`[FollowListModal] 언팔로우 시작 - user_id: ${targetUserId}`);
    setUnfollowingUserId(targetUserId);

    try {
      const response = await fetch("/api/follows", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ following_id: targetUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API 호출 실패:", errorData);
        throw new Error(
          errorData.message || "언팔로우 처리 중 오류가 발생했습니다.",
        );
      }

      console.log("✅ 언팔로우 성공");
      console.groupEnd();

      // 목록에서 제거
      setFollowing((prev) => prev.filter((user) => user.id !== targetUserId));

      // 콜백 호출 (프로필 헤더의 팔로잉 수 업데이트)
      if (onUnfollow) {
        onUnfollow();
      }

      // 페이지 새로고침
      router.refresh();
    } catch (error) {
      console.error("❌ 언팔로우 오류:", error);
      console.groupEnd();
      alert(
        error instanceof Error
          ? error.message
          : "언팔로우 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setUnfollowingUserId(null);
    }
  };

  // 팔로우/언팔로우 토글 핸들러 (두 탭 공통)
  const handleToggleFollow = async (
    targetUserId: string,
    willFollow: boolean,
  ) => {
    console.group(
      `[FollowListModal] 팔로우 토글 시작 - target: ${targetUserId}, willFollow: ${willFollow}`,
    );

    try {
      const response = await fetch("/api/follows", {
        method: willFollow ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: targetUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API 호출 실패:", errorData);
        throw new Error(
          errorData.message || "팔로우 상태를 변경하는 중 오류가 발생했습니다.",
        );
      }

      // UI 업데이트: 현재 탭의 목록에서 플래그 토글
      if (activeTab === "followers") {
        setFollowers((prev) =>
          prev.map((u) =>
            u.id === targetUserId
              ? { ...u, isFollowedByViewer: willFollow }
              : u,
          ),
        );
      } else {
        // following 탭
        if (!willFollow && isOwnProfile) {
          // 내 프로필의 팔로잉 탭에서 언팔로우 시 항목 제거
          setFollowing((prev) => prev.filter((u) => u.id !== targetUserId));
          if (onUnfollow) onUnfollow();
        } else {
          setFollowing((prev) =>
            prev.map((u) =>
              u.id === targetUserId
                ? { ...u, isFollowedByViewer: willFollow }
                : u,
            ),
          );
        }
      }

      console.log("✅ 팔로우 토글 성공", {
        targetUserId,
        willFollow,
        tab: activeTab,
      });
      router.refresh();
    } catch (error) {
      console.error("❌ 팔로우 토글 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "팔로우 상태를 변경하는 중 오류가 발생했습니다.",
      );
    } finally {
      console.groupEnd();
    }
  };

  const currentList = activeTab === "followers" ? followers : following;
  const isLoading =
    activeTab === "followers" ? isLoadingFollowers : isLoadingFollowing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-[#dbdbdb] flex-shrink-0">
          <DialogTitle className="text-center text-base font-semibold text-[#262626]">
            팔로워/팔로잉
          </DialogTitle>
        </DialogHeader>

        {/* 탭 */}
        <div className="flex border-b border-[#dbdbdb] flex-shrink-0">
          <button
            onClick={() => setActiveTab("followers")}
            className={cn(
              "flex-1 py-3 text-sm font-semibold transition-colors",
              "border-b-2 border-transparent",
              activeTab === "followers"
                ? "text-[#262626] border-[#262626]"
                : "text-[#8e8e8e] hover:text-[#262626]",
            )}
          >
            팔로워
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={cn(
              "flex-1 py-3 text-sm font-semibold transition-colors",
              "border-b-2 border-transparent",
              activeTab === "following"
                ? "text-[#262626] border-[#262626]"
                : "text-[#8e8e8e] hover:text-[#262626]",
            )}
          >
            팔로잉
          </button>
        </div>

        {/* 목록 영역 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[#8e8e8e]">로딩 중...</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[#8e8e8e]">
                {activeTab === "followers"
                  ? "팔로워가 없습니다."
                  : "팔로잉이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#dbdbdb]">
              {currentList.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa] transition-colors"
                >
                  {/* 프로필 이미지 */}
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={() => onOpenChange(false)}
                    className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0"
                  >
                    {user.image_url ? (
                      <Image
                        src={user.image_url}
                        alt={user.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-lg font-semibold text-gray-500">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* 사용자 정보 */}
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={() => onOpenChange(false)}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-semibold text-[#262626] truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-[#8e8e8e] truncate">
                      {user.name}
                    </p>
                  </Link>

                  {/* 액션 버튼 (두 탭 공통: 팔로우/언팔로우) - 본인 계정이면 버튼 숨김 */}
                  {user.clerk_id !== clerkUser?.id && (
                    <Button
                      onClick={() =>
                        handleToggleFollow(
                          user.id,
                          !(user.isFollowedByViewer === true),
                        )
                      }
                      variant="outline"
                      size="sm"
                      className={cn(
                        "px-4 py-1.5 h-8 text-sm font-semibold rounded-md",
                        "bg-white text-[#262626] border border-[#dbdbdb]",
                        "hover:bg-[#fafafa]",
                      )}
                    >
                      {user.isFollowedByViewer ? "언팔로우" : "팔로우"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
