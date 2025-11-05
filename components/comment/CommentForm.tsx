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
 * 6. 이모지 피커 기능 (댓글에 이모지 삽입)
 *
 * @dependencies
 * - types/post: CommentWithUser 타입
 * - emoji-picker-react: 이모지 피커 컴포넌트
 */

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  /**
   * 이모지 선택 핸들러
   * 선택한 이모지를 textarea에 삽입하고 피커를 닫습니다.
   */
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    console.group(`[CommentForm] 이모지 선택`);
    console.log("선택한 이모지:", emojiData.emoji);

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const textBefore = content.substring(0, start);
      const textAfter = content.substring(end);
      const newContent = textBefore + emojiData.emoji + textAfter;

      setContent(newContent);
      console.log("✅ 이모지 삽입 완료");

      // 커서 위치를 삽입된 이모지 뒤로 이동
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + emojiData.emoji.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // textarea ref가 없으면 텍스트 끝에 추가
      setContent((prev) => prev + emojiData.emoji);
      console.log("✅ 이모지 추가 완료 (텍스트 끝)");
    }

    setShowEmojiPicker(false);
    console.log("✅ 이모지 피커 닫기");
    console.groupEnd();
  };

  /**
   * 외부 클릭 감지 - 이모지 피커 닫기
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        console.log("[CommentForm] 외부 클릭 감지 - 이모지 피커 닫기");
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      console.log("[CommentForm] 이모지 피커 열림");
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // 제출 가능 여부 (빈 값이 아니고 로딩 중이 아닐 때)
  const canSubmit = content.trim().length > 0 && !isLoading;

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-[#dbdbdb]">
      {/* 이모지 버튼 */}
      <div className="relative" ref={emojiPickerRef}>
        <button
          onClick={() => {
            console.log(
              `[CommentForm] 이모지 버튼 클릭 - 피커 ${
                showEmojiPicker ? "닫기" : "열기"
              }`,
            );
            setShowEmojiPicker(!showEmojiPicker);
          }}
          className="text-[#262626] hover:opacity-50 transition-opacity cursor-pointer"
          title="이모지 추가"
          type="button"
        >
          <span className="text-xl">😊</span>
        </button>

        {/* 이모지 피커 */}
        {showEmojiPicker && (
          <div className="absolute bottom-full mb-2 left-0 z-50 shadow-lg rounded-lg overflow-hidden border border-[#dbdbdb] bg-white">
            {/* Desktop: 350x400, Mobile: 280x320 */}
            <div className="hidden md:block">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={350}
                height={400}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
              />
            </div>
            {/* Mobile */}
            <div className="block md:hidden">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={280}
                height={320}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
              />
            </div>
          </div>
        )}
      </div>

      {/* 댓글 입력창 */}
      <textarea
        ref={textareaRef}
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
