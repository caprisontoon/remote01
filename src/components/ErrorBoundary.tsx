import { Component, type ErrorInfo, type ReactNode } from 'react';

/** 위젯 하나가 오류를 내도 리모컨 전체가 멈추지 않도록 위젯 단위로 감싼다. */
export class WidgetErrorBoundary extends Component<{ name: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[widget:${this.props.name}]`, error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-[13px] font-semibold">위젯을 표시하지 못했습니다.</p>
        <p className="text-[11px] text-black/50 dark:text-white/50 break-all">{this.state.error.message}</p>
        <button className="h-8 px-4 rounded-full bg-[rgba(120,120,128,0.16)] text-[13px] font-medium" onClick={() => this.setState({ error: null })}>
          다시 시도
        </button>
      </div>
    );
  }
}
