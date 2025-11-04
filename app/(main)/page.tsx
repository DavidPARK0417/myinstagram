/**
 * @file app/(main)/page.tsx
 * @description 홈 피드 페이지
 *
 * 이 페이지는 Instagram 스타일의 홈 피드를 표시합니다.
 *
 * 주요 기능:
 * 1. PostFeed 컴포넌트를 통한 게시물 목록 표시
 * 2. 로딩 상태 처리
 * 3. 배경색 #FAFAFA, 카드 배경 #FFFFFF (layout에서 처리)
 * 4. 최대 너비 630px 중앙 정렬 (layout에서 처리)
 *
 * @dependencies
 * - components/post/PostFeed: 게시물 피드 컴포넌트
 * - TODO: /api/posts GET API 연동 필요
 */

import PostFeed from "@/components/post/PostFeed";

export default function HomePage() {
  // TODO: API 연동 후 실제 데이터 fetch
  // 현재는 빈 상태로 표시 (API 구현 후 데이터 연결)

  return (
    <div className="w-full">
      <PostFeed posts={undefined} isLoading={false} error={null} />
    </div>
  );
}
