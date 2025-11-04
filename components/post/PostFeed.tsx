"use client";

/**
 * @file components/post/PostFeed.tsx
 * @description Instagram 스타일 게시물 피드 컴포넌트
 *
 * 이 컴포넌트는 게시물 목록을 표시하고 로딩 상태를 처리합니다.
 *
 * 주요 기능:
 * 1. 게시물 목록 표시 (PostCard 컴포넌트 사용)
 * 2. 로딩 상태 처리 (PostCardSkeleton 사용)
 * 3. 빈 상태 처리
 *
 * @dependencies
 * - components/post/PostCard: 게시물 카드 컴포넌트
 * - components/post/PostCardSkeleton: 로딩 UI 컴포넌트
 * - types/post: 타입 정의
 */

import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";
import { PostWithDetails } from "@/types/post";

interface PostFeedProps {
  posts?: PostWithDetails[];
  isLoading?: boolean;
  error?: string | null;
}

export default function PostFeed({
  posts,
  isLoading = false,
  error = null,
}: PostFeedProps) {
  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-[#8e8e8e] text-sm">
          게시물을 불러오는 중 오류가 발생했습니다.
        </p>
        <p className="text-[#8e8e8e] text-xs mt-2">{error}</p>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <PostCardSkeleton key={`skeleton-${index}`} />
        ))}
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
    </div>
  );
}
