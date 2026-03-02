import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const PhilosophySection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section id="philosophy" className="section-padding bg-card">
      <div ref={ref} className="max-w-4xl mx-auto text-center opacity-0 animate-reveal">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
          {t(translations.philosophy.label)}
        </p>
        <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-light leading-snug text-foreground">
          {t(translations.philosophy.title)}
        </h2>
        <p className="mt-8 font-body text-sm md:text-base font-light text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {t(translations.philosophy.desc)}
        </p>
      </div>
    </section>
  );
};

export default PhilosophySection;
