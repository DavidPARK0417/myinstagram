"use client";

/**
 * @file components/comment/CommentList.tsx
 * @description 댓글 목록 표시 컴포넌트 (무한 스크롤 지원)
 *
 * 이 컴포넌트는 게시물의 댓글 목록을 표시하고 무한 스크롤을 지원합니다.
 *
 * 주요 기능:
 * 1. 댓글 목록 표시 (최신순)
 * 2. 각 댓글의 사용자 정보 (프로필 이미지, 이름)
 * 3. 댓글 내용 및 작성 시간
 * 4. 댓글 삭제 기능 (CommentItem 사용)
 * 5. 무한 스크롤 (Intersection Observer 사용)
 * 6. 빈 상태 처리
 *
 * @dependencies
 * - types/post: CommentWithUser 타입
 * - components/comment/CommentItem: 댓글 항목 컴포넌트
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { CommentWithUser } from "@/types/post";
import CommentItem from "./CommentItem";

interface CommentListProps {
  postId: string;
  initialComments: CommentWithUser[];
  initialPage?: number;
  initialHasMore?: boolean;
  onCommentDeleted?: (commentId: string) => void;
}

export default function CommentList({
  postId,
  initialComments,
  initialPage = 1,
  initialHasMore = true,
  onCommentDeleted,
}: CommentListProps) {
  const [localComments, setLocalComments] =
    useState<CommentWithUser[]>(initialComments);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 초기 댓글이 변경되면 상태 업데이트
  useEffect(() => {
    setLocalComments(initialComments);
    setPage(initialPage);
    setHasMore(initialHasMore);
  }, [initialComments, initialPage, initialHasMore]);

  /**
   * 다음 페이지 댓글 로드
   */
  const loadMoreComments = useCallback(async () => {
    if (isLoading || !hasMore) return;

    console.group(`[CommentList] 다음 페이지 댓글 로드 - page: ${page + 1}`);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/comments?post_id=${postId}&page=${page + 1}&limit=20`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API 호출 실패:", response.status, errorData);
        throw new Error(
          errorData.message ||
            `댓글을 불러오는데 실패했습니다. (${response.status})`,
        );
      }

      const data = await response.json();
      const newComments: CommentWithUser[] = data.comments || [];
      const pagination = data.pagination || {};

      console.log("✅ 댓글 데이터 가져오기 성공:", {
        count: newComments.length,
        pagination,
      });

      if (newComments.length > 0) {
        // 새 댓글을 기존 배열에 추가
        setLocalComments((prev) => [...prev, ...newComments]);
        setPage((prev) => prev + 1);
        setHasMore(pagination.hasMore || false);
      } else {
        // 더 이상 불러올 데이터가 없음
        setHasMore(false);
      }
    } catch (err) {
      console.error("❌ 댓글 로드 오류:", err);
      setError(
        err instanceof Error ? err.message : "댓글을 불러오는데 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [postId, page, isLoading, hasMore]);

  /**
   * Intersection Observer 설정
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          console.log("[CommentList] 하단 도달 - 다음 페이지 로드");
          loadMoreComments();
        }
      },
      {
        threshold: 0.1,
      },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMoreComments]);

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

  // 댓글이 없을 때
  if (!localComments || localComments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {localComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onCommentDeleted={handleCommentDeleted}
        />
      ))}

      {/* 무한 스크롤 감지 영역 */}
      {hasMore && (
        <div ref={observerTarget} className="py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-[#8e8e8e]">
                댓글을 불러오는 중...
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center py-4">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
