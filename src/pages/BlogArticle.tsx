import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import Navbar from "@/components/clinic/Navbar";
import FooterSection from "@/components/clinic/FooterSection";
import ConsultationPopup from "@/components/clinic/ConsultationPopup";
import { ArrowLeft, Calendar, Eye, ArrowRight } from "lucide-react";

interface Article {
  id: string;
  slug: string;
  title_th: string;
  title_en: string | null;
  content_th: string;
  content_en: string | null;
  cover_image_url: string | null;
  tags: string[];
  published_at: string | null;
  view_count: number;
  meta_title_th: string | null;
  meta_title_en: string | null;
  meta_description_th: string | null;
  meta_description_en: string | null;
}

interface RelatedArticle {
  id: string;
  slug: string;
  title_th: string;
  title_en: string | null;
  cover_image_url: string | null;
  tags: string[];
  published_at: string | null;
}

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("blog_articles")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (data) {
        setArticle(data as Article);
        // Increment view count (fire and forget)
        supabase
          .from("blog_articles")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("slug", slug)
          .then(() => {});
        // Set page title
        const title = lang === "th"
          ? (data.meta_title_th || data.title_th)
          : (data.meta_title_en || data.title_en || data.title_th);
        document.title = title;

        // Fetch related articles (same tags, exclude current)
        const { data: related } = await supabase
          .from("blog_articles")
          .select("id, slug, title_th, title_en, cover_image_url, tags, published_at")
          .eq("status", "published")
          .neq("slug", slug)
          .order("published_at", { ascending: false })
          .limit(6);

        if (related) {
          // Sort by tag overlap
          const currentTags = data.tags || [];
          const scored = related.map((r: RelatedArticle) => ({
            ...r,
            score: (r.tags || []).filter((t: string) => currentTags.includes(t)).length,
          }));
          scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
          setRelatedArticles(scored.slice(0, 3));
        }
      }
      setLoading(false);
    };
    fetchArticle();
  }, [slug, lang]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: JSX.Element[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeaders: string[] = [];

    const flushTable = () => {
      if (tableHeaders.length > 0) {
        elements.push(
          <div key={`table-${elements.length}`} className="overflow-x-auto my-6">
            <table className="w-full border-collapse border border-border text-sm font-body">
              <thead>
                <tr>
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="border border-border bg-muted px-4 py-2 text-left text-foreground">
                      {h.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-border px-4 py-2 text-muted-foreground">
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      inTable = false;
      tableRows = [];
      tableHeaders = [];
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Table row
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const cells = trimmed.slice(1, -1).split("|");
        if (cells.every((c) => c.trim().match(/^-+$/))) {
          // separator row
          return;
        }
        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        flushTable();
      }

      if (trimmed === "") {
        elements.push(<div key={idx} className="h-4" />);
      } else if (trimmed.startsWith("### ")) {
        elements.push(
          <h3 key={idx} className="font-display text-xl text-foreground mt-8 mb-3">
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith("## ")) {
        elements.push(
          <h2 key={idx} className="font-display text-2xl text-foreground mt-10 mb-4">
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.match(/^\d+\.\s/)) {
        const text = trimmed.replace(/^\d+\.\s/, "");
        elements.push(
          <li key={idx} className="font-body text-muted-foreground ml-6 list-decimal mb-1">
            <span dangerouslySetInnerHTML={{ __html: formatInline(text) }} />
          </li>
        );
      } else {
        elements.push(
          <p key={idx} className="font-body text-muted-foreground leading-relaxed mb-2">
            <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
          </p>
        );
      }
    });

    if (inTable) flushTable();
    return elements;
  };

  const formatInline = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-medium">$1</strong>');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onBook={() => setPopupOpen(true)} />
        <div className="pt-28 section-padding max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="bg-muted h-8 w-3/4 rounded-sm" />
            <div className="bg-muted h-4 w-1/2 rounded-sm" />
            <div className="bg-muted h-64 rounded-sm mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onBook={() => setPopupOpen(true)} />
        <div className="pt-28 section-padding max-w-3xl mx-auto text-center">
          <h1 className="font-display text-2xl text-foreground mb-4">
            {lang === "th" ? "ไม่พบบทความ" : "Article Not Found"}
          </h1>
          <Link to="/blog" className="font-body text-primary hover:underline">
            {lang === "th" ? "← กลับหน้าบทความ" : "← Back to articles"}
          </Link>
        </div>
      </div>
    );
  }

  const title = lang === "th" ? article.title_th : (article.title_en || article.title_th);
  const content = lang === "th" ? article.content_th : (article.content_en || article.content_th);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBook={() => setPopupOpen(true)} />

      <article className="pt-28 pb-16 md:pt-36">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === "th" ? "บทความทั้งหมด" : "All articles"}
          </Link>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-body text-[10px] tracking-wider uppercase px-2 py-0.5 bg-accent text-accent-foreground rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4 leading-tight">
            {title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-body mb-8 pb-8 border-b border-border">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(article.published_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {article.view_count} {lang === "th" ? "ครั้ง" : "views"}
            </span>
          </div>

          {/* Cover */}
          {article.cover_image_url && (
            <div className="aspect-[16/9] rounded-sm overflow-hidden mb-10">
              <img
                src={article.cover_image_url}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose-clinic">
            {renderContent(content)}
          </div>

          {/* CTA */}
          <div className="mt-16 p-8 bg-muted/50 border border-border rounded-sm text-center">
            <p className="font-display text-xl text-foreground mb-2">
              {lang === "th" ? "สนใจปรึกษาแพทย์?" : "Interested in consultation?"}
            </p>
            <p className="font-body text-sm text-muted-foreground mb-6">
              {lang === "th"
                ? "พูดคุยกับแพทย์ผู้เชี่ยวชาญเพื่อวางแผนการรักษาที่เหมาะกับคุณ"
                : "Speak with our specialists to plan the right treatment for you"}
            </p>
            <button
              onClick={() => setPopupOpen(true)}
              className="font-body text-xs tracking-widest uppercase bg-primary text-primary-foreground px-8 py-3 hover:bg-primary/90 transition-colors duration-300"
            >
              {lang === "th" ? "นัดปรึกษาแพทย์" : "Book a Consultation"}
            </button>
          </div>

          {/* Internal Links - Related Articles */}
          {relatedArticles.length > 0 && (
            <nav className="mt-16" aria-label="Related articles">
              <h2 className="font-display text-2xl text-foreground mb-6">
                {lang === "th" ? "บทความที่เกี่ยวข้อง" : "Related Articles"}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    to={`/blog/${related.slug}`}
                    className="group block bg-card border border-border rounded-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="aspect-[16/9] bg-muted overflow-hidden">
                      {related.cover_image_url ? (
                        <img
                          src={related.cover_image_url}
                          alt={lang === "th" ? related.title_th : (related.title_en || related.title_th)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <span className="text-3xl">📝</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {related.tags && related.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {related.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="font-body text-[10px] tracking-wider uppercase px-2 py-0.5 bg-accent text-accent-foreground rounded-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 className="font-display text-sm text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 mb-2">
                        {lang === "th" ? related.title_th : (related.title_en || related.title_th)}
                      </h3>
                      <span className="inline-flex items-center gap-1 font-body text-xs text-primary group-hover:gap-2 transition-all duration-300">
                        {lang === "th" ? "อ่านต่อ" : "Read more"}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </nav>
          )}

          {/* Breadcrumb for SEO */}
          <nav className="mt-12 pt-6 border-t border-border" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 font-body text-xs text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  {lang === "th" ? "หน้าแรก" : "Home"}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition-colors">
                  {lang === "th" ? "บทความ" : "Blog"}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground truncate max-w-[200px]" aria-current="page">
                {title}
              </li>
            </ol>
          </nav>
        </div>
      </article>

      <FooterSection />
      <ConsultationPopup open={popupOpen} onClose={() => setPopupOpen(false)} />
    </div>
  );
};

export default BlogArticle;
