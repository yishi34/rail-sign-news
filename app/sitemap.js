import categories from "../data/categories.json";

export const dynamic = "force-static";

const BASE_URL = "https://rail-sign-news.vercel.app";

export default function sitemap() {
  const now = new Date();
  const staticPaths = [
    "",
    "/yanaka",
    "/yanaka/national-map",
    "/yanaka/metro-map",
    "/yanaka/map-3d",
    "/yanaka/routemap",
    "/yanaka/limited-express",
    "/yanaka/timetable",
    "/yanaka/history",
    "/yanaka/trains",
    "/yanaka/routemap-maker",
  ];

  const entries = staticPaths.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" || path === "/yanaka" || path === "/yanaka/national-map" ? 1.0 : 0.8,
  }));

  for (const cat of categories) {
    entries.push({
      url: `${BASE_URL}/category/${cat.id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  return entries;
}
