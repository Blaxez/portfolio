"use client";
import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";

/** The time in Mumbai, whatever the visitor's timezone. */
export default function LocalTime({ className = "", withLabel = true }) {
  const [time, setTime] = useState(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: SITE.timeZone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={`tabular ${className}`}>
      {withLabel ? <span className="sr-only">Local time in {SITE.location}: </span> : null}
      <span className="inline-block min-w-[8ch]">{time ?? "--:-- --"}</span> {SITE.timeZoneLabel}
    </span>
  );
}
