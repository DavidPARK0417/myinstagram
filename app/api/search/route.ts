import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { SearchResponse, PostSearchResult } from "@/types/search";

/**
 * @file app/api/search/route.ts
 * @description 검색 API
 *
 * 이 API는 사용자 및 게시물 검색 기능을 제공합니다.
 *
 * GET: 사용자/게시물 검색
 * - 사용자 검색: 이름 또는 사용자명으로 검색
 * - 게시물 검색: 캡션으로 검색
 * - 검색어 파라미터: ?q=검색어
 * - 검색 타입 파라미터: ?type=users|posts|all (기본값: users)
 * - 페이지네이션 지원 (선택사항)
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 * - types/search: 타입 정의
 */

export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/search - 검색 시작");

    // 검색어 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const type = (searchParams.get("type") || "users") as
      | "users"
      | "posts"
      | "all";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    console.log("📝 요청 데이터:", { query, type, limit, offset });

    // 검색어가 없으면 빈 결과 반환
    if (!query.trim()) {
      console.log("⚠️ 검색어가 없습니다. 빈 결과 반환");
      console.groupEnd();
      return NextResponse.json({
        results: {
          users: [],
          posts: [],
          usersTotal: 0,
          postsTotal: 0,
        },
        query: "",
        type,
      } as SearchResponse);
    }

    const supabase = createClerkSupabaseClient();
    const searchPattern = `%${query.toLowerCase()}%`;

    // 사용자 검색 (type이 users 또는 all일 때)
    let users: any[] = [];
    let usersTotal = 0;

    if (type === "users" || type === "all") {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, clerk_id, name, created_at", { count: "exact" })
        .ilike("name", searchPattern)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (usersError) {
        console.error("❌ 사용자 검색 실패:", usersError);
      } else {
        users = usersData || [];
      }

      // 총 개수 가져오기
      const { count, error: countError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .ilike("name", searchPattern);

      if (!countError) {
        usersTotal = count || 0;
      }
    }

    // 게시물 검색 (type이 posts 또는 all일 때)
    let posts: PostSearchResult[] = [];
    let postsTotal = 0;

    if (type === "posts" || type === "all") {
      // post_stats 뷰에서 게시물 검색 (캡션에 검색어 포함)
      const { data: postsStats, error: postsError } = await supabase
        .from("post_stats")
        .select("*")
        .ilike("caption", searchPattern)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) {
        console.error("❌ 게시물 검색 실패:", postsError);
      } else if (postsStats && postsStats.length > 0) {
        // 게시물 작성자 정보 조회
        const userIds = [...new Set(postsStats.map((post) => post.user_id))];
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, clerk_id, name, created_at")
          .in("id", userIds);

        if (usersError) {
          console.error("❌ 게시물 작성자 정보 조회 실패:", usersError);
        } else {
          const usersMap = new Map(
            (usersData || []).map((user) => [user.id, user]),
          );

          posts = postsStats.map((post) => ({
            id: post.post_id,
            user_id: post.user_id,
            image_url: post.image_url,
            caption: post.caption,
            created_at: post.created_at,
            likes_count: post.likes_count || 0,
            comments_count: post.comments_count || 0,
            user: usersMap.get(post.user_id) || {
              id: post.user_id,
              clerk_id: "",
              name: "Unknown",
              created_at: "",
            },
          }));
        }
      }

      // 게시물 총 개수 가져오기
      const { count, error: countError } = await supabase
        .from("post_stats")
        .select("*", { count: "exact", head: true })
        .ilike("caption", searchPattern);

      if (!countError) {
        postsTotal = count || 0;
      }
    }

    console.log("✅ 검색 성공:", {
      query,
      type,
      usersCount: users.length,
      usersTotal,
      postsCount: posts.length,
      postsTotal,
    });
    console.groupEnd();

    return NextResponse.json({
      results: {
        users,
        posts,
        usersTotal,
        postsTotal,
      },
      query,
      type,
    } as SearchResponse);
  } catch (error) {
    console.error("❌ 검색 API 오류:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "검색 중 서버 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
