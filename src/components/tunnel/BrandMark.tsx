/**
 * The product mark: three streamlines parting around a body, on safety yellow —
 * a wind-tunnel smoke photograph reduced to a glyph.
 */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="hsl(var(--safety))" />
      <g fill="none" stroke="hsl(var(--ink))" strokeWidth="2" strokeLinecap="round">
        <path d="M4 9.5 C10 9.5 12 6.5 16 6.5 C20 6.5 22 9.5 28 9.5" />
        <path d="M4 22.5 C10 22.5 12 25.5 16 25.5 C20 25.5 22 22.5 28 22.5" />
        <path d="M4 16 H9.5" />
        <path d="M22.5 16 C24.5 14.6 26 17.4 28 16" />
      </g>
      <ellipse cx="16" cy="16" rx="5.5" ry="3.6" fill="hsl(var(--ink))" />
    </svg>
  );
}
