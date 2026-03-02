import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import clinicInterior from "@/assets/clinic-interior.jpeg";

const PhilosophySection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section id="philosophy" className="section-padding bg-card">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0 animate-reveal">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
              {t(translations.philosophy.label)}
            </p>
            <h2 className="font-display text-2xl md:text-4xl font-light leading-snug text-foreground">
              {t(translations.philosophy.title)}
            </h2>
            <p className="mt-8 font-body text-sm md:text-base font-light text-muted-foreground leading-relaxed">
              {t(translations.philosophy.desc)}
            </p>
          </div>
          <div className="relative overflow-hidden">
            <img
              src={clinicInterior}
              alt="Clarity Clinic interior"
              className="w-full h-[400px] md:h-[500px] object-cover grayscale-[20%] brightness-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card/30 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhilosophySection;
