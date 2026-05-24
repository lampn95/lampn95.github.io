type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
};

export function SectionHeading({ eyebrow, title, description, id }: Props) {
  return (
    <div id={id} className="mb-10 scroll-mt-24">
      {eyebrow && (
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-300/80 font-mono">
          {eyebrow}
        </div>
      )}
      <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-2xl text-white/60 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
