"use client";

/**
 * @file components/layout/Header.tsx
 * @description Instagram 스타일 모바일 헤더 컴포넌트
 *
 * 이 컴포넌트는 모바일 화면에서 표시되는 상단 헤더입니다.
 *
 * 주요 기능:
 * 1. 높이 60px 고정
 * 2. 로고 (Instagram) + 알림/DM/프로필 아이콘
 * 3. 모바일 전용 (md 미만에서만 표시)
 *
 * @dependencies
 * - lucide-react: 아이콘 라이브러리
 * - next/navigation: 경로 탐색
 * - @clerk/nextjs: 사용자 인증 상태 확인
 */

import Link from "next/link";
import { Bell, Send, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";

export default function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-[#dbdbdb] z-50">
      <div className="h-full flex items-center justify-between px-4">
        {/* 로고 */}
        <Link href="/" className="text-xl font-bold text-[#262626]">
          Instagram
        </Link>

        {/* 우측 아이콘들 */}
        <div className="flex items-center gap-4">
          {/* 알림 (인증 필요) */}
          {isSignedIn && (
            <Link href="/notifications" className="text-[#262626]">
              <Bell className="w-6 h-6" />
            </Link>
          )}

          {/* DM (인증 필요) */}
          {isSignedIn && (
            <Link href="/messages" className="text-[#262626]">
              <Send className="w-6 h-6" />
            </Link>
          )}

          {/* 프로필 (인증 필요) */}
          {isSignedIn ? (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-6 h-6",
                },
              }}
            />
          ) : (
            <Link href="/sign-in" className="text-[#262626]">
              <User className="w-6 h-6" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
