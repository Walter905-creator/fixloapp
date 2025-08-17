// client/src/components/Seo.jsx
import React from "react";
import { Helmet } from "react-helmet-async";
import { SITE_URL, DEFAULT_TITLE, DEFAULT_DESC } from "../seo/config";

function absolutize(pathOrUrl) {
  if (!pathOrUrl) return SITE_URL;
  try {
    // Already absolute?
    const u = new URL(pathOrUrl);
    return u.href;
  } catch {
    return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
  }
}

export default function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  path = "/",               // e.g. "/services/plumbing/miami"
  canonical,                // optionally override canonical URL
  noindex = false,          // keep false for indexable pages
  openGraph = {},
  twitter = {},
}) {
  const canonicalUrl = absolutize(canonical || path);
  const og = {
    url: canonicalUrl,
    title,
    description,
    ...openGraph,
  };
  const tw = {
    card: "summary_large_image",
    title,
    description,
    ...twitter,
  };

  return (
    <Helmet>
      {/* Primary */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Indexing */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={og.url} />
      <meta property="og:title" content={og.title} />
      <meta property="og:description" content={og.description} />
      {og.image && <meta property="og:image" content={absolutize(og.image)} />}

      {/* Twitter */}
      <meta name="twitter:card" content={tw.card} />
      <meta name="twitter:title" content={tw.title} />
      <meta name="twitter:description" content={tw.description} />
      {tw.image && <meta name="twitter:image" content={absolutize(tw.image)} />}
    </Helmet>
  );
}