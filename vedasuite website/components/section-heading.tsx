type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-[38rem]";

  return (
    <div className={alignment}>
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h2 className="prose-balance mt-4 font-[var(--font-heading)] text-[1.95rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.35rem]">
        {title}
      </h2>
      <p className="prose-balance mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-[1.05rem]">
        {description}
      </p>
    </div>
  );
}
