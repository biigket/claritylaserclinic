
-- Create blog articles table
CREATE TABLE public.blog_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_th TEXT NOT NULL,
  title_en TEXT,
  excerpt_th TEXT,
  excerpt_en TEXT,
  content_th TEXT NOT NULL,
  content_en TEXT,
  cover_image_url TEXT,
  meta_title_th TEXT,
  meta_title_en TEXT,
  meta_description_th TEXT,
  meta_description_en TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  view_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles
CREATE POLICY "Anyone can read published articles"
ON public.blog_articles FOR SELECT
USING (status = 'published');

-- Admin/editor can manage articles
CREATE POLICY "Admins can manage articles"
ON public.blog_articles FOR ALL
TO authenticated
USING (public.is_admin_or_editor(auth.uid()))
WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_blog_articles_updated_at
BEFORE UPDATE ON public.blog_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample articles for SEO
INSERT INTO public.blog_articles (slug, title_th, title_en, excerpt_th, excerpt_en, content_th, content_en, tags, status, published_at, cover_image_url, meta_title_th, meta_description_th) VALUES
(
  'acne-scar-treatment-guide',
  'รักษาหลุมสิวด้วยเลเซอร์ — คู่มือฉบับสมบูรณ์ 2026',
  'Acne Scar Laser Treatment — Complete Guide 2026',
  'ทำความเข้าใจหลุมสิวแต่ละประเภท และวิธีรักษาด้วยเทคโนโลยีเลเซอร์ที่ได้ผลจริง',
  'Understanding different types of acne scars and effective laser treatments',
  E'## หลุมสิวคืออะไร?\n\nหลุมสิวเกิดจากการอักเสบของสิวที่ทำลายเนื้อเยื่อผิวหนังชั้นลึก ทำให้เกิดรอยบุ๋มหรือรอยนูนบนผิว\n\n## ประเภทของหลุมสิว\n\n### 1. Ice Pick Scar\nหลุมสิวแบบรูเข็ม มีลักษณะแคบและลึก เหมือนถูกเจาะด้วยเข็มน้ำแข็ง\n\n### 2. Boxcar Scar\nหลุมสิวแบบกล่อง มีลักษณะกว้างและตื้นกว่า Ice Pick ขอบค่อนข้างชัด\n\n### 3. Rolling Scar\nหลุมสิวแบบลอนคลื่น ผิวดูเป็นลอนไม่เรียบ\n\n## เทคโนโลยีเลเซอร์ที่ใช้รักษา\n\n### Fractional CO2 Laser\nเลเซอร์ที่ทำงานโดยสร้างจุดความร้อนขนาดเล็กลงไปในผิว กระตุ้นการสร้างคอลลาเจนใหม่\n\n### Pico Laser\nเลเซอร์พิโควินาที ทำงานเร็วมาก ลดความเจ็บและ downtime\n\n### DermaV\nเลเซอร์ที่ช่วยลดรอยแดงและกระตุ้นการฟื้นฟูผิว\n\n## ที่ Clarity Clinic\n\nเราใช้เทคนิค **Layered Treatment** รักษาหลุมสิวทุกชั้นผิวพร้อมกัน ด้วยโปรแกรม **Acne Scar Buffet** ที่รวมเทคโนโลยีหลายตัวไว้ในครั้งเดียว เริ่มต้น 9,990 บาท',
  'Complete guide content in English...',
  ARRAY['หลุมสิว', 'เลเซอร์', 'acne scar', 'laser treatment'],
  'published',
  now(),
  NULL,
  'รักษาหลุมสิวด้วยเลเซอร์ 2026 | Clarity Laser Clinic',
  'คู่มือรักษาหลุมสิวฉบับสมบูรณ์ เข้าใจหลุมสิวแต่ละแบบ และเทคโนโลยีเลเซอร์ที่ได้ผลจริง โดย Clarity Laser & Aesthetic Clinic'
),
(
  'filler-botox-difference',
  'ฟิลเลอร์ vs โบท็อก — ต่างกันอย่างไร เลือกอะไรดี?',
  'Filler vs Botox — What''s the Difference?',
  'เปรียบเทียบฟิลเลอร์กับโบท็อก ข้อดีข้อเสีย และวิธีเลือกให้เหมาะกับปัญหาของคุณ',
  'Comparing filler and botox treatments',
  E'## ฟิลเลอร์คืออะไร?\n\nฟิลเลอร์ (Dermal Filler) คือสารเติมเต็มที่ฉีดเข้าไปใต้ผิวหนัง เพื่อเพิ่มวอลุ่ม ลดริ้วรอย หรือปรับรูปหน้า\n\n## โบท็อกคืออะไร?\n\nโบท็อก (Botox) คือสารที่ช่วยคลายกล้ามเนื้อ ทำให้ริ้วรอยจากการเคลื่อนไหวของกล้ามเนื้อลดลง\n\n## ความแตกต่างหลัก\n\n| | ฟิลเลอร์ | โบท็อก |\n|---|---|---|\n| หลักการ | เติมเต็มวอลุ่ม | คลายกล้ามเนื้อ |\n| ใช้กับ | ร่องแก้ม ปาก คาง | หน้าผาก คิ้ว ตีนกา |\n| ผลลัพธ์ | 6-18 เดือน | 4-6 เดือน |\n\n## เลือกอะไรดี?\n\nขึ้นอยู่กับปัญหาที่ต้องการแก้ ปรึกษาแพทย์เพื่อวางแผนการรักษาที่เหมาะสม',
  'English content...',
  ARRAY['ฟิลเลอร์', 'โบท็อก', 'filler', 'botox'],
  'published',
  now(),
  NULL,
  'ฟิลเลอร์ vs โบท็อก ต่างกันอย่างไร | Clarity Clinic',
  'เปรียบเทียบฟิลเลอร์กับโบท็อก ข้อดีข้อเสีย วิธีเลือกให้ตรงจุด โดยแพทย์ผู้เชี่ยวชาญ Clarity Laser Clinic'
),
(
  'skin-care-after-laser',
  'ดูแลผิวหลังทำเลเซอร์อย่างไร ให้ผิวฟื้นเร็วสุด',
  'Post-Laser Skin Care Tips',
  'คำแนะนำดูแลผิวหลังทำเลเซอร์ เพื่อผลลัพธ์ที่ดีที่สุดและผิวฟื้นตัวเร็ว',
  'Post-laser skin care tips for best results',
  E'## ทำไมการดูแลหลังเลเซอร์ถึงสำคัญ?\n\nหลังทำเลเซอร์ ผิวอยู่ในช่วงฟื้นฟู การดูแลที่ถูกต้องจะช่วยให้ผลลัพธ์ดีขึ้นและลดผลข้างเคียง\n\n## สิ่งที่ควรทำ\n\n1. **ทากันแดด SPF50+** ทุกวัน แม้อยู่ในร่ม\n2. **ใช้มอยส์เจอไรเซอร์** ที่อ่อนโยน\n3. **ดื่มน้ำให้เพียงพอ** อย่างน้อย 2 ลิตรต่อวัน\n4. **นอนหลับให้เพียงพอ** 7-8 ชั่วโมง\n\n## สิ่งที่ควรหลีกเลี่ยง\n\n1. **ห้ามแกะสะเก็ด** ปล่อยให้หลุดเอง\n2. **หลีกเลี่ยงแสงแดดจัด** 2-4 สัปดาห์\n3. **ไม่ใช้สกินแคร์ที่มีกรด** (AHA, BHA, Retinol) 1-2 สัปดาห์\n4. **งดออกกำลังกายหนัก** 3-5 วัน',
  'English content...',
  ARRAY['ดูแลผิว', 'เลเซอร์', 'aftercare', 'laser'],
  'published',
  now(),
  NULL,
  'ดูแลผิวหลังทำเลเซอร์ ฟื้นเร็วสุด | Clarity Clinic',
  'วิธีดูแลผิวหลังทำเลเซอร์ให้ผิวฟื้นตัวเร็ว ผลลัพธ์ดีที่สุด คำแนะนำจากแพทย์ Clarity Laser Clinic'
);
