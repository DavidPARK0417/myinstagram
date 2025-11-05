"use client";

/**
 * @file components/profile/PostGrid.tsx
 * @description 프로필 페이지 게시물 그리드 컴포넌트
 *
 * 이 컴포넌트는 특정 사용자의 게시물을 3열 그리드 레이아웃으로 표시합니다.
 *
 * 주요 기능:
 * 1. 3열 그리드 레이아웃 (반응형: 모바일 1열, 태블릿 2열, 데스크톱 3열)
 * 2. 1:1 정사각형 썸네일 이미지
 * 3. Hover 시 좋아요 수와 댓글 수 오버레이 표시
 * 4. 클릭 시 게시물 상세 모달(Desktop) 또는 페이지(Mobile)로 이동
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - next/navigation: 라우팅
 * - components/post/PostModal: 게시물 상세 모달
 * - types/post: PostWithDetails 타입
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle } from "lucide-react";
import { PostWithDetails } from "@/types/post";
import PostModal from "@/components/post/PostModal";
import { cn } from "@/lib/utils";

interface PostGridProps {
  userId: string;
}

export default function PostGrid({ userId }: PostGridProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostWithDetails | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.group(`[PostGrid] 게시물 그리드 로드 시작 - user_id: ${userId}`);

  /**
   * 게시물 데이터 로드
   */
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log("📡 API 호출: GET /api/posts?userId=" + userId);
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/posts?userId=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        console.log("📡 응답 상태:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
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
        console.log("✅ 게시물 조회 성공:", {
          count: data.posts?.length || 0,
          posts: data.posts,
        });

        setPosts(data.posts || []);
      } catch (err) {
        console.error("❌ 게시물 로드 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "게시물을 불러오는데 실패했습니다.",
        );
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    };

    if (userId) {
      fetchPosts();
    }
  }, [userId]);

  /**
   * 그리드 아이템 클릭 핸들러
   */
  const handlePostClick = (post: PostWithDetails) => {
    console.group(`[PostGrid] 게시물 클릭 - post_id: ${post.post_id}`);
    console.log("게시물 정보:", {
      post_id: post.post_id,
      user_id: post.user_id,
    });

    // Mobile에서는 페이지로 이동, Desktop에서는 모달 열기
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      console.log("📱 모바일: 페이지로 이동");
      router.push(`/post/${post.post_id}`);
    } else {
      console.log("🖥️ 데스크톱: 모달 열기");
      setSelectedPost(post);
      setIsModalOpen(true);
    }
    console.groupEnd();
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="aspect-square bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-[#8e8e8e] text-sm">{error}</p>
      </div>
    );
  }

  // 빈 상태 (게시물이 없을 때)
  if (posts.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#8e8e8e] rounded" />
        </div>
        <p className="text-xl font-semibold text-[#262626] mb-2">게시물 없음</p>
        <p className="text-[#8e8e8e] text-sm">아직 게시물이 없습니다.</p>
      </div>
    );
  }

  // 게시물 그리드
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {posts.map((post) => (
          <div
            key={post.post_id}
            className="relative aspect-square group cursor-pointer bg-gray-100"
            onClick={() => handlePostClick(post)}
          >
            {/* 이미지 */}
            <Image
              src={post.image_url}
              alt={post.caption || "게시물 이미지"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={80}
              loading="lazy"
            />

            {/* Hover 오버레이 (Desktop만) */}
            <div
              className={cn(
                "absolute inset-0 bg-black/40 flex items-center justify-center gap-6",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "hidden sm:flex", // 모바일에서는 숨김
              )}
            >
              {/* 좋아요 수 */}
              <div className="flex items-center gap-2 text-white">
                <Heart className="w-6 h-6 fill-white" />
                <span className="font-semibold text-base">
                  {post.likes_count || 0}
                </span>
              </div>

              {/* 댓글 수 */}
              <div className="flex items-center gap-2 text-white">
                <MessageCircle className="w-6 h-6 fill-white" />
                <span className="font-semibold text-base">
                  {post.comments_count || 0}
                </span>
              </div>
            </div>

            {/* 모바일: 터치 시 오버레이 표시 (간단한 버전) */}
            <div
              className={cn(
                "absolute inset-0 bg-black/30 flex items-center justify-center gap-6",
                "opacity-0 active:opacity-100 transition-opacity duration-150",
                "sm:hidden", // 데스크톱에서는 숨김
              )}
            >
              <div className="flex items-center gap-2 text-white">
                <Heart className="w-5 h-5 fill-white" />
                <span className="font-semibold text-sm">
                  {post.likes_count || 0}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 게시물 상세 모달 (Desktop) */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedPost(null);
            }
          }}
        />
      )}
    </>
  );
}
