import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const WhyClaritySection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section className="section-padding">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0 animate-reveal">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-16 text-center">
          {t(translations.whyClarity.label)}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {translations.whyClarity.cards.map((card, i) => (
            <div key={i} className="bg-background p-8 md:p-12">
              <h3 className="font-display text-xl md:text-2xl font-light text-foreground mb-4">
                {t(card.title)}
              </h3>
              <p className="font-body text-sm font-light text-muted-foreground leading-relaxed">
                {t(card.desc)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyClaritySection;
