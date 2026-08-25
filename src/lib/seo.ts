const PUBLIC_SITE_ORIGIN = "https://matrixqa.trlabs.tech";
const DEFAULT_SOCIAL_IMAGE = `${PUBLIC_SITE_ORIGIN}/matrixqa-og-image.png`;

export function canonicalLink(pathname: string) {
  const url = new URL(pathname, PUBLIC_SITE_ORIGIN);
  url.search = "";
  url.hash = "";

  return {
    rel: "canonical" as const,
    href: url.toString(),
  };
}

type SeoHeadOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
};

export function seoHead({
  title,
  description,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
  imageAlt = "Matrix QA evidence-grade web quality assurance",
}: SeoHeadOptions) {
  const url = new URL(path, PUBLIC_SITE_ORIGIN).toString();

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:alt", content: imageAlt },
      { property: "og:image:type", content: "image/png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: imageAlt },
    ],
    links: [canonicalLink(path)],
  };
}
