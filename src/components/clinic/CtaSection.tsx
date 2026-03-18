import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const CtaSection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  const scrollToCaseReviews = () => {
    const el = document.getElementById("case-reviews");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="section-padding">
      <div ref={ref} className="max-w-2xl mx-auto text-center opacity-0 animate-reveal">
        <h2 className="font-display text-2xl md:text-4xl font-light text-foreground mb-6">
          {t(translations.cta.title)}
        </h2>
        <p className="font-body text-sm font-light text-muted-foreground mb-10">
          {t(translations.cta.desc)}
        </p>
        <button
          onClick={scrollToCaseReviews}
          className="inline-block font-body text-xs tracking-widest uppercase bg-primary text-primary-foreground px-10 py-4 hover:bg-primary/90 transition-colors duration-300"
        >
          {t(translations.cta.button)}
        </button>
      </div>
    </section>
  );
};

export default CtaSection;
