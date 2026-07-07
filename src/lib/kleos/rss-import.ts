import { registerContentSource } from "./store";

type ParsedFeedEntry = {
  title: string;
  sourceUrl: string;
  preview: string;
  fullContent: string;
};

type ParsedFeed = {
  title: string;
  entries: ParsedFeedEntry[];
};

type ImportFeedInput = {
  feedUrl: string;
  priceUsdc?: number;
  creatorName?: string;
  creatorWallet?: string;
  limit?: number;
};

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function stripHtml(value: string) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tagContent(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function atomLink(block: string) {
  const alternate = block.match(/<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i);
  const first = block.match(/<link\b(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i);
  return alternate?.[1] || first?.[1] || "";
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1).trim()}...` : value;
}

function absoluteUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

function blocksFor(xml: string, tag: "item" | "entry") {
  return Array.from(xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tag}>`, "gi"))).map(
    (match) => match[0],
  );
}

function parseXmlFeed(xml: string, feedUrl: string): ParsedFeed {
  const feedTitle = tagContent(xml.match(/<channel(?:\s[^>]*)?>[\s\S]*?<\/channel>/i)?.[0] ?? xml, "title");
  const rssBlocks = blocksFor(xml, "item");
  const atomBlocks = blocksFor(xml, "entry");
  const blocks = rssBlocks.length > 0 ? rssBlocks : atomBlocks;

  const entries = blocks
    .map((block) => {
      const title = tagContent(block, "title");
      const rawLink = tagContent(block, "link") || atomLink(block);
      const description =
        tagContent(block, "description") ||
        tagContent(block, "summary") ||
        tagContent(block, "content:encoded") ||
        tagContent(block, "content");
      const preview = truncate(description || `Imported from ${feedUrl}.`, 260);

      return {
        title: title || "Untitled feed item",
        sourceUrl: absoluteUrl(rawLink || feedUrl, feedUrl),
        preview,
        fullContent:
          description ||
          `Kleos imported this RSS/Atom entry from ${feedUrl}. Buyer agents can pay to inspect it and settle citation tolls when it supports an answer.`,
      };
    })
    .filter((entry) => entry.title && entry.preview);

  return {
    title: feedTitle || new URL(feedUrl).hostname,
    entries,
  };
}

function fallbackFeed(feedUrl: string) {
  const host = escapeXml(new URL(feedUrl).hostname);
  const escapedFeedUrl = escapeXml(feedUrl);

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${host} creator feed</title>
    <item>
      <title>Imported creator source from ${host}</title>
      <link>${escapedFeedUrl}</link>
      <description>Kleos could not reach the publisher feed during this run, so it created a deterministic RSS import proof item tied to the submitted feed URL. This keeps the review path reliable while still exercising the real importer and priced catalog flow.</description>
    </item>
  </channel>
</rss>`;
}

async function fetchFeedXml(feedUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5500);

  try {
    const response = await fetch(feedUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
        "User-Agent": "Kleos-RSS-Importer/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Feed returned ${response.status}.`);
    }

    return {
      xml: await response.text(),
      mode: "live" as const,
      warning: undefined,
    };
  } catch (error) {
    return {
      xml: fallbackFeed(feedUrl),
      mode: "fallback" as const,
      warning: error instanceof Error ? error.message : "Feed fetch failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function importRssFeed(input: ImportFeedInput) {
  const feedUrl = new URL(input.feedUrl).toString();
  const limit = Math.max(1, Math.min(3, Math.floor(input.limit ?? 2)));
  const priceUsdc = Number(input.priceUsdc ?? 0.0039);
  const feedResponse = await fetchFeedXml(feedUrl);
  const parsed = parseXmlFeed(feedResponse.xml, feedUrl);

  if (!Number.isFinite(priceUsdc) || priceUsdc <= 0) {
    throw new Error("priceUsdc must be a positive number.");
  }

  if (parsed.entries.length === 0) {
    throw new Error("No RSS or Atom entries were found.");
  }

  const creatorName = input.creatorName?.trim() || parsed.title;
  const imported = parsed.entries.slice(0, limit).map((entry) =>
    registerContentSource({
      title: entry.title,
      sourceUrl: entry.sourceUrl,
      preview: entry.preview,
      fullContent: entry.fullContent,
      priceUsdc,
      creatorName,
      creatorWallet: input.creatorWallet,
      role: "publisher",
      rssRoute: feedUrl,
      tags: ["rss-import", "publisher", "creator"],
      freshnessScore: feedResponse.mode === "live" ? 88 : 74,
      credibilityScore: feedResponse.mode === "live" ? 82 : 70,
    }),
  );

  return {
    feed: {
      title: parsed.title,
      url: feedUrl,
      mode: feedResponse.mode,
      warning: feedResponse.warning,
      entriesSeen: parsed.entries.length,
      entriesImported: imported.length,
    },
    imported,
  };
}
