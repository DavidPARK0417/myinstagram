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
 * 4. 댓글 삭제 기능 (CommentItem 사용)
 * 5. 빈 상태 처리
 *
 * @dependencies
 * - types/post: CommentWithUser 타입
 * - components/comment/CommentItem: 댓글 항목 컴포넌트
 */

import { useState } from "react";
import { CommentWithUser } from "@/types/post";
import CommentItem from "./CommentItem";

interface CommentListProps {
  comments: CommentWithUser[];
  onCommentDeleted?: (commentId: string) => void;
}

export default function CommentList({
  comments,
  onCommentDeleted,
}: CommentListProps) {
  const [localComments, setLocalComments] =
    useState<CommentWithUser[]>(comments);

  // 댓글이 없을 때
  if (!localComments || localComments.length === 0) {
    return null;
  }

  /**
   * 댓글 삭제 핸들러
   */
  const handleCommentDeleted = (commentId: string) => {
    console.group(`[CommentList] 댓글 삭제 처리 - comment_id: ${commentId}`);
    console.log("삭제 전 댓글 수:", localComments.length);

    // 로컬 상태에서 댓글 제거
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));

    console.log("✅ 댓글 삭제 완료 (로컬 상태 업데이트)");
    console.groupEnd();

    // 부모 컴포넌트에 알림
    if (onCommentDeleted) {
      onCommentDeleted(commentId);
    }
  };

  return (
    <div className="space-y-2">
      {localComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onCommentDeleted={handleCommentDeleted}
        />
      ))}
    </div>
  );
}
