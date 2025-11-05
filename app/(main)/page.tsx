/**
 * @file app/(main)/page.tsx
 * @description 홈 피드 페이지
 *
 * 이 페이지는 Instagram 스타일의 홈 피드를 표시합니다.
 *
 * 주요 기능:
 * 1. PostFeed 컴포넌트를 통한 게시물 목록 표시
 * 2. 로딩 상태 처리
 * 3. 배경색 #FAFAFA, 카드 배경 #FFFFFF (layout에서 처리)
 * 4. 최대 너비 630px 중앙 정렬 (layout에서 처리)
 *
 * @dependencies
 * - components/post/PostFeed: 게시물 피드 컴포넌트
 * - app/api/posts: 게시물 목록 조회 API
 */

import { headers } from "next/headers";
import PostFeed from "@/components/post/PostFeed";
import { PostWithDetails } from "@/types/post";

/**
 * 홈 피드 페이지 컴포넌트
 *
 * Server Component에서 API를 호출하여 게시물 데이터를 가져옵니다.
 */
export default async function HomePage() {
  console.group("[HomePage] 게시물 데이터 가져오기 시작");

  try {
    // 현재 호스트 정보 가져오기 (Next.js 15)
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    console.log("📝 API 호출:", `${baseUrl}/api/posts?page=1&limit=10`);

    // 게시물 목록 API 호출
    const response = await fetch(`${baseUrl}/api/posts?page=1&limit=10`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Server Component에서 API 호출 시 캐시를 사용하지 않음
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
    const posts: PostWithDetails[] = data.posts || [];

    console.log("✅ 게시물 데이터 가져오기 성공:", {
      count: posts.length,
      pagination: data.pagination,
    });
    console.groupEnd();

    return (
      <div className="w-full">
        <PostFeed
          initialPosts={posts}
          initialPage={1}
          initialHasMore={data.pagination?.hasMore || false}
          initialError={null}
        />
      </div>
    );
  } catch (error) {
    console.error("❌ 게시물 데이터 가져오기 오류:", error);
    console.groupEnd();

    const errorMessage =
      error instanceof Error
        ? error.message
        : "게시물을 불러오는 중 오류가 발생했습니다.";

    return (
      <div className="w-full">
        <PostFeed
          initialPosts={[]}
          initialPage={1}
          initialHasMore={false}
          initialError={errorMessage}
        />
      </div>
    );
  }
}
