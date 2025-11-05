import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

/**
 * @file app/api/follows/route.ts
 * @description 팔로우 추가/삭제 API
 *
 * 이 API는 사용자를 팔로우하거나 언팔로우합니다.
 *
 * 주요 기능:
 * 1. POST: 팔로우 추가 (중복 체크)
 * 2. DELETE: 언팔로우 (팔로우 삭제)
 *
 * @body (POST/DELETE)
 * - following_id: 팔로우할 사용자 ID (UUID)
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 */

/**
 * POST - 팔로우 추가
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/follows - 팔로우 추가 시작");

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
    const { following_id } = body;

    if (!following_id) {
      console.log("❌ 잘못된 요청: following_id가 없습니다");
      return NextResponse.json(
        { error: "Bad Request", message: "following_id가 필요합니다." },
        { status: 400 },
      );
    }

    console.log("📝 요청 데이터:", { clerkUserId, following_id });

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

    // 자기 자신 팔로우 방지 (데이터베이스 제약조건으로도 처리되지만, API 레벨에서도 체크)
    if (currentUser.id === following_id) {
      console.log("❌ 자기 자신을 팔로우할 수 없습니다");
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "자기 자신을 팔로우할 수 없습니다.",
        },
        { status: 400 },
      );
    }

    // 팔로우할 사용자가 존재하는지 확인
    const { data: followingUser, error: followingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", following_id)
      .single();

    if (followingUserError || !followingUser) {
      console.error("❌ 팔로우할 사용자 조회 실패:", followingUserError);
      return NextResponse.json(
        {
          error: "User Not Found",
          message: "팔로우할 사용자를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    // 중복 체크: 이미 팔로우 중인지 확인
    const { data: existingFollow, error: checkError } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", following_id)
      .maybeSingle();

    if (checkError) {
      console.error("❌ 중복 체크 실패:", checkError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "팔로우 상태를 확인하는 중 오류가 발생했습니다.",
          details: checkError.message,
        },
        { status: 500 },
      );
    }

    if (existingFollow) {
      console.log("⚠️ 이미 팔로우 중입니다:", existingFollow.id);
      return NextResponse.json(
        {
          error: "Already Following",
          message: "이미 팔로우 중입니다.",
        },
        { status: 409 },
      );
    }

    // 팔로우 추가
    const { data: follow, error: insertError } = await supabase
      .from("follows")
      .insert({
        follower_id: currentUser.id,
        following_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ 팔로우 추가 실패:", insertError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "팔로우 추가 중 오류가 발생했습니다.",
          details: insertError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 팔로우 추가 성공:", follow.id);
    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        follow,
        message: "팔로우가 추가되었습니다.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ 팔로우 추가 API 에러:", error);
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
 * DELETE - 언팔로우 (팔로우 삭제)
 */
export async function DELETE(request: NextRequest) {
  try {
    console.group("[API] DELETE /api/follows - 언팔로우 시작");

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
    const { following_id } = body;

    if (!following_id) {
      console.log("❌ 잘못된 요청: following_id가 없습니다");
      return NextResponse.json(
        { error: "Bad Request", message: "following_id가 필요합니다." },
        { status: 400 },
      );
    }

    console.log("📝 요청 데이터:", { clerkUserId, following_id });

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

    // 팔로우 관계 확인 (권한 검증)
    const { data: existingFollow, error: checkError } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", following_id)
      .single();

    if (checkError || !existingFollow) {
      console.error("❌ 팔로우 관계를 찾을 수 없습니다:", checkError);
      return NextResponse.json(
        {
          error: "Not Found",
          message: "팔로우 관계를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    // 언팔로우 (팔로우 삭제)
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", following_id);

    if (deleteError) {
      console.error("❌ 언팔로우 실패:", deleteError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "언팔로우 중 오류가 발생했습니다.",
          details: deleteError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 언팔로우 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "언팔로우되었습니다.",
    });
  } catch (error) {
    console.error("❌ 언팔로우 API 에러:", error);
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
