import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import doctorImage from "@/assets/doctor-profile.jpeg";

const DoctorSection = () => {
  const { t } = useLanguage();
  const ref = useScrollReveal();

  return (
    <section id="doctor" className="section-padding">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0 animate-reveal">
        <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-6 text-center">
          {t(translations.doctor.label)}
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-16 text-center">
          {t(translations.doctor.title)}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative overflow-hidden mx-auto lg:mx-0 max-w-md">
            <img
              src={doctorImage}
              alt="นพ.ฐิติคมน์ – Clarity Clinic"
              className="w-full h-auto object-cover grayscale-[15%] brightness-105 contrast-[0.95]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
          </div>

          <div className="text-center lg:text-left">
            <h3 className="font-display text-xl md:text-2xl font-light text-foreground mb-2">
              {t({ th: "นพ.ฐิติคมน์", en: "Dr. Thitikamon" })}
            </h3>
            <p className="font-body text-xs tracking-wider text-muted-foreground mb-8">
              {t({ th: "ว.61395 — แพทย์ผู้เชี่ยวชาญด้านเลเซอร์และผิวหนัง", en: "License No. 61395 — Laser & Dermatology Specialist" })}
            </p>

            <blockquote className="font-display text-lg md:text-xl font-light text-foreground/80 leading-relaxed italic">
              {t(translations.doctor.philosophy)}
            </blockquote>

            <div className="mt-8 space-y-3">
              {[
                { th: "ดูแลโดยแพทย์ 100% ทุกเคส", en: "100% physician-supervised treatments" },
                { th: "เลือกเทคโนโลยีเฉพาะบุคคล", en: "Individually selected technology" },
                { th: "ติดตามผลดูแลหลังทำ", en: "Post-treatment follow-up care" },
              ].map((item, i) => (
                <p key={i} className="font-body text-sm font-light text-muted-foreground flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-warm-deep flex-shrink-0" />
                  {t(item)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorSection;
