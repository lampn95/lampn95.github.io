"use client";

import { useLang, useT } from "@/lib/i18n";

type Props = {
  size?: "sm" | "md";
  className?: string;
};

export function LanguageToggle({ size = "md", className = "" }: Props) {
  const { lang, setLang } = useLang();
  const t = useT();

  const isSm = size === "sm";
  const wrapH = isSm ? "h-7" : "h-8";
  const btnH = isSm ? "h-6" : "h-7";
  const btnPad = isSm ? "px-2" : "px-2.5";
  const textCls = isSm ? "text-[10px]" : "text-xs";

  return (
    <div
      role="group"
      aria-label={t("langToggle.aria")}
      className={`inline-flex ${wrapH} items-center gap-0.5 rounded-full border border-white/15 bg-white/[0.03] p-0.5 ${className}`}
    >
      <LangButton
        active={lang === "en"}
        onClick={() => setLang("en")}
        label="EN"
        height={btnH}
        pad={btnPad}
        textCls={textCls}
      />
      <LangButton
        active={lang === "vi"}
        onClick={() => setLang("vi")}
        label="VI"
        height={btnH}
        pad={btnPad}
        textCls={textCls}
      />
    </div>
  );
}

function LangButton({
  active,
  onClick,
  label,
  height,
  pad,
  textCls,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  height: string;
  pad: string;
  textCls: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex ${height} ${pad} ${textCls} items-center justify-center rounded-full font-mono font-semibold transition-colors ${
        active
          ? "bg-white text-black"
          : "text-white/55 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
