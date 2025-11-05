/**
 * @file app/(main)/profile/page.tsx
 * @description 내 프로필 페이지 리다이렉트
 *
 * 이 페이지는 현재 사용자의 프로필 페이지로 리다이렉트합니다.
 *
 * 주요 기능:
 * 1. Clerk 인증 확인
 * 2. 현재 사용자의 Clerk ID로 Supabase users 테이블에서 UUID 조회
 * 3. `/profile/[userId]`로 리다이렉트
 * 4. 로그인하지 않은 경우 로그인 페이지로 리다이렉트
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증
 * - lib/supabase/server: Supabase 클라이언트
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export default async function MyProfilePage() {
  console.group("[MyProfilePage] 내 프로필 리다이렉트 시작");

  // Clerk 인증 확인
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    console.log("❌ 인증 실패: 로그인되지 않은 사용자");
    console.groupEnd();
    // redirect는 try-catch 밖에서 호출 (Next.js의 redirect는 내부적으로 에러를 throw)
    redirect("/sign-in");
  }

  console.log("📝 Clerk User ID:", clerkUserId);

  // Supabase 클라이언트 생성
  const supabase = createClerkSupabaseClient();

  // 현재 사용자의 Supabase user ID 조회
  const { data: currentUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (userError || !currentUser) {
    console.error("❌ 사용자 조회 실패:", userError);
    console.groupEnd();
    // 사용자를 찾을 수 없는 경우에도 로그인 페이지로 리다이렉트
    redirect("/sign-in");
  }

  console.log("✅ 사용자 조회 성공:", currentUser.id);
  console.log("🔄 프로필 페이지로 리다이렉트:", `/profile/${currentUser.id}`);
  console.groupEnd();

  // 프로필 페이지로 리다이렉트
  // redirect는 내부적으로 에러를 throw하지만, 이것은 정상적인 동작입니다.
  // Next.js가 이를 감지하여 리다이렉트를 수행합니다.
  redirect(`/profile/${currentUser.id}`);
}
