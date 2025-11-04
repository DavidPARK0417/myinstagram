import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { PostWithDetails } from "@/types/post";

/**
 * @file app/api/posts/route.ts
 * @description 게시물 목록 조회 API
 *
 * 이 API는 게시물 목록을 조회합니다.
 *
 * 주요 기능:
 * 1. 페이지네이션 (10개씩)
 * 2. 시간 역순 정렬
 * 3. 사용자 정보 JOIN (users 테이블)
 * 4. post_stats 뷰 활용 (좋아요 수, 댓글 수)
 * 5. 댓글 미리보기 최신 2개 조회
 *
 * @query
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지당 항목 수 (기본값: 10, 최대: 50)
 * - userId: 특정 사용자의 게시물만 조회 (선택사항)
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 * - types/post: 타입 정의
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClerkSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    // 페이지네이션 파라미터
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const offset = (page - 1) * limit;

    // 특정 사용자 필터 (선택사항)
    const userId = searchParams.get("userId");

    // post_stats 뷰에서 게시물 통계 조회
    let postsQuery = supabase
      .from("post_stats")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 특정 사용자 필터 적용
    if (userId) {
      postsQuery = postsQuery.eq("user_id", userId);
    }

    const { data: postsStats, error: postsError } = await postsQuery;

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 },
      );
    }

    if (!postsStats || postsStats.length === 0) {
      return NextResponse.json({
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false,
        },
      });
    }

    // 게시물 ID 배열 추출
    const postIds = postsStats.map((post) => post.post_id);

    // 사용자 정보 조회 (users 테이블)
    const userIds = [...new Set(postsStats.map((post) => post.user_id))];
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError.message },
        { status: 500 },
      );
    }

    // 사용자 맵 생성
    const usersMap = new Map(users?.map((user) => [user.id, user]) || []);

    // 댓글 미리보기 조회 (각 게시물당 최신 2개)
    // 각 게시물별로 최신 2개를 가져오기 위해 게시물별로 쿼리 실행
    const commentsByPostArray = await Promise.all(
      postIds.map(async (postId) => {
        const { data, error } = await supabase
          .from("comments")
          .select("id, post_id, user_id, content, created_at, updated_at")
          .eq("post_id", postId)
          .order("created_at", { ascending: false })
          .limit(2);

        if (error) {
          console.error(`Error fetching comments for post ${postId}:`, error);
          return [];
        }

        return data || [];
      }),
    );

    // 댓글 배열을 평탄화
    const comments = commentsByPostArray.flat();

    // 댓글 작성자 ID 배열 추출
    const commentUserIds = [
      ...new Set(comments.map((comment) => comment.user_id)),
    ];

    // 댓글 작성자 정보 조회
    const { data: commentUsers, error: commentUsersError } =
      commentUserIds.length > 0
        ? await supabase
            .from("users")
            .select("id, clerk_id, name, created_at")
            .in("id", commentUserIds)
        : { data: [], error: null };

    if (commentUsersError) {
      console.error("Error fetching comment users:", commentUsersError);
      return NextResponse.json(
        {
          error: "Failed to fetch comment users",
          details: commentUsersError.message,
        },
        { status: 500 },
      );
    }

    // 댓글 작성자 맵 생성
    const commentUsersMap = new Map<string, (typeof commentUsers)[0]>(
      commentUsers?.map((user) => [user.id, user] as [string, typeof user]) ||
        [],
    );

    // 댓글을 게시물별로 그룹화 (이미 각 게시물당 최신 2개만 가져옴)
    const commentsByPost = new Map<string, typeof comments>();
    comments.forEach((comment) => {
      if (!commentsByPost.has(comment.post_id)) {
        commentsByPost.set(comment.post_id, []);
      }
      commentsByPost.get(comment.post_id)!.push(comment);
    });

    // 현재 사용자 ID 가져오기 (좋아요 상태 확인용)
    const { userId: clerkUserId } = await auth();

    // 좋아요 상태 조회 (현재 사용자가 로그인한 경우)
    let userLikes: string[] = [];
    if (clerkUserId) {
      // Supabase에서 현재 사용자 ID를 가져오기 위해 users 테이블에서 조회
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (currentUser) {
        const { data: likes } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUser.id)
          .in("post_id", postIds);

        userLikes = likes?.map((like) => like.post_id) || [];
      }
    }

    // 결과 조합
    const postsWithDetails: PostWithDetails[] = postsStats.map((post) => {
      const user = usersMap.get(post.user_id);
      if (!user) {
        throw new Error(`User not found for post ${post.post_id}`);
      }

      // 댓글 미리보기 (최신 2개, 사용자 정보 포함)
      const postComments = commentsByPost.get(post.post_id) || [];
      const commentsWithUsers = postComments
        .map((comment) => {
          const commentUser = commentUsersMap.get(comment.user_id);
          if (!commentUser) {
            return null;
          }
          return {
            ...comment,
            user: commentUser,
          };
        })
        .filter(
          (comment): comment is NonNullable<typeof comment> => comment !== null,
        );

      return {
        ...post,
        user: {
          ...user,
          image_url: undefined, // Clerk에서 가져올 수 있지만 현재는 undefined
        },
        comments: commentsWithUsers,
        user_liked: userLikes.includes(post.post_id),
      };
    });

    // 전체 게시물 수 조회 (페이지네이션용)
    let countQuery = supabase
      .from("post_stats")
      .select("*", { count: "exact", head: true });

    if (userId) {
      countQuery = countQuery.eq("user_id", userId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting posts:", countError);
      // count 에러는 무시하고 진행
    }

    return NextResponse.json({
      posts: postsWithDetails,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error("Posts API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
