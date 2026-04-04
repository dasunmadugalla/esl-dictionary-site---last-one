import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { data: words } = await supabase
      .from("Words")
      .select("word")
      .order("word", { ascending: true });

    const staticPages = [
      { loc: "https://grasperr.com/",              changefreq: "daily",   priority: "1.0" },
      { loc: "https://grasperr.com/trending",       changefreq: "daily",   priority: "0.8" },
      { loc: "https://grasperr.com/word-of-the-day",changefreq: "daily",   priority: "0.8" },
      { loc: "https://grasperr.com/about",          changefreq: "monthly", priority: "0.5" },
      { loc: "https://grasperr.com/contact",        changefreq: "monthly", priority: "0.5" },
      { loc: "https://grasperr.com/policy",         changefreq: "monthly", priority: "0.3" },
    ];

    const wordEntries = (words || []).map(({ word }) => ({
      loc: `https://grasperr.com/word/${encodeURIComponent(word)}`,
      changefreq: "monthly",
      priority: "0.9",
    }));

    const allEntries = [...staticPages, ...wordEntries];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send("Failed to generate sitemap");
  }
});

export default router;
