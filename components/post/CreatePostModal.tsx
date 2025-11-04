"use client";

/**
 * @file components/post/CreatePostModal.tsx
 * @description 게시물 작성 모달 컴포넌트
 *
 * 이 컴포넌트는 Instagram 스타일의 게시물 작성 모달을 제공합니다.
 *
 * 주요 기능:
 * 1. 이미지 선택 및 미리보기
 * 2. 캡션 입력 (최대 2,200자)
 * 3. 게시하기 버튼
 * 4. 로딩 상태 처리
 *
 * @dependencies
 * - components/ui/dialog: Dialog 모달 컴포넌트
 * - components/ui/button: Button 컴포넌트
 * - components/ui/textarea: Textarea 컴포넌트
 * - lucide-react: 아이콘 라이브러리
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreatePostModal({
  open,
  onOpenChange,
}: CreatePostModalProps) {
  // 상태 관리
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 파일 입력 ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setSelectedImage(null);
      setImagePreview(null);
      setCaption("");
      setIsLoading(false);
    }
  }, [open]);

  // 이미지 선택 핸들러
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    console.group("[CreatePostModal] 이미지 선택");
    console.log("선택된 파일:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    setSelectedImage(file);

    // 미리보기 URL 생성
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    console.log("✅ 이미지 미리보기 생성 완료");
    console.groupEnd();
  };

  // 이미지 제거 핸들러
  const handleImageRemove = () => {
    console.group("[CreatePostModal] 이미지 제거");

    // 미리보기 URL 메모리 해제
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview(null);

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    console.log("✅ 이미지 제거 완료");
    console.groupEnd();
  };

  // 캡션 변경 핸들러
  const handleCaptionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
    // 최대 2,200자 제한
    if (value.length <= 2200) {
      setCaption(value);
    }
  };

  // 업로드 버튼 클릭 핸들러
  const handleSubmit = async () => {
    if (!selectedImage) {
      alert("이미지를 선택해주세요.");
      return;
    }

    console.group("[CreatePostModal] 게시물 업로드 시작");
    console.log("업로드할 데이터:", {
      image: selectedImage.name,
      imageSize: selectedImage.size,
      caption: caption,
      captionLength: caption.length,
    });

    setIsLoading(true);

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("caption", caption);

      console.log("📝 API 호출: POST /api/posts");

      // API 호출
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
        // Content-Type은 FormData 사용 시 자동 설정됨
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ API 호출 실패:", data);
        throw new Error(
          data.message || "게시물 업로드 중 오류가 발생했습니다.",
        );
      }

      console.log("✅ 게시물 업로드 성공:", data.post?.id);
      console.groupEnd();

      // 모달 닫기
      onOpenChange(false);

      // 페이지 새로고침 (피드 업데이트)
      router.refresh();
    } catch (error) {
      console.error("❌ 게시물 업로드 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "게시물 업로드 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  // 이미지 선택 버튼 클릭 핸들러
  const handleSelectImageClick = () => {
    fileInputRef.current?.click();
  };

  // 캡션 글자 수 포맷팅
  const captionLength = caption.length;
  const maxLength = 2200;
  const captionCountText = `${captionLength.toLocaleString()} / ${maxLength.toLocaleString()}`;

  // 업로드 버튼 비활성화 조건
  const isUploadDisabled = !selectedImage || isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        {/* 헤더 */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#dbdbdb]">
          <DialogTitle className="text-center text-lg font-semibold text-[#262626]">
            새 게시물 만들기
          </DialogTitle>
        </DialogHeader>

        {/* 메인 컨텐츠 */}
        <div className="px-6 py-6 space-y-6">
          {/* 이미지 선택 영역 */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-[#262626]">
              이미지 선택
            </label>

            {!imagePreview ? (
              // 이미지 미선택 상태
              <div
                onClick={handleSelectImageClick}
                className="relative aspect-square w-full border-2 border-dashed border-[#dbdbdb] rounded-lg cursor-pointer hover:border-[#0095f6] transition-colors flex flex-col items-center justify-center bg-[#fafafa]"
              >
                <Upload className="w-12 h-12 text-[#8e8e8e] mb-2" />
                <p className="text-sm font-semibold text-[#262626]">
                  이미지를 선택하세요
                </p>
                <p className="text-xs text-[#8e8e8e] mt-1">
                  JPG, PNG, WebP 형식 지원
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            ) : (
              // 이미지 미리보기
              <div className="relative aspect-square w-full border border-[#dbdbdb] rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={imagePreview}
                  alt="미리보기"
                  fill
                  className="object-contain"
                  sizes="600px"
                />
                {/* 이미지 제거 버튼 */}
                <button
                  onClick={handleImageRemove}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {/* 이미지 다시 선택 버튼 */}
                <button
                  onClick={handleSelectImageClick}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 hover:bg-black/70 text-white text-sm font-semibold rounded-lg transition-colors"
                  disabled={isLoading}
                >
                  이미지 변경
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* 캡션 입력 영역 */}
          <div className="space-y-2">
            <label
              htmlFor="caption"
              className="text-sm font-semibold text-[#262626]"
            >
              캡션
            </label>
            <Textarea
              id="caption"
              value={caption}
              onChange={handleCaptionChange}
              placeholder="캡션을 입력하세요..."
              maxLength={2200}
              rows={6}
              className="resize-none"
              disabled={isLoading}
            />
            {/* 글자 수 표시 */}
            <div className="flex justify-end">
              <span
                className={cn(
                  "text-xs",
                  captionLength > maxLength * 0.9
                    ? "text-[#ed4956]"
                    : "text-[#8e8e8e]",
                )}
              >
                {captionCountText}
              </span>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <DialogFooter className="px-6 pb-6 pt-4 border-t border-[#dbdbdb]">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploadDisabled}
              className={cn(
                "flex-1",
                "bg-[#0095f6] hover:bg-[#0095f6]/90 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isLoading ? "게시 중..." : "게시하기"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
