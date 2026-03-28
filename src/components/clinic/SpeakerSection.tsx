import { useEffect, useCallback, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const speaker1 = new URL("@/assets/speaker-1.jpeg", import.meta.url).href;
const speaker2 = new URL("@/assets/speaker-2.jpeg", import.meta.url).href;
const speaker3 = new URL("@/assets/speaker-3.jpeg", import.meta.url).href;
const speaker4 = new URL("@/assets/speaker-4.jpeg", import.meta.url).href;
const speaker5 = new URL("@/assets/speaker-5.jpeg", import.meta.url).href;

const slides = [
  {
    image: speaker1,
    label: { th: "Speaker Engagement", en: "Speaker Engagement" },
    title: { th: "2026 Doublo Standard Lifting", en: "2026 Doublo Standard Lifting" },
    location: { th: "Thailand", en: "Thailand" },
  },
  {
    image: speaker2,
    label: { th: "Speaker Engagement", en: "Speaker Engagement" },
    title: { th: "2025 Silverfox Workshop", en: "2025 Silverfox Workshop" },
    location: { th: "Vietnam", en: "Vietnam" },
  },
  {
    image: speaker3,
    label: { th: "Speaker Engagement", en: "Speaker Engagement" },
    title: { th: "2025 IMCAS Paris", en: "2025 IMCAS Paris" },
    location: { th: "France", en: "France" },
  },
  {
    image: speaker4,
    label: { th: "Speaker Engagement", en: "Speaker Engagement" },
    title: { th: "2024 KIMES Seoul", en: "2024 KIMES Seoul" },
    location: { th: "Korea", en: "Korea" },
  },
  {
    image: speaker5,
    label: { th: "Speaker Engagement", en: "Speaker Engagement" },
    title: { th: "2024 Hironic Workshop – Piyavet Hospital", en: "2024 Hironic Workshop – Piyavet Hospital" },
    location: { th: "Thailand", en: "Thailand" },
  },
];

const SpeakerSection = () => {
  const { t } = useLanguage();
  const sectionRef = useScrollReveal();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    slidesToScroll: 1,
    containScroll: false,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  // Auto-scroll
  useEffect(() => {
    if (!emblaApi || isHovered) {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      return;
    }
    autoplayRef.current = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
  }, [emblaApi, isHovered]);

  return (
    <section className="section-padding bg-background overflow-hidden">
      <div ref={sectionRef} className="max-w-6xl mx-auto opacity-0 animate-reveal">
        {/* Header */}
        <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground mb-6 text-center">
          {t({ th: "ผลงานวิชาการ", en: "Scientific Activities" })}
        </p>
        <h2 className="font-display text-2xl md:text-3xl font-light text-foreground text-center mb-4 max-w-3xl mx-auto">
          {t({ th: "International Speaker & Scientific Contributions", en: "International Speaker & Scientific Contributions" })}
        </h2>
        <p className="font-body text-sm text-muted-foreground text-center mb-14 max-w-xl mx-auto">
          {t({
            th: "แบ่งปันความรู้ทางคลินิกและพัฒนาเวชศาสตร์ความงามผ่านการศึกษาและความร่วมมือระดับสากล",
            en: "Sharing clinical knowledge and advancing aesthetic medicine through global education and collaboration.",
          })}
        </p>
      </div>

      {/* Carousel */}
      <div
        className="max-w-7xl mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {slides.map((slide, i) => {
              const isActive = i === selectedIndex;
              return (
                <div
                  key={i}
                  className="flex-[0_0_85%] md:flex-[0_0_70%] lg:flex-[0_0_60%] px-3"
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-lg group aspect-[16/9]">
                    <img
                      src={slide.image}
                      alt={slide.title.en}
                      className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                        i === 2 ? "object-[50%_25%]" : "object-center"
                      } ${isActive ? "scale-[1.03]" : "scale-100"}`}
                    />
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500 ${
                      isActive ? "opacity-100" : "opacity-60"
                    }`} />

                    {/* Caption */}
                    <div className={`absolute bottom-0 left-0 right-0 p-6 md:p-8 transition-all duration-500 ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-2 opacity-60"
                    }`}>
                      <span className="inline-block font-body text-[10px] tracking-[0.25em] uppercase text-white/70 mb-2">
                        {t(slide.label)}
                      </span>
                      <h3 className="font-display text-lg md:text-xl text-white font-light leading-snug drop-shadow-md">
                        {t(slide.title)}
                      </h3>
                      <p className="font-body text-xs text-white/60 mt-1 tracking-wide">
                        {t(slide.location)}
                      </p>
                    </div>

                    {/* Hover glow */}
                    <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-white/15 transition-colors duration-300 pointer-events-none" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === selectedIndex
                  ? "w-8 bg-primary"
                  : "w-1.5 bg-border hover:bg-muted-foreground/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpeakerSection;
