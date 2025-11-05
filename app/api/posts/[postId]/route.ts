import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { PostWithDetails } from "@/types/post";

/**
 * @file app/api/posts/[postId]/route.ts
 * @description 단일 게시물 조회 API
 *
 * 이 API는 특정 게시물의 상세 정보를 조회합니다.
 *
 * GET: 게시물 상세 조회
 * - 전체 댓글 포함
 * - 사용자 정보 JOIN
 * - 좋아요 수, 댓글 수 포함
 * - 좋아요 상태 포함
 *
 * @params
 * - postId: 게시물 ID (UUID)
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 * - types/post: 타입 정의
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    console.group("[API] GET /api/posts/[postId] - 게시물 상세 조회 시작");

    const { postId } = await params;
    const supabase = createClerkSupabaseClient();

    console.log("📝 요청 데이터:", { postId });

    // post_stats 뷰에서 게시물 통계 조회
    const { data: postStats, error: postsError } = await supabase
      .from("post_stats")
      .select("*")
      .eq("post_id", postId)
      .single();

    if (postsError || !postStats) {
      console.error("❌ 게시물 조회 실패:", postsError);
      return NextResponse.json(
        {
          error: "Post Not Found",
          message: "게시물을 찾을 수 없습니다.",
          details: postsError?.message,
        },
        { status: 404 },
      );
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .eq("id", postStats.user_id)
      .single();

    if (userError || !user) {
      console.error("❌ 사용자 조회 실패:", userError);
      return NextResponse.json(
        {
          error: "User Not Found",
          message: "사용자 정보를 찾을 수 없습니다.",
          details: userError?.message,
        },
        { status: 404 },
      );
    }

    // 전체 댓글 조회 (최신순)
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("id, post_id, user_id, content, created_at, updated_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (commentsError) {
      console.error("❌ 댓글 조회 실패:", commentsError);
      return NextResponse.json(
        {
          error: "Failed to fetch comments",
          message: "댓글을 불러오는데 실패했습니다.",
          details: commentsError.message,
        },
        { status: 500 },
      );
    }

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
          error: "Failed to fetch comment users",
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

    // 현재 사용자 ID 가져오기 (좋아요 상태 확인용)
    const { userId: clerkUserId } = await auth();

    // 좋아요 상태 조회 (현재 사용자가 로그인한 경우)
    let userLiked = false;
    if (clerkUserId) {
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (currentUser) {
        const { data: like } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", currentUser.id)
          .maybeSingle();

        userLiked = !!like;
      }
    }

    // 결과 조합
    const postWithDetails: PostWithDetails = {
      ...postStats,
      user: {
        ...user,
        image_url: undefined, // Clerk에서 가져올 수 있지만 현재는 undefined
      },
      comments: commentsWithUsers,
      user_liked: userLiked,
    };

    console.log("✅ 게시물 상세 조회 성공");
    console.groupEnd();

    return NextResponse.json({
      post: postWithDetails,
    });
  } catch (error) {
    console.error("❌ 게시물 상세 조회 API 에러:", error);
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
 * DELETE - 게시물 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    console.group("[API] DELETE /api/posts/[postId] - 게시물 삭제 시작");

    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.log("❌ 인증 실패: 로그인되지 않은 사용자");
      return NextResponse.json(
        { error: "Unauthorized", message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    const { postId } = await params;
    console.log("📝 요청 데이터:", { clerkUserId, postId });

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

    // 게시물 존재 여부 및 작성자 확인
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, image_url")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("❌ 게시물 조회 실패:", postError);
      return NextResponse.json(
        {
          error: "Post Not Found",
          message: "게시물을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    // 권한 검증: 게시물 작성자만 삭제 가능
    if (post.user_id !== currentUser.id) {
      console.log("❌ 권한 없음: 본인의 게시물이 아닙니다");
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "본인의 게시물만 삭제할 수 있습니다.",
        },
        { status: 403 },
      );
    }

    console.log("✅ 권한 검증 완료");

    // Storage에서 이미지 파일 삭제
    const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads";
    const imageUrl = post.image_url;

    // Storage 경로 추출 (URL에서 경로 추출)
    // 예: https://xxx.supabase.co/storage/v1/object/public/uploads/user123/image.jpg
    // -> user123/image.jpg
    if (imageUrl) {
      try {
        const urlParts = imageUrl.split(`/${storageBucket}/`);
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          console.log("🗑️ Storage 파일 삭제 시작:", filePath);

          const { error: storageError } = await supabase.storage
            .from(storageBucket)
            .remove([filePath]);

          if (storageError) {
            console.error(
              "⚠️ Storage 파일 삭제 실패 (계속 진행):",
              storageError,
            );
            // Storage 삭제 실패해도 DB 삭제는 계속 진행
          } else {
            console.log("✅ Storage 파일 삭제 성공");
          }
        }
      } catch (error) {
        console.error("⚠️ Storage 경로 파싱 실패 (계속 진행):", error);
        // Storage 삭제 실패해도 DB 삭제는 계속 진행
      }
    }

    // 게시물 삭제 (CASCADE로 관련 댓글, 좋아요, 북마크도 자동 삭제됨)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("❌ 게시물 삭제 실패:", deleteError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "게시물 삭제 중 오류가 발생했습니다.",
          details: deleteError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 게시물 삭제 성공");
    console.groupEnd();

    return NextResponse.json({
      success: true,
      message: "게시물이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("❌ 게시물 삭제 API 에러:", error);
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
