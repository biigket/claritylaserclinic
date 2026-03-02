import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const CtaSection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section className="section-padding">
      <div ref={ref} className="max-w-2xl mx-auto text-center opacity-0 animate-reveal">
        <h2 className="font-display text-2xl md:text-4xl font-light text-foreground mb-6">
          {t(translations.cta.title)}
        </h2>
        <p className="font-body text-sm font-light text-muted-foreground mb-10">
          {t(translations.cta.desc)}
        </p>
        <a
          href="#contact"
          className="inline-block font-body text-xs tracking-widest uppercase bg-foreground text-background px-10 py-4 hover:bg-foreground/90 transition-colors duration-300"
        >
          {t(translations.cta.button)}
        </a>
      </div>
    </section>
  );
};

export default CtaSection;
