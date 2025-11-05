import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { FollowListResponse } from "@/types/post";

/**
 * @file app/api/users/[userId]/followers/route.ts
 * @description 팔로워 목록 조회 API
 *
 * 이 API는 특정 사용자를 팔로우하고 있는 사용자들의 목록을 조회합니다.
 *
 * GET: 팔로워 목록 조회
 * - follows 테이블과 users 테이블 JOIN
 * - 내 프로필인지 확인 (권한 검증)
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
    console.group(
      "[API] GET /api/users/[userId]/followers - 팔로워 목록 조회 시작",
    );

    const { userId } = await params;
    const supabase = createClerkSupabaseClient();

    console.log("📝 요청 데이터:", { userId });

    // 인증 확인 (로그인한 사용자만 조회 가능)
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.error("❌ 인증되지 않은 사용자");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "로그인이 필요합니다.",
        },
        { status: 401 },
      );
    }

    // 현재 사용자의 Supabase user ID 조회
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id, clerk_id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (currentUserError || !currentUser) {
      console.error("❌ 현재 사용자 조회 실패:", currentUserError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "User Not Found",
          message: "사용자 정보를 찾을 수 없습니다.",
          details: currentUserError?.message,
        },
        { status: 404 },
      );
    }

    // 권한 검증: 내 프로필만 조회 가능
    const isOwnProfile = String(currentUser.id) === String(userId);
    if (!isOwnProfile) {
      console.error("❌ 권한 없음:", {
        currentUserId: currentUser.id,
        targetUserId: userId,
      });
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "본인의 팔로워 목록만 조회할 수 있습니다.",
        },
        { status: 403 },
      );
    }

    // 팔로워 목록 조회 (두 단계로 나눠서 조회)
    // 1단계: follows 테이블에서 follower_id 목록 조회
    const { data: follows, error: followsError } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId)
      .order("created_at", { ascending: false });

    if (followsError) {
      console.error("❌ 팔로워 목록 조회 실패:", followsError);
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Database Error",
          message: "팔로워 목록을 조회하는 중 오류가 발생했습니다.",
          details: followsError.message,
        },
        { status: 500 },
      );
    }

    // 빈 배열인 경우
    if (!follows || follows.length === 0) {
      const response: FollowListResponse = {
        users: [],
        total: 0,
      };

      console.log("✅ 팔로워 목록 조회 성공 (빈 목록):", {
        userId,
        total: 0,
      });
      console.groupEnd();

      return NextResponse.json(response);
    }

    // 2단계: users 테이블에서 사용자 정보 조회
    const followerIds = follows
      .map((follow) => follow.follower_id)
      .filter((id): id is string => id != null); // null/undefined 필터링

    console.log("📝 팔로워 ID 목록:", {
      count: followerIds.length,
      ids: followerIds,
      rawFollows: follows.length,
    });

    // 빈 배열인 경우 체크
    if (followerIds.length === 0) {
      const response: FollowListResponse = {
        users: [],
        total: 0,
      };

      console.log("✅ 팔로워 목록 조회 성공 (빈 목록):", {
        userId,
        total: 0,
      });
      console.groupEnd();

      return NextResponse.json(response);
    }

    // 사용자 정보 조회 (개별 쿼리로 안전하게 처리)
    const usersList: any[] = [];

    console.log("📝 팔로워 ID별 사용자 조회 시작:", {
      followerIds,
      count: followerIds.length,
    });

    // 각 팔로워 ID에 대해 개별적으로 사용자 정보 조회<div class="flex items-center gap-4 md:gap-6"><div class="flex items-center gap-1"><span class="font-semibold text-[#262626]">4</span><span class="text-[#8e8e8e]">게시물</span></div><button class="flex items-center gap-1 transition-opacity hover:opacity-50 cursor-pointer"><span class="font-semibold text-[#262626]">1</span><span class="text-[#8e8e8e]">팔로워</span></button><button class="flex items-center gap-1 transition-opacity hover:opacity-50 cursor-pointer"><span class="font-semibold text-[#262626]">1</span><span class="text-[#8e8e8e]">팔로잉</span></button></div>
    for (const followerId of followerIds) {
      try {
        console.log(`🔍 팔로워 ID ${followerId}에 대한 사용자 조회`);

        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id, clerk_id, name, created_at")
          .eq("id", followerId)
          .single();

        if (userError) {
          console.error(`❌ 사용자 ${followerId} 조회 실패:`, userError);
          // 개별 사용자 조회 실패는 전체 실패로 처리하지 않음
          continue;
        }

        if (user) {
          usersList.push({
            id: user.id,
            clerk_id: user.clerk_id,
            name: user.name,
            created_at: user.created_at,
          });
          console.log(`✅ 사용자 ${followerId} 조회 성공:`, user.name);
        }
      } catch (error) {
        console.error(`❌ 사용자 ${followerId} 조회 중 예외:`, error);
        // 개별 사용자 조회 실패는 전체 실패로 처리하지 않음
        continue;
      }
    }

    const response: FollowListResponse = {
      users: usersList,
      total: usersList.length,
    };

    console.log("✅ 팔로워 목록 조회 성공:", {
      userId,
      total: usersList.length,
      usersFound: usersList.length,
      requestedIds: followerIds.length,
    });
    console.groupEnd();

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ 팔로워 목록 조회 에러:", error);
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
