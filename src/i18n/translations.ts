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
      th: "หลุมสิวดีขึ้นได้ เมื่อรักษาถูกชั้นผิว",
      en: "Acne Scars Can Improve When Treated at the Right Skin Layer",
    },
    sub: {
      th: "รวมหลายเครื่องและเทคนิค เพื่อผลลัพธ์ที่ชัดเจนยิ่งขึ้น ในราคาเดียว",
      en: "Combining multiple devices and techniques for clearer results, all in one price",
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
          th: "DermaV + Picohi + CO₂ + Fotona",
          en: "DermaV + Picohi + CO₂ + Fotona",
        },
        price: { th: "6,990 บาท / ครั้ง", en: "6,990 THB / session" },
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
    label: { th: "แนวทางการรักษาแบบครบทุกชั้นผิว", en: "All-Layer Treatment Approach" },
    title: {
      th: "ฟื้นฟูผิวจากต้นเหตุ ไม่ใช่แค่รักษาที่ผิวด้านบน",
      en: "Restore skin from the root cause, not just the surface",
    },
    subtitle: {
      th: "ผิวที่ดูดีจริง ต้องได้รับการดูแล \"ทุกชั้น\"",
      en: "Truly beautiful skin requires care at \"every layer\"",
    },
    subtitleDesc: {
      th: "เราออกแบบการรักษาให้ทำงานตั้งแต่ผิวชั้นบน ไปจนถึงโครงสร้างใบหน้า เพื่อผลลัพธ์ที่ดูเป็นธรรมชาติและยาวนาน",
      en: "We design treatments that work from the surface layer down to the facial structure, for results that look natural and last",
    },
    closing: {
      th: "เพราะผิวไม่ได้มีแค่ชั้นเดียว",
      en: "Because skin isn't just one layer",
    },
    closingDesc: {
      th: "เราจึงรักษาแบบครบทุกระดับ เพื่อผลลัพธ์ที่ดูดีจริงในระยะยาว",
      en: "We treat at every level, for results that truly look great long-term",
    },
    layers: [
      {
        icon: "✨",
        name: { th: "ชั้นผิวด้านบน (Surface Skin)", en: "Surface Skin" },
        tagline: {
          th: "ปรับผิวให้เรียบเนียน กระจ่างใส",
          en: "Smooth and brighten the skin surface",
        },
        points: [
          { th: "ลดจุดด่างดำ รอยแดง และความหมองคล้ำ", en: "Reduce dark spots, redness, and dullness" },
          { th: "ปรับสีผิวให้สม่ำเสมอ", en: "Even out skin tone" },
          { th: "ฟื้นฟูผิวให้ดูสดใส สุขภาพดี", en: "Restore a fresh, healthy glow" },
        ],
        result: {
          th: "ผิวดูใสขึ้นตั้งแต่ครั้งแรกที่เริ่มดูแล",
          en: "Visibly brighter skin from the very first session",
        },
      },
      {
        icon: "💧",
        name: { th: "ชั้นผิวกลาง (Skin Quality Layer)", en: "Skin Quality Layer" },
        tagline: {
          th: "ซ่อมแซมผิวและกระตุ้นคอลลาเจน",
          en: "Repair skin and stimulate collagen",
        },
        points: [
          { th: "กระตุ้นการสร้างคอลลาเจนใหม่", en: "Stimulate new collagen production" },
          { th: "ลดหลุมสิวและรูขุมขน", en: "Reduce acne scars and pores" },
          { th: "เพิ่มความแน่นและความยืดหยุ่นของผิว", en: "Improve skin firmness and elasticity" },
        ],
        result: {
          th: "ผิวแข็งแรงขึ้นจากภายใน",
          en: "Stronger skin from within",
        },
      },
      {
        icon: "🔥",
        name: { th: "ชั้นผิวลึก (Lifting Layer)", en: "Lifting Layer" },
        tagline: {
          th: "ยกกระชับและแก้ปัญหาที่ต้นเหตุ",
          en: "Lift and address the root cause",
        },
        points: [
          { th: "คลายพังผืดใต้หลุมสิว", en: "Release fibrous bands under scars" },
          { th: "ยกกระชับชั้นลึกของผิว", en: "Deep-layer skin lifting" },
          { th: "ปรับกรอบหน้าให้ดูได้รูปมากขึ้น", en: "Refine facial contour" },
        ],
        result: {
          th: "ใบหน้าดูยกกระชับโดยไม่ต้องผ่าตัด",
          en: "A lifted look without surgery",
        },
      },
      {
        icon: "🦴",
        name: { th: "ชั้นโครงสร้างใบหน้า (Foundation Layer)", en: "Foundation Layer" },
        tagline: {
          th: "เสริมฐานโครงหน้าให้สมดุล",
          en: "Strengthen and balance the facial foundation",
        },
        points: [
          { th: "ฟื้นฟูการรองรับของโครงหน้า", en: "Restore facial structural support" },
          { th: "ลดความหย่อนคล้อยจากการยุบตัวตามวัย", en: "Reduce sagging from age-related volume loss" },
          { th: "ทำให้ผลลัพธ์ดูเป็นธรรมชาติและอยู่ได้นานขึ้น", en: "Ensure natural-looking and longer-lasting results" },
        ],
        result: {
          th: "ความสวยที่เริ่มจาก \"โครงสร้างที่แข็งแรง\"",
          en: "Beauty that starts from \"a strong foundation\"",
        },
      },
    ],
  },
  technology: {
    label: { th: "เทคโนโลยี", en: "Technology Intelligence" },
    title: {
      th: "เราไม่ได้เลือกเครื่อง — เราเลือกพลังงานที่เหมาะกับชั้นผิว",
      en: "We don't choose machines — we choose the right energy for each skin layer",
    },
    subtitle: {
      th: "เทคโนโลยีของเราถูกจัดกลุ่มตามหน้าที่ต่อผิว ไม่ใช่ตามชื่อเครื่อง",
      en: "Our technologies are classified by skin function, not by device name",
    },
    categories: [
      {
        name: { th: "Surface Renewal", en: "Surface Renewal" },
        tagline: { th: "ฟื้นฟูผิวชั้นบน ปรับผิวเรียบ ลดหลุมสิว รูขุมขน", en: "Surface renewal & controlled skin regeneration" },
        devices: { th: "Erbium Glass • Thulium • CO₂ • Er:YAG", en: "Erbium Glass • Thulium • CO₂ • Er:YAG" },
        layer: { th: "Epidermis + Superficial Dermis", en: "Epidermis + Superficial Dermis" },
      },
      {
        name: { th: "Pigment Precision", en: "Pigment Precision" },
        tagline: { th: "ปรับสีผิว ลดจุดด่างดำ ฝ้า กระ เพิ่มความกระจ่างใส", en: "Precision pigment targeting technology" },
        devices: { th: "Picosecond Laser • Thulium", en: "Picosecond Laser • Thulium" },
        layer: { th: "Epidermis — Melanin Target", en: "Epidermis — Melanin Target" },
      },
      {
        name: { th: "Redness & Vascular Control", en: "Redness & Vascular Control" },
        tagline: { th: "ลดรอยแดง เส้นเลือดฝอย ควบคุมการอักเสบ", en: "Vascular balance & redness management" },
        devices: { th: "Long Pulse Nd:YAG • Long Pulse KTP", en: "Long Pulse Nd:YAG • Long Pulse KTP" },
        layer: { th: "Dermis — Hemoglobin Target", en: "Dermis — Hemoglobin Target" },
      },
      {
        name: { th: "Deep Skin Remodeling", en: "Deep Skin Remodeling" },
        tagline: { th: "รักษาหลุมสิวชั้นลึก กระตุ้น collagen remodeling", en: "Deep dermal regeneration technology" },
        devices: { th: "Microneedle RF (MNRF)", en: "Microneedle RF (MNRF)" },
        layer: { th: "Deep Dermis", en: "Deep Dermis" },
      },
      {
        name: { th: "Structural Lifting", en: "Structural Lifting" },
        tagline: { th: "ยกกระชับโครงสร้างผิว ชั้น SMAS และ Dermis", en: "Structural lifting & collagen tightening" },
        devices: { th: "MFU • Monopolar RF", en: "MFU • Monopolar RF" },
        layer: { th: "SMAS + Deep Dermis", en: "SMAS + Deep Dermis" },
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
  reviews: {
    label: { th: "รีวิวจากผู้ใช้บริการ", en: "Patient Reviews" },
    items: [
      {
        name: "Toei",
        avatar: "T",
        badge: "",
        text: {
          th: "ทำโปรแกรม doublo ยกกระชับ+สลายไขมัน เห็นผลชัดขนาดนี้ครั้งแรก! พนักงานดูแลดีมาก คุณหมอใจดี ถามตลอดว่าเจ็บมั้ย จะเป็นคลินิกประจำตลอดไป",
          en: "Had the Doublo lifting + fat reduction program. First time seeing such clear results! Staff was amazing, doctor was so kind. Will be my go-to clinic forever.",
        },
      },
      {
        name: "RUECHYY",
        avatar: "",
        badge: "Local Guide",
        text: {
          th: "เลเซอร์แม่นยำมาก เครื่องครบทุกความยาวคลื่น หมอเลือกสิ่งที่เหมาะกับผิวเรา อธิบายทุกขั้นตอนก่อนทำ ไม่มี downtime คุณภาพระดับโรงพยาบาลในราคาคลินิก",
          en: "Hospital-level laser quality with clear explanations and minimal downtime. The doctor chose exactly what was right for my skin. Truly comparable to top-tier hospitals.",
        },
      },
      {
        name: "Petra Bollhalder",
        avatar: "P",
        badge: "",
        text: {
          th: "คุณหมอและผู้ช่วยอธิบายทุกอย่างละเอียด เป็นมืออาชีพและอดทนมาก รู้สึกได้รับการดูแลเป็นอย่างดีตลอดการรักษา ตั้งตารอที่จะกลับมาอีก",
          en: "The doctor and assistant explained everything in detail, professional and patient. I felt well taken care of throughout the treatment. Can't wait to come back!",
        },
      },
      {
        name: "Jirawat Laosuphap",
        avatar: "",
        badge: "Local Guide",
        text: {
          th: "ไปครั้งแรกประทับใจมาก คุณหมอละเอียดสุด อธิบายเข้าใจง่าย แนะนำสิ่งที่เหมาะกับหน้าเรา มีบริการแถมหน้าด้วย ทีมงานดูแลดีมาก เดินทางง่าย ลงลิฟต์ไปชั้น B เจอเลย",
          en: "Impressed from the first visit! Doctor was thorough and explained everything clearly. Staff was wonderful. Easy to find — just take the lift to floor B.",
        },
      },
      {
        name: "เบญจภา พัน",
        avatar: "",
        badge: "",
        text: {
          th: "ประทับใจที่สุดในชีวิต คุณหมอวิเคราะห์ละเอียดและให้คำแนะนำดีมากๆ ตัวจริงสวยมากด้วย พนักงานน่ารักและ nice ทุกคนเลย แนะนำมากๆค่ะ",
          en: "Most impressive clinic experience ever. The doctor's analysis was detailed with great recommendations. Staff was lovely and nice. Highly recommended!",
        },
      },
      {
        name: "Chonruthai Khowto",
        avatar: "C",
        badge: "",
        text: {
          th: "ชอบที่คลินิกมีเครื่อง scan ผิว คุณหมอ communicate ได้เข้าใจง่ายดี informative มาก แนะนำเลยค่ะ มารอบ 2 แล้ว ไว้มาอีกแน่นอน",
          en: "Love the skin scanning device! The doctor communicates clearly and is very informative. Already came for a second visit, will definitely be back!",
        },
      },
      {
        name: "N G",
        avatar: "N",
        badge: "",
        text: {
          th: "พนักงานเป็นมืออาชีพมาก มีเลเซอร์หลายชนิดสำหรับปัญหาผิวต่างๆ รวมหลายการรักษาในเซสชันเดียวได้ ราคาสมเหตุสมผลกับคุณภาพ ให้ 100/10!",
          en: "Exceptionally professional staff. Wide range of laser machines with the option to combine treatments. Pricing is very reasonable for the quality. 100/10!",
        },
      },
      {
        name: "Nichapa Pipatthanapokin",
        avatar: "N",
        badge: "",
        text: {
          th: "ประทับใจเครื่องวิเคราะห์ผิว ทำให้ได้โปรแกรมที่เหมาะกับเรา ผู้เชี่ยวชาญอธิบายชัดเจนและปรับการรักษาตามความต้องการ ผลลัพธ์ดีมาก แนะนำเลย!",
          en: "Impressed with the innovative skin analysis machine for a personalized program. Experts explained everything clearly. Great results, highly recommended!",
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
