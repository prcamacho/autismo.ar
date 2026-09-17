import { useId } from "react";

export function PuzzleMark({
  className = "",
  decorative = true,
}: {
  className?: string;
  decorative?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
      aria-label={
        decorative
          ? undefined
          : "Pieza de rompecabezas multicolor de autismo.ar"
      }
    >
      <defs>
        <clipPath id={`puzzle-${id}`}>
          <path d="M23 19h19c-2-3-3-5-3-8a11 11 0 0 1 22 0c0 3-1 5-3 8h19a5 5 0 0 1 5 5v19c3-2 5-3 8-3a10 10 0 0 1 0 20c-3 0-5-1-8-3v19a5 5 0 0 1-5 5H58c2 3 3 5 3 8a11 11 0 0 1-22 0c0-3 1-5 3-8H23a5 5 0 0 1-5-5V57c-3 2-5 3-8 3a10 10 0 0 1 0-20c3 0 5 1 8 3V24a5 5 0 0 1 5-5Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#puzzle-${id})`}>
        <path fill="#2565d5" d="M0 0h100v100H0z" />
        <path fill="#70bce8" d="M50 0h50v50H50z" />
        <path fill="#f2b948" d="M0 50h35v50H0z" />
        <path fill="#ee8d79" d="M35 65h22v35H35z" />
        <path fill="#1e4eab" d="M57 50h43v50H57z" />
      </g>
    </svg>
  );
}
