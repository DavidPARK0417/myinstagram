/**
 * @file app/(main)/profile/[userId]/page.tsx
 * @description 사용자 프로필 페이지
 *
 * 이 페이지는 특정 사용자의 프로필 정보를 표시합니다.
 *
 * 주요 기능:
 * 1. 사용자 프로필 정보 표시 (ProfileHeader)
 * 2. 프로필 이미지, 통계, 팔로우 버튼
 * 3. 게시물 그리드 표시 (PostGrid)
 * 4. SEO 메타데이터 생성
 *
 * @dependencies
 * - components/profile/ProfileHeader: 프로필 헤더 컴포넌트
 * - components/profile/PostGrid: 게시물 그리드 컴포넌트
 * - app/api/users/[userId]: 사용자 프로필 조회 API
 */

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileHeaderSkeleton from "@/components/profile/ProfileHeaderSkeleton";
import PostGrid from "@/components/profile/PostGrid";
import { UserProfileResponse } from "@/types/post";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

/**
 * 동적 메타데이터 생성
 */
export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { userId } = await params;

  try {
    // 현재 호스트 정보 가져오기
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    // 사용자 프로필 API 호출 (쿠키 전달)
    const cookie = headersList.get("cookie") ?? "";
    const response = await fetch(`${baseUrl}/api/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        title: "프로필을 찾을 수 없습니다",
      };
    }

    const data: UserProfileResponse = await response.json();
    const user = data.user;

    const title = `${user.name} (@${user.name})`;
    const description = `${user.name}님의 프로필입니다. 게시물 ${
      user.posts_count || 0
    }개, 팔로워 ${user.followers_count || 0}명, 팔로잉 ${
      user.following_count || 0
    }명`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "profile",
        images: user.image_url
          ? [
              {
                url: user.image_url,
                width: 400,
                height: 400,
                alt: `${user.name}님의 프로필 이미지`,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: user.image_url ? [user.image_url] : undefined,
      },
    };
  } catch (error) {
    console.error("❌ 메타데이터 생성 오류:", error);
    return {
      title: "프로필",
    };
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  console.group(`[ProfilePage] 사용자 프로필 조회 - user_id: ${userId}`);

  try {
    // 현재 호스트 정보 가져오기 (Next.js 15)
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    console.log("📝 API 호출:", `${baseUrl}/api/users/${userId}`);

    // 사용자 프로필 API 호출 (쿠키 전달)
    const cookie = headersList.get("cookie") ?? "";
    const response = await fetch(`${baseUrl}/api/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ API 호출 실패:", response.status, errorData);

      if (response.status === 404) {
        console.groupEnd();
        notFound();
      }

      throw new Error(
        errorData.message ||
          `프로필을 불러오는데 실패했습니다. (${response.status})`,
      );
    }

    const data: UserProfileResponse = await response.json();

    console.log("✅ 사용자 프로필 조회 성공:", {
      userId: data.user.id,
      name: data.user.name,
      isOwnProfile: data.isOwnProfile,
      isFollowing: data.isFollowing,
    });
    console.groupEnd();

    return (
      <div className="w-full">
        <Suspense fallback={<ProfileHeaderSkeleton />}>
          <ProfileHeader
            user={data.user}
            isOwnProfile={data.isOwnProfile}
            isFollowing={data.isFollowing}
          />
        </Suspense>
        <PostGrid userId={userId} />
      </div>
    );
  } catch (error) {
    console.error("❌ 사용자 프로필 조회 오류:", error);
    console.groupEnd();
    notFound();
  }
}
