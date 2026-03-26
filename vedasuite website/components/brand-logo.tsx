import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  mode?: "full" | "mark";
  theme?: "light" | "dark";
};

export function BrandLogo({
  className,
  mode = "full",
  theme = "light",
}: BrandLogoProps) {
  const isDark = theme === "dark";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "rgba(226,232,240,0.72)" : "rgba(51,65,85,0.7)";

  return (
    <div className={cn("inline-flex items-center", className)}>
      <svg
        viewBox={mode === "full" ? "0 0 560 180" : "0 0 160 160"}
        aria-label="VedaSuite AI logo"
        role="img"
        className="h-full w-auto"
      >
        <defs>
          <linearGradient id="petal-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F8D77A" />
            <stop offset="100%" stopColor="#B8862E" />
          </linearGradient>
          <linearGradient id="petal-purple" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D89CF6" />
            <stop offset="100%" stopColor="#6E2B8B" />
          </linearGradient>
          <linearGradient id="petal-green" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D8F47E" />
            <stop offset="100%" stopColor="#5B8F1D" />
          </linearGradient>
          <linearGradient id="core-circuit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C8A8FF" />
            <stop offset="50%" stopColor="#8A68FF" />
            <stop offset="100%" stopColor="#3BA8F5" />
          </linearGradient>
          <radialGradient id="lotus-glow" cx="50%" cy="42%" r="68%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="rgba(15,23,42,0.18)" />
          </filter>
        </defs>

        <g transform={mode === "full" ? "translate(20 12)" : "translate(6 6)"} filter="url(#soft-shadow)">
          <ellipse cx="70" cy="108" rx="50" ry="7" fill="rgba(148,163,184,0.22)" />
          <path d="M74 94c-22-1-41-9-54-26 18-3 31 2 46 11 4 2 8 5 12 8-1 2-2 5-4 7z" fill="url(#petal-gold)" />
          <path d="M69 88c-17-8-29-22-31-52 20 2 40 10 54 30-8 5-15 13-23 22z" fill="url(#petal-gold)" />
          <path d="M72 86c2-26 13-46 38-65 18 11 27 27 32 46-10 4-19 10-27 19H72z" fill="url(#petal-purple)" />
          <path d="M69 88c17-8 29-22 31-52-20 2-40 10-54 30 8 5 15 13 23 22z" transform="matrix(-1 0 0 1 220 0)" fill="url(#petal-green)" />
          <path d="M86 28c-16 12-25 33-25 55 0 30 20 51 49 62 29-11 49-32 49-62 0-22-9-43-25-55-7 8-16 14-24 21-8-7-17-13-24-21z" fill="#120C2C" />
          <ellipse cx="110" cy="74" rx="38" ry="44" fill="url(#lotus-glow)" opacity="0.12" />
          <g stroke="url(#core-circuit)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M110 44v54" />
            <path d="M110 58l-16 10v12" />
            <path d="M110 72l-24 14" />
            <path d="M110 58l16 10v12" />
            <path d="M110 72l24 14" />
            <path d="M101 45c-8 0-12 5-12 12v11" />
            <path d="M119 45c8 0 12 5 12 12v11" />
            <path d="M92 80l-14-8" />
            <path d="M128 80l14-8" />
          </g>
          <g fill="url(#core-circuit)">
            <circle cx="110" cy="42" r="4" />
            <circle cx="94" cy="81" r="4" />
            <circle cx="126" cy="81" r="4" />
            <circle cx="86" cy="87" r="4" />
            <circle cx="134" cy="87" r="4" />
            <circle cx="94" cy="66" r="4" />
            <circle cx="126" cy="66" r="4" />
          </g>
        </g>

        {mode === "full" ? (
          <g transform="translate(185 60)">
            <text
              x="0"
              y="52"
              fill={textPrimary}
              fontSize="60"
              fontFamily="Georgia, Times New Roman, serif"
              letterSpacing="-1.5"
            >
              VedaSuite
            </text>
            <text
              x="310"
              y="52"
              fill="url(#petal-green)"
              fontSize="60"
              fontFamily="Georgia, Times New Roman, serif"
              letterSpacing="-1.5"
            >
              AI
            </text>
            <line x1="0" x2="365" y1="74" y2="74" stroke={textSecondary} strokeOpacity="0.28" />
            <text
              x="20"
              y="102"
              fill={textSecondary}
              fontSize="18"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              letterSpacing="6"
            >
              AI COMMERCE SOLUTIONS FOR SHOPIFY
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
