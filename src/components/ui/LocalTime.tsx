"use client";

import { useEffect, useState } from "react";

export default function LocalTime({ timeZone, label }: { timeZone: string; label: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone });
    const tick = () => setTime(format.format(new Date()));
    tick();
    // Align to the minute boundary, then tick once a minute.
    let interval = 0;
    const align = window.setTimeout(() => {
      tick();
      interval = window.setInterval(tick, 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      window.clearTimeout(align);
      window.clearInterval(interval);
    };
  }, [timeZone]);

  return (
    <span className="inline-block min-w-[9ch] tabular-nums">
      {time ?? "--:--"} {label}
    </span>
  );
}
