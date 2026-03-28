import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSeoHead } from "@/hooks/useSeoHead";
import Navbar from "@/components/clinic/Navbar";
import FooterSection from "@/components/clinic/FooterSection";
import ConsultationPopup from "@/components/clinic/ConsultationPopup";
import { Calendar, Eye, ArrowRight } from "lucide-react";

interface Article {
  id: string;
  slug: string;
  title_th: string;
  title_en: string | null;
  excerpt_th: string | null;
  excerpt_en: string | null;
  cover_image_url: string | null;
  tags: string[];
  published_at: string | null;
  view_count: number;
}

const BlogList = () => {
  const { lang, t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);

  useSeoHead({
    title: lang === "th"
      ? "บทความดูแลผิว & รักษาหลุมสิว | Clarity Laser Clinic"
      : "Skin Care & Acne Scar Articles | Clarity Laser Clinic",
    description: lang === "th"
      ? "รวมบทความความรู้ดูแลผิว รักษาหลุมสิว เลเซอร์ ฟิลเลอร์ โบท็อก จากแพทย์ผู้เชี่ยวชาญ Clarity Laser Clinic ราชเทวี กรุงเทพ"
      : "Expert articles on skin care, acne scar treatment, laser, filler & botox from Clarity Laser Clinic Bangkok",
    canonical: "https://claritylaserclinic.com/blog",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": lang === "th" ? "บทความดูแลผิว" : "Skin Care Articles",
      "url": "https://claritylaserclinic.com/blog",
      "isPartOf": { "@type": "WebSite", "name": "Clarity Laser & Aesthetic Clinic", "url": "https://claritylaserclinic.com" },
    },
  });

  useEffect(() => {
    const fetchArticles = async () => {
      const { data } = await supabase
        .from("blog_articles")
        .select("id, slug, title_th, title_en, excerpt_th, excerpt_en, cover_image_url, tags, published_at, view_count")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (data) setArticles(data);
      setLoading(false);
    };
    fetchArticles();
  }, [lang]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBook={() => setPopupOpen(true)} />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 section-padding bg-muted/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
            {lang === "th" ? "บทความ & ความรู้" : "Articles & Insights"}
          </p>
          <h1 className="font-display text-3xl md:text-5xl text-foreground mb-4">
            {lang === "th" ? "บทความดูแลผิว" : "Skin Care Articles"}
          </h1>
          <p className="font-body text-muted-foreground max-w-2xl mx-auto">
            {lang === "th"
              ? "ความรู้เกี่ยวกับการดูแลผิว รักษาหลุมสิว และเทคโนโลยีเลเซอร์ จากแพทย์ผู้เชี่ยวชาญ"
              : "Expert insights on skin care, acne scar treatment, and laser technology from our specialists"}
          </p>
        </div>
      </section>

      {/* Article Grid */}
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted h-48 rounded-sm mb-4" />
                  <div className="bg-muted h-6 w-3/4 rounded-sm mb-2" />
                  <div className="bg-muted h-4 w-full rounded-sm" />
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <p className="text-center text-muted-foreground font-body">
              {lang === "th" ? "ยังไม่มีบทความ" : "No articles yet"}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  to={`/blog/${article.slug}`}
                  className="group block"
                >
                  <article className="bg-card border border-border rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                    {/* Cover image */}
                    <div className="aspect-[16/9] bg-muted overflow-hidden">
                      {article.cover_image_url ? (
                        <img
                          src={article.cover_image_url}
                          alt={lang === "th" ? article.title_th : (article.title_en || article.title_th)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <span className="text-4xl">📝</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="font-body text-[10px] tracking-wider uppercase px-2 py-0.5 bg-accent text-accent-foreground rounded-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <h2 className="font-display text-lg text-foreground mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                        {lang === "th" ? article.title_th : (article.title_en || article.title_th)}
                      </h2>

                      <p className="font-body text-sm text-muted-foreground line-clamp-2 mb-4">
                        {lang === "th" ? article.excerpt_th : (article.excerpt_en || article.excerpt_th)}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(article.published_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {article.view_count}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all duration-300">
                          {lang === "th" ? "อ่าน" : "Read"}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <FooterSection />
      <ConsultationPopup open={popupOpen} onClose={() => setPopupOpen(false)} />
    </div>
  );
};

export default BlogList;
