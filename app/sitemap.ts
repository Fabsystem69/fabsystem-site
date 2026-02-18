import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.fabsystem.fr";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/prestations`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/realisations`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/visio`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/a-propos`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
  ];
}