import { SignIn } from "@clerk/nextjs";

/**
 * @file app/(auth)/sign-in/[[...sign-in]]/page.tsx
 * @description Clerk 로그인 페이지
 *
 * 이 페이지는 Clerk의 SignIn 컴포넌트를 사용하여 로그인 UI를 제공합니다.
 * [[...sign-in]] 동적 라우트를 사용하여 Clerk의 모든 인증 경로를 처리합니다.
 *
 * @see {@link https://clerk.com/docs/components/authentication/sign-in} - Clerk SignIn 문서
 */

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none border border-[#dbdbdb]",
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/"
      />
    </div>
  );
}
