const PUBLIC_SITE_ORIGIN = "https://matrixqa.trlabs.tech";
const DEFAULT_SOCIAL_IMAGE = `${PUBLIC_SITE_ORIGIN}/matrixqa-og-image.png`;
const ORGANIZATION_ID = `${PUBLIC_SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${PUBLIC_SITE_ORIGIN}/#website`;
const PRODUCT_ID = `${PUBLIC_SITE_ORIGIN}/#matrix-qa`;

export function canonicalLink(pathname: string) {
  const url = new URL(pathname, PUBLIC_SITE_ORIGIN);
  url.search = "";
  url.hash = "";

  return {
    rel: "canonical" as const,
    href: url.toString(),
  };
}

export type SeoFaqItem = {
  question: string;
  answer: string;
};

type SeoHeadOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  breadcrumbLabel?: string;
  faqItems?: SeoFaqItem[];
};

function structuredData({
  title,
  description,
  path,
  breadcrumbLabel,
  faqItems,
}: Pick<SeoHeadOptions, "title" | "description" | "path" | "breadcrumbLabel" | "faqItems">) {
  const url = new URL(path, PUBLIC_SITE_ORIGIN).toString();
  const pageId = `${url}#webpage`;
  const breadcrumbId = `${url}#breadcrumb`;
  const label = breadcrumbLabel ?? (path === "/" ? "Home" : title.split("|")[0].trim());

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "Tr Labs",
      url: PUBLIC_SITE_ORIGIN,
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: "Matrix QA",
      url: PUBLIC_SITE_ORIGIN,
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@type": "SoftwareApplication",
      "@id": PRODUCT_ID,
      name: "Matrix QA",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: PUBLIC_SITE_ORIGIN,
      description:
        "Evidence-grade browser quality assurance for authorized web journeys and human investigation.",
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@type": "WebPage",
      "@id": pageId,
      url,
      name: title,
      description,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PRODUCT_ID },
      mainEntity: { "@id": PRODUCT_ID },
      breadcrumb: { "@id": breadcrumbId },
    },
    {
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: PUBLIC_SITE_ORIGIN,
        },
        ...(path === "/"
          ? []
          : [
              {
                "@type": "ListItem",
                position: 2,
                name: label,
                item: url,
              },
            ]),
      ],
    },
  ];

  if (faqItems && faqItems.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      url,
      mainEntity: faqItems.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function seoHead({
  title,
  description,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
  imageAlt = "Matrix QA evidence-grade web quality assurance",
  breadcrumbLabel,
  faqItems,
}: SeoHeadOptions) {
  const url = new URL(path, PUBLIC_SITE_ORIGIN).toString();

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "author", content: "Tr Labs" },
      { property: "og:site_name", content: "Matrix QA" },
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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          structuredData({ title, description, path, breadcrumbLabel, faqItems }),
        ),
      },
    ],
  };
}
