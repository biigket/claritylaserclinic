import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

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
              className="bg-background border border-border p-8 md:p-10 flex flex-col"
            >
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
