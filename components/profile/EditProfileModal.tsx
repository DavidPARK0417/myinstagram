"use client";

/**
 * @file components/profile/EditProfileModal.tsx
 * @description 프로필 편집 모달 컴포넌트
 *
 * 이 컴포넌트는 Instagram 스타일의 프로필 편집 모달을 제공합니다.
 *
 * 주요 기능:
 * 1. 이름 변경 입력 필드
 * 2. 프로필 이미지 변경 (Clerk 이미지 URL 업데이트)
 * 3. 저장 버튼
 * 4. 로딩 상태 처리
 *
 * @dependencies
 * - components/ui/dialog: Dialog 모달 컴포넌트
 * - components/ui/button: Button 컴포넌트
 * - components/ui/input: Input 컴포넌트
 * - lucide-react: 아이콘 라이브러리
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ProfileInfo } from "@/types/post";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ProfileInfo;
  onUpdate?: (updatedUser: ProfileInfo) => void;
}

export default function EditProfileModal({
  open,
  onOpenChange,
  user,
  onUpdate,
}: EditProfileModalProps) {
  // 상태 관리
  const [name, setName] = useState(user.name);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 모달이 열릴 때 초기값 설정
  useEffect(() => {
    if (open) {
      setName(user.name);
    }
  }, [open, user.name]);

  // 저장 핸들러
  const handleSave = async () => {
    if (!name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    if (name.trim() === user.name) {
      // 변경사항이 없으면 모달만 닫기
      onOpenChange(false);
      return;
    }

    console.group("[EditProfileModal] 프로필 업데이트 시작");
    console.log("업데이트할 데이터:", {
      userId: user.id,
      currentName: user.name,
      newName: name.trim(),
    });

    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ API 호출 실패:", data);
        throw new Error(
          data.message || "프로필 업데이트 중 오류가 발생했습니다.",
        );
      }

      console.log("✅ 프로필 업데이트 성공:", data.user);
      console.groupEnd();

      // 업데이트된 사용자 정보 전달
      if (onUpdate && data.user) {
        onUpdate(data.user);
      }

      // 모달 닫기
      onOpenChange(false);

      // 페이지 새로고침 (프로필 정보 업데이트)
      router.refresh();
    } catch (error) {
      console.error("❌ 프로필 업데이트 오류:", error);
      console.groupEnd();
      alert(
        error instanceof Error
          ? error.message
          : "프로필 업데이트 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#dbdbdb] flex-shrink-0">
          <DialogTitle className="text-center text-lg font-semibold text-[#262626]">
            프로필 편집
          </DialogTitle>
        </DialogHeader>

        {/* 메인 컨텐츠 - 스크롤 가능 */}
        <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* 프로필 이미지 영역 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              {user.image_url ? (
                <Image
                  src={user.image_url}
                  alt={user.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-2xl font-semibold text-gray-500">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-[#8e8e8e]">
              프로필 이미지는 Clerk에서 관리됩니다.
            </p>
          </div>

          {/* 이름 입력 영역 */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-semibold text-[#262626]"
            >
              이름
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              maxLength={50}
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-xs text-[#8e8e8e]">
              최대 50자까지 입력할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 푸터 - 고정 */}
        <DialogFooter className="px-6 pb-6 pt-4 border-t border-[#dbdbdb] flex-shrink-0">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !name.trim()}
              className={cn(
                "flex-1",
                "bg-[#0095f6] hover:bg-[#0095f6]/90 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
