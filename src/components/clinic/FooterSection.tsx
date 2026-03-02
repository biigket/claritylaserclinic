import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";

const FooterSection = () => {
  const { t } = useLanguage();

  return (
    <footer id="contact" className="section-padding bg-foreground text-background">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="font-display text-2xl font-light mb-2">
              {t(translations.footer.clinic)}
            </h3>
            <p className="font-body text-xs tracking-wider text-background/60 mb-8">
              {t(translations.footer.tagline)}
            </p>
            <div className="space-y-2 font-body text-sm font-light text-background/70">
              <p>{t(translations.footer.hours)}</p>
              <p>{t(translations.footer.line)}</p>
              <p>{t(translations.footer.phone)}</p>
            </div>
          </div>

          <div className="flex items-end justify-start md:justify-end">
            <a
              href="#contact"
              className="font-body text-xs tracking-widest uppercase border border-background/30 text-background/80 px-8 py-3.5 hover:bg-background/10 transition-colors duration-300"
            >
              {t(translations.cta.button)}
            </a>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-background/10">
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
