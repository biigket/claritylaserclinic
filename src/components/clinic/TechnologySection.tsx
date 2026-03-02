import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const TechnologySection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section id="technology" className="section-padding bg-card">
      <div ref={ref} className="max-w-5xl mx-auto opacity-0 animate-reveal">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6 text-center">
          {t(translations.technology.label)}
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-light text-foreground text-center mb-16 max-w-2xl mx-auto">
          {t(translations.technology.title)}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {translations.technology.categories.map((cat, i) => (
            <div
              key={i}
              className="text-center p-8 border border-border bg-background"
            >
              <h3 className="font-display text-lg font-light text-foreground mb-3">
                {t(cat.name)}
              </h3>
              <p className="font-body text-xs font-light text-muted-foreground leading-relaxed">
                {t(cat.desc)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
