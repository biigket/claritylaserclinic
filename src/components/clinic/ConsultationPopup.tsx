import { useState, useEffect, useRef } from "react";
import { X, Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface ConsultationPopupProps {
  open: boolean;
  onClose: () => void;
}

const concerns = [
  { value: "acne_scar", th: "หลุมสิว", en: "Acne Scar" },
  { value: "skin_quality", th: "คุณภาพผิว", en: "Skin Quality" },
  { value: "lifting", th: "ยกกระชับ", en: "Lifting & Firming" },
  { value: "pigmentation", th: "ฝ้า กระ จุดด่างดำ", en: "Pigmentation" },
  { value: "pores", th: "รูขุมขน & เนื้อผิว", en: "Pores & Texture" },
  { value: "not_sure", th: "ยังไม่แน่ใจ (ต้องการคำแนะนำ)", en: "Not sure (Need advice)" },
];

const budgets = [
  { value: "3000-5000", label: "3,000 – 5,000 THB" },
  { value: "5000-10000", label: "5,000 – 10,000 THB" },
  { value: "10000-20000", label: "10,000 – 20,000 THB" },
  { value: "20000+", label: "20,000+ THB" },
];

const ConsultationPopup = ({ open, onClose }: ConsultationPopupProps) => {
  const { lang } = useLanguage();
  const [name, setName] = useState("");
  const [concern, setConcern] = useState("");
  const [budget, setBudget] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ name?: boolean; concern?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Lock body scroll & auto-focus
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => nameRef.current?.focus(), 350);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleSubmit = async () => {
    const newErrors: { name?: boolean; concern?: boolean } = {};
    if (!name.trim()) newErrors.name = true;
    if (!concern) newErrors.concern = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const concernLabel = concerns.find(c => c.value === concern)?.[lang] || concern;
    const budgetLabel = budgets.find(b => b.value === budget)?.label || "-";

    // Save to Google Sheets via edge function
    try {
      await supabase.functions.invoke("save-consultation", {
        body: { name: name.trim(), concern: concernLabel, budget: budgetLabel, note: note.trim() },
      });
    } catch (e) {
      console.error("Failed to save consultation:", e);
    }

    // Open LINE
    const lineUrl = `https://lin.ee/Ez76erL`;
    window.open(lineUrl, "_blank");

    // Reset & close
    setTimeout(() => {
      setName("");
      setConcern("");
      setBudget("");
      setNote("");
      setSubmitting(false);
      onClose();
    }, 500);
  };

  if (!open) return null;

  const t = (th: string, en: string) => (lang === "th" ? th : en);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-background rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 pr-8">
            <h3 className="font-display text-xl md:text-2xl font-light text-foreground leading-snug">
              {t("เริ่มต้นปรึกษาปัญหาผิวเฉพาะคุณ", "Start Your Personalized Skin Consultation")}
            </h3>
            <p className="mt-2 font-body text-xs text-muted-foreground leading-relaxed">
              {t(
                "บอกปัญหาของคุณ แล้วผู้เชี่ยวชาญจะแนะนำการรักษาที่เหมาะสมที่สุด",
                "Tell us your concern and our specialist will recommend the most suitable treatment for you."
              )}
            </p>
          </div>

          {/* Name */}
          <div className="mb-5">
            <label className="block font-body text-xs text-muted-foreground mb-1.5 tracking-wide uppercase">
              {t("ชื่อ", "Name")} <span className="text-destructive">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: false })); }}
              placeholder={t("ชื่อของคุณ", "Your name")}
              maxLength={100}
              className={`w-full px-4 py-3 rounded-xl border bg-background text-sm font-body transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/30 ${
                errors.name ? "border-destructive" : "border-border"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive font-body">{t("กรุณากรอกชื่อ", "Please enter your name")}</p>
            )}
          </div>

          {/* Concern */}
          <div className="mb-5">
            <label className="block font-body text-xs text-muted-foreground mb-1.5 tracking-wide uppercase">
              {t("ปัญหาที่สนใจ", "Main Concern")} <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {concerns.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => { setConcern(c.value); setErrors(prev => ({ ...prev, concern: false })); }}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-body text-left transition-all duration-200 ${
                    concern === c.value
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  {c[lang]}
                </button>
              ))}
            </div>
            {errors.concern && (
              <p className="mt-1 text-xs text-destructive font-body">{t("กรุณาเลือกปัญหา", "Please select a concern")}</p>
            )}
          </div>

          {/* Budget */}
          <div className="mb-5">
            <label className="block font-body text-xs text-muted-foreground mb-1.5 tracking-wide uppercase">
              {t("งบประมาณ", "Budget Range")}
            </label>
            <div className="flex flex-wrap gap-2">
              {budgets.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setBudget(budget === b.value ? "" : b.value)}
                  className={`px-3 py-2 rounded-full border text-xs font-body transition-all duration-200 ${
                    budget === b.value
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="mb-6">
            <label className="block font-body text-xs text-muted-foreground mb-1.5 tracking-wide uppercase">
              {t("หมายเหตุเพิ่มเติม", "Optional Note")}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("บอกเราเพิ่มเติมเกี่ยวกับปัญหาผิวของคุณ (ไม่จำเป็น)", "Tell us more about your skin concern (optional)")}
              maxLength={1000}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-body transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-body text-sm tracking-wide hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {submitting ? t("กำลังส่ง...", "Sending...") : t("คุยกับผู้เชี่ยวชาญทาง LINE", "Get Recommendation via LINE")}
          </button>

          {/* Trust elements */}
          <div className="mt-4 flex flex-col gap-1.5">
            {[
              t("ปรึกษาฟรี ไม่มีค่าใช้จ่าย", "Free consultation"),
              t("ประเมินโดยแพทย์ผู้เชี่ยวชาญ", "Doctor assessment"),
              t("ตอบกลับภายในเวลาทำการ", "Reply within business hours"),
            ].map((text) => (
              <div key={text} className="flex items-center gap-2">
                <Check className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="font-body text-[10px] text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationPopup;
