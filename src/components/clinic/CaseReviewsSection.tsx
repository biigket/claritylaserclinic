import { useLanguage } from "@/i18n/LanguageContext";
import review2x from "@/assets/review-2x.jpg";
import review4x from "@/assets/review-4x.jpg";
import review5x from "@/assets/review-5x.jpg";

const cases = [
  {
    image: review2x,
    badge: { th: "🟢 เคส 2X — Mild", en: "🟢 Case 2X — Mild" },
    sessions: { th: "✨ รีวิวผลลัพธ์ (ทำ 3 ครั้ง)", en: "✨ Results Review (3 Sessions)" },
    intro: {
      th: "เคสนี้เป็นหลุมสิวระดับเริ่มต้น (ตื้น กระจายไม่มาก) หลังเข้ารับการรักษาด้วยโปรแกรม 2X ต่อเนื่อง 3 ครั้ง",
      en: "Mild acne scars (shallow, scattered). After 3 consecutive sessions with the 2X program:",
    },
    results: {
      th: ["ผิวดูเรียบเนียนขึ้นอย่างเห็นได้ชัด", "หลุมตื้นดูจางลง", "Texture ผิวโดยรวมดีขึ้น"],
      en: ["Visibly smoother skin texture", "Shallow scars noticeably faded", "Overall skin texture improved"],
    },
    note: {
      th: "💡 เคสระดับนี้มักเริ่มเห็นการเปลี่ยนแปลงตั้งแต่ครั้งแรก (~20%) และจะชัดขึ้นเมื่อทำต่อเนื่อง",
      en: "💡 At this level, changes are often visible from the first session (~20%) and improve with continued treatment.",
    },
    suitable: {
      th: "เหมาะสำหรับคนที่เริ่มมีหลุมสิว และต้องการปรับผิวให้เรียบขึ้นแบบค่อยเป็นค่อยไป",
      en: "Ideal for those with early-stage scars seeking gradual skin refinement.",
    },
  },
  {
    image: review4x,
    badge: { th: "🟡 เคส 4X — Moderate", en: "🟡 Case 4X — Moderate" },
    sessions: { th: "✨ รีวิวผลลัพธ์ (ทำ 4 ครั้ง)", en: "✨ Results Review (4 Sessions)" },
    intro: {
      th: "เคสนี้เป็นหลุมสิวระดับปานกลาง (เห็นชัดในแสงปกติ มีหลายจุด) รักษาด้วยโปรแกรม 4X ต่อเนื่อง 4 ครั้ง",
      en: "Moderate acne scars (visible under normal light, multiple areas). After 4 consecutive sessions with the 4X program:",
    },
    results: {
      th: ["หลุมสิวดูตื้นขึ้นอย่างชัดเจน", "ผิวเรียบขึ้นและสม่ำเสมอมากขึ้น", "รูขุมขนและ texture ดีขึ้นร่วมด้วย"],
      en: ["Scars significantly shallower", "Smoother, more even skin surface", "Improved pore size and texture"],
    },
    note: {
      th: "💡 เคสระดับนี้มักต้องใช้การรักษาหลายเทคนิคร่วมกัน และต้องทำต่อเนื่องเพื่อให้เห็นผลชัด",
      en: "💡 This level typically requires multi-technique treatment and consistent sessions for visible results.",
    },
    suitable: {
      th: "เหมาะสำหรับคนที่เคยรักษามาบ้าง แต่ยังต้องการผลลัพธ์ที่ดีขึ้นแบบชัดเจน",
      en: "Ideal for those who've tried treatments before but want significantly better results.",
    },
  },
  {
    image: review5x,
    badge: { th: "🔴 เคส 5X — Severe", en: "🔴 Case 5X — Severe" },
    sessions: { th: "✨ รีวิวผลลัพธ์ (ทำ 6 ครั้ง)", en: "✨ Results Review (6 Sessions)" },
    intro: {
      th: "เคสนี้เป็นหลุมสิวระดับลึกและซับซ้อน รักษาด้วยโปรแกรม 5X ต่อเนื่อง 6 ครั้ง",
      en: "Severe, deep acne scars with complex scarring patterns. After 6 consecutive sessions with the 5X program:",
    },
    results: {
      th: ["หลุมลึกดูตื้นขึ้นอย่างมีนัยสำคัญ", "ผิวเรียบขึ้นชัดเจนเมื่อเทียบก่อนรักษา", "ภาพรวมผิวดีขึ้นทั้งพื้นผิวและความสม่ำเสมอ"],
      en: ["Deep scars significantly shallower", "Clearly smoother skin compared to baseline", "Overall skin quality improved in texture and evenness"],
    },
    note: {
      th: "💡 เคสระดับนี้จำเป็นต้องใช้การรักษาหลายระดับ (multi-layer treatment) และต้องใช้เวลาในการฟื้นฟูผิว",
      en: "💡 This level requires multi-layer treatment and patience for skin regeneration.",
    },
    suitable: {
      th: "เหมาะสำหรับคนที่มีหลุมสิวลึก หรือเคยทำหลายวิธีแล้วยังไม่ดีขึ้น",
      en: "Ideal for those with deep scars or who haven't seen improvement from other methods.",
    },
  },
];

const CaseReviewsSection = () => {
  const { t, lang } = useLanguage();

  return (
    <section id="case-reviews" className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t({ th: "เคสจริง ผลลัพธ์จริง", en: "Real Cases, Real Results" })}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t({ th: "ผลลัพธ์การรักษาหลุมสิวจากเคสจริง", en: "Actual Acne Scar Treatment Results" })}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-sm md:text-base">
            {t({
              th: "ทุกเคสรักษาโดยแพทย์ผู้เชี่ยวชาญ ด้วยโปรแกรมที่ออกแบบเฉพาะบุคคล ผลลัพธ์อาจแตกต่างกันในแต่ละบุคคล",
              en: "All cases treated by our specialist physician with personalized programs. Individual results may vary.",
            })}
          </p>
        </div>

        <div className="space-y-12">
          {cases.map((c, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border"
            >
              {/* Image */}
              <div className="w-full">
                <img
                  src={c.image}
                  alt={t(c.badge)}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg md:text-xl font-bold text-foreground">
                    {t(c.badge)}
                  </span>
                </div>

                <p className="text-sm font-semibold text-primary">{t(c.sessions)}</p>

                <p className="text-sm text-muted-foreground leading-relaxed">{t(c.intro)}</p>

                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">
                    {t({ th: "ผลลัพธ์:", en: "Results:" })}
                  </p>
                  <ul className="space-y-1">
                    {c.results[lang].map((r: string, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-foreground/90">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
                  {t(c.note)}
                </p>

                <p className="text-sm text-muted-foreground italic">{t(c.suitable)}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {t({
            th: "* ผลลัพธ์อาจแตกต่างกันในแต่ละบุคคล ขึ้นอยู่กับสภาพผิวและการดูแลหลังการรักษา",
            en: "* Results may vary depending on individual skin condition and post-treatment care.",
          })}
        </p>
      </div>
    </section>
  );
};

export default CaseReviewsSection;
