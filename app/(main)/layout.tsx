import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

/**
 * @file app/(main)/layout.tsx
 * @description 메인 앱 레이아웃 (Route Group)
 *
 * 이 레이아웃은 Instagram 스타일의 메인 앱 인터페이스를 제공합니다.
 *
 * 주요 기능:
 * 1. Sidebar + 메인 컨텐츠 레이아웃
 * 2. 반응형 처리 (Mobile/Tablet/Desktop)
 * 3. MobileHeader 및 BottomNav 조건부 렌더링
 *
 * 반응형 브레이크포인트:
 * - Mobile (< 768px): Header + BottomNav 표시, Sidebar 숨김
 * - Tablet (768px ~ 1024px): Sidebar (72px) 표시, Header/BottomNav 숨김
 * - Desktop (1024px+): Sidebar (244px) 표시, Header/BottomNav 숨김
 *
 * @dependencies
 * - components/layout/Sidebar: 데스크톱/태블릿 사이드바
 * - components/layout/Header: 모바일 헤더
 * - components/layout/BottomNav: 모바일 하단 네비게이션
 */

export const metadata: Metadata = {
  title: "Instagram SNS",
  description: "Instagram 스타일 SNS 앱",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Sidebar: 태블릿/데스크톱에서만 표시 (md 이상) */}
      <Sidebar />

      {/* Mobile Header: 모바일에서만 표시 (md 미만) */}
      <Header />

      {/* 메인 컨텐츠 영역 */}
      <main
        className="
          pt-[60px] md:pt-0
          pb-[50px] md:pb-0
          md:ml-[72px] lg:ml-[244px]
          min-h-screen
          flex
          justify-center
        "
      >
        {/* 메인 피드 컨텐츠 (최대 너비 630px, 중앙 정렬) */}
        <div className="w-full max-w-[630px] px-4 py-8 md:py-12">
          {children}
        </div>
      </main>

      {/* Bottom Nav: 모바일에서만 표시 (md 미만) */}
      <BottomNav />
    </div>
  );
}
