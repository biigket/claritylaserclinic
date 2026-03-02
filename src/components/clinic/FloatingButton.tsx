import { useLanguage } from "@/i18n/LanguageContext";
import { MessageCircle } from "lucide-react";

const FloatingButton = () => {
  const { lang } = useLanguage();

  return (
    <a
      href="#contact"
      className="fixed bottom-6 right-6 z-50 bg-foreground text-background rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300"
      aria-label={lang === "th" ? "นัดปรึกษา" : "Book consultation"}
    >
      <MessageCircle className="w-5 h-5" />
    </a>
  );
};

export default FloatingButton;
