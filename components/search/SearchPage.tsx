"use client";

/**
 * @file components/search/SearchPage.tsx
 * @description 검색 페이지 메인 컴포넌트
 *
 * 이 컴포넌트는 검색 기능의 메인 UI를 제공합니다.
 *
 * 주요 기능:
 * 1. 검색 입력 필드
 * 2. 실시간 검색 (debounce 적용, 300ms)
 * 3. 검색 결과 목록 표시
 * 4. 로딩 스켈레톤 UI
 * 5. 검색 결과 없음 상태 처리
 *
 * @dependencies
 * - components/search/UserSearchResult: 사용자 검색 결과 아이템
 * - types/search: 타입 정의
 * - lucide-react: 아이콘 라이브러리
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { UserSearchResult as UserSearchResultType } from "@/types/search";
import UserSearchResult from "./UserSearchResult";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserSearchResultType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 검색 API 호출
   */
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    console.group("[SearchPage] 검색 실행");
    console.log("검색어:", searchTerm);

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchTerm)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ 검색 실패:", response.status, errorData);
        throw new Error(
          errorData.message ||
            `검색 중 오류가 발생했습니다. (${response.status})`,
        );
      }

      const data = await response.json();
      const users: UserSearchResultType[] = data.results?.users || [];

      console.log("✅ 검색 성공:", {
        query: searchTerm,
        resultsCount: users.length,
      });
      console.groupEnd();

      setResults(users);
    } catch (err) {
      console.error("❌ 검색 오류:", err);
      console.groupEnd();
      setError(
        err instanceof Error ? err.message : "검색 중 오류가 발생했습니다.",
      );
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Debounce를 적용한 검색 실행
   */
  useEffect(() => {
    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 검색어가 비어있으면 결과 초기화
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // 300ms 후에 검색 실행
    setIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(query);
      performSearch(query);
    }, 300);

    // 클린업 함수
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch]);

  /**
   * 검색어 입력 핸들러
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setError(null);
  };

  return (
    <div className="w-full max-w-[630px] mx-auto px-4 py-6">
      {/* 검색 입력 필드 */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="w-5 h-5 text-[#8e8e8e]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="검색"
            className={cn(
              "w-full pl-10 pr-4 py-3 rounded-lg border border-[#dbdbdb]",
              "bg-white text-[#262626] placeholder:text-[#8e8e8e]",
              "focus:outline-none focus:border-[#0095f6] focus:ring-1 focus:ring-[#0095f6]",
              "transition-colors",
            )}
            autoFocus
          />
        </div>
      </div>

      {/* 검색 결과 영역 */}
      <div className="space-y-2">
        {/* 로딩 상태 */}
        {isLoading && query.trim() && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#8e8e8e] animate-spin" />
          </div>
        )}

        {/* 에러 상태 */}
        {error && !isLoading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-[#ed4956]">{error}</p>
          </div>
        )}

        {/* 검색 결과 없음 */}
        {!isLoading &&
          !error &&
          query.trim() &&
          searchQuery.trim() &&
          results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm font-semibold text-[#262626] mb-1">
                검색 결과가 없습니다
              </p>
              <p className="text-xs text-[#8e8e8e]">
                다른 검색어를 시도해보세요.
              </p>
            </div>
          )}

        {/* 검색어 입력 전 상태 */}
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="w-12 h-12 text-[#8e8e8e] mb-3" />
            <p className="text-sm font-semibold text-[#262626] mb-1">검색</p>
            <p className="text-xs text-[#8e8e8e]">
              사용자 이름을 검색해보세요.
            </p>
          </div>
        )}

        {/* 검색 결과 목록 */}
        {!isLoading && !error && query.trim() && results.length > 0 && (
          <div className="bg-white rounded-lg border border-[#dbdbdb] divide-y divide-[#dbdbdb]">
            {results.map((user) => (
              <UserSearchResult key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
