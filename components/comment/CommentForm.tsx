"use client";

/**
 * @file components/comment/CommentForm.tsx
 * @description 댓글 작성 폼 컴포넌트
 *
 * 이 컴포넌트는 게시물에 댓글을 작성하는 폼을 제공합니다.
 *
 * 주요 기능:
 * 1. "댓글 달기..." placeholder 입력창
 * 2. Enter 키로 제출 (Shift+Enter는 줄바꿈)
 * 3. "게시" 버튼 (댓글 입력 시에만 활성화)
 * 4. 로딩 상태 처리
 * 5. API 호출 및 에러 처리
 *
 * @dependencies
 * - types/post: CommentWithUser 타입
 */

import { useState, KeyboardEvent } from "react";
import { CommentWithUser } from "@/types/post";

interface CommentFormProps {
  postId: string;
  onCommentAdded: (comment: CommentWithUser) => void;
}

export default function CommentForm({
  postId,
  onCommentAdded,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 댓글 제출 핸들러
   */
  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isLoading) return;

    console.group(`[CommentForm] 댓글 작성 - post_id: ${postId}`);
    console.log("댓글 내용:", trimmedContent);

    setIsLoading(true);

    try {
      const url = "/api/comments";
      const body = JSON.stringify({ post_id: postId, content: trimmedContent });

      console.log(`API 호출: POST ${url}`, { post_id: postId });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ API 호출 실패:", data);
        throw new Error(data.message || "댓글 작성 중 오류가 발생했습니다.");
      }

      console.log("✅ 댓글 작성 성공:", data.comment);

      // 입력창 초기화
      setContent("");

      // 부모 컴포넌트에 알림
      onCommentAdded(data.comment);

      console.log("✅ 댓글 추가 완료");
    } catch (error) {
      console.error("❌ 댓글 작성 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "댓글 작성 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  /**
   * Enter 키 핸들러
   * - Enter: 제출
   * - Shift+Enter: 줄바꿈 (기본 동작)
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 제출 가능 여부 (빈 값이 아니고 로딩 중이 아닐 때)
  const canSubmit = content.trim().length > 0 && !isLoading;

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-[#dbdbdb]">
      {/* 이모지 버튼 (UI만) */}
      <button
        className="text-[#262626] hover:opacity-50 transition-opacity cursor-not-allowed opacity-50"
        disabled
        title="이모지 기능은 준비 중입니다"
      >
        <span className="text-xl">😊</span>
      </button>

      {/* 댓글 입력창 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="댓글 달기..."
        disabled={isLoading}
        rows={1}
        className="flex-1 text-sm resize-none bg-transparent border-none outline-none placeholder:text-[#8e8e8e] text-[#262626] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          minHeight: "18px",
          maxHeight: "80px",
          overflow: "auto",
        }}
      />

      {/* 게시 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`text-sm font-semibold transition-opacity ${
          canSubmit
            ? "text-[#0095f6] hover:text-[#00376b] cursor-pointer"
            : "text-[#0095f6] opacity-30 cursor-not-allowed"
        }`}
      >
        {isLoading ? "게시 중..." : "게시"}
      </button>
    </div>
  );
}
