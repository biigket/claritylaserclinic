import { useEffect } from "react";

interface SeoHeadOptions {
  title: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Manages SEO meta tags and JSON-LD in document <head>.
 * Cleans up on unmount so tags don't leak across routes.
 */
export const useSeoHead = (opts: SeoHeadOptions) => {
  useEffect(() => {
    const managedElements: HTMLElement[] = [];

    const setMeta = (attr: string, value: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      managedElements.push(el);
    };

    // Title
    document.title = opts.title;

    // Description
    if (opts.description) {
      setMeta("name", "description", opts.description);
    }

    // Canonical
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (opts.canonical) {
      if (!canonicalEl) {
        canonicalEl = document.createElement("link");
        canonicalEl.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute("href", opts.canonical);
      managedElements.push(canonicalEl);
    }

    // Robots
    if (opts.noindex) {
      setMeta("name", "robots", "noindex, nofollow");
    }

    // Open Graph
    setMeta("property", "og:title", opts.ogTitle || opts.title);
    setMeta("property", "og:type", opts.ogType || "website");
    if (opts.ogDescription || opts.description) {
      setMeta("property", "og:description", opts.ogDescription || opts.description!);
    }
    if (opts.ogImage) {
      setMeta("property", "og:image", opts.ogImage);
    }
    if (opts.canonical) {
      setMeta("property", "og:url", opts.canonical);
    }

    // Twitter
    setMeta("name", "twitter:title", opts.ogTitle || opts.title);
    if (opts.ogDescription || opts.description) {
      setMeta("name", "twitter:description", opts.ogDescription || opts.description!);
    }
    if (opts.ogImage) {
      setMeta("name", "twitter:image", opts.ogImage);
    }

    // JSON-LD
    const jsonLdScripts: HTMLScriptElement[] = [];
    if (opts.jsonLd) {
      const items = Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd];
      items.forEach((item) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(item);
        document.head.appendChild(script);
        jsonLdScripts.push(script);
      });
    }

    return () => {
      jsonLdScripts.forEach((s) => s.remove());
    };
  }, [opts.title, opts.description, opts.canonical, opts.ogImage, opts.noindex]);
};
