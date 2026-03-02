import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import logoImage from "@/assets/logo-clarity.jpeg";
import mapImage from "@/assets/clinic-map.jpeg";

const FooterSection = () => {
  const { t } = useLanguage();

  return (
    <footer id="contact" className="section-padding bg-foreground text-background">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Info */}
          <div>
            <img
              src={logoImage}
              alt="Clarity Laser & Aesthetic"
              className="h-16 w-auto object-contain rounded-sm mb-6 brightness-[2] contrast-[0.8]"
            />
            <p className="font-body text-xs tracking-wider text-background/60 mb-8">
              {t(translations.footer.tagline)}
            </p>
            <div className="space-y-2 font-body text-sm font-light text-background/70">
              <p>{t(translations.footer.hours)}</p>
              <p>{t(translations.footer.line)}</p>
              <p>{t(translations.footer.phone)}</p>
              <p className="text-background/50 text-xs mt-4">
                {t({
                  th: "Spring Tower ชั้น B, ใกล้ BTS ราชเทวี ทางออก 3",
                  en: "Spring Tower B Floor, near BTS Ratchathewi Exit 3",
                })}
              </p>
            </div>

            <a
              href="#contact"
              className="inline-block mt-8 font-body text-xs tracking-widest uppercase border border-background/30 text-background/80 px-8 py-3.5 hover:bg-background/10 transition-colors duration-300"
            >
              {t(translations.cta.button)}
            </a>
          </div>

          {/* Right: Map */}
          <div className="relative overflow-hidden rounded-sm">
            <img
              src={mapImage}
              alt="Clarity Clinic location map"
              className="w-full h-auto object-cover brightness-90 contrast-[0.95]"
            />
          </div>
        </div>

        {/* Social links */}
        <div className="mt-12 pt-8 border-t border-background/10 flex flex-wrap gap-6 text-background/40 font-body text-xs">
          <a href="https://line.me/R/ti/p/@clarityclinic" target="_blank" rel="noopener noreferrer" className="hover:text-background/70 transition-colors">LINE @clarityclinic</a>
          <a href="https://facebook.com/ClarityClinic" target="_blank" rel="noopener noreferrer" className="hover:text-background/70 transition-colors">Facebook</a>
          <a href="https://instagram.com/Clarity.laserclinic" target="_blank" rel="noopener noreferrer" className="hover:text-background/70 transition-colors">Instagram</a>
          <a href="https://tiktok.com/@clarity.clinic" target="_blank" rel="noopener noreferrer" className="hover:text-background/70 transition-colors">TikTok</a>
        </div>

        <div className="mt-6">
          <p className="font-body text-[10px] font-light text-background/40 leading-relaxed mb-4">
            {t(translations.footer.disclaimer)}
          </p>
          <p className="font-body text-[10px] font-light text-background/30">
            {t(translations.footer.rights)}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
