"use client";

/**
 * @file components/ErrorBoundary.tsx
 * @description React Error Boundary 컴포넌트
 *
 * 이 컴포넌트는 React 애플리케이션의 에러를 포착하고 사용자 친화적인 에러 메시지를 표시합니다.
 *
 * 주요 기능:
 * 1. React 컴포넌트 트리의 에러 포착
 * 2. 사용자 친화적 에러 메시지 표시
 * 3. 에러 재시도 기능
 *
 * @dependencies
 * - React: Error Boundary는 클래스 컴포넌트로만 구현 가능
 */

import React, { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 에러 상태 업데이트
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === "development") {
      console.error("❌ [ErrorBoundary] 에러 발생:", error);
      console.error("❌ [ErrorBoundary] 에러 정보:", errorInfo);
    }
  }

  handleReset = () => {
    // 에러 상태 초기화
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
          <div className="max-w-md w-full bg-white border border-[#dbdbdb] rounded-lg p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#262626] mb-2">
                오류가 발생했습니다
              </h2>
              <p className="text-sm text-[#8e8e8e] mb-4">
                예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 다시
                시도해주세요.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-[#8e8e8e] cursor-pointer hover:text-[#262626] mb-2">
                    에러 상세 정보 (개발 모드)
                  </summary>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-48">
                    {this.state.error.toString()}
                    {this.state.error.stack && `\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#0095f6] text-white rounded-md text-sm font-semibold hover:bg-[#1877f2] transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#efefef] text-[#262626] rounded-md text-sm font-semibold hover:bg-[#dbdbdb] transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
