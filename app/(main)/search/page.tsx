/**
 * @file app/(main)/search/page.tsx
 * @description 검색 페이지
 *
 * 이 페이지는 사용자 검색 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 검색 입력 필드 (Instagram 스타일)
 * 2. 검색 결과 영역
 * 3. 로딩 상태 처리
 * 4. 검색 결과 없음 상태 처리
 *
 * @dependencies
 * - components/search/SearchPage: 검색 UI 컴포넌트
 */

import SearchPage from "@/components/search/SearchPage";

/**
 * 검색 페이지 컴포넌트
 *
 * Server Component로 구현되어 있으며, 검색 UI 컴포넌트를 렌더링합니다.
 */
export default function SearchPageRoute() {
  return (
    <div className="w-full min-h-screen bg-[#fafafa]">
      <SearchPage />
    </div>
  );
}
