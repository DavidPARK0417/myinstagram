"use client";

/**
 * @file components/post/PostFeed.tsx
 * @description Instagram 스타일 게시물 피드 컴포넌트 (무한 스크롤)
 *
 * 이 컴포넌트는 게시물 목록을 표시하고 무한 스크롤을 구현합니다.
 *
 * 주요 기능:
 * 1. 게시물 목록 표시 (PostCard 컴포넌트 사용)
 * 2. 무한 스크롤 (Intersection Observer 사용)
 * 3. 로딩 상태 처리 (PostCardSkeleton 사용)
 * 4. 빈 상태 처리
 * 5. 페이지네이션 (10개씩)
 *
 * @dependencies
 * - components/post/PostCard: 게시물 카드 컴포넌트
 * - components/post/PostCardSkeleton: 로딩 UI 컴포넌트
 * - types/post: 타입 정의
 */

import { useState, useEffect, useRef, useCallback } from "react";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";
import { PostWithDetails } from "@/types/post";

interface PostFeedProps {
  initialPosts?: PostWithDetails[];
  initialPage?: number;
  initialHasMore?: boolean;
  initialError?: string | null;
}

export default function PostFeed({
  initialPosts = [],
  initialPage = 1,
  initialHasMore = true,
  initialError = null,
}: PostFeedProps) {
  const [posts, setPosts] = useState<PostWithDetails[]>(initialPosts);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(initialError);
  const observerTarget = useRef<HTMLDivElement>(null);

  /**
   * 다음 페이지 게시물 로드
   */
  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return;

    console.group(`[PostFeed] 다음 페이지 로드 - page: ${page + 1}`);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts?page=${page + 1}&limit=10`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API 호출 실패:", response.status, errorData);
        throw new Error(
          errorData.message ||
            `게시물을 불러오는데 실패했습니다. (${response.status})`,
        );
      }

      const data = await response.json();
      const newPosts: PostWithDetails[] = data.posts || [];
      const pagination = data.pagination || {};

      console.log("✅ 게시물 데이터 가져오기 성공:", {
        count: newPosts.length,
        pagination,
      });

      if (newPosts.length > 0) {
        // 새 게시물을 기존 배열에 추가
        setPosts((prev) => [...prev, ...newPosts]);
        setPage((prev) => prev + 1);
        setHasMore(pagination.hasMore || false);
      } else {
        // 더 이상 불러올 데이터가 없음
        setHasMore(false);
      }
    } catch (err) {
      console.error("❌ 게시물 로드 오류:", err);
      setError(
        err instanceof Error
          ? err.message
          : "게시물을 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  }, [page, isLoading, hasMore]);

  /**
   * Intersection Observer 설정
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          console.log("[PostFeed] 하단 도달, 다음 페이지 로드");
          loadMorePosts();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
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
  }, [loadMorePosts, hasMore, isLoading]);

  // 에러 상태
  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-[#8e8e8e] text-sm">
          게시물을 불러오는 중 오류가 발생했습니다.
        </p>
        <p className="text-[#8e8e8e] text-xs mt-2">{error}</p>
      </div>
    );
  }

  // 빈 상태
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-[#8e8e8e] text-sm">게시물이 없습니다.</p>
      </div>
    );
  }

  // 게시물 목록 표시
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.post_id} post={post} />
      ))}

      {/* 하단 감지 요소 (Intersection Observer 타겟) */}
      {hasMore && (
        <div
          ref={observerTarget}
          className="h-20 flex items-center justify-center"
        >
          {isLoading && (
            <div className="space-y-4 w-full">
              {Array.from({ length: 2 }).map((_, index) => (
                <PostCardSkeleton key={`skeleton-loading-${index}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 마지막 페이지 표시 */}
      {!hasMore && posts.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <p className="text-[#8e8e8e] text-sm">모든 게시물을 불러왔습니다.</p>
        </div>
      )}
    </div>
  );
}
