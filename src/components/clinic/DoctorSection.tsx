import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const DoctorSection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section id="doctor" className="section-padding">
      <div ref={ref} className="max-w-3xl mx-auto text-center opacity-0 animate-reveal">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
          {t(translations.doctor.label)}
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-12">
          {t(translations.doctor.title)}
        </h2>

        <blockquote className="font-display text-lg md:text-xl font-light text-foreground/80 leading-relaxed italic">
          {t(translations.doctor.philosophy)}
        </blockquote>
      </div>
    </section>
  );
};

export default DoctorSection;
