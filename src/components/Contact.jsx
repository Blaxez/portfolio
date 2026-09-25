"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, ArrowUpRight, Github, Linkedin, MessageCircle, Check, Copy, ArrowUp, Loader2 } from "lucide-react";
import SectionHeading from "./ui/SectionHeading";
import { SITE } from "@/lib/site";
import { scrollToTarget } from "@/lib/scroll";

const SOCIAL_ICONS = { github: Github, linkedin: Linkedin, whatsapp: MessageCircle };

/* ── Particle-wave backdrop (three.js, loaded when the section approaches) ── */
function WaveBackdrop() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    let wave;
    let cancelled = false;
    const colors = () => {
      const css = getComputedStyle(document.documentElement);
      return [css.getPropertyValue("--acc").trim(), css.getPropertyValue("--acc-2").trim(), !document.documentElement.classList.contains("dark")];
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        import("@/lib/three/ParticleWave").then(({ mountParticleWave }) => {
          if (cancelled) return;
          const [a, b, light] = colors();
          wave = mountParticleWave(el, { colorA: a, colorB: b, light });
        });
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    const onTheme = () => wave?.setColors(...colors());
    window.addEventListener("themechange", onTheme);
    return () => {
      cancelled = true;
      io.disconnect();
      window.removeEventListener("themechange", onTheme);
      wave?.destroy();
    };
  }, []);
  return <div ref={ref} aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[75%] md:h-full pointer-events-none" />;
}

/* ── Clock in Mumbai time, whatever the visitor's timezone ── */
function MumbaiTime() {
  const [time, setTime] = useState(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: SITE.timeZone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="inline-block min-w-[9ch] text-right tabular-nums">
      {time ?? "--:-- --"} {SITE.timeZoneLabel}
    </span>
  );
}

