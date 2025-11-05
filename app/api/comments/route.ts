import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * @file app/api/comments/route.ts
 * @description 댓글 조회, 작성 및 삭제 API
 *
 * 이 API는 게시물의 댓글을 조회, 작성하고 삭제합니다.
 *
 * 주요 기능:
 * 1. GET: 댓글 목록 조회 (페이지네이션)
 * 2. POST: 댓글 작성
 * 3. DELETE: 댓글 삭제 (본인만 가능)
 *
 * @query (GET)
 * - post_id: 게시물 ID (UUID, 필수)
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지당 댓글 수 (기본값: 20)
 *
 * @body (POST)
 * - post_id: 게시물 ID (UUID)
 * - content: 댓글 내용 (string, 최대 2,200자)
 *
 * @body (DELETE)
 * - comment_id: 댓글 ID (UUID)
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 */

/**
 * GET - 댓글 목록 조회 (페이지네이션)
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/comments - 댓글 목록 조회 시작");

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    console.log("📝 요청 데이터:", { postId, page, limit });

    // post_id 검증
    if (!postId) {
      console.log("❌ 잘못된 요청: post_id가 없습니다");
      return NextResponse.json(
        { error: "Bad Request", message: "post_id가 필요합니다." },
        { status: 400 },
      );
    }

    // 페이지네이션 검증
    if (page < 1 || limit < 1 || limit > 100) {
      console.log("❌ 잘못된 요청: 잘못된 페이지네이션 파라미터");
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "잘못된 페이지네이션 파라미터입니다.",
        },
        { status: 400 },
      );
    }

    const offset = (page - 1) * limit;

    console.log("✅ 입력 검증 완료");

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 댓글 조회 (페이지네이션)
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("id, post_id, user_id, content, created_at, updated_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (commentsError) {
      console.error("❌ 댓글 조회 실패:", commentsError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "댓글을 불러오는데 실패했습니다.",
          details: commentsError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 댓글 조회 성공:", comments?.length || 0);

    // 댓글 작성자 ID 배열 추출
    const commentUserIds = [
      ...new Set(comments?.map((comment) => comment.user_id) || []),
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
      console.error("❌ 댓글 작성자 조회 실패:", commentUsersError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "댓글 작성자 정보를 불러오는데 실패했습니다.",
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

    // 댓글에 사용자 정보 추가
    const commentsWithUsers = (comments || [])
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

    // 전체 댓글 수 조회 (페이지네이션용)
    const { count, error: countError } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (countError) {
      console.error("❌ 댓글 수 조회 실패:", countError);
      // count 에러는 무시하고 진행
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    console.log("✅ 댓글 목록 조회 완료:", {
      count: commentsWithUsers.length,
      total,
      hasMore,
    });
    console.groupEnd();

    return NextResponse.json({
      comments: commentsWithUsers,
      pagination: {
        page,
        limit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("❌ 댓글 목록 조회 API 에러:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "서버 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST - 댓글 작성
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/comments - 댓글 작성 시작");

    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.log("❌ 인증 실패: 로그인되지 않은 사용자");
      return NextResponse.json(
        { error: "Unauthorized", message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { post_id, content } = body;

    console.log("📝 요청 데이터:", {
      clerkUserId,
      post_id,
      contentLength: content?.length,
    });

    // post_id 검증
    if (!post_id) {
      console.log("❌ 잘못된 요청: post_id가 없습니다");
      return NextResponse.json(
        { error: "Bad Request", message: "post_id가 필요합니다." },
        { status: 400 },
      );
    }

    // content 검증
    if (!content || typeof content !== "string") {
      console.log("❌ 잘못된 요청: content가 없습니다");
      return NextResponse.json(
        { error: "Bad Request", message: "댓글 내용이 필요합니다." },
        { status: 400 },
      );
    }

    // content trim 후 빈 값 체크
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      console.log("❌ 잘못된 요청: content가 비어있습니다");
      return NextResponse.json(
        { error: "Bad Request", message: "댓글 내용을 입력해주세요." },
        { status: 400 },
      );
    }

    // content 최대 길이 검증 (2,200자)
    if (trimmedContent.length > 2200) {
      console.log("❌ 잘못된 요청: content 길이 초과", trimmedContent.length);
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "댓글은 최대 2,200자까지 입력할 수 있습니다.",
        },
        { status: 400 },
      );
    }

    console.log("✅ 입력 검증 완료");

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 Supabase user ID 조회
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      console.error("❌ 사용자 조회 실패:", userError);
      return NextResponse.json(
        {
          error: "User Not Found",
          message: "사용자 정보를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    console.log("✅ 사용자 조회 성공:", currentUser.id);

    // 댓글 추가
    const { data: comment, error: insertError } = await supabase
      .from("comments")
      .insert({
        post_id,
        user_id: currentUser.id,
        content: trimmedContent,
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ 댓글 추가 실패:", insertError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "댓글 작성 중 오류가 발생했습니다.",
          details: insertError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 댓글 추가 성공:", comment.id);

    // 댓글 + 사용자 정보 응답
    const commentWithUser = {
      ...comment,
      user: {
        id: currentUser.id,
        clerk_id: currentUser.clerk_id,
        name: currentUser.name,
        created_at: currentUser.created_at,
      },
    };

    console.log("✅ 댓글 작성 완료");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      comment: commentWithUser,
      message: "댓글이 작성되었습니다.",
    });
  } catch (error) {
    console.error("❌ 댓글 작성 API 에러:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "서버 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE - 댓글 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    console.group("[API] DELETE /api/comments - 댓글 삭제 시작");

    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.log("❌ 인증 실패: 로그인되지 않은 사용자");
      return NextResponse.json(
        { error: "Unauthorized", message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { comment_id } = body;

    console.log("📝 요청 데이터:", { clerkUserId, comment_id });

    // comment_id 검증
    if (!comment_id) {
      console.log("❌ 잘못된 요청: comment_id가 없습니다");
      return NextResponse.json(
        { error: "Bad Request", message: "comment_id가 필요합니다." },
        { status: 400 },
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 현재 사용자의 Supabase user ID 조회
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      console.error("❌ 사용자 조회 실패:", userError);
      return NextResponse.json(
        {
          error: "User Not Found",
          message: "사용자 정보를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    console.log("✅ 사용자 조회 성공:", currentUser.id);

    // 댓글 존재 여부 및 작성자 확인
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("id, user_id")
      .eq("id", comment_id)
      .single();

    if (commentError || !comment) {
      console.error("❌ 댓글 조회 실패:", commentError);
      return NextResponse.json(
        {
          error: "Comment Not Found",
          message: "댓글을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    // 권한 검증: 댓글 작성자만 삭제 가능
    if (comment.user_id !== currentUser.id) {
      console.log("❌ 권한 없음: 본인의 댓글이 아닙니다");
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "본인의 댓글만 삭제할 수 있습니다.",
        },
        { status: 403 },
      );
    }

    console.log("✅ 권한 검증 완료");

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment_id);

    if (deleteError) {
      console.error("❌ 댓글 삭제 실패:", deleteError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "댓글 삭제 중 오류가 발생했습니다.",
          details: deleteError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 댓글 삭제 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "댓글이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ 댓글 삭제 API 에러:", error);
    console.groupEnd();
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "서버 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
