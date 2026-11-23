import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export function PublicShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-medium tracking-[0.16em] text-primary uppercase">{eyebrow}</p>
        <h1 className="mt-3 font-heading text-4xl tracking-tight text-balance sm:text-5xl">{title}</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}