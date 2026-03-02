import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const TreatmentSection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section className="section-padding">
      <div ref={ref} className="max-w-4xl mx-auto opacity-0 animate-reveal">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6 text-center">
          {t(translations.treatment.label)}
        </p>
        <h2 className="font-display text-2xl md:text-4xl font-light text-foreground text-center mb-16">
          {t(translations.treatment.title)}
        </h2>

        <div className="space-y-0">
          {translations.treatment.layers.map((layer, i) => (
            <div
              key={i}
              className="flex items-start gap-8 py-8 border-b border-border last:border-b-0"
            >
              <span className="font-display text-4xl md:text-5xl font-light text-gold/60 shrink-0 w-12 text-right">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-lg md:text-xl font-light text-foreground mb-2">
                  {t(layer.name)}
                </h3>
                <p className="font-body text-sm font-light text-muted-foreground leading-relaxed">
                  {t(layer.desc)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TreatmentSection;
