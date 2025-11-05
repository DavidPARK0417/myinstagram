/**
 * @file app/(main)/post/[postId]/page.tsx
 * @description 게시물 상세 페이지 (Mobile용)
 *
 * 이 페이지는 Mobile에서 게시물 상세 정보를 전체 페이지로 표시합니다.
 *
 * 주요 기능:
 * 1. 게시물 상세 정보 표시
 * 2. 전체 댓글 표시
 * 3. 댓글 작성 및 삭제
 * 4. 좋아요 기능
 *
 * @dependencies
 * - components/post/PostModal: 게시물 상세 모달 컴포넌트 재사용
 * - app/api/posts/[postId]: 게시물 상세 조회 API
 */

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import PostModal from "@/components/post/PostModal";
import PostDetailSkeleton from "@/components/post/PostDetailSkeleton";
import { PostWithDetails } from "@/types/post";

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  console.group(`[PostDetailPage] 게시물 상세 조회 - post_id: ${postId}`);

  try {
    // 현재 호스트 정보 가져오기 (Next.js 15)
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    console.log("📝 API 호출:", `${baseUrl}/api/posts/${postId}`);

    // 게시물 상세 API 호출
    const response = await fetch(`${baseUrl}/api/posts/${postId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ API 호출 실패:", response.status, errorData);

      if (response.status === 404) {
        console.groupEnd();
        notFound();
      }

      throw new Error(
        errorData.message ||
          `게시물을 불러오는데 실패했습니다. (${response.status})`,
      );
    }

    const data = await response.json();
    const post: PostWithDetails = data.post;

    console.log("✅ 게시물 상세 조회 성공");
    console.groupEnd();

    // Mobile에서는 PostModal을 항상 열린 상태로 표시
    return (
      <div className="w-full h-screen">
        <Suspense fallback={<PostDetailSkeleton />}>
          <PostModal post={post} open={true} onOpenChange={() => {}} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("❌ 게시물 상세 조회 오류:", error);
    console.groupEnd();
    notFound();
  }
}
