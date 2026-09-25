"use client";
import { useRef, useState } from "react";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import SectionHeading from "./ui/SectionHeading";
import LocalTime from "./ui/LocalTime";
import { SITE } from "@/lib/site";

function EmailBlock() {
  const [copyState, setCopyState] = useState("idle");
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
    <div>
      <p className="label">Write to me</p>
      <a
        href={`mailto:${SITE.email}`}
        className="group mt-5 block w-fit max-w-full serif text-[1.55rem] sm:text-[2.2rem] lg:text-[2.9rem] leading-[1.05] tracking-[-0.02em] text-[var(--fg)] [overflow-wrap:anywhere] transition-colors hover:text-[var(--signal)]"
        data-cursor-label="Write"
      >
        {SITE.email}
      </a>
      <div className="rule mt-4" data-rule aria-hidden="true">
        <span className="rule-fill" />
        <span className="beam-head" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button type="button" onClick={copyEmail} className="label link-u inline-flex min-h-11 items-center gap-2 hover:text-[var(--fg)]" aria-label="Copy email address">
          {copyState === "copied" ? <Check size={12} aria-hidden="true" /> : null}
          <span aria-hidden="true">{copyState === "copied" ? "Copied" : copyState === "failed" ? "Select it instead" : "Copy address"}</span>
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {copyState === "copied" ? "Email address copied" : copyState === "failed" ? "Couldn't copy — select the address instead" : ""}
        </span>
      </div>

      <dl className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8 border-t border-[var(--line)] pt-8">
        <div>
          <dt className="label">Based in</dt>
          <dd className="mt-2 text-[var(--fg)]">{SITE.location}</dd>
        </div>
        <div>
          <dt className="label">Local time</dt>
          <dd className="mt-2 text-[var(--fg)]">
            <LocalTime />
          </dd>
        </div>
        <div>
          <dt className="label">Status</dt>
          <dd className="mt-2 flex items-center gap-2 text-[var(--fg)]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--beam)]" />
            Open to work
          </dd>
        </div>
      </dl>

      <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-2">
        {SITE.socials.map((s) => (
          <li key={s.id}>
            <a href={s.href} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-11 items-center gap-1.5 text-[var(--fg)]">
              <span className="link-u">{s.label}</span>
              <ArrowUpRight size={14} aria-hidden="true" className="text-[var(--muted)] transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
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
    "peer w-full bg-transparent border-b py-4 text-lg md:text-xl text-[var(--fg)] focus:outline-none focus-visible:outline-none transition-colors placeholder-transparent";

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      aria-labelledby="contact-form-title"
      className="relative"
      data-reveal="up"
    >
      <p id="contact-form-title" className="label mb-8">
        Or leave a message
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
            className: `${inputClass} ${invalid ? "border-red-700 dark:border-red-400" : "border-[var(--line-strong)] focus:border-[var(--beam)]"}`,
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
                className="absolute left-0 -top-3 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[var(--muted)] transition-all pointer-events-none peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-3 peer-focus:text-[0.72rem] peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-[var(--signal)]"
              >
                {f.label}
              </label>
              {invalid ? (
                <p id={errorId} className="mt-2 text-sm text-red-700 dark:text-red-400">
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
        <p role="status" aria-live="polite" className={`text-sm ${status.state === "error" ? "text-red-700 dark:text-red-400" : "text-[var(--muted)]"}`}>
          {status.message}
          {status.state === "handoff" || status.state === "error" ? (
            <>
              {" "}
              <a href={`mailto:${SITE.email}`} className="link-u is-static text-[var(--signal)]">
                {SITE.email}
              </a>
            </>
          ) : null}
        </p>
        <button type="submit" className="btn btn-solid flex-shrink-0" disabled={status.state === "sending"} data-magnetic="0.25">
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
              Send message <ArrowUpRight size={16} className="btn-arrow" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative bg-[var(--bg)] section-y">
      <div className="max-w-screen-container layout-padding">
        <SectionHeading
          index="06"
          label="Contact"
          aside="Replies within a couple of days"
          id="contact-title"
          title={
            <>
              Have something in mind? <em>Let&apos;s talk.</em>
            </>
          }
        />
        <div className="mt-16 md:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-10">
          <div className="lg:col-span-7">
            <EmailBlock />
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
