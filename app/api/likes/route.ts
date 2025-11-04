import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * @file app/api/likes/route.ts
 * @description 좋아요 추가/삭제 API
 *
 * 이 API는 게시물에 좋아요를 추가하거나 삭제합니다.
 *
 * 주요 기능:
 * 1. POST: 좋아요 추가 (중복 체크)
 * 2. DELETE: 좋아요 삭제
 *
 * @body (POST/DELETE)
 * - post_id: 게시물 ID (UUID)
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 */

/**
 * POST - 좋아요 추가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/likes - 좋아요 추가 시작");

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
    const { post_id } = body;

    if (!post_id) {
      console.log("❌ 잘못된 요청: post_id가 없습니다");
      return NextResponse.json(
        { error: "Bad Request", message: "post_id가 필요합니다." },
        { status: 400 },
      );
    }

    console.log("📝 요청 데이터:", { clerkUserId, post_id });

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

    // 중복 체크: 이미 좋아요를 눌렀는지 확인
    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", post_id)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (checkError) {
      console.error("❌ 중복 체크 실패:", checkError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "좋아요 상태를 확인하는 중 오류가 발생했습니다.",
          details: checkError.message,
        },
        { status: 500 },
      );
    }

    if (existingLike) {
      console.log("⚠️ 이미 좋아요를 눌렀습니다:", existingLike.id);
      return NextResponse.json(
        {
          error: "Already Liked",
          message: "이미 좋아요를 눌렀습니다.",
        },
        { status: 409 },
      );
    }

    // 좋아요 추가
    const { data: like, error: insertError } = await supabase
      .from("likes")
      .insert({
        post_id,
        user_id: currentUser.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ 좋아요 추가 실패:", insertError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "좋아요 추가 중 오류가 발생했습니다.",
          details: insertError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 좋아요 추가 성공:", like.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      like,
      message: "좋아요가 추가되었습니다.",
    });
  } catch (error) {
    console.error("❌ 좋아요 추가 API 에러:", error);
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
 * DELETE - 좋아요 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    console.group("[API] DELETE /api/likes - 좋아요 삭제 시작");

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
    const { post_id } = body;

    if (!post_id) {
      console.log("❌ 잘못된 요청: post_id가 없습니다");
      return NextResponse.json(
        { error: "Bad Request", message: "post_id가 필요합니다." },
        { status: 400 },
      );
    }

    console.log("📝 요청 데이터:", { clerkUserId, post_id });

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

    // 좋아요 삭제
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", post_id)
      .eq("user_id", currentUser.id);

    if (deleteError) {
      console.error("❌ 좋아요 삭제 실패:", deleteError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "좋아요 삭제 중 오류가 발생했습니다.",
          details: deleteError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 좋아요 삭제 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "좋아요가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ 좋아요 삭제 API 에러:", error);
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
