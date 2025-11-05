import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { PostWithDetails } from "@/types/post";

/**
 * @file app/api/posts/route.ts
 * @description 게시물 목록 조회 및 생성 API
 *
 * 이 API는 게시물 목록을 조회하고 게시물을 생성합니다.
 *
 * GET: 게시물 목록 조회
 * - 페이지네이션 (10개씩)
 * - 시간 역순 정렬
 * - 사용자 정보 JOIN (users 테이블)
 * - post_stats 뷰 활용 (좋아요 수, 댓글 수)
 * - 댓글 미리보기 최신 2개 조회
 *
 * POST: 게시물 생성
 * - 이미지 파일 업로드 (최대 5MB)
 * - 파일 형식 검증 (jpg, png, webp 등)
 * - Supabase Storage에 업로드
 * - posts 테이블에 데이터 저장
 *
 * @query (GET)
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지당 항목 수 (기본값: 10, 최대: 50)
 * - userId: 특정 사용자의 게시물만 조회 (선택사항)
 *
 * @body (POST)
 * - image: File 객체 (필수)
 * - caption: string (선택사항, 최대 2,200자)
 *
 * @dependencies
 * - lib/supabase/server: Supabase 클라이언트
 * - types/post: 타입 정의
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClerkSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    // 페이지네이션 파라미터
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const offset = (page - 1) * limit;

    // 특정 사용자 필터 (선택사항)
    const userId = searchParams.get("userId");

    // post_stats 뷰에서 게시물 통계 조회
    let postsQuery = supabase
      .from("post_stats")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 특정 사용자 필터 적용
    if (userId) {
      postsQuery = postsQuery.eq("user_id", userId);
    }

    const { data: postsStats, error: postsError } = await postsQuery;

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 },
      );
    }

    if (!postsStats || postsStats.length === 0) {
      return NextResponse.json({
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false,
        },
      });
    }

    // 게시물 ID 배열 추출
    const postIds = postsStats.map((post) => post.post_id);

    // 사용자 정보 조회 (users 테이블)
    const userIds = [...new Set(postsStats.map((post) => post.user_id))];
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id, name, created_at")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError.message },
        { status: 500 },
      );
    }

    // 사용자 맵 생성
    const usersMap = new Map(users?.map((user) => [user.id, user]) || []);

    // 댓글 미리보기 조회 (각 게시물당 최신 2개)
    // 각 게시물별로 최신 2개를 가져오기 위해 게시물별로 쿼리 실행
    const commentsByPostArray = await Promise.all(
      postIds.map(async (postId) => {
        const { data, error } = await supabase
          .from("comments")
          .select("id, post_id, user_id, content, created_at, updated_at")
          .eq("post_id", postId)
          .order("created_at", { ascending: false })
          .limit(2);

        if (error) {
          console.error(`Error fetching comments for post ${postId}:`, error);
          return [];
        }

        return data || [];
      }),
    );

    // 댓글 배열을 평탄화
    const comments = commentsByPostArray.flat();

    // 댓글 작성자 ID 배열 추출
    const commentUserIds = [
      ...new Set(comments.map((comment) => comment.user_id)),
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
      console.error("Error fetching comment users:", commentUsersError);
      return NextResponse.json(
        {
          error: "Failed to fetch comment users",
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

    // 댓글을 게시물별로 그룹화 (이미 각 게시물당 최신 2개만 가져옴)
    const commentsByPost = new Map<string, typeof comments>();
    comments.forEach((comment) => {
      if (!commentsByPost.has(comment.post_id)) {
        commentsByPost.set(comment.post_id, []);
      }
      commentsByPost.get(comment.post_id)!.push(comment);
    });

    // 현재 사용자 ID 가져오기 (좋아요/북마크 상태 확인용)
    const { userId: clerkUserId } = await auth();

    // 좋아요 및 북마크 상태 조회 (현재 사용자가 로그인한 경우)
    let userLikes: string[] = [];
    let userBookmarks: string[] = [];
    if (clerkUserId) {
      // Supabase에서 현재 사용자 ID를 가져오기 위해 users 테이블에서 조회
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (currentUser) {
        // 좋아요 상태 조회
        const { data: likes } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUser.id)
          .in("post_id", postIds);

        userLikes = likes?.map((like) => like.post_id) || [];

        // 북마크 상태 조회
        const { data: bookmarks } = await supabase
          .from("bookmarks")
          .select("post_id")
          .eq("user_id", currentUser.id)
          .in("post_id", postIds);

        userBookmarks = bookmarks?.map((bookmark) => bookmark.post_id) || [];
      }
    }

    // 결과 조합
    const postsWithDetails: PostWithDetails[] = postsStats.map((post) => {
      const user = usersMap.get(post.user_id);
      if (!user) {
        throw new Error(`User not found for post ${post.post_id}`);
      }

      // 댓글 미리보기 (최신 2개, 사용자 정보 포함)
      const postComments = commentsByPost.get(post.post_id) || [];
      const commentsWithUsers = postComments
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

      return {
        ...post,
        user: {
          ...user,
          image_url: undefined, // Clerk에서 가져올 수 있지만 현재는 undefined
        },
        comments: commentsWithUsers,
        user_liked: userLikes.includes(post.post_id),
        user_bookmarked: userBookmarks.includes(post.post_id),
      };
    });

    // 전체 게시물 수 조회 (페이지네이션용)
    let countQuery = supabase
      .from("post_stats")
      .select("*", { count: "exact", head: true });

    if (userId) {
      countQuery = countQuery.eq("user_id", userId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting posts:", countError);
      // count 에러는 무시하고 진행
    }

    return NextResponse.json({
      posts: postsWithDetails,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error("Posts API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST - 게시물 생성
 */
