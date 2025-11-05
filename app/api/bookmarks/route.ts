import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * @file app/api/bookmarks/route.ts
 * @description 북마크 추가/삭제 API
 *
 * 이 API는 게시물에 북마크를 추가하거나 삭제합니다.
 *
 * 주요 기능:
 * 1. POST: 북마크 추가 (중복 체크)
 * 2. DELETE: 북마크 삭제
 *
 * @body (POST/DELETE)
 * - post_id: 게시물 ID (UUID)
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 */

/**
 * POST - 북마크 추가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/bookmarks - 북마크 추가 시작");

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
    console.log("🔍 Supabase users 테이블 조회:", { clerkUserId });
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError) {
      console.error("❌ users 테이블 조회 에러:", {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
      });
      return NextResponse.json(
        {
          error: "Database Error",
          message: "사용자 정보 조회 중 데이터베이스 오류가 발생했습니다.",
          details: `Code: ${userError.code}, Message: ${userError.message}`,
          hint: userError.hint || "users 테이블 또는 RLS 설정을 확인하세요.",
        },
        { status: 500 },
      );
    }

    if (!currentUser) {
      console.error("❌ 사용자 미존재:", { clerkUserId });
      return NextResponse.json(
        {
          error: "User Not Found",
          message: "Supabase users 테이블에 사용자가 존재하지 않습니다.",
          hint: "로그인 후 홈 페이지를 방문하여 사용자 동기화를 완료하세요.",
        },
        { status: 404 },
      );
    }

    console.log("✅ 사용자 조회 성공:", currentUser.id);

    // 북마크 추가 (중복 시 갱신 없이 유지) - 원자적 처리
    console.log("📝 북마크 upsert 시작:", { post_id, user_id: currentUser.id });
    const { data: bookmark, error: upsertError } = await supabase
      .from("bookmarks")
      .upsert(
        { post_id, user_id: currentUser.id },
        { onConflict: "post_id,user_id", ignoreDuplicates: true },
      )
      .select("id")
      .maybeSingle();

    if (upsertError) {
      console.error("❌ bookmarks 테이블 upsert 에러:", {
        code: upsertError.code,
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
      });
      return NextResponse.json(
        {
          error: "Database Error",
          message: "북마크 추가 중 데이터베이스 오류가 발생했습니다.",
          details: `Code: ${upsertError.code}, Message: ${upsertError.message}`,
          hint:
            upsertError.hint || "bookmarks 테이블 또는 RLS 설정을 확인하세요.",
        },
        { status: 500 },
      );
    }

    console.log("✅ 북마크 처리 성공:", bookmark?.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      bookmark: bookmark ?? null,
      message: "북마크가 추가되었습니다.",
    });
  } catch (error) {
    console.error("❌ 북마크 추가 API 에러:", error);
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
 * DELETE - 북마크 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    console.group("[API] DELETE /api/bookmarks - 북마크 삭제 시작");

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
    console.log("🔍 Supabase users 테이블 조회:", { clerkUserId });
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError) {
      console.error("❌ users 테이블 조회 에러:", {
        code: userError.code,
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
      });
      return NextResponse.json(
        {
          error: "Database Error",
          message: "사용자 정보 조회 중 데이터베이스 오류가 발생했습니다.",
          details: `Code: ${userError.code}, Message: ${userError.message}`,
          hint: userError.hint || "users 테이블 또는 RLS 설정을 확인하세요.",
        },
        { status: 500 },
      );
    }

    if (!currentUser) {
      console.error("❌ 사용자 미존재:", { clerkUserId });
      return NextResponse.json(
        {
          error: "User Not Found",
          message: "Supabase users 테이블에 사용자가 존재하지 않습니다.",
          hint: "로그인 후 홈 페이지를 방문하여 사용자 동기화를 완료하세요.",
        },
        { status: 404 },
      );
    }

    console.log("✅ 사용자 조회 성공:", currentUser.id);

    // 북마크 삭제
    console.log("📝 북마크 delete 시작:", { post_id, user_id: currentUser.id });
    const { error: deleteError } = await supabase
      .from("bookmarks")
      .delete()
      .eq("post_id", post_id)
      .eq("user_id", currentUser.id);

    if (deleteError) {
      console.error("❌ bookmarks 테이블 delete 에러:", {
        code: deleteError.code,
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
      });
      return NextResponse.json(
        {
          error: "Database Error",
          message: "북마크 삭제 중 데이터베이스 오류가 발생했습니다.",
          details: `Code: ${deleteError.code}, Message: ${deleteError.message}`,
          hint:
            deleteError.hint || "bookmarks 테이블 또는 RLS 설정을 확인하세요.",
        },
        { status: 500 },
      );
    }

    console.log("✅ 북마크 삭제 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "북마크가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ 북마크 삭제 API 에러:", error);
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
