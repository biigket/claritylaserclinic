import { useLanguage } from "@/i18n/LanguageContext";
import translations from "@/i18n/translations";
import { Star, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const reviews = translations.reviews.items;

const ReviewCard = ({ review, t }: { review: (typeof reviews)[number]; t: (obj: Record<"th" | "en", string>) => string }) => (
  <div className="min-w-[300px] max-w-[340px] md:min-w-[360px] md:max-w-[400px] snap-center shrink-0 bg-card rounded-xl p-6 border border-border/50 shadow-sm flex flex-col gap-4">
    <div className="flex items-center gap-3">
      {review.avatar ? (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground overflow-hidden">
          <span>{review.avatar}</span>
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
          {review.name.charAt(0)}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-foreground">{review.name}</p>
        {review.badge && (
          <p className="text-xs text-muted-foreground">{review.badge}</p>
        )}
      </div>
    </div>
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-[#FBBC04] text-[#FBBC04]" />
      ))}
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-5">
      {t(review.text)}
    </p>
  </div>
);

const ReviewsSection = () => {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const sectionRef = useScrollReveal();

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, []);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 380, behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} className="section-padding bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-lg font-medium text-foreground">Google Reviews</span>
              <span className="text-sm text-muted-foreground ml-1">5.0 ★</span>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground text-sm">
                {t({ th: "รีวิวจริงจากผู้ใช้บริการ", en: "Real reviews from our patients" })}
              </p>
              <a
                href="https://maps.app.goo.gl/YourGoogleMapsLink"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-2"
                onClick={(e) => {
                  e.preventDefault();
                  window.open("https://www.google.com/search?q=%E0%B8%A3%E0%B8%B5%E0%B8%A7%E0%B8%B4%E0%B8%A7+clarity+clinic+%E0%B9%80%E0%B8%A5%E0%B9%80%E0%B8%8B%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%AB%E0%B8%A5%E0%B8%B8%E0%B8%A1%E0%B8%AA%E0%B8%B4%E0%B8%A7%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%A2%E0%B8%81%E0%B8%81%E0%B8%A3%E0%B8%B0%E0%B8%8A%E0%B8%B1%E0%B8%9A+%E0%B9%80%E0%B8%82%E0%B8%95%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B9%80%E0%B8%97%E0%B8%A7%E0%B8%B5#lrd=0x30e29ed751e1fcc1:0xd9b3e75e3de50ee0,1,,,,", "_blank");
                }}
              >
                {t({ th: "ดูรีวิวทั้งหมด", en: "See all reviews" })}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-6 px-6"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {reviews.map((review, i) => (
            <ReviewCard key={i} review={review} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