export async function POST(request: NextRequest) {
  try {
    console.group("[API] POST /api/posts - 게시물 생성 시작");

    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      console.log("❌ 인증 실패: 로그인되지 않은 사용자");
      return NextResponse.json(
        { error: "Unauthorized", message: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    console.log("✅ 인증 확인 완료:", clerkUserId);

    // FormData 파싱
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const caption = (formData.get("caption") as string) || "";

    console.log("📝 요청 데이터:", {
      hasImage: !!imageFile,
      imageName: imageFile?.name,
      imageSize: imageFile?.size,
      captionLength: caption.length,
    });

    // 이미지 파일 검증
    if (!imageFile) {
      console.log("❌ 이미지 파일 없음");
      return NextResponse.json(
        { error: "Bad Request", message: "이미지 파일이 필요합니다." },
        { status: 400 },
      );
    }

    // 파일 크기 검증 (최대 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > MAX_FILE_SIZE) {
      console.log("❌ 파일 크기 초과:", imageFile.size);
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "이미지 파일 크기는 5MB를 초과할 수 없습니다.",
        },
        { status: 400 },
      );
    }

    // 파일 형식 검증
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(imageFile.type)) {
      console.log("❌ 허용되지 않은 파일 형식:", imageFile.type);
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "지원하지 않는 이미지 형식입니다. (JPG, PNG, WebP, GIF만 지원)",
        },
        { status: 400 },
      );
    }

    // 캡션 길이 검증 (최대 2,200자)
    if (caption.length > 2200) {
      console.log("❌ 캡션 길이 초과:", caption.length);
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "캡션은 최대 2,200자까지 입력할 수 있습니다.",
        },
        { status: 400 },
      );
    }

    console.log("✅ 파일 검증 완료");

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

    // 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const fileExt = imageFile.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `${clerkUserId}/${fileName}`;

    console.log("📤 Storage 업로드 시작:", { filePath, size: imageFile.size });

    // Supabase Storage에 업로드
    const storageBucket = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads";
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Storage 업로드 실패:", uploadError);
      return NextResponse.json(
        {
          error: "Upload Error",
          message: "이미지 업로드 중 오류가 발생했습니다.",
          details: uploadError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ Storage 업로드 성공:", uploadData.path);

    // 업로드된 이미지 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from(storageBucket).getPublicUrl(filePath);

    console.log("📝 이미지 URL:", publicUrl);

    // posts 테이블에 데이터 저장
    const { data: postData, error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: currentUser.id,
        image_url: publicUrl,
        caption: caption || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ 게시물 저장 실패:", insertError);

      // 롤백: Storage에서 파일 삭제
      await supabase.storage.from(storageBucket).remove([filePath]);
      console.log("🔄 Storage 파일 롤백 완료");

      return NextResponse.json(
        {
          error: "Database Error",
          message: "게시물 저장 중 오류가 발생했습니다.",
          details: insertError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ 게시물 저장 성공:", postData.id);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      post: postData,
      message: "게시물이 성공적으로 생성되었습니다.",
    });
  } catch (error) {
    console.error("❌ 게시물 생성 API 에러:", error);
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
