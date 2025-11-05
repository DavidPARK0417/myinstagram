"use client";

/**
 * @file components/comment/CommentList.tsx
 * @description 댓글 목록 표시 컴포넌트
 *
 * 이 컴포넌트는 게시물의 댓글 목록을 표시합니다.
 *
 * 주요 기능:
 * 1. 댓글 목록 표시 (최신순)
 * 2. 각 댓글의 사용자 정보 (프로필 이미지, 이름)
 * 3. 댓글 내용 및 작성 시간
 * 4. 빈 상태 처리
 *
 * @dependencies
 * - types/post: CommentWithUser 타입
 * - lib/utils/format-time: 상대 시간 포맷팅
 */

import Link from "next/link";
import Image from "next/image";
import { CommentWithUser } from "@/types/post";
import { formatRelativeTime } from "@/lib/utils/format-time";

interface CommentListProps {
  comments: CommentWithUser[];
}

export default function CommentList({ comments }: CommentListProps) {
  // 댓글이 없을 때
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
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
        </div>
      ))}
    </div>
  );
}
