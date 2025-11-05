"use client";

/**
 * @file components/comment/CommentItem.tsx
 * @description 댓글 항목 컴포넌트 (삭제 기능 포함)
 *
 * 이 컴포넌트는 단일 댓글을 표시하고 삭제 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 댓글 내용 표시 (프로필 이미지, 사용자명, 내용, 시간)
 * 2. 본인 댓글만 삭제 버튼 표시 (⋯ 메뉴)
 * 3. 삭제 확인 다이얼로그
 * 4. 삭제 API 호출 및 상태 업데이트
 *
 * @dependencies
 * - types/post: CommentWithUser 타입
 * - lib/utils/format-time: 상대 시간 포맷팅
 * - @clerk/nextjs: useUser 훅
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MoreVertical, Trash2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { CommentWithUser } from "@/types/post";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { cn } from "@/lib/utils";

interface CommentItemProps {
  comment: CommentWithUser;
  onCommentDeleted?: (commentId: string) => void;
}

export default function CommentItem({
  comment,
  onCommentDeleted,
}: CommentItemProps) {
  const { user: clerkUser } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 본인 댓글인지 확인 (Clerk user ID와 comment.user.clerk_id 비교)
  const isOwnComment = clerkUser?.id === comment.user.clerk_id;

  /**
   * 댓글 삭제 핸들러
   */
  const handleDelete = async () => {
    if (isDeleting) return;

    console.group(`[CommentItem] 댓글 삭제 - comment_id: ${comment.id}`);
    console.log("댓글 정보:", comment);

    setIsDeleting(true);

    try {
      const url = "/api/comments";
      const body = JSON.stringify({ comment_id: comment.id });

      console.log(`API 호출: DELETE ${url}`, { comment_id: comment.id });

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ API 호출 실패:", data);
        throw new Error(data.message || "댓글 삭제 중 오류가 발생했습니다.");
      }

      console.log("✅ 댓글 삭제 성공");

      // 다이얼로그 닫기
      setIsDeleteDialogOpen(false);
      setIsMenuOpen(false);

      // 부모 컴포넌트에 알림
      if (onCommentDeleted) {
        onCommentDeleted(comment.id);
      }

      console.log("✅ 댓글 삭제 완료");
    } catch (error) {
      console.error("❌ 댓글 삭제 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "댓글 삭제 중 오류가 발생했습니다.",
      );
    } finally {
      setIsDeleting(false);
      console.groupEnd();
    }
  };

  return (
    <>
      <div className="flex gap-3 group">
        {/* 프로필 이미지 (32px 원형) */}
        <Link
          href={`/profile/${comment.user.id}`}
          className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
        >
          {comment.user.image_url ? (
            <Image
              src={comment.user.image_url}
              alt={comment.user.name}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs font-semibold">
              {comment.user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        {/* 댓글 내용 */}
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <Link
              href={`/profile/${comment.user.id}`}
              className="font-semibold text-[#262626] hover:opacity-50 transition-opacity"
            >
              {comment.user.name}
            </Link>{" "}
            <span className="text-[#262626] break-words">
              {comment.content}
            </span>
          </div>
          {/* 작성 시간 */}
          <div className="text-xs text-[#8e8e8e] mt-1">
            {formatRelativeTime(comment.created_at)}
          </div>
        </div>

        {/* 삭제 메뉴 (본인 댓글만 표시) */}
        {isOwnComment && (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "text-[#8e8e8e] hover:text-[#262626] transition-colors p-1",
                "opacity-0 group-hover:opacity-100",
              )}
              aria-label="댓글 메뉴"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* 드롭다운 메뉴 */}
            {isMenuOpen && (
              <>
                {/* 백드롭 (클릭 시 메뉴 닫기) */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                {/* 메뉴 */}
                <div className="absolute right-0 top-6 z-20 bg-white border border-[#dbdbdb] rounded-lg shadow-lg min-w-[160px]">
                  <button
                    onClick={() => {
                      setIsDeleteDialogOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 text-left flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-[#262626] mb-2">
              댓글 삭제
            </h3>
            <p className="text-sm text-[#8e8e8e] mb-6">
              이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-[#262626] hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
