import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const TreatmentSection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section className="section-padding">
      <div ref={ref} className="max-w-4xl mx-auto opacity-0 animate-reveal">
        {/* Label */}
        <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-6 text-center">
          {t(translations.treatment.label)}
        </p>

        {/* Title */}
        <h2 className="font-display text-2xl md:text-4xl font-light text-foreground text-center mb-6">
          {t(translations.treatment.title)}
        </h2>

        {/* Subtitle block */}
        <div className="text-center mb-16">
          <p className="font-display text-lg md:text-xl font-light text-foreground mb-3">
            {t(translations.treatment.subtitle)}
          </p>
          <p className="font-body text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t(translations.treatment.subtitleDesc)}
          </p>
        </div>

        {/* Layers */}
        <div className="space-y-0">
          {translations.treatment.layers.map((layer, i) => (
            <div
              key={i}
              className="py-10 border-b border-border last:border-b-0"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <span className="text-2xl shrink-0">{layer.icon}</span>
                <div>
                  <span className="font-body text-xs tracking-[0.1em] text-gold/80">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-lg md:text-xl font-light text-foreground">
                    {t(layer.name)}
                  </h3>
                </div>
              </div>

              {/* Tagline */}
              <p className="font-display text-sm md:text-base font-light text-foreground/80 mb-4 ml-10">
                {t(layer.tagline)}
              </p>

              {/* Bullet points */}
              <ul className="space-y-1.5 ml-10 mb-5">
                {layer.points.map((point, j) => (
                  <li
                    key={j}
                    className="font-body text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-gold/60 mt-1 shrink-0">·</span>
                    {t(point)}
                  </li>
                ))}
              </ul>

              {/* Result highlight */}
              <p className="font-body text-sm italic text-gold/80 ml-10">
                {t(layer.result)}
              </p>
            </div>
          ))}
        </div>

        {/* Closing */}
        <div className="text-center mt-16">
          <p className="font-display text-lg md:text-2xl font-light text-foreground mb-3">
            {t(translations.treatment.closing)}
          </p>
          <p className="font-body text-sm text-muted-foreground">
            {t(translations.treatment.closingDesc)}
          </p>
        </div>
      </div>
    </section>
  );
};

export default TreatmentSection;
