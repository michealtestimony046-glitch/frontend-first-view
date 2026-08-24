const PUBLIC_SITE_ORIGIN = "https://matrixqa.trlabs.tech";

export function canonicalLink(pathname: string) {
  const url = new URL(pathname, PUBLIC_SITE_ORIGIN);
  url.search = "";
  url.hash = "";

  return {
    rel: "canonical" as const,
    href: url.toString(),
  };
}
