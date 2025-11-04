"use client";

/**
 * @file components/post/PostCard.tsx
 * @description Instagram 스타일 게시물 카드 컴포넌트
 *
 * 이 컴포넌트는 Instagram과 유사한 게시물 카드를 표시합니다.
 *
 * 주요 기능:
 * 1. 헤더 섹션 (프로필 이미지 32px, 사용자명, 시간, ⋯ 메뉴)
 * 2. 이미지 영역 (1:1 정사각형 비율)
 * 3. 액션 버튼 (좋아요, 댓글, 공유(UI만), 북마크(UI만))
 * 4. 컨텐츠 섹션 (좋아요 수, 캡션, 댓글 미리보기 2개)
 * 5. 캡션 "... 더 보기" 토글 기능
 *
 * @dependencies
 * - lucide-react: 아이콘 라이브러리
 * - types/post: 타입 정의
 * - lib/utils/format-time: 상대 시간 포맷팅
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreVertical,
} from "lucide-react";
import { PostWithDetails, CommentWithUser } from "@/types/post";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: PostWithDetails;
}

export default function PostCard({ post }: PostCardProps) {
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  // 캡션 줄 수 계산 (대략적으로)
  const captionLines = post.caption ? Math.ceil(post.caption.length / 40) : 0; // 한 줄당 약 40자로 가정
  const shouldShowMore = captionLines > 2;

  // 캡션 표시 텍스트
  const displayCaption =
    shouldShowMore && !isCaptionExpanded
      ? post.caption?.substring(0, 80) + "..."
      : post.caption;

  // 댓글 미리보기 (최신 2개, created_at 기준 내림차순)
  const previewComments = [...post.comments]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 2) as CommentWithUser[];

  return (
    <article className="bg-white border border-[#dbdbdb] rounded-lg mb-4">
      {/* 헤더 섹션 (60px) */}
      <header className="h-[60px] flex items-center justify-between px-4 border-b border-[#dbdbdb]">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 32px 원형 */}
          <Link
            href={`/profile/${post.user.id}`}
            className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
          >
            {post.user.image_url ? (
              <Image
                src={post.user.image_url}
                alt={post.user.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs font-semibold">
                {post.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          {/* 사용자명 + 시간 */}
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold text-[#262626] hover:opacity-50 transition-opacity"
            >
              {post.user.name}
            </Link>
            <span className="text-xs text-[#8e8e8e]">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        </div>
        {/* ⋯ 메뉴 */}
        <button className="text-[#262626] hover:opacity-50 transition-opacity">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div className="relative aspect-square w-full bg-gray-100">
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 630px"
        />
      </div>

      {/* 액션 버튼 섹션 (48px) */}
      <div className="h-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <button className="text-[#262626] hover:opacity-50 transition-opacity">
            <Heart
              className={cn(
                "w-6 h-6",
                post.user_liked && "fill-[#ed4956] text-[#ed4956]",
              )}
            />
          </button>
          {/* 댓글 버튼 */}
          <button className="text-[#262626] hover:opacity-50 transition-opacity">
            <MessageCircle className="w-6 h-6" />
          </button>
          {/* 공유 버튼 (UI만) */}
          <button
            className="text-[#262626] hover:opacity-50 transition-opacity cursor-not-allowed opacity-50"
            disabled
            title="공유 기능은 준비 중입니다"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        {/* 북마크 버튼 (UI만) */}
        <button
          className="text-[#262626] hover:opacity-50 transition-opacity cursor-not-allowed opacity-50"
          disabled
          title="북마크 기능은 준비 중입니다"
        >
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      {/* 컨텐츠 섹션 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 */}
        {post.likes_count > 0 && (
          <div className="font-semibold text-[#262626]">
            좋아요 {post.likes_count.toLocaleString()}개
          </div>
        )}

        {/* 캡션 */}
        {post.caption && (
          <div className="text-sm text-[#262626]">
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold hover:opacity-50 transition-opacity"
            >
              {post.user.name}
            </Link>{" "}
            <span>{displayCaption}</span>
            {shouldShowMore && (
              <button
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-[#8e8e8e] hover:text-[#262626] ml-1 transition-colors"
              >
                {isCaptionExpanded ? " 줄이기" : " 더 보기"}
              </button>
            )}
          </div>
        )}

        {/* 댓글 미리보기 */}
        {post.comments_count > 0 && (
          <div className="space-y-1">
            {/* "댓글 N개 모두 보기" 링크 */}
            {post.comments_count > 2 && (
              <Link
                href={`/post/${post.post_id}`}
                className="text-sm text-[#8e8e8e] hover:text-[#262626] transition-colors"
              >
                댓글 {post.comments_count}개 모두 보기
              </Link>
            )}
            {/* 최신 댓글 2개 미리보기 */}
            {previewComments.map((comment) => (
              <div key={comment.id} className="text-sm text-[#262626]">
                <Link
                  href={`/profile/${comment.user.id}`}
                  className="font-semibold hover:opacity-50 transition-opacity"
                >
                  {comment.user.name}
                </Link>{" "}
                <span>{comment.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
