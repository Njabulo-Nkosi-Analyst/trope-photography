export function TropeLogo({ size = "default" }: { size?: "default" | "lg" }) {
  const dot = size === "lg" ? 18 : 14;
  const wordmark = size === "lg" ? "text-2xl" : "text-xl lg:text-2xl";
  return (
    <span className="flex flex-col leading-none">
      <span className={`font-display ${wordmark} tracking-[0.08em] inline-flex items-center`}>
        <span>TR</span>
        <span
          aria-hidden
          className="inline-block rounded-full bg-[var(--trope-red)] mx-[0.08em]"
          style={{ width: dot, height: dot }}
        />
        <span>PE</span>
      </span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-white/60 mt-1">Photography</span>
    </span>
  );
}