function HolographicCard() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [copyState, setCopyState] = useState("idle");

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouse({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    setTimeout(() => setCopyState("idle"), 2200);
  };

  return (
    <div className="relative w-full max-w-md" style={{ perspective: 1000 }} data-reveal="up">
      <motion.div
        className="relative w-full rounded-2xl overflow-hidden bg-[var(--surface)]/95 border border-[var(--border)] shadow-2xl"
        onPointerMove={onMove}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => {
          setHovered(false);
          setMouse({ x: 0, y: 0 });
        }}
        animate={{ rotateY: hovered ? mouse.x * 16 : 0, rotateX: hovered ? -mouse.y * 16 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: hovered ? 1 : 0.5,
            background: `radial-gradient(circle at ${50 + mouse.x * 100}% ${50 + mouse.y * 100}%, rgba(var(--acc-rgb), 0.22), transparent 60%), linear-gradient(115deg, transparent 30%, rgba(var(--acc-rgb), 0.08) 45%, rgba(129, 140, 248, 0.1) 55%, transparent 70%)`,
          }}
        />
        <div className="relative z-10 p-6 md:p-8 flex flex-col gap-6" style={{ transform: "translateZ(24px)" }}>
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-2xl font-black text-[var(--fg)] tracking-tight uppercase">{SITE.name}</p>
              <p className="text-sm font-mono text-[var(--acc)] mt-1">Full-Stack Developer</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--acc)]/10 border border-[var(--acc)]/25">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-mono text-[var(--fg)] uppercase tracking-wider">Available</span>
              </span>
              <span className="text-[11px] font-mono text-[var(--muted)]">
                <span className="sr-only">Local time in Mumbai: </span>
                <MumbaiTime />
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg)]/60 border border-[var(--border)]">
              <span className="p-2 rounded-lg bg-[var(--acc)]/10 text-[var(--acc)]" aria-hidden="true">
                <Mail size={16} />
              </span>
              <a href={`mailto:${SITE.email}`} className="min-w-0 flex-1 group">
                <span className="block text-[10px] text-[var(--muted)] uppercase tracking-widest">Email</span>
                <span className="block text-xs font-mono text-[var(--fg)] truncate group-hover:text-[var(--acc)] transition-colors">{SITE.email}</span>
              </a>
              <button
                type="button"
                onClick={copyEmail}
                className="flex-shrink-0 inline-flex items-center gap-1.5 min-h-9 px-3 rounded-full border border-[var(--border)] font-mono text-[10px] uppercase tracking-widest text-[var(--fg)] hover:border-[var(--acc)] hover:text-[var(--acc)] transition-colors"
                aria-label="Copy email address"
              >
                {copyState === "copied" ? <Check size={12} /> : <Copy size={12} />}
                {copyState === "copied" ? "Copied" : copyState === "failed" ? "Select" : "Copy"}
              </button>
              <span className="sr-only" role="status" aria-live="polite">
                {copyState === "copied" ? "Email address copied" : copyState === "failed" ? "Couldn't copy — select the address instead" : ""}
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg)]/60 border border-[var(--border)]">
              <span className="p-2 rounded-lg bg-[var(--acc)]/10 text-[var(--acc)]" aria-hidden="true">
                <MapPin size={16} />
              </span>
              <span>
                <span className="block text-[10px] text-[var(--muted)] uppercase tracking-widest">Base</span>
                <span className="block text-xs font-mono text-[var(--fg)]">{SITE.location}</span>
              </span>
            </div>
          </div>

          <ul className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
            {SITE.socials.map((s) => {
              const Icon = SOCIAL_ICONS[s.id];
              return (
                <li key={s.id}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.label} (opens in a new tab)`}
                    title={s.label}
                    className="w-11 h-11 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--fg)] hover:bg-[var(--acc)] hover:border-[var(--acc)] hover:text-white transition-all hover:-translate-y-0.5"
                    data-magnetic="0.25"
                  >
                    <Icon size={18} aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Form: posts to SITE.formEndpoint when configured, else opens a pre-filled email ── */
const FIELDS = [
  { name: "name", label: "Your name", type: "text", autoComplete: "name", required: true },
  { name: "email", label: "Email address", type: "email", autoComplete: "email", required: true },
  { name: "phone", label: "Phone (optional)", type: "tel", autoComplete: "tel", required: false },
  { name: "message", label: "Your message", type: "textarea", required: true },
];

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Please tell me your name.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Please enter a valid email address.";
  if (values.message.trim().length < 10) errors.message = "A little more detail, please (10+ characters).";
  return errors;
}

function ContactForm() {
  const formRef = useRef(null);
  const [values, setValues] = useState({ name: "", email: "", phone: "", message: "", company: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const update = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (values.company) return; // honeypot: bots fill hidden fields
    const found = validate(values);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      formRef.current?.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    if (!SITE.formEndpoint) {
      const subject = encodeURIComponent(`Portfolio enquiry from ${values.name.trim()}`);
      const body = encodeURIComponent(
        `${values.message.trim()}\n\n— ${values.name.trim()}\n${values.email.trim()}${values.phone ? `\n${values.phone.trim()}` : ""}`,
      );
      window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
      setStatus({ state: "handoff", message: "Your email app should open with the message ready to send." });
      return;
    }

    setStatus({ state: "sending", message: "" });
    try {
      const res = await fetch(SITE.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: values.name, email: values.email, phone: values.phone, message: values.message }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus({ state: "sent", message: "Thanks — your message is on its way. I'll reply within a couple of days." });
      setValues({ name: "", email: "", phone: "", message: "", company: "" });
    } catch {
      setStatus({ state: "error", message: "That didn't go through. Please try again or email me directly." });
    }
  };

  const inputClass =
    "peer w-full bg-transparent border-b py-4 text-lg md:text-xl text-[var(--fg)] focus:outline-none transition-colors placeholder-transparent";

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      aria-labelledby="contact-form-title"
      className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/95 p-6 md:p-10 shadow-2xl"
      data-reveal="up"
    >
      <p id="contact-form-title" className="eyebrow mb-6">
        Send a message
      </p>
      <div className="space-y-7">
        {FIELDS.map((f) => {
          const id = `contact-${f.name}`;
          const errorId = `${id}-error`;
          const invalid = Boolean(errors[f.name]);
          const shared = {
            id,
            name: f.name,
            value: values[f.name],
            onChange: update,
            placeholder: f.label,
            required: f.required,
            "aria-invalid": invalid || undefined,
            "aria-describedby": invalid ? errorId : undefined,
            className: `${inputClass} ${invalid ? "border-red-600 dark:border-red-400" : "border-[var(--border)] focus:border-[var(--acc)]"}`,
          };
          return (
            <div key={f.name} className="relative">
              {f.type === "textarea" ? (
                <textarea {...shared} rows={4} className={`${shared.className} resize-none`} />
              ) : (
                <input {...shared} type={f.type} autoComplete={f.autoComplete} />
              )}
              <label
                htmlFor={id}
                className="absolute left-0 -top-3 font-mono text-[11px] uppercase tracking-widest text-[var(--muted)] transition-all pointer-events-none peer-placeholder-shown:top-5 peer-placeholder-shown:text-xs peer-focus:-top-3 peer-focus:text-[11px] peer-focus:text-[var(--acc)]"
              >
                {f.label}
              </label>
              {invalid ? (
                <p id={errorId} className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors[f.name]}
                </p>
              ) : null}
            </div>
          );
        })}
        <div className="absolute w-px h-px overflow-hidden -left-[9999px]" aria-hidden="true">
          <label htmlFor="contact-company">Company</label>
          <input id="contact-company" name="company" tabIndex={-1} autoComplete="off" value={values.company} onChange={update} />
        </div>
      </div>

      <div className="mt-10 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-5">
        <p role="status" aria-live="polite" className={`text-sm ${status.state === "error" ? "text-red-600 dark:text-red-400" : "text-[var(--muted)]"}`}>
          {status.message}
          {status.state === "handoff" || status.state === "error" ? (
            <>
              {" "}
              <a href={`mailto:${SITE.email}`} className="underline underline-offset-4 text-[var(--acc)]">
                {SITE.email}
              </a>
            </>
          ) : null}
        </p>
        <button type="submit" className="btn btn-primary flex-shrink-0" disabled={status.state === "sending"} data-magnetic="0.3">
          {status.state === "sending" ? (
            <>
              Sending <Loader2 size={16} className="animate-spin" />
            </>
          ) : status.state === "sent" ? (
            <>
              Sent <Check size={16} />
            </>
          ) : (
            <>
              Send message <ArrowUpRight size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function Contact() {
  const year = new Date().getFullYear();
  return (
    <>
      <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden bg-[var(--bg)] border-t border-[var(--border)]">
        <WaveBackdrop />
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[var(--bg)] via-[var(--bg)]/25 to-transparent" />
        <div className="relative z-10 max-w-screen-container layout-padding section-y">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-start">
            <div className="lg:col-span-6 flex flex-col gap-10">
              <SectionHeading index="06" eyebrow="Get in touch" title={["Let's build", "the future."]} id="contact-title">
                From concept to code, I engineer digital experiences that matter. Have a project in mind? Drop me a line.
              </SectionHeading>
              <HolographicCard />
            </div>
            <div className="lg:col-span-6">
              <ContactForm />
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="relative z-10 overflow-hidden border-t border-[var(--border)] py-6 md:py-10">
          <div className="marquee-track" style={{ "--marquee-duration": "40s" }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <span
                key={i}
                className="whitespace-nowrap pr-12 text-[18vw] md:text-[11vw] font-black uppercase leading-none tracking-tighter text-transparent [-webkit-text-stroke:1px_var(--faint)]"
              >
                Let&apos;s work together ✦ Let&apos;s work together ✦&nbsp;
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative bg-[var(--bg)] border-t border-[var(--border)]">
        <div className="max-w-screen-container layout-padding py-10 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>
          <ul className="flex items-center gap-6">
            {SITE.socials.map((s) => (
              <li key={s.id}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--acc)] transition-colors">
                  {s.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#hero");
            }}
            className="group inline-flex items-center gap-2 text-[var(--fg)] hover:text-[var(--acc)] transition-colors"
            data-magnetic="0.3"
          >
            Back to top <ArrowUp size={14} className="transition-transform group-hover:-translate-y-1" />
          </a>
        </div>
      </footer>
    </>
  );
}
