"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, GitBranch, Layers3, ScanSearch } from "lucide-react";
import { CodeMap } from "@/components/graph/code-map";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { ComplexityPreview } from "./complexity-preview";
import { HistoryPreview } from "./history-preview";
import { ImpactPreview } from "./impact-preview";
import { ImportPath } from "./import-path";
import { useLocale } from "@/providers/locale-provider";

const features = [
  {
    number: "01",
    label: "Dependencies",
    title: "See how every piece connects.",
    text: "Follow real import paths from entry point to leaf module. Select any file to inspect its direct dependencies and callers.",
    icon: GitBranch,
  },
  {
    number: "02",
    label: "Change impact",
    title: "Know what a change can reach.",
    text: "Trace reverse dependencies from a changed file, layer by layer, and separate affected paths from unrelated code.",
    icon: ScanSearch,
  },
  {
    number: "03",
    label: "Complexity",
    title: "Find the modules carrying the load.",
    text: "Compare fan-in and fan-out across the project to spot shared modules and tightly coupled areas.",
    icon: Layers3,
  },
];

export function HomeView() {
  const { t } = useLocale();
  return (
    <div>
      <section id="product" className="scroll-mt-16 overflow-hidden border-b border-border">
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-12 md:px-8 md:pt-20 md:pb-16">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] text-foreground-secondary">
                <span className="size-1.5 rounded-full bg-success" />
                {t("CODEBASE INTELLIGENCE, IN CONTEXT", "KOD TABANI ZEKÂSI, BAĞLAMINDA")}
              </div>
              <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.08] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl md:text-6xl">
                {t("Understand the architecture behind your code.", "Kodunuzun arkasındaki mimariyi anlayın.")}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-foreground-secondary md:text-lg md:leading-8">
                {t("Explore dependencies, trace change impact, and understand how your codebase evolves — all in one interactive workspace.", "Bağımlılıkları keşfedin, değişikliklerin etkisini izleyin ve kod tabanınızın nasıl evrildiğini tek bir etkileşimli çalışma alanında anlayın.")}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/repositories#public-repository"
                  className={cn(buttonVariants({ size: "lg" }), "group gap-2 px-5 shadow-sm")}
                >
                  {t("Analyze your repository", "Deponuzu analiz edin")}{" "}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#features"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  {t("View how it works", "Nasıl çalıştığını görün")}
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="relative mx-auto mt-12 max-w-6xl md:mt-16">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-12 -top-8 -z-10 h-52 bg-[radial-gradient(ellipse_at_center,var(--primary-subtle),transparent_68%)] opacity-70"
              />
              <div className="overflow-hidden rounded-lg border border-border-strong bg-background shadow-[0_24px_80px_-44px_var(--foreground)]">
                <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3">
                  <span className="flex gap-1.5" aria-hidden="true">
                    <i className="size-2 rounded-full bg-danger/70" />
                    <i className="size-2 rounded-full bg-warning/80" />
                    <i className="size-2 rounded-full bg-success/70" />
                  </span>
                  <span className="font-mono text-xs text-foreground-secondary">
                    CodeDNA / repository preview
                  </span>
                  <span className="ml-auto rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] text-foreground-tertiary">
                    INTERACTIVE PREVIEW
                  </span>
                </div>
                <CodeMap />
              </div>
              <p className="mt-3 text-center text-xs text-foreground-tertiary">
                {t("Illustrative architecture view. Analyze your own public GitHub repository to see its files and imports here.", "Örnek mimari görünümü. Kendi herkese açık GitHub deponuzu analiz ederek dosyalarını ve import ilişkilerini burada görüntüleyin.")}
              </p>
            </div>
          </Reveal>
          <a
            href="#features"
            className="mx-auto mt-8 hidden w-fit items-center gap-2 text-xs text-foreground-tertiary transition-colors hover:text-foreground md:flex"
          >
            {t("Explore the workspace", "Çalışma alanını keşfedin")} <ArrowDown className="size-3.5" />
          </a>
        </div>
      </section>

      <section id="features" className="scroll-mt-16">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 md:px-8 md:pt-24">
          <div className="grid gap-6 md:grid-cols-[1fr_18rem] md:items-end">
            <div>
              <p className="font-mono text-xs tracking-wider text-accent uppercase">
                {t("A clearer view of your code", "Kodunuza daha net bir bakış")}
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {t("From files to a working mental model.", "Dosyalardan işleyen bir zihinsel modele.")}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-foreground-secondary md:justify-self-end">
              {t("Move from structure to risk to change history, with the relationships between them kept in view.", "Yapıdan riske ve değişiklik geçmişine ilerlerken aralarındaki ilişkileri görünür tutun.")}
            </p>
          </div>
        </div>
        <Reveal>
          <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <FeatureCopy feature={{ ...features[0], label: t("Dependencies", "Bağımlılıklar"), title: t("See how every piece connects.", "Her parçanın nasıl bağlandığını görün."), text: t("Follow real import paths from entry point to leaf module. Select any file to inspect its direct dependencies and callers.", "Giriş noktasından alt modüllere gerçek import yollarını izleyin. Doğrudan bağımlılıkları ve kullananları görmek için bir dosya seçin.") }} />
            <div className="rounded-lg border border-border bg-surface p-3 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="font-mono text-xs text-foreground-secondary">
                  IMPORT RELATIONSHIPS
                </span>
                <span className="font-mono text-[11px] text-foreground-tertiary">
                  File and import relationships
                </span>
              </div>
              <ImportPath />
            </div>
          </section>
        </Reveal>
        <Reveal>
          <section className="border-y border-border bg-background-subtle">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <FeatureCopy feature={{ ...features[1], label: t("Change impact", "Değişiklik etkisi"), title: t("Know what a change can reach.", "Bir değişikliğin neleri etkileyebileceğini görün."), text: t("Trace reverse dependencies from a changed file, layer by layer, and separate affected paths from unrelated code.", "Değişen bir dosyanın ters bağımlılıklarını katman katman izleyin ve etkilenen yolları ilgisiz koddan ayırın.") }} />
              <div>
                <div className="mb-3 flex items-center gap-2 font-mono text-xs text-foreground-secondary">
                  <span className="size-1.5 rounded-full bg-warning" /> CHANGE SET · src/context.ts
                </div>
                <ImpactPreview />
              </div>
            </div>
          </section>
        </Reveal>
        <Reveal>
          <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <FeatureCopy feature={{ ...features[2], label: t("Complexity", "Karmaşıklık"), title: t("Find the modules carrying the load.", "Yükü taşıyan modülleri bulun."), text: t("Compare fan-in and fan-out across the project to spot shared modules and tightly coupled areas.", "Paylaşılan modülleri ve sıkı bağlı alanları görmek için proje genelindeki gelen ve giden bağımlılıkları karşılaştırın.") }} />
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="font-mono text-xs text-foreground-secondary">MODULE COUPLING</span>
                <span className="font-mono text-[10px] text-foreground-tertiary">
                  FIXTURE METRICS
                </span>
              </div>
              <ComplexityPreview />
            </div>
          </section>
        </Reveal>
        <Reveal>
          <section className="border-y border-border bg-background-subtle">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
              <div className="mb-7 grid gap-4 md:grid-cols-[1fr_22rem] md:items-end">
                <FeatureCopy
                  feature={{
                    number: "04",
                    label: t("History", "Geçmiş"),
                    title: t("Put code changes back in context.", "Kod değişikliklerini bağlamına oturtun."),
                    text: t("Explore sample commits alongside the files they touch, then jump into those modules in the demo workspace.", "Örnek commit'leri değiştirdikleri dosyalarla birlikte inceleyin ve demo çalışma alanında ilgili modüllere geçin."),
                    icon: GitBranch,
                  }}
                />
                <p className="max-w-sm text-xs leading-5 text-foreground-tertiary md:justify-self-end">
                  {t("Commit history is illustrative fixture data and is not read from a live Git repository.", "Commit geçmişi açıklama amaçlı örnek veridir; canlı bir Git deposundan alınmamıştır.")}
                </p>
              </div>
              <HistoryPreview />
            </div>
          </section>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6 md:flex-row md:items-center md:justify-between md:p-9">
          <div>
            <p className="font-mono text-xs tracking-wider text-accent uppercase">
              {t("Try the workspace", "Çalışma alanını deneyin")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {t("Start with your repository.", "Kendi deponuzla başlayın.")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-secondary">
              {t("Paste a public GitHub repository link to explore its architecture and dependencies.", "Mimarisini ve bağımlılıklarını keşfetmek için herkese açık bir GitHub depo bağlantısı girin.")}
            </p>
          </div>
          <Link href="/repositories#public-repository" className={cn(buttonVariants({ size: "lg" }), "group shrink-0 gap-2")}>
            {t("Enter repository link", "Depo bağlantısını girin")}{" "}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCopy({ feature }: { feature: (typeof features)[number] }) {
  const Icon = feature.icon;
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-foreground-tertiary">{feature.number}</span>
        <span className="h-px w-8 bg-border-strong" />
        <Icon className="size-4 text-accent" aria-hidden="true" />
        <span className="font-mono text-[11px] tracking-wider text-foreground-tertiary uppercase">
          {feature.label}
        </span>
      </div>
      <h3 className="mt-4 max-w-lg text-2xl leading-tight font-semibold tracking-tight text-foreground md:text-3xl">
        {feature.title}
      </h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-foreground-secondary">{feature.text}</p>
    </div>
  );
}
