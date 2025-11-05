"use client";

/**
 * @file components/post/PostModal.tsx
 * @description 게시물 상세 모달 컴포넌트
 *
 * 이 컴포넌트는 게시물 상세 정보를 모달로 표시합니다.
 *
 * 주요 기능:
 * 1. Desktop: Dialog 모달 (이미지 50% + 댓글 50%)
 * 2. Mobile: 전체 페이지로 리다이렉트
 * 3. 전체 댓글 표시 (스크롤 가능)
 * 4. 댓글 작성 및 삭제
 * 5. 좋아요 기능
 *
 * @dependencies
 * - components/ui/dialog: Dialog 모달 컴포넌트
 * - components/comment/CommentList: 댓글 목록
 * - components/comment/CommentForm: 댓글 작성 폼
 * - components/post/PostCard: 게시물 표시 로직 참고
 * - types/post: PostWithDetails 타입
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreVertical,
  X,
  Trash2,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PostWithDetails, CommentWithUser } from "@/types/post";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { cn } from "@/lib/utils";
import CommentList from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";
import { useUser } from "@clerk/nextjs";

interface PostModalProps {
  post: PostWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PostModal({
  post,
  open,
  onOpenChange,
}: PostModalProps) {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [localPost, setLocalPost] = useState<PostWithDetails | null>(post);
  const [comments, setComments] = useState<CommentWithUser[]>(
    (post?.comments as CommentWithUser[]) || [],
  );
  const [commentsCount, setCommentsCount] = useState(post?.comments_count || 0);
  const [isLiked, setIsLiked] = useState(post?.user_liked || false);
  const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
  const [isLoading, setIsLoading] = useState(false);

  // 북마크 상태 관리
  const [isBookmarked, setIsBookmarked] = useState(
    post?.user_bookmarked || false,
  );
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // 삭제 메뉴 상태 관리
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 본인 게시글인지 확인
  const isOwnPost = clerkUser?.id === localPost?.user.clerk_id;

  // post가 변경될 때 상태 업데이트
  useEffect(() => {
    if (post) {
      setLocalPost(post);
      // post.comments는 이미 CommentWithUser[] 타입이지만, 타입 안전성을 위해 확인
      setComments((post.comments as CommentWithUser[]) || []);
      setCommentsCount(post.comments_count || 0);
      setIsLiked(post.user_liked || false);
      setLikesCount(post.likes_count || 0);
      setIsBookmarked(post.user_bookmarked || false);
    }
  }, [post]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open && post) {
      // 상태는 유지하되, 필요시 초기화
    }
  }, [open, post]);

  /**
   * 댓글 추가 핸들러
   */
  const handleCommentAdded = (newComment: CommentWithUser) => {
    console.group(`[PostModal] 댓글 추가됨 - comment_id: ${newComment.id}`);
    console.log("새 댓글:", newComment);

    // 댓글 배열에 새 댓글 추가 (맨 앞에)
    setComments((prev) => [newComment, ...prev]);

    // 댓글 수 증가
    setCommentsCount((prev) => prev + 1);

    console.log("✅ 댓글 상태 업데이트 완료");
    console.groupEnd();
  };

  /**
   * 댓글 삭제 핸들러
   */
  const handleCommentDeleted = (commentId: string) => {
    console.group(`[PostModal] 댓글 삭제됨 - comment_id: ${commentId}`);
    console.log("삭제 전 댓글 수:", comments.length);

    // 로컬 상태에서 댓글 제거
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    // 댓글 수 감소
    setCommentsCount((prev) => Math.max(0, prev - 1));

    console.log("✅ 댓글 삭제 완료");
    console.groupEnd();
  };

  /**
   * 좋아요 버튼 클릭 핸들러
   */
  const handleLikeClick = async () => {
    if (!localPost || isLoading) return;

    console.group(
      `[PostModal] 좋아요 버튼 클릭 - post_id: ${localPost.post_id}`,
    );
    console.log("현재 상태:", { isLiked, likesCount });

    setIsLoading(true);

    try {
      const url = "/api/likes";
      const method = isLiked ? "DELETE" : "POST";
      const body = JSON.stringify({ post_id: localPost.post_id });

      console.log(`API 호출: ${method} ${url}`, { post_id: localPost.post_id });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      console.log("📡 응답 상태:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get("content-type"),
      });

      // 응답 본문이 비어있는지 확인
      const responseText = await response.text();
      console.log("📄 응답 본문 (raw):", responseText);

      let data: any = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
          console.log("📦 파싱된 데이터:", data);
        } catch (parseError) {
          console.error("❌ JSON 파싱 실패:", parseError);
          throw new Error("서버 응답을 파싱할 수 없습니다.");
        }
      } else {
        console.warn("⚠️ 응답 본문이 비어있습니다.");
      }

      // 409 (Already Liked)는 상태 동기화를 의미
      // 에러가 아니라 현재 상태를 확인하고 동기화만 수행
      if (response.status === 409) {
        // 이미 좋아요를 눌렀다는 의미 -> 상태를 true로 동기화
        console.log("ℹ️ 이미 좋아요를 눌렀습니다. 상태 동기화 중...");
        if (!isLiked) {
          setIsLiked(true);
          // 좋아요 수가 0보다 크면 유지, 아니면 1로 설정
          if (likesCount === 0) {
            setLikesCount(1);
          }
        }
        console.log("✅ 상태 동기화 완료");
        return; // 에러를 던지지 않고 조용히 처리
      }

      if (!response.ok) {
        console.error("❌ API 호출 실패:", {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        throw new Error(
          data.message ||
            data.error ||
            `서버 오류가 발생했습니다. (${response.status})`,
        );
      }

      // 상태 업데이트
      const newIsLiked = !isLiked;
      const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);

      console.log("✅ 상태 업데이트:", {
        isLiked: newIsLiked,
        likesCount: newLikesCount,
      });
    } catch (error) {
      console.error("❌ 좋아요 처리 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "좋아요 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  /**
   * 공유 버튼 클릭 핸들러
   */
  const handleShareClick = async () => {
    if (!localPost) return;

    console.group(`[PostModal] 공유 버튼 클릭 - post_id: ${localPost.post_id}`);

    // 공유할 URL 생성
    const shareUrl = `${window.location.origin}/post/${localPost.post_id}`;
    console.log("공유 URL:", shareUrl);

    try {
      // Web Share API 지원 확인 (주로 모바일)
      if (navigator.share) {
        console.log("Web Share API 사용");
        await navigator.share({
          title: `${localPost.user.name}님의 게시물`,
          text: localPost.caption || "게시물 보기",
          url: shareUrl,
        });
        console.log("✅ 공유 완료");
      } else {
        // Web Share API를 지원하지 않는 경우 클립보드로 복사
        console.log("클립보드 복사 사용");
        await navigator.clipboard.writeText(shareUrl);
        alert("링크가 복사되었습니다!");
        console.log("✅ 링크 복사 완료");
      }
    } catch (error) {
      // AbortError는 사용자가 공유를 취소한 경우이므로 무시
      if (error instanceof Error && error.name === "AbortError") {
        console.log("사용자가 공유를 취소했습니다.");
      } else {
        console.error("❌ 공유 실패:", error);
        // 클립보드 복사도 실패한 경우
        alert("공유에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      console.groupEnd();
    }
  };

  /**
   * 북마크 버튼 클릭 핸들러
   */
  const handleBookmarkClick = async () => {
    if (!localPost || isBookmarkLoading) return;

    console.group(
      `[PostModal] 북마크 버튼 클릭 - post_id: ${localPost.post_id}`,
    );
    console.log("현재 상태:", { isBookmarked });

    setIsBookmarkLoading(true);

    try {
      const url = "/api/bookmarks";
      const method = isBookmarked ? "DELETE" : "POST";
      const body = JSON.stringify({ post_id: localPost.post_id });

      console.log(`API 호출: ${method} ${url}`, { post_id: localPost.post_id });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ API 호출 실패:", data);
        throw new Error(data.message || "북마크 처리 중 오류가 발생했습니다.");
      }

      // 상태 업데이트
      const newIsBookmarked = !isBookmarked;
      setIsBookmarked(newIsBookmarked);

      console.log("✅ 상태 업데이트:", {
        isBookmarked: newIsBookmarked,
      });
    } catch (error) {
      console.error("❌ 북마크 처리 오류:", error);
      // 에러 발생 시 사용자에게 알림
      alert(
        error instanceof Error
          ? error.message
          : "북마크 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setIsBookmarkLoading(false);
      console.groupEnd();
    }
  };

  /**
   * 게시물 삭제 핸들러
   */
  const handleDelete = async () => {
    if (!localPost || isDeleting) return;

    console.group(
      `[PostModal] 게시물 삭제 시작 - post_id: ${localPost.post_id}`,
    );
    console.log("게시물 정보:", {
      post_id: localPost.post_id,
      user_id: localPost.user.id,
    });

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${localPost.post_id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ 게시물 삭제 실패:", data);
        throw new Error(data.message || "게시물 삭제 중 오류가 발생했습니다.");
      }

      console.log("✅ 게시물 삭제 성공");
      console.groupEnd();

      // 삭제 성공 후 모달 닫기 및 페이지 새로고침
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("❌ 게시물 삭제 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "게시물 삭제 중 오류가 발생했습니다.",
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      console.groupEnd();
    }
  };

  if (!localPost) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] p-0 flex flex-col sm:flex-row">
        {/* 접근성을 위한 DialogTitle (시각적으로 숨김) */}
        <DialogTitle className="sr-only">
          {localPost.user.name}님의 게시물
        </DialogTitle>
        {/* 이미지 영역 (50%) */}
        <div className="w-full sm:w-1/2 h-full bg-black flex items-center justify-center">
          <div className="relative w-full h-full">
            <Image
              src={localPost.image_url}
              alt={localPost.caption || "게시물 이미지"}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* 댓글 영역 (50%) */}
        <div className="w-full sm:w-1/2 h-full flex flex-col bg-white">
          {/* 헤더 */}
          <header className="h-[60px] flex items-center justify-between px-4 border-b border-[#dbdbdb]">
            <div className="flex items-center gap-3">
              {/* 프로필 이미지 32px 원형 */}
              <Link
                href={`/profile/${localPost.user.id}`}
                className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
              >
                {localPost.user.image_url ? (
                  <Image
                    src={localPost.user.image_url}
                    alt={localPost.user.name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs font-semibold">
                    {localPost.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              {/* 사용자명 + 시간 */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${localPost.user.id}`}
                  className="font-semibold text-[#262626] hover:opacity-50 transition-opacity"
                >
                  {localPost.user.name}
                </Link>
                <span className="text-xs text-[#8e8e8e]">
                  {formatRelativeTime(localPost.created_at)}
                </span>
              </div>
            </div>
            {/* ⋯ 메뉴 (본인 게시글만 표시) */}
            {isOwnPost && (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-[#262626] hover:opacity-50 transition-opacity"
                  aria-label="게시물 메뉴"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* 드롭다운 메뉴 */}
                {isMenuOpen && (
                  <>
                    {/* 백드롭 (클릭 시 메뉴 닫기) */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    {/* 메뉴 */}
                    <div className="absolute right-0 top-8 z-20 bg-white border border-[#dbdbdb] rounded-lg shadow-lg min-w-[160px]">
                      <button
                        onClick={() => {
                          setIsDeleteDialogOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 text-left flex items-center gap-2 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </header>

          {/* 댓글 목록 (스크롤 가능) */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* 캡션 */}
            {localPost.caption && (
              <div className="text-sm text-[#262626]">
                <Link
                  href={`/profile/${localPost.user.id}`}
                  className="font-semibold hover:opacity-50 transition-opacity"
                >
                  {localPost.user.name}
                </Link>{" "}
                <span>{localPost.caption}</span>
              </div>
            )}

            {/* 댓글 목록 */}
            <CommentList
              comments={comments}
              onCommentDeleted={handleCommentDeleted}
            />
          </div>

          {/* 액션 버튼 및 좋아요 수 */}
          <div className="border-t border-[#dbdbdb] px-4 py-3 space-y-2">
            {/* 액션 버튼 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLikeClick}
                  disabled={isLoading}
                  className={cn(
                    "text-[#262626] hover:opacity-50 transition-opacity",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <Heart
                    className={cn(
                      "w-6 h-6 transition-transform",
                      isLiked && "fill-[#ed4956] text-[#ed4956]",
                    )}
                  />
                </button>
                <button className="text-[#262626] hover:opacity-50 transition-opacity">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button
                  onClick={handleShareClick}
                  className="text-[#262626] hover:opacity-50 transition-opacity"
                  title="게시물 공유"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button
                onClick={handleBookmarkClick}
                disabled={isBookmarkLoading}
                className={cn(
                  "text-[#262626] hover:opacity-50 transition-opacity",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
                title={isBookmarked ? "북마크 제거" : "북마크 추가"}
              >
                <Bookmark
                  className={cn(
                    "w-6 h-6 transition-transform",
                    isBookmarked && "fill-[#262626] text-[#262626]",
                  )}
                />
              </button>
            </div>

            {/* 좋아요 수 */}
            {likesCount > 0 && (
              <div className="font-semibold text-[#262626]">
                좋아요 {likesCount.toLocaleString()}개
              </div>
            )}
          </div>

          {/* 댓글 작성 폼 */}
          <div className="border-t border-[#dbdbdb] px-4 py-3">
            <CommentForm
              postId={localPost.post_id}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        </div>
      </DialogContent>

      {/* 삭제 확인 다이얼로그 */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-[#262626] mb-2">
              게시물 삭제
            </h3>
            <p className="text-sm text-[#8e8e8e] mb-6">
              이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-[#262626] hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
