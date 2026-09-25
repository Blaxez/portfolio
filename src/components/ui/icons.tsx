import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "square" as const,
  "aria-hidden": true,
  focusable: false,
};

export const ArrowUpRight = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 11 11 5M6 5h5v5" />
  </svg>
);

export const ArrowDown = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M8 3v10M4 9l4 4 4-4" />
  </svg>
);

export const ArrowUp = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M8 13V3M4 7l4-4 4 4" />
  </svg>
);

export const CopyIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5.5 5.5h7v7h-7z" />
    <path d="M3.5 10.5v-7h7" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
);
