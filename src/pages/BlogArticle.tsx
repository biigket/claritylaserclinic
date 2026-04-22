import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSeoHead } from "@/hooks/useSeoHead";
import Navbar from "@/components/clinic/Navbar";
import FooterSection from "@/components/clinic/FooterSection";
import ConsultationPopup from "@/components/clinic/ConsultationPopup";
import { ArrowLeft, Calendar, Eye, ArrowRight, Clock } from "lucide-react";

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
  updated_at: string | null;
  view_count: number;
  meta_title_th: string | null;
  meta_title_en: string | null;
  meta_description_th: string | null;
  meta_description_en: string | null;
  excerpt_th: string | null;
  excerpt_en: string | null;
  schema_jsonld?: any;
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

const formatInline = (text: string) => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary transition-colors">$1</a>');
};

const estimateReadingTime = (content: string, lang: string): string => {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return lang === "th" ? `อ่าน ${minutes} นาที` : `${minutes} min read`;
};

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
        supabase
          .from("blog_articles")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("slug", slug)
          .then(() => {});

        const { data: related } = await supabase
          .from("blog_articles")
          .select("id, slug, title_th, title_en, cover_image_url, tags, published_at")
          .eq("status", "published")
          .neq("slug", slug)
          .order("published_at", { ascending: false })
          .limit(6);

        if (related) {
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

  const renderContent = (content: string) => {
    // Split by section separators (---)
    const blocks = content.split(/\n---\n/);
    const elements: JSX.Element[] = [];

    blocks.forEach((block, blockIdx) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return;

      // TL;DR block
      if (trimmedBlock.startsWith("> **TL;DR**") || trimmedBlock.startsWith("> **TL;DR")) {
        const bullets = trimmedBlock
          .split("\n")
          .filter((l) => l.startsWith("- "))
          .map((l) => l.slice(2));
        if (bullets.length) {
          elements.push(
            <div key={`tldr-${blockIdx}`} className="bg-primary/5 border border-primary/20 rounded-xl p-5 md:p-6 my-6">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                {lang === "th" ? "สรุปสั้นๆ" : "Quick Summary"}
              </p>
              <ul className="space-y-2">
                {bullets.map((b, i) => (
                  <li key={i} className="text-sm leading-relaxed flex gap-2.5">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span dangerouslySetInnerHTML={{ __html: formatInline(b) }} />
                  </li>
                ))}
              </ul>
            </div>
          );
          return;
        }
      }

      // Author bio block (italic text)
      if (trimmedBlock.startsWith("*เกี่ยวกับ") || trimmedBlock.startsWith("*About") || (trimmedBlock.startsWith("*") && trimmedBlock.endsWith("*") && !trimmedBlock.includes("\n"))) {
        const bioText = trimmedBlock.replace(/^\*|\*$/g, "");
        elements.push(
          <div key={`bio-${blockIdx}`} className="border-l-4 border-primary/30 pl-4 md:pl-5 py-3 bg-primary/5 rounded-r-lg my-6">
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              <span dangerouslySetInnerHTML={{ __html: formatInline(bioText) }} />
            </p>
          </div>
        );
        return;
      }

      // Render line by line within the block
      const lines = trimmedBlock.split("\n");
      let i = 0;

      while (i < lines.length) {
        const line = lines[i].trim();

        if (line === "") {
          i++;
          continue;
        }

        // Blockquote / Expert quote
        if (line.startsWith("> ")) {
          const quoteLines: string[] = [];
          while (i < lines.length && lines[i].trim().startsWith("> ")) {
            quoteLines.push(lines[i].trim().slice(2));
            i++;
          }
          const quoteText = quoteLines.join("\n");
          const attrMatch = quoteText.match(/— \*(.+?)\*/);
          const mainQuote = quoteText.replace(/\n?— \*.+?\*/, "").replace(/^"|"$/g, "").trim();

          elements.push(
            <blockquote key={`q-${blockIdx}-${i}`} className="border-l-4 border-primary/40 pl-4 md:pl-5 py-3 my-6 bg-muted/30 rounded-r-lg">
              <p className="text-sm italic text-foreground/80 leading-relaxed">
                "{mainQuote}"
              </p>
              {attrMatch && (
                <cite className="block text-xs text-muted-foreground not-italic mt-2">— {attrMatch[1]}</cite>
              )}
            </blockquote>
          );
          continue;
        }

        // H2 heading
        if (line.startsWith("## ")) {
          const headingText = line.slice(3);

          // Check for special sections
          if (headingText.includes("สรุปสำคัญ") || headingText.includes("Key Takeaways")) {
            // Collect takeaway bullets
            i++;
            const bullets: string[] = [];
            while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim() === "")) {
              if (lines[i].trim().startsWith("- ")) {
                bullets.push(lines[i].trim().slice(2));
              }
              i++;
            }
            if (bullets.length) {
              elements.push(
                <div key={`takeaways-${blockIdx}-${i}`} className="bg-green-500/5 border border-green-500/20 rounded-xl p-5 md:p-6 my-8">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-3">
                    {lang === "th" ? "สรุปสำคัญ" : "Key Takeaways"}
                  </p>
                  <ul className="space-y-2">
                    {bullets.map((b, bi) => (
                      <li key={bi} className="text-sm flex gap-2.5">
                        <span className="shrink-0">✅</span>
                        <span dangerouslySetInnerHTML={{ __html: formatInline(b) }} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            continue;
          }

          if (headingText.includes("คำถามที่พบบ่อย") || headingText.includes("FAQ")) {
            // Collect FAQ items
            i++;
            const faqItems: { q: string; a: string }[] = [];
            let currentQ = "";
            let currentA = "";

            while (i < lines.length && !lines[i].trim().startsWith("## ")) {
              const faqLine = lines[i].trim();
              if (faqLine.startsWith("**") && faqLine.endsWith("**")) {
                if (currentQ) faqItems.push({ q: currentQ, a: currentA.trim() });
                currentQ = faqLine.slice(2, -2);
                currentA = "";
              } else if (faqLine !== "" && currentQ) {
                currentA += (currentA ? " " : "") + faqLine;
              }
              i++;
            }
            if (currentQ) faqItems.push({ q: currentQ, a: currentA.trim() });

            if (faqItems.length) {
              elements.push(
                <div key={`faq-${blockIdx}`} className="my-8 space-y-3">
                  <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">
                    {lang === "th" ? "คำถามที่พบบ่อย" : "FAQ"}
                  </h2>
                  {faqItems.map((f, fi) => (
                    <div key={fi} className="border border-border rounded-lg p-4 hover:border-primary/20 transition-colors">
                      <p className="text-sm font-semibold text-foreground mb-1.5">
                        <span dangerouslySetInnerHTML={{ __html: formatInline(f.q) }} />
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        <span dangerouslySetInnerHTML={{ __html: formatInline(f.a) }} />
                      </p>
                    </div>
                  ))}
                </div>
              );
            }
            continue;
          }

          if (headingText.includes("บทความที่เกี่ยวข้อง") || headingText.includes("Related")) {
            // Collect related links
            i++;
            const links: { title: string; desc: string; href?: string }[] = [];
            while (i < lines.length && !lines[i].trim().startsWith("## ")) {
              const rLine = lines[i].trim();
              if (rLine.startsWith("→")) {
                const linkMatch = rLine.match(/→\s*\[(.+?)\]\((.+?)\)\s*—\s*(.*)/);
                const boldMatch = rLine.match(/→\s*\*\*(.+?)\*\*\s*—\s*(.*)/);
                if (linkMatch) {
                  links.push({ title: linkMatch[1], href: linkMatch[2], desc: linkMatch[3] });
                } else if (boldMatch) {
                  links.push({ title: boldMatch[1], desc: boldMatch[2] });
                }
              }
              i++;
            }
            if (links.length) {
              elements.push(
                <div key={`related-inline-${blockIdx}`} className="my-8 space-y-3">
                  <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">
                    {lang === "th" ? "บทความที่เกี่ยวข้อง" : "Related Articles"}
                  </h2>
                  {links.map((l, li) => (
                    <div key={li} className="border border-border rounded-lg p-4 hover:border-primary/20 transition-colors">
                      {l.href ? (
                        <Link to={l.href} className="text-sm font-medium text-primary hover:underline">
                          → {l.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-foreground">→ {l.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">{l.desc}</p>
                    </div>
                  ))}
                </div>
              );
            }
            continue;
          }

          // Normal H2
          elements.push(
            <h2 key={`h2-${blockIdx}-${i}`} className="font-display text-xl md:text-2xl text-foreground mt-10 mb-4">
              {headingText}
            </h2>
          );
          i++;
          continue;
        }

        // H3 heading
        if (line.startsWith("### ")) {
          elements.push(
            <h3 key={`h3-${blockIdx}-${i}`} className="font-display text-lg md:text-xl text-foreground mt-8 mb-3">
              {line.slice(4)}
            </h3>
          );
          i++;
          continue;
        }

        // Table
        if (line.startsWith("|") && line.endsWith("|")) {
          const tableLines: string[] = [];
          while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
            tableLines.push(lines[i].trim());
            i++;
          }
          if (tableLines.length >= 2) {
            const headers = tableLines[0].slice(1, -1).split("|").map((c) => c.trim());
            const rows = tableLines
              .slice(1)
              .filter((l) => !l.match(/^\|[\s-|]+\|$/))
              .map((l) => l.slice(1, -1).split("|").map((c) => c.trim()));

            elements.push(
              <div key={`table-${blockIdx}-${i}`} className="overflow-x-auto my-6 rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      {headers.map((h, hi) => (
                        <th key={hi} className="px-4 py-2.5 text-left text-foreground font-medium border-b border-border">
                          <span dangerouslySetInnerHTML={{ __html: formatInline(h) }} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-2.5 text-muted-foreground">
                            <span dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          continue;
        }

        // Bullet list
        if (line.startsWith("- ")) {
          const bullets: string[] = [];
          while (i < lines.length && lines[i].trim().startsWith("- ")) {
            bullets.push(lines[i].trim().slice(2));
            i++;
          }
          elements.push(
            <ul key={`ul-${blockIdx}-${i}`} className="space-y-1.5 my-3 ml-1">
              {bullets.map((b, bi) => (
                <li key={bi} className="text-sm text-muted-foreground leading-relaxed flex gap-2.5">
                  <span className="text-primary/60 mt-0.5 shrink-0">•</span>
                  <span dangerouslySetInnerHTML={{ __html: formatInline(b) }} />
                </li>
              ))}
            </ul>
          );
          continue;
        }

        // Numbered list
        if (line.match(/^\d+\.\s/)) {
          const items: string[] = [];
          while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
            items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
            i++;
          }
          elements.push(
            <ol key={`ol-${blockIdx}-${i}`} className="space-y-1.5 my-3 ml-1 list-decimal list-inside">
              {items.map((item, ii) => (
                <li key={ii} className="text-sm text-muted-foreground leading-relaxed">
                  <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
                </li>
              ))}
            </ol>
          );
          continue;
        }

        // Standalone image: ![alt](url)
        const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
        if (imgMatch) {
          const alt = imgMatch[1];
          const src = imgMatch[2];
          // Optional caption on next non-empty line: *caption*
          let caption = "";
          let j = i + 1;
          while (j < lines.length && lines[j].trim() === "") j++;
          const next = j < lines.length ? lines[j].trim() : "";
          const capMatch = next.match(/^\*([^*].*?)\*$/);
          if (capMatch) {
            caption = capMatch[1];
            i = j + 1;
          } else {
            i++;
          }
          elements.push(
            <figure key={`img-${blockIdx}-${i}`} className="my-6">
              <img
                src={src}
                alt={alt}
                loading="lazy"
                className="border border-border bg-card"
                style={{ maxWidth: "100%", height: "auto", borderRadius: "16px", display: "block", margin: "0 auto" }}
              />
              {caption && (
                <figcaption className="mt-2 text-xs text-muted-foreground text-center italic">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
          continue;
        }

        // Regular paragraph
        elements.push(
          <p key={`p-${blockIdx}-${i}`} className="text-sm text-muted-foreground leading-relaxed mb-3">
            <span dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          </p>
        );
        i++;
      }
    });

    return elements;
  };

  const title = article ? (lang === "th" ? article.title_th : (article.title_en || article.title_th)) : "";
  const content = article ? (lang === "th" ? article.content_th : (article.content_en || article.content_th)) : "";
  const metaDesc = article ? (lang === "th" ? (article.meta_description_th || "") : (article.meta_description_en || article.meta_description_th || "")) : "";
  const canonicalUrl = `https://claritylaserclinic.com/blog/${slug || ""}`;

  const jsonLdData = useMemo(() => {
    if (!article) return undefined;
    return [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": metaDesc,
        "image": article.cover_image_url || undefined,
        "datePublished": article.published_at || undefined,
        "dateModified": article.updated_at || article.published_at || undefined,
        "author": {
          "@type": "Person",
          "name": "นพ.ฐิติคมน์",
          "jobTitle": "แพทย์ผู้เชี่ยวชาญด้านผิวหนังและเลเซอร์",
          "worksFor": { "@type": "Organization", "name": "Clarity Laser & Aesthetic Clinic" },
        },
        "publisher": {
          "@type": "Organization",
          "name": "Clarity Laser & Aesthetic Clinic",
          "url": "https://claritylaserclinic.com",
          "logo": { "@type": "ImageObject", "url": "https://claritylaserclinic.com/favicon.jpeg" },
        },
        "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
        "keywords": (article.tags || []).join(", "),
        "inLanguage": lang === "th" ? "th-TH" : "en-US",
        "isPartOf": { "@type": "WebSite", "name": "Clarity Laser & Aesthetic Clinic", "url": "https://claritylaserclinic.com" },
      },
      ...(article.cover_image_url ? [{
        "@context": "https://schema.org",
        "@type": "ImageObject",
        "contentUrl": article.cover_image_url,
        "description": metaDesc || title,
        "name": title,
      }] : []),
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": lang === "th" ? "หน้าแรก" : "Home", "item": "https://claritylaserclinic.com/" },
          { "@type": "ListItem", "position": 2, "name": lang === "th" ? "บทความ" : "Blog", "item": "https://claritylaserclinic.com/blog" },
          { "@type": "ListItem", "position": 3, "name": title, "item": canonicalUrl },
        ],
      },
    ];
  }, [article, lang, title, metaDesc, canonicalUrl]);

  useSeoHead({
    title: article ? (lang === "th" ? (article.meta_title_th || article.title_th) : (article.meta_title_en || article.title_en || article.title_th)) : "Loading...",
    description: metaDesc || undefined,
    canonical: canonicalUrl,
    ogType: "article",
    ogImage: article?.cover_image_url || undefined,
    jsonLd: jsonLdData,
  });

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
          <Link to="/blog" className="text-primary hover:underline">
            {lang === "th" ? "← กลับหน้าบทความ" : "← Back to articles"}
          </Link>
        </div>
      </div>
    );
  }

  const readingTime = estimateReadingTime(content, lang);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onBook={() => setPopupOpen(true)} />

      <article className="pt-28 pb-16 md:pt-36">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === "th" ? "บทความทั้งหมด" : "All articles"}
          </Link>

          {/* Cover */}
          {article.cover_image_url && (
            <div className="aspect-[16/7] rounded-xl overflow-hidden mb-8">
              <img
                src={article.cover_image_url}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Tags + Reading time */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex flex-wrap gap-2">
              {article.tags?.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] tracking-wider uppercase px-2.5 py-0.5 bg-accent text-accent-foreground rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {readingTime}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl md:text-4xl text-foreground mb-4 leading-tight" style={{ fontFamily: "'Georgia', 'Sarabun', serif" }}>
            {title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8 pb-6 border-b border-border">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(article.published_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {article.view_count.toLocaleString()} {lang === "th" ? "ครั้ง" : "views"}
            </span>
          </div>

          {/* Article body with Canvas-style rendering */}
          <div style={{ fontFamily: "'Georgia', 'Sarabun', serif" }}>
            {renderContent(content)}
          </div>

          {/* CTA */}
          <div className="mt-16 p-8 bg-primary/5 border border-primary/20 rounded-xl text-center">
            <p className="font-display text-xl text-foreground mb-2">
              {lang === "th" ? "สนใจปรึกษาแพทย์?" : "Interested in consultation?"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {lang === "th"
                ? "พูดคุยกับแพทย์ผู้เชี่ยวชาญเพื่อวางแผนการรักษาที่เหมาะกับคุณ"
                : "Speak with our specialists to plan the right treatment for you"}
            </p>
            <button
              onClick={() => setPopupOpen(true)}
              className="text-xs tracking-widest uppercase bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-300"
            >
              {lang === "th" ? "นัดปรึกษาแพทย์" : "Book a Consultation"}
            </button>
          </div>

          {/* Related Articles from DB */}
          {relatedArticles.length > 0 && (
            <nav className="mt-16" aria-label="Related articles">
              <h2 className="font-display text-2xl text-foreground mb-6">
                {lang === "th" ? "อ่านเพิ่มเติม" : "Read More"}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    to={`/blog/${related.slug}`}
                    className="group block bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-300"
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
                      <h3 className="font-display text-sm text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2 mb-2">
                        {lang === "th" ? related.title_th : (related.title_en || related.title_th)}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs text-primary group-hover:gap-2 transition-all duration-300">
                        {lang === "th" ? "อ่านต่อ" : "Read more"}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </nav>
          )}

          {/* Breadcrumb */}
          <nav className="mt-12 pt-6 border-t border-border" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">{lang === "th" ? "หน้าแรก" : "Home"}</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to="/blog" className="hover:text-foreground transition-colors">{lang === "th" ? "บทความ" : "Blog"}</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground truncate max-w-[200px]" aria-current="page">{title}</li>
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
