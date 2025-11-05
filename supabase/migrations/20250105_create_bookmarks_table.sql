-- ============================================
-- Bookmarks 테이블 (북마크)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

    -- 중복 북마크 방지 (같은 사용자가 같은 게시물에 여러 번 북마크 불가)
    UNIQUE(post_id, user_id)
);

-- 테이블 소유자 설정
ALTER TABLE public.bookmarks OWNER TO postgres;

-- 인덱스 생성
CREATE INDEX idx_bookmarks_post_id ON public.bookmarks(post_id);
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);

-- RLS 비활성화 (개발 단계)
ALTER TABLE public.bookmarks DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.bookmarks TO anon;
GRANT ALL ON TABLE public.bookmarks TO authenticated;
GRANT ALL ON TABLE public.bookmarks TO service_role;

