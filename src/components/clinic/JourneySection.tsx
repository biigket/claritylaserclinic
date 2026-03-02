import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const JourneySection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section className="section-padding bg-card">
      <div ref={ref} className="max-w-4xl mx-auto opacity-0 animate-reveal">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-16 text-center">
          {t(translations.journey.label)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {translations.journey.steps.map((step, i) => (
            <div key={i} className="text-center">
              <span className="font-display text-3xl font-light text-primary/50">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-xl font-light text-foreground mt-4 mb-3">
                {t(step.title)}
              </h3>
              <p className="font-body text-sm font-light text-muted-foreground leading-relaxed">
                {t(step.desc)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JourneySection;
