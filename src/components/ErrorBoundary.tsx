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
        <p className="text-body font-semibold text-text">위젯을 표시하지 못했습니다.</p>
        <p className="text-micro text-text-tertiary break-all">{this.state.error.message}</p>
        <button className="h-[30px] px-3 rounded-control bg-surface-raised border border-line-strong text-body font-semibold text-text hover:bg-surface-sunken" onClick={() => this.setState({ error: null })}>
          다시 시도
        </button>
      </div>
    );
  }
}
