import { SignUp } from "@clerk/nextjs";

/**
 * @file app/(auth)/sign-up/[[...sign-up]]/page.tsx
 * @description Clerk 회원가입 페이지
 *
 * 이 페이지는 Clerk의 SignUp 컴포넌트를 사용하여 회원가입 UI를 제공합니다.
 * [[...sign-up]] 동적 라우트를 사용하여 Clerk의 모든 인증 경로를 처리합니다.
 *
 * @see {@link https://clerk.com/docs/components/authentication/sign-up} - Clerk SignUp 문서
 */

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none border border-[#dbdbdb]",
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/"
      />
    </div>
  );
}

