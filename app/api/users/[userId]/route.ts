import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { UserProfileResponse } from "@/types/post";

/**
 * @file app/api/users/[userId]/route.ts
 * @description 사용자 프로필 정보 조회 API
 *
 * 이 API는 특정 사용자의 프로필 정보를 조회합니다.
 *
 * GET: 사용자 프로필 정보 조회
 * - user_stats 뷰 활용 (게시물 수, 팔로워 수, 팔로잉 수)
 * - 현재 사용자가 해당 사용자를 팔로우 중인지 확인
 * - 내 프로필인지 확인
 *
 * @params
 * - userId: 사용자 ID (UUID)
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 * - types/post: 타입 정의
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    console.group("[API] GET /api/users/[userId] - 사용자 프로필 조회 시작");

    const { userId } = await params;
    const supabase = createClerkSupabaseClient();

    console.log("📝 요청 데이터:", { userId });

    // user_stats 뷰에서 사용자 정보 조회
    const { data: userStats, error: userStatsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (userStatsError || !userStats) {
      console.error("❌ 사용자 조회 실패:", userStatsError);
      return NextResponse.json(
        {
          error: "User Not Found",
          message: "사용자를 찾을 수 없습니다.",
          details: userStatsError?.message,
        },
        { status: 404 },
      );
    }

    // 사용자 생성일 조회 (user_stats 뷰에 없으므로 users 테이블에서)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("created_at")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("❌ 사용자 정보 조회 실패:", userError);
      return NextResponse.json(
        {
          error: "User Not Found",
          message: "사용자 정보를 찾을 수 없습니다.",
          details: userError?.message,
        },
        { status: 404 },
      );
    }

    // 현재 사용자 인증 확인 (선택사항 - 로그인하지 않아도 프로필 조회 가능)
    const { userId: clerkUserId } = await auth();
    let isOwnProfile = false;
    let isFollowing = false;

    if (clerkUserId) {
      // 현재 사용자의 Supabase user ID 조회
      const { data: currentUser, error: currentUserError } = await supabase
        .from("users")
        .select("id, clerk_id")
        .eq("clerk_id", clerkUserId)
        .single();

      console.log("🔍 현재 사용자 정보:", {
        clerkUserId,
        supabaseUserId: currentUser?.id,
        error: currentUserError,
      });

      if (!currentUserError && currentUser) {
        // 내 프로필인지 확인
        // 명시적으로 string 비교 (UUID는 모두 string)
        isOwnProfile = String(currentUser.id) === String(userId);

        console.log("🔍 프로필 소유자 확인:", {
          currentUserId: currentUser.id,
          currentUserIdType: typeof currentUser.id,
          profileUserId: userId,
          profileUserIdType: typeof userId,
          isOwnProfile,
        });

        // 팔로우 상태 확인 (내 프로필이 아닌 경우에만)
        if (!isOwnProfile) {
          const { data: follow, error: followError } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", currentUser.id)
            .eq("following_id", userId)
            .single();

          console.log("🔍 팔로우 상태 확인:", {
            followId: follow?.id,
            error: followError,
            isFollowing: !followError && !!follow,
          });

          if (!followError && follow) {
            isFollowing = true;
          }
        } else {
          console.log("✅ 본인 프로필이므로 팔로우 상태 확인 스킵");
        }
      }
    }

    // 응답 데이터 구성
    const response: UserProfileResponse = {
      user: {
        id: userStats.user_id,
        user_id: userStats.user_id,
        clerk_id: userStats.clerk_id,
        name: userStats.name,
        posts_count: userStats.posts_count || 0,
        followers_count: userStats.followers_count || 0,
        following_count: userStats.following_count || 0,
        created_at: user.created_at,
      },
      isOwnProfile,
      isFollowing,
    };

    console.log("✅ 사용자 프로필 조회 성공:", {
      userId: userStats.user_id,
      name: userStats.name,
      isOwnProfile,
      isFollowing,
    });
    console.groupEnd();

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ 사용자 프로필 조회 에러:", error);
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
