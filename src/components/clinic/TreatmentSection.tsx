import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const TreatmentSection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section className="section-padding">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0 animate-reveal">
        <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-6 text-center">
          {t(translations.treatment.label)}
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-light text-foreground text-center mb-16">
          {t(translations.treatment.title)}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {translations.treatment.layers.map((layer, i) => (
            <div key={i} className="bg-background p-8 md:p-12">
              <span className="font-body text-xs tracking-[0.1em] text-gold/80 mb-4 block">
                {layer.num}
              </span>
              <h3 className="font-display text-xl md:text-2xl font-light text-foreground mb-4">
                {t(layer.name)}
              </h3>
              <p className="font-body text-sm font-light text-muted-foreground leading-relaxed">
                {t(layer.desc)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TreatmentSection;
