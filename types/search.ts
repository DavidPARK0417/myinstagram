/**
 * @file types/search.ts
 * @description 검색 관련 TypeScript 타입 정의
 *
 * 검색 기능에서 사용하는 타입들을 정의합니다.
 */

/**
 * 사용자 검색 결과 타입
 */
export interface UserSearchResult {
  id: string;
  clerk_id: string;
  name: string;
  created_at: string;
  image_url?: string; // Clerk 프로필 이미지 URL (optional)
}

/**
 * 검색 결과 응답 타입
 */
export interface SearchResult {
  users: UserSearchResult[];
  total: number;
}

/**
 * 검색 API 응답 타입
 */
export interface SearchResponse {
  results: SearchResult;
  query: string;
}
