import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, Star } from "lucide-react";

const ScarAssessmentCTA = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const ref = useScrollReveal();

  return (
    <section className="py-10 px-4 sm:px-6 md:py-20 md:px-12 bg-background">
      <div ref={ref} className="max-w-5xl mx-auto opacity-0 animate-reveal">
        <div className="relative overflow-hidden border border-border bg-card">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="flex flex-col md:grid md:grid-cols-5">
            {/* Left content */}
            <div className="md:col-span-3 p-6 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <p className="font-body text-[10px] tracking-[0.25em] uppercase text-primary mb-3 md:mb-4">
                {t({ th: "เครื่องมือประเมินออนไลน์", en: "Online Assessment Tool" })}
              </p>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-foreground leading-tight mb-3 md:mb-4">
                {t({
                  th: "ประเมินหลุมสิวของคุณ\nใน 30 วินาที",
                  en: "Assess Your Acne Scars\nin 30 Seconds",
                })}
              </h2>
              <p className="font-body text-xs sm:text-sm font-light text-muted-foreground leading-relaxed max-w-md mb-6 md:mb-8">
                {t({
                  th: "ตอบ 3 คำถามง่ายๆ รับแผนการรักษาที่ออกแบบเฉพาะคุณ พร้อมดูเคสจริงที่ใกล้เคียงกับปัญหาของคุณ",
                  en: "Answer 3 simple questions to get a personalized treatment plan and see real cases similar to yours",
                })}
              </p>
              <button
                onClick={() => navigate("/scar-assessment")}
                className="group inline-flex items-center justify-center gap-3 font-body text-xs tracking-widest uppercase bg-primary text-primary-foreground px-6 sm:px-8 py-3.5 sm:py-4 hover:bg-primary/90 transition-all duration-300 self-stretch sm:self-start"
              >
                {t({ th: "เริ่มประเมินเลย", en: "Start Assessment" })}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Right visual */}
            <div className="md:col-span-2 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 sm:p-8 md:p-12 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-border">
              <div className="flex md:flex-col gap-4 sm:gap-6 w-full md:w-auto">
                {/* Step indicators - horizontal on mobile, vertical on desktop */}
                <div className="flex md:flex-col gap-4 sm:gap-6 flex-1 md:flex-none">
                  {[
                    { th: "ระดับความลึก", en: "Scar Depth" },
                    { th: "บริเวณที่เป็น", en: "Affected Area" },
                    { th: "ประวัติการรักษา", en: "Treatment History" },
                  ].map((step, i) => (
                    <div key={i} className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-primary/30 flex items-center justify-center text-primary font-body text-[10px] md:text-xs font-medium shrink-0">
                        {i + 1}
                      </div>
                      <p className="font-body text-[10px] md:text-sm font-light text-foreground/70 text-center md:text-left">
                        {t(step)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Result preview */}
                <div className="hidden md:block mt-4 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-1 justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-primary/60 text-primary/60" />
                    ))}
                  </div>
                  <p className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                    {t({ th: "รับผลประเมินทันที", en: "Get Instant Results" })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScarAssessmentCTA;
