// 상태(리모컨 스토어)에 기대지 않는 기본 컨트롤. 리모컨과 관리자 웹이 함께 쓴다.
import type { ReactNode } from 'react';

/** 토글: ON = brand, OFF = line-strong, 원형 손잡이 */
export function Toggle({ on, onChange, label, size = 'md', disabled }: { on: boolean; onChange: (v: boolean) => void; label?: string; size?: 'sm' | 'md'; disabled?: boolean }) {
  // 컨트롤 크기는 px 고정 — 텍스트 크기 설정에 따라 손잡이와 트랙 비율이 어긋나지 않게
  const track = size === 'sm' ? 'w-[32px] h-[18px]' : 'w-[36px] h-[20px]';
  const knob = size === 'sm' ? 'w-[14px] h-[14px]' : 'w-[16px] h-[16px]';
  const shift = size === 'sm' ? 'translate-x-[14px]' : 'translate-x-[16px]';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative ${track} shrink-0 rounded-pill transition-colors duration-150 ${on ? 'bg-brand' : 'bg-line-strong'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span className={`absolute top-[2px] left-[2px] ${knob} rounded-pill bg-white transition-transform duration-150 ${on ? shift : ''}`} />
      <span className="sr-only">{on ? 'ON' : 'OFF'}</span>
    </button>
  );
}

/**
 * 버튼 (토큰 문서 §5).
 * primary = brand, secondary = surface-raised + line-strong, outline = 투명 + line-control, danger = danger.
 * 높이: sm 30px(보조) · md 34px(카드 버튼) · lg 44px(퀵 제어)
 */
export function Button({ variant = 'primary', size = 'md', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger'; size?: 'sm' | 'md' | 'lg' }) {
  const styles = {
    primary: 'bg-brand text-text-on-brand hover:bg-brand-hover disabled:bg-surface-sunken disabled:text-text-tertiary disabled:border disabled:border-line',
    secondary: 'bg-surface-raised border border-line-strong text-text hover:bg-surface-sunken disabled:text-text-tertiary',
    outline: 'bg-transparent border border-line-control text-text hover:bg-surface-raised disabled:text-text-tertiary',
    danger: 'bg-danger text-white hover:brightness-110 disabled:opacity-50',
  }[variant];
  const dim = size === 'lg' ? 'h-11 px-5' : size === 'sm' ? 'h-[30px] px-3' : 'h-[34px] px-4';
  return <button type="button" className={`${dim} rounded-control text-body font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed ${styles} ${className}`} {...props} />;
}

/** 위젯 조작·닫기 같은 아이콘 버튼: text-tertiary 아이콘, hover 시 surface-raised */
export function IconButton({ label, className = '', active, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`w-7 h-7 shrink-0 rounded-control flex items-center justify-center transition-colors ${active ? 'bg-brand-tint text-link' : 'text-text-tertiary hover:text-text hover:bg-text/10'} ${className}`}
      {...props}
    />
  );
}

/** 2~3개 중 하나 고르기 (설정의 테마·글자 크기). 사각 세그먼트: surface-raised 바탕, 선택 칸 brand */
export function Segmented<T extends string | number>({ value, options, onChange, className = '' }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={`flex h-[30px] p-0.5 gap-0.5 rounded-control bg-surface-raised border border-line-strong ${className}`}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-[4px] text-caption whitespace-nowrap transition-colors ${value === o.value ? 'bg-brand text-text-on-brand font-semibold' : 'text-text-secondary hover:text-text'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** 숫자 배지: danger 바탕, 10px 700, 최소 16px */
export function Badge({ count, className = '' }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={`inline-block min-w-4 h-4 px-1 rounded-pill bg-danger text-white text-badge leading-4 text-center tabular-nums ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** 입력칸·선택칸 공통 모양: surface-raised + 1px line-strong, 포커스 시 live 테두리 */
export const fieldClass =
  'h-[30px] px-2.5 rounded-control bg-surface-raised border border-line-strong text-body text-text placeholder:text-text-tertiary outline-none focus:border-live disabled:opacity-50';
