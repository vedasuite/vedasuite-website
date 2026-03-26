type IconProps = {
  className?: string;
};

function SvgWrapper({
  className,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
    >
      {children}
    </svg>
  );
}

export function LogoMark({ className }: IconProps) {
  return (
    <SvgWrapper className={className ?? "h-5 w-5"}>
      <path d="M12 3l7 4v5c0 4.5-2.7 7.9-7 9-4.3-1.1-7-4.5-7-9V7l7-4z" />
      <path d="M8.8 12.2l2.2 2.2 4.6-4.8" />
    </SvgWrapper>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <SvgWrapper className={className}>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </SvgWrapper>
  );
}

export function ScoreIcon({ className }: IconProps) {
  return (
    <SvgWrapper className={className}>
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </SvgWrapper>
  );
}

export function SparkIcon({ className }: IconProps) {
  return (
    <SvgWrapper className={className}>
      <path d="M12 3l1.8 4.8L19 9.6l-4.5 2.1L12 17l-2.5-5.3L5 9.6l5.2-1.8L12 3z" />
    </SvgWrapper>
  );
}

export function ProfileIcon({ className }: IconProps) {
  return (
    <SvgWrapper className={className}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </SvgWrapper>
  );
}

export function WaveIcon({ className }: IconProps) {
  return (
    <SvgWrapper className={className}>
      <path d="M3 12c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2" />
      <path d="M3 17c2.2 0 2.2-2 4.4-2s2.2 2 4.4 2 2.2-2 4.4-2 2.2 2 4.4 2" />
    </SvgWrapper>
  );
}

export function RouteIcon({ className }: IconProps) {
  return (
    <SvgWrapper className={className}>
      <circle cx="6" cy="7" r="2" />
      <circle cx="18" cy="17" r="2" />
      <path d="M8 7h4a3 3 0 0 1 3 3v4" />
      <path d="M15 14l3 3" />
    </SvgWrapper>
  );
}

export function AlertIcon({ className }: IconProps) {
  return (
    <SvgWrapper className={className}>
      <path d="M12 4l8 14H4L12 4z" />
      <path d="M12 10v3.5" />
      <path d="M12 17h.01" />
    </SvgWrapper>
  );
}

export function LoopIcon({ className }: IconProps) {
  return (
    <SvgWrapper className={className}>
      <path d="M4 7h10a4 4 0 1 1 0 8H6" />
      <path d="M7 4L4 7l3 3" />
      <path d="M20 17l-3 3-3-3" />
    </SvgWrapper>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <SvgWrapper className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v5l3 2" />
    </SvgWrapper>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <SvgWrapper className={className}>
      <path d="M12 3l7 4v5c0 4.5-2.7 7.9-7 9-4.3-1.1-7-4.5-7-9V7l7-4z" />
      <path d="M9 12l2 2 4-4" />
    </SvgWrapper>
  );
}
