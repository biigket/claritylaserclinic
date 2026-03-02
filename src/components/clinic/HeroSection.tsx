import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import heroImage from "@/assets/hero-clinic.jpg";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const HeroSection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section className="relative min-h-screen flex items-end pb-20 md:pb-32">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Clarity Laser & Aesthetic reception"
          className="w-full h-full object-cover object-center md:object-[center_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
      </div>

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-light leading-tight tracking-tight text-foreground animate-reveal">
            {t(translations.hero.headline)}
          </h1>
          <p className="mt-6 font-body text-sm md:text-base font-light text-muted-foreground leading-relaxed max-w-lg animate-reveal animate-reveal-delay-1">
            {t(translations.hero.sub)}
          </p>
          <a
            href="#contact"
            className="inline-block mt-10 font-body text-xs tracking-widest uppercase bg-primary text-primary-foreground px-8 py-3.5 hover:bg-primary/90 transition-colors duration-300 animate-reveal animate-reveal-delay-2"
          >
            {t(translations.hero.cta)}
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
