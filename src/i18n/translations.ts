export type Lang = "th" | "en";

const translations = {
  nav: {
    philosophy: { th: "ปรัชญา", en: "Philosophy" },
    programs: { th: "โปรแกรม", en: "Programs" },
    technology: { th: "เทคโนโลยี", en: "Technology" },
    doctor: { th: "แพทย์ผู้เชี่ยวชาญ", en: "Our Doctor" },
    contact: { th: "ติดต่อเรา", en: "Contact" },
    book: { th: "นัดปรึกษา", en: "Book Consultation" },
  },
  hero: {
    headline: {
      th: "สถาบันเฉพาะทางด้านหลุมสิวและคุณภาพผิว",
      en: "Specialist Institute for Acne Scars & Skin Quality",
    },
    sub: {
      th: "การรักษาเชิงลึกแบบหลายระดับชั้น ด้วยเทคโนโลยีที่คัดสรรอย่างแม่นยำ",
      en: "Multi-layered precision treatment with intelligently selected technologies",
    },
    cta: { th: "นัดปรึกษาแพทย์", en: "Book a Consultation" },
  },
  philosophy: {
    label: { th: "ปรัชญาของเรา", en: "Our Philosophy" },
    title: {
      th: "ปัญหาผิวมีหลายระดับชั้น การรักษาจึงต้องผสานหลายเทคโนโลยีอย่างชาญฉลาด",
      en: "Skin concerns exist in multiple layers — treatment must intelligently combine multiple technologies",
    },
    desc: {
      th: "Clarity Clinic เชื่อว่าการรักษาที่มีประสิทธิภาพสูงสุดคือการเข้าใจโครงสร้างผิวแต่ละชั้น และออกแบบแผนการรักษาที่ตรงจุดด้วยเทคโนโลยีที่เหมาะสมกับแต่ละปัญหา",
      en: "Clarity Clinic believes the most effective treatment comes from understanding each layer of skin structure and designing precise treatment plans with the right technology for each concern.",
    },
  },
  whyClarity: {
    label: { th: "ทำไมต้อง Clarity Clinic", en: "Why Clarity Clinic" },
    cards: [
      {
        title: { th: "เชี่ยวชาญด้านหลุมสิว", en: "Acne Scar Expertise" },
        desc: {
          th: "มุ่งเน้นการรักษาหลุมสิวและปัญหาผิวเชิงลึกโดยเฉพาะ",
          en: "Dedicated exclusively to acne scar treatment and deep skin concerns",
        },
      },
      {
        title: { th: "การรักษาแบบผสมผสาน", en: "Combination Therapy" },
        desc: {
          th: "ใช้หลายเทคโนโลยีร่วมกันเพื่อผลลัพธ์ที่ครอบคลุมทุกชั้นผิว",
          en: "Multiple technologies work in synergy for results that address every skin layer",
        },
      },
      {
        title: { th: "บุฟเฟ่ต์ที่คุ้มค่าในราคาเดียว", en: "All-Inclusive Buffet Value" },
        desc: {
          th: "ระบบโปรแกรมบุฟเฟ่ต์ที่รวมทุกเทคโนโลยีที่จำเป็นในราคาเดียว",
          en: "All-inclusive buffet programs combining essential technologies in one transparent price",
        },
      },
      {
        title: { th: "ผลลัพธ์ที่เห็นชัดตั้งแต่ครั้งแรก", en: "Visible Results from First Session" },
        desc: {
          th: "เห็นความเปลี่ยนแปลงได้ตั้งแต่การรักษาครั้งแรก ด้วยเทคโนโลยีที่ตรงจุด",
          en: "See noticeable improvement from your very first treatment with precisely targeted technology",
        },
      },
    ],
  },
  programs: {
    label: { th: "โปรแกรมการรักษา", en: "Clinical Programs" },
    subtitle: {
      th: "โปรแกรมที่ออกแบบโดยแพทย์ผู้เชี่ยวชาญ เพื่อผลลัพธ์ที่ตรงจุดและยั่งยืน",
      en: "Physician-designed programs for precise and lasting results",
    },
    items: [
      {
        name: { th: "Acne Scar Buffet Program", en: "Acne Scar Buffet Program" },
        purpose: {
          th: "โปรแกรมรักษาหลุมสิวแบบครบวงจร ผสานเทคโนโลยีหลายชนิดในหนึ่งเซสชัน",
          en: "Comprehensive acne scar treatment combining multiple technologies in a single session",
        },
        suitable: {
          th: "ผู้ที่มีหลุมสิวทุกประเภท เห็นผลชัดเจนตั้งแต่ครั้งแรก",
          en: "Those with all types of acne scars — visible results from the very first session",
        },
        concept: {
          th: "Subcision + Microneedle RF + Er:Glass + Picohi + Er:YAG + CO₂",
          en: "Subcision + Microneedle RF + Er:Glass + Picohi + Er:YAG + CO₂",
        },
        price: { th: "9,990 บาท / ครั้ง", en: "9,990 THB / session" },
        benefit: {
          th: "ซื้อ 5 ครั้ง รับสิทธิ์ Subcision เพิ่มเติม (แพทย์ประเมินก่อนทำ)",
          en: "Purchase 5 sessions to receive complimentary Subcision (physician assessment required)",
        },
      },
      {
        name: { th: "Skin Quality Buffet Program", en: "Skin Quality Buffet Program" },
        purpose: {
          th: "โปรแกรมฟื้นฟูและยกระดับคุณภาพผิวโดยรวม",
          en: "Skin restoration and quality enhancement protocol",
        },
        suitable: {
          th: "ผู้ที่ต้องการบำรุงผิวเชิงลึก ฟื้นฟูความกระจ่างใสและความยืดหยุ่น",
          en: "Those seeking deep skin nourishment, radiance restoration and elasticity improvement",
        },
        concept: {
          th: "DermaV + Picohi + CO₂ + Er bump",
          en: "DermaV + Picohi + CO₂ + Er bump",
        },
        price: { th: "4,990 บาท / ครั้ง", en: "4,990 THB / session" },
        benefit: {
          th: "ซื้อ 5 ครั้ง รับสิทธิ์ Red Light Therapy เพิ่มเติม",
          en: "Purchase 5 sessions to receive complimentary Red Light Therapy",
        },
      },
      {
        name: { th: "Dual-Energy Lifting Program", en: "Dual-Energy Lifting Program" },
        purpose: {
          th: "โปรแกรมยกกระชับด้วยพลังงานคู่ สำหรับโครงสร้างใบหน้าที่คมชัดขึ้น",
          en: "Dual-energy structural lifting for enhanced facial definition",
        },
        suitable: {
          th: "ผู้ที่ต้องการยกกระชับ ลดริ้วรอย และปรับรูปหน้าให้ดูเรียวขึ้น",
          en: "Those seeking lifting, wrinkle reduction, and refined facial contours",
        },
        concept: {
          th: "HIFU + RF Lifting + Botox จุดริ้วรอย",
          en: "HIFU + RF Lifting + Targeted wrinkle Botox",
        },
        price: { th: "9,990 บาท", en: "9,990 THB" },
        benefit: {
          th: "รับสิทธิ์ Botox จุดริ้วรอย เพิ่มเติม",
          en: "Complimentary wrinkle Botox treatment included",
        },
      },
    ],
  },
  treatment: {
    label: { th: "แนวทางการรักษา", en: "Treatment Approach" },
    title: {
      th: "การรักษาแบบทุกชั้นผิว",
      en: "All-Layer Treatment",
    },
    layers: [
      {
        name: { th: "ชั้นลึก (SMAS / ไขมัน)", en: "Deep Layer (SMAS / Fat)" },
        desc: {
          th: "ตัดพังผืดใต้หลุม ยกระดับโครงสร้าง ปรับรูปหน้า",
          en: "Fibrous band release, structural elevation, contour refinement",
        },
      },
      {
        name: { th: "ชั้นกลาง (หนังแท้)", en: "Mid Layer (Dermis)" },
        desc: {
          th: "กระตุ้นคอลลาเจน เติมเนื้อเยื่อ ลดหลุมสิว",
          en: "Collagen stimulation, tissue remodeling, scar depth reduction",
        },
      },
      {
        name: { th: "ชั้นตื้น (หนังกำพร้า)", en: "Surface Layer (Epidermis)" },
        desc: {
          th: "ปรับสีผิว ลดจุดด่างดำ ฟื้นฟูความสม่ำเสมอ",
          en: "Tone correction, pigment reduction, uniformity restoration",
        },
      },
    ],
  },
  technology: {
    label: { th: "เทคโนโลยี", en: "Technology Intelligence" },
    title: {
      th: "ครอบคลุมทุกกลุ่มพลังงานสำหรับผลลัพธ์ที่ครบถ้วน",
      en: "Complete energy spectrum for comprehensive results",
    },
    categories: [
      {
        name: { th: "พลังงานแสง", en: "Light Energy" },
        desc: { th: "IPL, Laser Toning, Pico Laser", en: "IPL, Laser Toning, Pico Laser" },
      },
      {
        name: { th: "พลังงานความร้อน", en: "Thermal Energy" },
        desc: { th: "Fractional CO₂, Erbium Laser", en: "Fractional CO₂, Erbium Laser" },
      },
      {
        name: { th: "คลื่นความถี่วิทยุ", en: "Radiofrequency" },
        desc: { th: "RF Microneedling, Monopolar RF", en: "RF Microneedling, Monopolar RF" },
      },
      {
        name: { th: "อัลตราซาวด์", en: "Ultrasound" },
        desc: { th: "HIFU, Micro-focused Ultrasound", en: "HIFU, Micro-focused Ultrasound" },
      },
    ],
  },
  doctor: {
    label: { th: "แพทย์ผู้เชี่ยวชาญ", en: "Our Doctor" },
    title: {
      th: "การรักษาทุกครั้งอยู่ภายใต้การดูแลของแพทย์ผู้เชี่ยวชาญ",
      en: "Every treatment is supervised by our specialist physician",
    },
    philosophy: {
      th: "\"ผมเชื่อว่าผลลัพธ์ที่ดีที่สุดมาจากการเข้าใจปัญหาผิวอย่างแท้จริง ไม่ใช่แค่การใช้เครื่องมือที่แพงที่สุด แต่คือการเลือกเทคโนโลยีที่ใช่ ในจังหวะที่ใช่ สำหรับผิวแต่ละคน\"",
      en: "\"I believe the best results come from truly understanding skin concerns — not using the most expensive devices, but choosing the right technology at the right time for each individual's skin.\"",
    },
  },
  journey: {
    label: { th: "ขั้นตอนการรักษา", en: "Patient Journey" },
    steps: [
      {
        title: { th: "ปรึกษาแพทย์", en: "Consultation" },
        desc: {
          th: "วิเคราะห์ปัญหาผิวอย่างละเอียด วางแผนการรักษาเฉพาะบุคคล",
          en: "Detailed skin analysis and personalized treatment planning",
        },
      },
      {
        title: { th: "รักษา", en: "Treatment" },
        desc: {
          th: "ดำเนินการรักษาด้วยเทคโนโลยีที่เลือกสรรภายใต้การดูแลของแพทย์",
          en: "Precision treatment with selected technologies under physician supervision",
        },
      },
      {
        title: { th: "ติดตามผล", en: "Follow-up" },
        desc: {
          th: "ประเมินผลและปรับแผนการรักษาเพื่อผลลัพธ์สูงสุด",
          en: "Progress evaluation and treatment plan optimization for maximum results",
        },
      },
    ],
  },
  cta: {
    title: {
      th: "พร้อมเริ่มต้นเส้นทางสู่ผิวที่ดีกว่า",
      en: "Ready to begin your journey to better skin",
    },
    desc: {
      th: "นัดปรึกษาแพทย์ผู้เชี่ยวชาญเพื่อวิเคราะห์ปัญหาผิวของคุณ",
      en: "Schedule a consultation with our specialist to analyze your skin concerns",
    },
    button: { th: "นัดปรึกษาแพทย์", en: "Book a Consultation" },
  },
  footer: {
    clinic: { th: "Clarity Clinic – Skin & Laser", en: "Clarity Clinic – Skin & Laser" },
    tagline: {
      th: "สถาบันเฉพาะทางด้านหลุมสิวและคุณภาพผิว",
      en: "Specialist Acne Scar & Skin Quality Institute",
    },
    hours: { th: "จ.-ศ. 11:00–19:00 | ส.-อา. 11:00–18:00 | ปิดทุกวันอังคาร", en: "Mon-Fri 11:00–19:00 | Sat-Sun 11:00–18:00 | Closed Tuesdays" },
    line: { th: "LINE: @clarityclinic", en: "LINE: @clarityclinic" },
    phone: { th: "โทร: 064-964-5859", en: "Tel: 064-964-5859" },
    disclaimer: {
      th: "ผลลัพธ์อาจแตกต่างกันในแต่ละบุคคล การรักษาทุกครั้งต้องผ่านการประเมินจากแพทย์",
      en: "Results may vary. All treatments require physician assessment.",
    },
    rights: {
      th: "© 2026 Clarity Clinic. สงวนลิขสิทธิ์.",
      en: "© 2026 Clarity Clinic. All rights reserved.",
    },
  },
} as const;

export default translations;
