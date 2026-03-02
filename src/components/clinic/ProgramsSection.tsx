import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import acneScarImg from "@/assets/program-acnescar.jpeg";
import skinQualityImg from "@/assets/program-skinquality.jpeg";

const programImages = [acneScarImg, skinQualityImg, null];

const ProgramsSection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section id="programs" className="section-padding bg-card">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0 animate-reveal">
        <div className="text-center mb-16">
          <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6">
            {t(translations.programs.label)}
          </p>
          <p className="font-body text-sm font-light text-muted-foreground max-w-xl mx-auto">
            {t(translations.programs.subtitle)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {translations.programs.items.map((program, i) => (
            <div
              key={i}
              className="bg-background border border-border flex flex-col overflow-hidden"
            >
              {/* Program image */}
              {programImages[i] && (
                <div className="relative overflow-hidden h-48 md:h-56">
                  <img
                    src={programImages[i]!}
                    alt={t(program.name)}
                    className="w-full h-full object-cover object-top grayscale-[10%] brightness-105 saturate-[0.9]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>
              )}

              <div className="p-8 md:p-10 flex flex-col flex-1">
                <h3 className="font-display text-xl md:text-2xl font-light text-foreground mb-4">
                  {t(program.name)}
                </h3>

                <div className="space-y-4 flex-1">
                  <div>
                    <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                      {t({ th: "จุดประสงค์", en: "Purpose" })}
                    </p>
                    <p className="font-body text-sm font-light text-foreground/80 leading-relaxed">
                      {t(program.purpose)}
                    </p>
                  </div>

                  <div>
                    <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                      {t({ th: "เหมาะกับ", en: "Suitable For" })}
                    </p>
                    <p className="font-body text-sm font-light text-foreground/80 leading-relaxed">
                      {t(program.suitable)}
                    </p>
                  </div>

                  <div>
                    <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                      {t({ th: "เทคโนโลยี", en: "Technology" })}
                    </p>
                    <p className="font-body text-sm font-light text-foreground/80 leading-relaxed">
                      {t(program.concept)}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <p className="font-display text-lg text-foreground">
                    {t(program.price)}
                  </p>
                  <p className="mt-2 font-body text-xs font-light text-warm-deep leading-relaxed">
                    {t(program.benefit)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
