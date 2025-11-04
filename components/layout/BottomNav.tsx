"use client";

/**
 * @file components/layout/BottomNav.tsx
 * @description Instagram 스타일 하단 네비게이션 컴포넌트
 *
 * 이 컴포넌트는 모바일 화면에서 표시되는 하단 네비게이션 바입니다.
 *
 * 주요 기능:
 * 1. 높이 50px 고정
 * 2. 5개 아이콘 메뉴 (홈, 검색, 만들기, 좋아요, 프로필)
 * 3. 모바일 전용 (md 미만에서만 표시)
 * 4. Active 상태 스타일링
 *
 * @dependencies
 * - lucide-react: 아이콘 라이브러리
 * - next/navigation: 경로 탐색 및 현재 경로 확인
 * - @clerk/nextjs: 사용자 인증 상태 확인
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Heart, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface BottomNavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
}

const bottomNavItems: BottomNavItem[] = [
  {
    href: "/",
    icon: Home,
  },
  {
    href: "/search",
    icon: Search,
  },
  {
    href: "/create",
    icon: Plus,
    requiresAuth: true,
  },
  {
    href: "/likes",
    icon: Heart,
    requiresAuth: true,
  },
  {
    href: "/profile",
    icon: User,
    requiresAuth: true,
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t border-[#dbdbdb] z-50">
      <div className="h-full flex items-center justify-around">
        {bottomNavItems.map((item) => {
          // 인증이 필요한 메뉴는 로그인하지 않은 경우 홈으로 리다이렉트
          if (item.requiresAuth && !isSignedIn) {
            return null;
          }

          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center flex-1 h-full transition-colors",
                "hover:bg-[#fafafa]",
                isActive && "bg-[#fafafa]",
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 text-[#262626]",
                  isActive && "stroke-[2.5]",
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
