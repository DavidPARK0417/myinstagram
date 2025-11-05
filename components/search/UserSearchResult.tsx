"use client";

/**
 * @file components/search/UserSearchResult.tsx
 * @description 사용자 검색 결과 아이템 컴포넌트
 *
 * 이 컴포넌트는 검색 결과 목록에서 개별 사용자를 표시합니다.
 *
 * 주요 기능:
 * 1. 프로필 이미지 (원형)
 * 2. 사용자명, 전체 이름 표시
 * 3. 클릭 시 프로필 페이지로 이동
 * 4. Hover 효과
 *
 * @dependencies
 * - next/image: 이미지 컴포넌트
 * - next/link: 링크 컴포넌트
 * - next/navigation: 경로 탐색
 * - types/search: 타입 정의
 */

import Link from "next/link";
import Image from "next/image";
import { UserSearchResult as UserSearchResultType } from "@/types/search";
import { cn } from "@/lib/utils";

interface UserSearchResultProps {
  user: UserSearchResultType;
}

export default function UserSearchResult({ user }: UserSearchResultProps) {
  return (
    <Link
      href={`/profile/${user.id}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        "hover:bg-[#fafafa] cursor-pointer",
      )}
    >
      {/* 프로필 이미지 */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
        {user.image_url ? (
          <Image
            src={user.image_url}
            alt={user.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-lg font-semibold text-gray-500">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* 사용자 정보 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#262626] truncate">
          {user.name}
        </p>
        <p className="text-xs text-[#8e8e8e] truncate">{user.name}</p>
      </div>
    </Link>
  );
}
