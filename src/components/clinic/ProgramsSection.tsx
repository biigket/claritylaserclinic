import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useIsMobile } from "@/hooks/use-mobile";
import acneScarImg from "@/assets/program-acnescar.jpeg";
import skinQualityImg from "@/assets/program-skinquality.jpeg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const programImages = [acneScarImg, skinQualityImg, null];

const ProgramCard = ({ program, index, t }: { program: any; index: number; t: any }) => (
  <div className="bg-background border border-border flex flex-col overflow-hidden h-full">
    {programImages[index] && (
      <div className="relative overflow-hidden aspect-square">
        <img
          src={programImages[index]!}
          alt={t(program.name)}
          className="w-full h-full object-cover object-center"
        />
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
);

const ProgramsSection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();
  const isMobile = useIsMobile();

  return (
    <section id="programs" className="section-padding bg-card">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0 animate-reveal">
        <div className="text-center mb-16">
          <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-6">
            {t(translations.programs.label)}
          </p>
        </div>

        {isMobile ? (
          <div className="grid grid-cols-1 gap-6">
            {translations.programs.items.map((program, i) => (
              <ProgramCard key={i} program={program} index={i} t={t} />
            ))}
          </div>
        ) : (
          <Carousel opts={{ loop: true, align: "start" }} className="w-full">
            <CarouselContent className="-ml-6">
              {translations.programs.items.map((program, i) => (
                <CarouselItem key={i} className="pl-6 basis-1/3">
                  <ProgramCard program={program} index={i} t={t} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-5 border-border text-foreground" />
            <CarouselNext className="-right-5 border-border text-foreground" />
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default ProgramsSection;
