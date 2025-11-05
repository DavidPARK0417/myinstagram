"use client";

/**
 * @file components/search/PostSearchResult.tsx
 * @description 게시물 검색 결과 아이템 컴포넌트
 *
 * 이 컴포넌트는 검색 결과 목록에서 개별 게시물을 표시합니다.
 *
 * 주요 기능:
 * 1. 게시물 이미지 미리보기 (정사각형 썸네일)
 * 2. 캡션 미리보기 (최대 2줄)
 * 3. 좋아요/댓글 수 표시
 * 4. 작성자 정보 표시
 * 5. 클릭 시 게시물 상세 페이지로 이동
 *
 * @dependencies
 * - next/image: 이미지 컴포넌트
 * - next/link: 링크 컴포넌트
 * - types/search: 타입 정의
 * - lucide-react: 아이콘 라이브러리
 */

import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { PostSearchResult as PostSearchResultType } from "@/types/search";
import { cn } from "@/lib/utils";

interface PostSearchResultProps {
  post: PostSearchResultType;
}

export default function PostSearchResult({ post }: PostSearchResultProps) {
  // 캡션 미리보기 (최대 2줄, 100자 제한)
  const captionPreview =
    post.caption && post.caption.length > 100
      ? `${post.caption.substring(0, 100)}...`
      : post.caption || "";

  return (
    <Link
      href={`/post/${post.id}`}
      className={cn(
        "flex items-start gap-4 px-4 py-3 rounded-lg transition-colors",
        "hover:bg-[#fafafa] cursor-pointer",
      )}
    >
      {/* 게시물 이미지 미리보기 */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
        <Image
          src={post.image_url}
          alt={captionPreview || "게시물 이미지"}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* 게시물 정보 */}
      <div className="flex-1 min-w-0">
        {/* 작성자 정보 */}
        <div className="flex items-center gap-2 mb-1">
          <div className="relative w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {post.user.image_url ? (
              <Image
                src={post.user.image_url}
                alt={post.user.name}
                fill
                className="object-cover"
                sizes="24px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-xs font-semibold text-gray-500">
                  {post.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-[#262626] truncate">
            {post.user.name}
          </p>
        </div>

        {/* 캡션 미리보기 */}
        {captionPreview && (
          <p className="text-sm text-[#262626] line-clamp-2 mb-2">
            {captionPreview}
          </p>
        )}

        {/* 좋아요/댓글 수 */}
        <div className="flex items-center gap-4 text-xs text-[#8e8e8e]">
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            <span>{post.likes_count.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            <span>{post.comments_count.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
