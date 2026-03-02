import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { useEffect, useState } from "react";
import logoImage from "@/assets/logo-clarity.jpeg";

const Navbar = () => {
  const { lang, setLang, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "#philosophy", label: t(translations.nav.philosophy) },
    { href: "#programs", label: t(translations.nav.programs) },
    { href: "#technology", label: t(translations.nav.technology) },
    { href: "#doctor", label: t(translations.nav.doctor) },
    { href: "#contact", label: t(translations.nav.contact) },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-16 md:h-20">
        <a href="#" className="flex items-center">
          <img 
            src={logoImage} 
            alt="Clarity Laser & Aesthetic" 
            className="h-10 md:h-12 w-auto object-contain rounded-sm"
          />
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-body text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setLang(lang === "th" ? "en" : "th")}
            className="font-body text-xs tracking-widest uppercase border border-border rounded-sm px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground transition-all duration-300"
          >
            {lang === "th" ? "EN" : "TH"}
          </button>

          <a
            href="#contact"
            className="hidden md:block font-body text-xs tracking-widest uppercase bg-primary text-primary-foreground px-5 py-2 hover:bg-primary/90 transition-colors duration-300"
          >
            {t(translations.nav.book)}
          </a>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
          >
            <span className={`w-5 h-px bg-foreground transition-transform duration-300 ${menuOpen ? "rotate-45 translate-y-[3.5px]" : ""}`} />
            <span className={`w-5 h-px bg-foreground transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`w-5 h-px bg-foreground transition-transform duration-300 ${menuOpen ? "-rotate-45 -translate-y-[3.5px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-background/95 backdrop-blur-md border-t border-border">
          <div className="px-6 py-8 flex flex-col gap-6">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-body text-sm tracking-widest uppercase text-muted-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="font-body text-sm tracking-widest uppercase bg-primary text-primary-foreground px-5 py-3 text-center"
            >
              {t(translations.nav.book)}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
