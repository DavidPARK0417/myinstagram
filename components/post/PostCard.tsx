"use client";

/**
 * @file components/post/PostCard.tsx
 * @description Instagram 스타일 게시물 카드 컴포넌트
 *
 * 이 컴포넌트는 Instagram과 유사한 게시물 카드를 표시합니다.
 *
 * 주요 기능:
 * 1. 헤더 섹션 (프로필 이미지 32px, 사용자명, 시간, ⋯ 메뉴)
 * 2. 이미지 영역 (1:1 정사각형 비율)
 * 3. 액션 버튼 (좋아요, 댓글, 공유(UI만), 북마크(UI만))
 * 4. 컨텐츠 섹션 (좋아요 수, 캡션, 댓글 미리보기 2개)
 * 5. 캡션 "... 더 보기" 토글 기능
 * 6. 좋아요 기능 (버튼 클릭, 이미지 더블탭)
 *
 * @dependencies
 * - lucide-react: 아이콘 라이브러리
 * - types/post: 타입 정의
 * - lib/utils/format-time: 상대 시간 포맷팅
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { PostWithDetails, CommentWithUser } from "@/types/post";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { cn } from "@/lib/utils";
import PostModal from "./PostModal";

interface PostCardProps {
  post: PostWithDetails;
}

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 좋아요 상태 관리
  const [isLiked, setIsLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDoubleTapAnimating, setIsDoubleTapAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 북마크 상태 관리
  const [isBookmarked, setIsBookmarked] = useState(
    post.user_bookmarked || false,
  );
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // 삭제 메뉴 상태 관리
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 본인 게시글인지 확인
  const isOwnPost = clerkUser?.id === post.user.clerk_id;

  /**
   * 게시물 클릭 핸들러 (이미지 또는 댓글 "모두 보기" 클릭 시)
   */
  const handlePostClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Mobile에서는 페이지로 이동, Desktop에서는 모달 열기
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      router.push(`/post/${post.post_id}`);
    } else {
      setIsModalOpen(true);
    }
  };

  // 더블탭 애니메이션 효과 제어 (fade in/out)
  useEffect(() => {
    if (isDoubleTapAnimating) {
      // 애니메이션이 시작되면 즉시 fade-in 효과를 위해 리렌더링 트리거
      // 1초 후 fade-out을 위해 타이머 설정
      const timer = setTimeout(() => {
        setIsDoubleTapAnimating(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDoubleTapAnimating]);

  // 캡션 줄 수 계산 (대략적으로)
  const captionLines = post.caption ? Math.ceil(post.caption.length / 40) : 0; // 한 줄당 약 40자로 가정
  const shouldShowMore = captionLines > 2;

  // 캡션 표시 텍스트
  const displayCaption =
    shouldShowMore && !isCaptionExpanded
      ? post.caption?.substring(0, 80) + "..."
      : post.caption;

  // 댓글 미리보기 (최신 2개, created_at 기준 내림차순)
  const previewComments = [...post.comments]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 2) as CommentWithUser[];

  /**
   * 좋아요 버튼 클릭 핸들러
   */
  const handleLikeClick = async () => {
    if (isLoading) return;

    console.group(`[PostCard] 좋아요 버튼 클릭 - post_id: ${post.post_id}`);
    console.log("현재 상태:", { isLiked, likesCount });

    setIsLoading(true);
    setIsAnimating(true);

    try {
      const url = "/api/likes";
      const method = isLiked ? "DELETE" : "POST";
      const body = JSON.stringify({ post_id: post.post_id });

      console.log(`API 호출: ${method} ${url}`, { post_id: post.post_id });

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

      // 409 (Already Liked) 또는 404 (Already Unliked)는 상태 동기화를 의미
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
      // 에러 발생 시 사용자에게 알림 (추후 토스트 메시지로 개선 가능)
      alert(
        error instanceof Error
          ? error.message
          : "좋아요 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
      // 클릭 애니메이션 완료 대기 (0.15초)
      setTimeout(() => {
        setIsAnimating(false);
      }, 150);
      console.groupEnd();
    }
  };

  /**
   * 이미지 더블탭 핸들러
   */
  const handleDoubleClick = async () => {
    // 이미 좋아요가 눌려있으면 무시
    if (isLiked || isLoading) return;

    console.group(`[PostCard] 이미지 더블탭 - post_id: ${post.post_id}`);
    console.log("현재 상태:", { isLiked, likesCount });

    // 더블탭 애니메이션 시작
    setIsDoubleTapAnimating(true);

    try {
      const url = "/api/likes";
      const body = JSON.stringify({ post_id: post.post_id });

      console.log(`API 호출: POST ${url}`, { post_id: post.post_id });

      const response = await fetch(url, {
        method: "POST",
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
      setIsLiked(true);
      setLikesCount(likesCount + 1);

      console.log("✅ 상태 업데이트:", {
        isLiked: true,
        likesCount: likesCount + 1,
      });
    } catch (error) {
      console.error("❌ 좋아요 처리 오류:", error);
      // 에러 발생 시 사용자에게 알림
      alert(
        error instanceof Error
          ? error.message
          : "좋아요 처리 중 오류가 발생했습니다.",
      );
      // 에러 발생 시에도 애니메이션은 정상적으로 진행되도록 함
    } finally {
      // 더블탭 애니메이션은 useEffect에서 자동으로 처리됨
      console.groupEnd();
    }
  };

  /**
   * 공유 버튼 클릭 핸들러
   */
  const handleShareClick = async () => {
    console.group(`[PostCard] 공유 버튼 클릭 - post_id: ${post.post_id}`);

    // 공유할 URL 생성
    const shareUrl = `${window.location.origin}/post/${post.post_id}`;
    console.log("공유 URL:", shareUrl);

    try {
      // Web Share API 지원 확인 (주로 모바일)
      if (navigator.share) {
        console.log("Web Share API 사용");
        await navigator.share({
          title: `${post.user.name}님의 게시물`,
          text: post.caption || "게시물 보기",
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
    if (isBookmarkLoading) return;

    console.group(`[PostCard] 북마크 버튼 클릭 - post_id: ${post.post_id}`);
    console.log("현재 상태:", { isBookmarked });

    setIsBookmarkLoading(true);

    try {
      const url = "/api/bookmarks";
      const method = isBookmarked ? "DELETE" : "POST";
      const body = JSON.stringify({ post_id: post.post_id });

      console.log(`API 호출: ${method} ${url}`, { post_id: post.post_id });

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
    if (isDeleting) return;

    console.group(`[PostCard] 게시물 삭제 시작 - post_id: ${post.post_id}`);
    console.log("게시물 정보:", {
      post_id: post.post_id,
      user_id: post.user.id,
    });

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${post.post_id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ 게시물 삭제 실패:", data);
        throw new Error(data.message || "게시물 삭제 중 오류가 발생했습니다.");
      }

      console.log("✅ 게시물 삭제 성공");
      console.groupEnd();

      // 삭제 성공 후 페이지 새로고침
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

  return (
    <article className="bg-white border border-[#dbdbdb] rounded-lg mb-4">
      {/* 헤더 섹션 (60px) */}
      <header className="h-[60px] flex items-center justify-between px-4 border-b border-[#dbdbdb]">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 32px 원형 */}
          <Link
            href={`/profile/${post.user.id}`}
            className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
          >
            {post.user.image_url ? (
              <Image
                src={post.user.image_url}
                alt={post.user.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs font-semibold">
                {post.user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          {/* 사용자명 + 시간 */}
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold text-[#262626] hover:opacity-50 transition-opacity"
            >
              {post.user.name}
            </Link>
            <span className="text-xs text-[#8e8e8e]">
              {formatRelativeTime(post.created_at)}
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

      {/* 이미지 영역 (1:1 정사각형) */}
      <div
        className="relative aspect-square w-full bg-gray-100 cursor-pointer select-none"
        onDoubleClick={handleDoubleClick}
        onClick={handlePostClick}
      >
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover pointer-events-none"
          sizes="(max-width: 768px) 100vw, 630px"
          quality={85}
          loading="lazy"
        />
        {/* 더블탭 큰 하트 애니메이션 */}
        {isDoubleTapAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Heart
              className={cn(
                "w-24 h-24 text-[#ed4956] fill-[#ed4956]",
                "transition-all duration-1000 ease-in-out",
                "opacity-100 scale-100",
              )}
            />
          </div>
        )}
      </div>

      {/* 액션 버튼 섹션 (48px) */}
      <div className="h-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
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
                "w-6 h-6 transition-transform duration-150",
                isAnimating && "scale-125",
                isLiked && "fill-[#ed4956] text-[#ed4956]",
              )}
            />
          </button>
          {/* 댓글 버튼 */}
          <button
            onClick={handlePostClick}
            className="text-[#262626] hover:opacity-50 transition-opacity"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          {/* 공유 버튼 */}
          <button
            onClick={handleShareClick}
            className="text-[#262626] hover:opacity-50 transition-opacity"
            title="게시물 공유"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        {/* 북마크 버튼 */}
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

      {/* 컨텐츠 섹션 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 */}
        {likesCount > 0 && (
          <div className="font-semibold text-[#262626]">
            좋아요 {likesCount.toLocaleString()}개
          </div>
        )}

        {/* 캡션 */}
        {post.caption && (
          <div className="text-sm text-[#262626]">
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold hover:opacity-50 transition-opacity"
            >
              {post.user.name}
            </Link>{" "}
            <span>{displayCaption}</span>
            {shouldShowMore && (
              <button
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-[#8e8e8e] hover:text-[#262626] ml-1 transition-colors"
              >
                {isCaptionExpanded ? " 줄이기" : " 더 보기"}
              </button>
            )}
          </div>
        )}

        {/* 댓글 미리보기 */}
        {post.comments_count > 0 && (
          <div className="space-y-1">
            {/* "댓글 N개 모두 보기" 링크 */}
            {post.comments_count > 2 && (
              <button
                onClick={handlePostClick}
                className="text-sm text-[#8e8e8e] hover:text-[#262626] transition-colors text-left"
              >
                댓글 {post.comments_count}개 모두 보기
              </button>
            )}
            {/* 최신 댓글 2개 미리보기 */}
            {previewComments.map((comment) => (
              <div key={comment.id} className="text-sm text-[#262626]">
                <Link
                  href={`/profile/${comment.user.id}`}
                  className="font-semibold hover:opacity-50 transition-opacity"
                >
                  {comment.user.name}
                </Link>{" "}
                <span>{comment.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 게시물 상세 모달 (Desktop) */}
      <PostModal post={post} open={isModalOpen} onOpenChange={setIsModalOpen} />

      {/* 삭제 확인 다이얼로그 */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
    </article>
  );
}
