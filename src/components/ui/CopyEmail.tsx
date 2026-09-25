"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";

export default function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <a href={`mailto:${email}`} className="text-link text-[clamp(1rem,4.2vw,2.25rem)] leading-tight font-medium tracking-[-0.02em] whitespace-nowrap text-ink">
        {email}
      </a>
      <button type="button" onClick={copy} className="btn self-start sm:self-auto" aria-describedby="copy-status">
        {copied ? <CheckIcon /> : <CopyIcon />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
      <span id="copy-status" className="sr-only" role="status" aria-live="polite">
        {copied ? "Email address copied to clipboard" : ""}
      </span>
    </div>
  );
}
