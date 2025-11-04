/**
 * @file app/(main)/page.tsx
 * @description 홈 피드 페이지
 *
 * 이 페이지는 Instagram 스타일의 홈 피드를 표시합니다.
 * (현재는 임시 페이지이며, 추후 PostFeed 컴포넌트로 대체 예정)
 */

export default function HomePage() {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-[#262626] mb-8">홈 피드</h1>
      <p className="text-[#8e8e8e]">게시물 목록이 여기에 표시됩니다.</p>
    </div>
  );
}
