import { useState, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, ArrowLeft, Star, ChevronRight, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import program2x from "@/assets/program-2x-scar.jpg";
import program4x from "@/assets/program-4x-scar.jpg";
import program5x from "@/assets/program-5x-scar.jpg";
import review2x from "@/assets/review-2x.jpg";
import review4x from "@/assets/review-4x.jpg";
import review5x from "@/assets/review-5x.jpg";
import logoClarity from "@/assets/logo-clarity.jpeg";

type Step = "hero" | "q1" | "q2" | "q3" | "result" | "lead" | "thanks";

interface QuizChoice {
  label: Record<"th" | "en", string>;
  value: number;
}

const quizData = {
  q1: {
    question: {
      th: "หลุมสิวของคุณเป็นแบบไหนมากที่สุด",
      en: "Which best describes your acne scars?",
    },
    micro: { th: "เลือกคำตอบที่ใกล้เคียงที่สุด", en: "Select the closest answer" },
    choices: [
      { label: { th: "ตื้น ต้องส่องกระจกตั้งใจมองใกล้ ๆ ถึงจะเห็น", en: "Shallow — only visible when looking closely in a mirror" }, value: 1 },
      { label: { th: "เห็นชัดในแสงปกติ แต่ไม่มีคนทัก", en: "Visible under normal lighting, but no one comments" }, value: 2 },
      { label: { th: "ลึก ผิวไม่เรียบชัดเจน มีคนทัก", en: "Deep — clearly uneven skin, others have noticed" }, value: 3 },
    ] as QuizChoice[],
  },
  q2: {
    question: {
      th: "บริเวณที่เป็นหลุมสิวเป็นแบบไหน",
      en: "How widespread are your acne scars?",
    },
    micro: { th: "เลือกคำตอบที่ใกล้เคียงที่สุด", en: "Select the closest answer" },
    choices: [
      { label: { th: "มีไม่กี่จุด", en: "Only a few spots" }, value: 1 },
      { label: { th: "หลายจุดบางบริเวณ เฉพาะหน้าแก้ม", en: "Multiple spots in some areas, mainly on cheeks" }, value: 2 },
      { label: { th: "กระจายหลายบริเวณทั่วหน้า มีถึงขมับ", en: "Widespread across the face, reaching the temples" }, value: 3 },
    ] as QuizChoice[],
  },
  q3: {
    question: {
      th: "เคยรักษาหลุมสิวมาก่อนหรือยัง",
      en: "Have you had acne scar treatment before?",
    },
    micro: { th: "เลือกคำตอบที่ใกล้เคียงที่สุด", en: "Select the closest answer" },
    choices: [
      { label: { th: "ยังไม่เคย", en: "Never" }, value: 1 },
      { label: { th: "เคยทำเลเซอร์/ทรีทเมนต์เบื้องต้น", en: "Basic laser or treatment" }, value: 2 },
      { label: { th: "เคยทำหลายวิธีแล้ว แต่ยังไม่ดีขึ้นชัด", en: "Multiple treatments — limited results" }, value: 3 },
    ] as QuizChoice[],
  },
};

type ProgramKey = "2x" | "4x" | "5x";

const programResults: Record<ProgramKey, {
  level: Record<"th" | "en", string>;
  stars: number;
  description: Record<"th" | "en", string>;
  suitable: Record<"th" | "en", string>;
  image: string;
  price: string;
  benefit: Record<"th" | "en", string>;
}> = {
  "2x": {
    level: { th: "ระดับเริ่มต้น (Mild)", en: "Mild Severity" },
    stars: 2,
    description: {
      th: "หลุมสิวของคุณอยู่ในระดับเริ่มต้น ผิวยังไม่ได้รับความเสียหายลึกมาก การรักษาด้วยเลเซอร์ 2 ชนิดจะช่วยกระตุ้นการซ่อมแซมผิวได้อย่างมีประสิทธิภาพ โดยไม่ต้องใช้หัตถการที่รุนแรง",
      en: "Your acne scars are at an early stage. The skin hasn't been deeply damaged yet. A combination of 2 laser technologies can effectively stimulate skin repair without aggressive procedures.",
    },
    suitable: { th: "เหมาะสำหรับหลุมสิวระดับเริ่มต้น", en: "Suitable for mild acne scars" },
    image: program2x,
    price: "3,990",
    benefit: { th: "ซื้อ 3 ครั้ง ฟรี 1 ครั้ง | ซื้อ 5 ครั้ง ฟรี 2 ครั้ง", en: "Buy 3 get 1 free | Buy 5 get 2 free" },
  },
  "4x": {
    level: { th: "ระดับปานกลาง (Moderate)", en: "Moderate Severity" },
    stars: 4,
    description: {
      th: "หลุมสิวของคุณอยู่ในระดับปานกลาง ผิวมีร่องรอยที่ชัดเจน ต้องใช้การรักษาที่เข้าถึงหลายชั้นผิวพร้อมกัน เพื่อกระตุ้นคอลลาเจนและฟื้นฟูโครงสร้างผิวให้กลับมาเรียบเนียนขึ้น",
      en: "Your scars are at a moderate level with visible marks. Multi-layer treatment is needed to stimulate collagen and restore smoother skin structure.",
    },
    suitable: { th: "เหมาะสำหรับหลุมสิวระดับปานกลาง", en: "Suitable for moderate acne scars" },
    image: program4x,
    price: "9,990",
    benefit: { th: "ซื้อ 3 ครั้ง ฟรี 1 ครั้ง | ซื้อ 5 ครั้ง ฟรี 2 ครั้ง", en: "Buy 3 get 1 free | Buy 5 get 2 free" },
  },
  "5x": {
    level: { th: "ระดับค่อนข้างลึก (Severe)", en: "Severe" },
    stars: 5,
    description: {
      th: "หลุมสิวของคุณอยู่ในระดับที่ค่อนข้างลึก มีความซับซ้อนและต้องใช้การรักษาแบบครบวงจร ที่เข้าถึงทุกชั้นผิว ตั้งแต่ผิวชั้นบนจนถึงชั้นลึก โปรแกรมนี้เป็นโปรแกรมที่แนะนำมากที่สุดสำหรับผู้ที่ต้องการผลลัพธ์ที่ชัดเจน",
      en: "Your scars are deep and complex, requiring comprehensive treatment across all skin layers. This is our most recommended program for those seeking significant visible improvement.",
    },
    suitable: { th: "เหมาะสำหรับหลุมสิวที่ลึกและซับซ้อน", en: "Suitable for deep and complex acne scars" },
    image: program5x,
    price: "12,990",
    benefit: { th: "ซื้อ 3 ครั้ง ฟรี 1 ครั้ง | ซื้อ 5 ครั้ง ฟรี 2 ครั้ง", en: "Buy 3 get 1 free | Buy 5 get 2 free" },
  },
};

function getProgram(score: number): ProgramKey {
  if (score <= 4) return "2x";
  if (score <= 6) return "4x";
  return "5x";
}

const stepOrder: Step[] = ["hero", "q1", "q2", "q3", "result", "lead", "thanks"];

export default function ScarAssessment() {
  const { lang, setLang, t } = useLanguage();
  const [step, setStep] = useState<Step>("hero");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean }>({});

  const score = (answers.q1 || 0) + (answers.q2 || 0) + (answers.q3 || 0);
  const program = getProgram(score);
  const result = programResults[program];

  const currentStepIndex = stepOrder.indexOf(step);

  const goTo = useCallback((s: Step) => setStep(s), []);

  const selectAnswer = (q: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [q]: value }));
    // Auto-advance after selection with a brief delay for animation
    const nextSteps: Record<string, Step> = { q1: "q2", q2: "q3", q3: "result" };
    setTimeout(() => goTo(nextSteps[q] as Step), 400);
  };

  const goBack = () => {
    const idx = stepOrder.indexOf(step);
    if (idx > 0) setStep(stepOrder[idx - 1]);
  };

  const submitLead = async () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = true;
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) errs.phone = true;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      // Call save-consultation edge function
      await supabase.functions.invoke("save-consultation", {
        body: {
          name: name.trim(),
          phone: phone.trim(),
          concern: "acne_scar",
          note: `[Scar Quiz] Score: ${score}, Program: ${program.toUpperCase()}, Answers: Q1=${answers.q1} Q2=${answers.q2} Q3=${answers.q3}`,
        },
      });
    } catch (e) {
      // Still show thank you even if submission fails
      console.error("Lead submission error:", e);
    }
    setSubmitting(false);
    goTo("thanks");
  };

  const quizStepNum = step === "q1" ? 1 : step === "q2" ? 2 : step === "q3" ? 3 : 0;

  const fadeVariant = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(35,20%,96%)] to-[hsl(30,14%,92%)]">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <img src={logoClarity} alt="Clarity Clinic" className="h-8 rounded" />
          <button
            onClick={() => setLang(lang === "th" ? "en" : "th")}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === "th" ? "EN" : "TH"}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-12">
        <AnimatePresence mode="wait">
          {/* ─── HERO ─── */}
          {step === "hero" && (
            <motion.div key="hero" {...fadeVariant} className="pt-12 text-center">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                  <Star className="w-3 h-3 fill-current" />
                  {t({ th: "ประเมินฟรี 30 วินาที", en: "Free 30-second assessment" })}
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-snug mb-4">
                  {t({
                    th: "ประเมินระดับหลุมสิวของคุณ\nใน 30 วินาที",
                    en: "Assess your acne scar\nseverity in 30 seconds",
                  })}
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                  {t({
                    th: "รู้ระดับปัญหา และแนวทางการรักษาที่เหมาะกับคุณ โดยทีมแพทย์ Clarity Clinic",
                    en: "Discover your concern level and the right treatment approach, designed by Clarity Clinic's medical team",
                  })}
                </p>
              </div>

              <button
                onClick={() => goTo("q1")}
                className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-4 rounded-2xl text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
              >
                {t({ th: "เริ่มประเมิน", en: "Start Assessment" })}
                <ChevronRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-muted-foreground mt-4">
                {t({ th: "ไม่มีค่าใช้จ่าย • ไม่ต้องสมัครสมาชิก", en: "Free • No signup required" })}
              </p>
            </motion.div>
          )}

          {/* ─── QUIZ STEPS ─── */}
          {(step === "q1" || step === "q2" || step === "q3") && (
            <motion.div key={step} {...fadeVariant} className="pt-8">
              {/* Progress */}
              <div className="flex items-center gap-3 mb-8">
                <button onClick={goBack} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 flex gap-1.5">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        n <= quizStepNum ? "bg-primary" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground font-medium">{quizStepNum}/3</span>
              </div>

              {/* Question */}
              {(() => {
                const q = quizData[step as "q1" | "q2" | "q3"];
                return (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">{t(q.micro)}</p>
                    <h2 className="text-xl font-semibold text-foreground mb-6 leading-snug">{t(q.question)}</h2>
                    <div className="space-y-3">
                      {q.choices.map((c, i) => {
                        const selected = answers[step] === c.value;
                        return (
                          <button
                            key={i}
                            onClick={() => selectAnswer(step, c.value)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                              selected
                                ? "border-primary bg-primary/5 shadow-md"
                                : "border-border bg-white hover:border-primary/40 hover:shadow-sm"
                            }`}
                          >
                            <span className={`text-sm ${selected ? "text-primary font-medium" : "text-foreground"}`}>
                              {t(c.label)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ─── RESULT ─── */}
          {step === "result" && (
            <motion.div key="result" {...fadeVariant} className="pt-8">
              <button onClick={goBack} className="p-1 text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ArrowLeft className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-semibold text-foreground mb-2">
                {t({ th: "ผลการประเมินของคุณ", en: "Your Assessment Result" })}
              </h2>

              {/* Severity visualization */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/60 mb-5">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < result.stars ? "text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" : "text-border"
                      }`}
                    />
                  ))}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{t(result.level)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(result.description)}</p>
              </div>

              {/* Disclaimer */}
              <div className="bg-accent/50 rounded-xl p-4 mb-6 text-xs text-muted-foreground leading-relaxed">
                {t({
                  th: "⚕️ การประเมินนี้เป็นการประเมินเบื้องต้นจากข้อมูลที่ให้ไว้ แนะนำให้แพทย์ประเมินสภาพผิวจริงอีกครั้งก่อนวางแผนการรักษา",
                  en: "⚕️ This is a preliminary assessment based on provided information. We recommend an in-person evaluation by our physician before finalizing a treatment plan.",
                })}
              </div>

              {/* Program recommendation */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  {t({ th: "โปรแกรมที่เหมาะกับคุณ", en: "Recommended Program" })}
                </h3>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border/60">
                  <img src={result.image} alt={`${program.toUpperCase()} Program`} className="w-full" />
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">{t(result.suitable)}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-primary">{result.price}</span>
                      <span className="text-sm text-muted-foreground">{t({ th: "บาท / ครั้ง", en: "THB / session" })}</span>
                    </div>
                    <p className="text-xs text-[hsl(var(--gold))] font-medium">{t(result.benefit)}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => goTo("lead")}
                className="w-full bg-primary text-primary-foreground font-medium py-4 rounded-2xl text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
              >
                {t({ th: "รับแผนการรักษาเฉพาะคุณ", en: "Get Your Personalized Plan" })}
              </button>
            </motion.div>
          )}

          {/* ─── LEAD CAPTURE ─── */}
          {step === "lead" && (
            <motion.div key="lead" {...fadeVariant} className="pt-8">
              <button onClick={goBack} className="p-1 text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ArrowLeft className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-semibold text-foreground mb-2">
                {t({ th: "รับแผนการรักษาเฉพาะคุณ", en: "Get Your Personalized Plan" })}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t({
                  th: "กรอกข้อมูลเพื่อให้เจ้าหน้าที่ติดต่อกลับ",
                  en: "Fill in your details and our team will contact you",
                })}
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {t({ th: "ชื่อ", en: "Name" })} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })); }}
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-sm transition-colors focus:outline-none focus:border-primary ${
                      errors.name ? "border-destructive" : "border-border"
                    }`}
                    placeholder={t({ th: "ชื่อของคุณ", en: "Your name" })}
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive mt-1">{t({ th: "กรุณากรอกชื่อ", en: "Please enter your name" })}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {t({ th: "เบอร์โทรศัพท์", en: "Phone" })} *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: false })); }}
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-sm transition-colors focus:outline-none focus:border-primary ${
                      errors.phone ? "border-destructive" : "border-border"
                    }`}
                    placeholder="0XX-XXX-XXXX"
                    maxLength={15}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive mt-1">
                      {t({ th: "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง", en: "Please enter a valid phone number" })}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={submitLead}
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground font-medium py-4 rounded-2xl text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {submitting
                  ? t({ th: "กำลังส่ง...", en: "Submitting..." })
                  : t({ th: "ให้เจ้าหน้าที่ติดต่อกลับ", en: "Request a Callback" })}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                {t({ th: "ทีมงานจะติดต่อภายใน 1 ชั่วโมง ในเวลาทำการ 11.00-20.00 น.", en: "Our team will contact you within 1 hour during business hours (11:00–20:00)" })}
              </p>
            </motion.div>
          )}

          {/* ─── THANK YOU ─── */}
          {step === "thanks" && (
            <motion.div key="thanks" {...fadeVariant} className="pt-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-primary fill-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {t({ th: "ขอบคุณครับ", en: "Thank You" })}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto mb-8">
                {t({
                  th: "ถ้าต้องการสอบถามเพิ่มเติมหรือทำนัดคุณหมอ สามารถทักแชทและแจ้งชื่อได้เลยครับ",
                  en: "For more info or to book an appointment, just send us a chat with your name.",
                })}
              </p>

              <div className="flex gap-3 max-w-xs mx-auto">
                <a
                  href="https://lin.ee/EPUPlNG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#06C755] text-white font-medium py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform"
                >
                  <MessageCircle className="w-4 h-4" />
                  LINE
                </a>
                <a
                  href="tel:064-964-5859"
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-transform"
                >
                  <Phone className="w-4 h-4" />
                  {t({ th: "โทร", en: "Call" })}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
