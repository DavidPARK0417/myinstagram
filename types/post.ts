/**
 * @file types/post.ts
 * @description 게시물 관련 TypeScript 타입 정의
 *
 * 데이터베이스 스키마와 일치하는 타입 구조를 정의합니다.
 */

/**
 * 사용자 정보 타입
 */
export interface User {
  id: string;
  clerk_id: string;
  name: string;
  created_at: string;
  image_url?: string; // Clerk 프로필 이미지 URL (optional)
}

/**
 * 게시물 기본 정보 타입
 */
export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 댓글 타입
 */
export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * 게시물 통계 타입 (post_stats 뷰)
 */
export interface PostStats {
  post_id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

/**
 * 게시물 상세 정보 타입 (API 응답용)
 * post_stats 뷰와 users 테이블을 JOIN한 결과
 */
export interface PostWithDetails extends PostStats {
  user: User;
  comments: Comment[];
  user_liked?: boolean; // 현재 사용자가 좋아요를 눌렀는지 여부
  user_bookmarked?: boolean; // 현재 사용자가 북마크를 눌렀는지 여부
}

/**
 * 댓글 상세 정보 타입 (사용자 정보 포함)
 */
export interface CommentWithUser extends Comment {
  user: User;
}

/**
 * 사용자 통계 타입 (user_stats 뷰)
 */
export interface UserStats {
  user_id: string;
  clerk_id: string;
  name: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

/**
 * 프로필 정보 타입 (API 응답용)
 */
export interface ProfileInfo extends UserStats {
  id: string; // user_id와 동일 (별칭)
  created_at: string;
  image_url?: string; // Clerk 프로필 이미지 URL (optional)
}

/**
 * 사용자 프로필 API 응답 타입
 */
export interface UserProfileResponse {
  user: ProfileInfo;
  isOwnProfile: boolean;
  isFollowing: boolean;
}

/**
 * 팔로워/팔로잉 목록 API 응답 타입
 */
export interface FollowListResponse {
  users: User[];
  total: number;
}
