"use client";

/**
 * @file components/layout/Sidebar.tsx
 * @description Instagram 스타일 사이드바 컴포넌트
 *
 * 이 컴포넌트는 Instagram과 유사한 사이드바 네비게이션을 제공합니다.
 *
 * 주요 기능:
 * 1. Desktop: 244px 너비, 아이콘 + 텍스트 메뉴
 * 2. Tablet: 72px 너비, 아이콘만 표시
 * 3. Hover 효과 및 Active 상태 스타일링
 * 4. 메뉴 항목: 홈, 검색, 만들기, 프로필
 * 5. "만들기" 버튼 클릭 시 게시물 작성 모달 열기
 *
 * @dependencies
 * - lucide-react: 아이콘 라이브러리
 * - next/navigation: 경로 탐색 및 현재 경로 확인
 * - @clerk/nextjs: 사용자 인증 상태 확인
 * - components/post/CreatePostModal: 게시물 작성 모달
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, User } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import CreatePostModal from "@/components/post/CreatePostModal";

interface SidebarItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiresAuth?: boolean;
  isModal?: boolean; // 모달을 열어야 하는 항목인지 여부
}

const sidebarItems: SidebarItem[] = [
  {
    href: "/",
    icon: Home,
    label: "홈",
  },
  {
    href: "/search",
    icon: Search,
    label: "검색",
  },
  {
    href: "/create",
    icon: Plus,
    label: "만들기",
    requiresAuth: true,
    isModal: true, // 모달을 열어야 함
  },
  {
    href: "/profile",
    icon: User,
    label: "프로필",
    requiresAuth: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen bg-white border-r border-[#dbdbdb] z-10 hidden md:block">
        {/* Desktop: 244px 너비, 아이콘 + 텍스트 */}
        <div className="hidden lg:block w-[244px] h-full flex flex-col pt-8 px-4">
          <div className="mb-8">
            <Link href="/" className="text-2xl font-bold text-[#262626]">
              Instagram
            </Link>
          </div>
          <nav className="flex flex-col gap-1">
            {sidebarItems.map((item) => {
              // 인증이 필요한 메뉴는 로그인하지 않은 경우 스킵
              if (item.requiresAuth && !isSignedIn) {
                return null;
              }

              const Icon = item.icon;
              const isActive = pathname === item.href && !item.isModal;

              // 모달을 열어야 하는 항목 (만들기)
              if (item.isModal) {
                return (
                  <button
                    key={item.href}
                    onClick={() => setIsCreateModalOpen(true)}
                    className={cn(
                      "flex items-center gap-4 px-3 py-2 rounded-lg transition-colors w-full text-left",
                      "hover:bg-[#fafafa]",
                      "text-[#262626]",
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-base">{item.label}</span>
                  </button>
                );
              }

              // 일반 링크 항목
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-3 py-2 rounded-lg transition-colors",
                    "hover:bg-[#fafafa]",
                    isActive && "font-semibold text-[#262626]",
                    !isActive && "text-[#262626]",
                  )}
                >
                  <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
                  <span className="text-base">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tablet: 72px 너비, 아이콘만 표시 */}
        <div className="hidden md:block lg:hidden w-[72px] h-full flex flex-col pt-8 px-2">
          <div className="mb-8 flex justify-center">
            <Link href="/" className="text-xl font-bold text-[#262626]">
              IG
            </Link>
          </div>
          <nav className="flex flex-col items-center gap-1">
            {sidebarItems.map((item) => {
              // 인증이 필요한 메뉴는 로그인하지 않은 경우 스킵
              if (item.requiresAuth && !isSignedIn) {
                return null;
              }

              const Icon = item.icon;
              const isActive = pathname === item.href && !item.isModal;

              // 모달을 열어야 하는 항목 (만들기)
              if (item.isModal) {
                return (
                  <button
                    key={item.href}
                    onClick={() => setIsCreateModalOpen(true)}
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
                      "hover:bg-[#fafafa]",
                    )}
                    title={item.label}
                  >
                    <Icon className="w-6 h-6 text-[#262626]" />
                  </button>
                );
              }

              // 일반 링크 항목
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
                    "hover:bg-[#fafafa]",
                    isActive && "bg-[#fafafa]",
                  )}
                  title={item.label}
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
          </nav>
        </div>
      </aside>

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </>
  );
}
