import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
  promo?: ReactNode;
  contentWidth?: "narrow" | "wide";
};

const widthMap: Record<NonNullable<AuthLayoutProps["contentWidth"]>, string> = {
  narrow: "max-w-xl",
  wide: "max-w-5xl"
};

export function AuthLayout({ children, promo, contentWidth = "narrow" }: AuthLayoutProps) {
  const containerClass = promo
    ? "max-w-6xl w-full grid gap-10 lg:grid-cols-[1.1fr_minmax(0,1fr)] items-start"
    : `${widthMap[contentWidth]} w-full`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(251,191,36,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute -top-56 -left-32 h-[32rem] w-[32rem] rounded-full bg-orange-500/25 blur-[180px]" />
      <div className="pointer-events-none absolute -bottom-72 -right-24 h-[32rem] w-[32rem] rounded-full bg-amber-400/20 blur-[180px]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className={containerClass}>
          {promo && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-8 shadow-[0_50px_120px_rgba(2,6,23,0.9)] backdrop-blur-xl space-y-6">
              {promo}
            </div>
          )}
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-[0_45px_90px_rgba(2,6,23,0.75)] backdrop-blur-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
