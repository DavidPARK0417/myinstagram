import { NextRequest, NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { SearchResponse } from "@/types/search";

/**
 * @file app/api/search/route.ts
 * @description 검색 API
 *
 * 이 API는 사용자 검색 기능을 제공합니다.
 *
 * GET: 사용자 검색
 * - 이름 또는 사용자명으로 검색
 * - 검색어 파라미터: ?q=검색어
 * - 페이지네이션 지원 (선택사항)
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 * - types/search: 타입 정의
 */

export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/search - 사용자 검색 시작");

    // 검색어 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    console.log("📝 요청 데이터:", { query, limit, offset });

    // 검색어가 없으면 빈 결과 반환
    if (!query.trim()) {
      console.log("⚠️ 검색어가 없습니다. 빈 결과 반환");
      console.groupEnd();
      return NextResponse.json({
        results: {
          users: [],
          total: 0,
        },
        query: "",
      } as SearchResponse);
    }

    const supabase = createClerkSupabaseClient();

    // 검색어를 소문자로 변환하여 LIKE 검색 (대소문자 구분 없음)
    const searchPattern = `%${query.toLowerCase()}%`;

    // users 테이블에서 이름으로 검색
    // name 필드에 검색어가 포함된 사용자 검색
    const { data: users, error: searchError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at", { count: "exact" })
      .ilike("name", searchPattern)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (searchError) {
      console.error("❌ 검색 실패:", searchError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Search Failed",
          message: "검색 중 오류가 발생했습니다.",
          details: searchError.message,
        },
        { status: 500 },
      );
    }

    // 총 개수 가져오기 (범위 쿼리와 별도로 실행)
    const { count, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .ilike("name", searchPattern);

    if (countError) {
      console.error("❌ 총 개수 조회 실패:", countError);
      // 에러가 발생해도 검색 결과는 반환
    }

    const totalCount = count || 0;

    console.log("✅ 검색 성공:", {
      query,
      resultsCount: users?.length || 0,
      totalCount,
    });
    console.groupEnd();

    return NextResponse.json({
      results: {
        users: users || [],
        total: totalCount,
      },
      query,
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
