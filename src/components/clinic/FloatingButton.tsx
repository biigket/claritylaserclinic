import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import iconLine from "@/assets/icon-line.png";
import iconTel from "@/assets/icon-tel.png";
import iconMap from "@/assets/icon-map.png";

const FloatingButton = () => {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);

  const actions = [
    {
      icon: iconLine,
      label: "LINE",
      href: "https://lin.ee/Ez76erL",
    },
    {
      icon: iconTel,
      label: lang === "th" ? "โทร" : "Call",
      href: "tel:064-964-5859",
    },
    {
      icon: iconMap,
      label: lang === "th" ? "แผนที่" : "Map",
      href: "https://maps.app.goo.gl/fnRqJFrrwW5xbaxf6?g_st=ic",
    },
  ];

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Action icons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-center gap-3">
        {/* Main toggle button */}
        <button
          onClick={() => setOpen(!open)}
          className="bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300"
          aria-label={lang === "th" ? "ติดต่อเรา" : "Contact us"}
        >
          {open ? (
            <X className="w-5 h-5 transition-transform duration-300" />
          ) : (
            <MessageCircle className="w-5 h-5 transition-transform duration-300" />
          )}
        </button>

        {/* Pop-up icons */}
        {actions.map((action, i) => (
          <a
            key={action.label}
            href={action.href}
            target={action.href.startsWith("tel:") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className="transition-all duration-300"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "scale(1) translateY(0)" : "scale(0.5) translateY(20px)",
              transitionDelay: open ? `${i * 60}ms` : "0ms",
              pointerEvents: open ? "auto" : "none",
            }}
            aria-label={action.label}
          >
            <img
              src={action.icon}
              alt={action.label}
              className="w-12 h-12 rounded-full shadow-md hover:scale-110 transition-transform duration-200"
            />
          </a>
        ))}
      </div>
    </>
  );
};

export default FloatingButton;
