import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * @file app/api/comments/route.ts
 * @description 댓글 작성 API
 *
 * 이 API는 게시물에 댓글을 작성합니다.
 *
 * 주요 기능:
 * 1. POST: 댓글 작성
 *
 * @body (POST)
 * - post_id: 게시물 ID (UUID)
 * - content: 댓글 내용 (string, 최대 2,200자)
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 */

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
