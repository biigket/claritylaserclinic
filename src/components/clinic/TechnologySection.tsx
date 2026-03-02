import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import devicesImage from "@/assets/laser-devices.jpeg";

const TechnologySection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section id="technology" className="section-padding bg-card">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0 animate-reveal">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6 text-center">
          {t(translations.technology.label)}
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-light text-foreground text-center mb-12 max-w-2xl mx-auto">
          {t(translations.technology.title)}
        </h2>

        {/* Devices image */}
        <div className="relative overflow-hidden mb-16 max-w-4xl mx-auto">
          <img
            src={devicesImage}
            alt="Clarity Clinic laser devices"
            className="w-full h-auto object-cover brightness-105 contrast-[0.95] saturate-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/40 to-transparent" />
        </div>

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
