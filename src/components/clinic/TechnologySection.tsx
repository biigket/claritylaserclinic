import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import devicesImage from "@/assets/laser-devices.jpeg";
import { Layers, Droplets, Zap, Target, ArrowUpFromDot } from "lucide-react";

const categoryIcons = [Layers, Target, Droplets, Zap, ArrowUpFromDot];

const TechnologySection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section id="technology" className="section-padding bg-card">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0 animate-reveal">
        <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-6 text-center">
          {t(translations.technology.label)}
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-light text-foreground text-center mb-4 max-w-3xl mx-auto">
          {t(translations.technology.title)}
        </h2>
        <p className="font-body text-sm text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          {t(translations.technology.subtitle)}
        </p>

        {/* Devices image */}
        <div className="relative overflow-hidden mb-16 max-w-4xl mx-auto">
          <img
            src={devicesImage}
            alt="Clarity Clinic laser devices"
            className="w-full h-auto object-cover brightness-105 contrast-[0.95] saturate-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/40 to-transparent" />
        </div>

        {/* 5 Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {translations.technology.categories.map((cat, i) => {
            const Icon = categoryIcons[i];
            return (
              <div
                key={i}
                className={`group relative p-7 border border-border bg-background transition-all duration-300 hover:border-primary/30 hover:shadow-md ${
                  i === 4 ? "sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                {/* Number badge */}
                <span className="absolute top-4 right-4 font-display text-xs text-muted-foreground/40 tracking-widest">
                  0{i + 1}
                </span>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 flex items-center justify-center border border-border group-hover:border-primary/40 transition-colors">
                    <Icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-display text-base font-medium text-foreground">
                    {t(cat.name)}
                  </h3>
                </div>

                <p className="font-body text-xs text-muted-foreground leading-relaxed mb-4">
                  {t(cat.tagline)}
                </p>

                <div className="border-t border-border pt-3 space-y-1.5">
                  <p className="font-body text-[11px] tracking-wide text-foreground/70">
                    {t(cat.devices)}
                  </p>
                  <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground/60">
                    {t(cat.layer)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
