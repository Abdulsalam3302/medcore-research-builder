/**
 * Optional web search via Tavily (preferred) or SerpAPI.
 * Returns simple hits to be shown separately from scholarly sources.
 */

export type WebHit = {
  title: string;
  url: string;
  snippet?: string;
  source: "tavily" | "serpapi";
};

export function webSearchConfigured(): "tavily" | "serpapi" | null {
  if (process.env.TAVILY_API_KEY) return "tavily";
  if (process.env.SERPAPI_API_KEY) return "serpapi";
  return null;
}

export async function webSearch(query: string, max = 10): Promise<WebHit[]> {
  const provider = webSearchConfigured();
  if (!provider) return [];
  if (provider === "tavily") {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: max,
        search_depth: "basic",
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: Array<{ title: string; url: string; content?: string }> };
    return (data.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      source: "tavily",
    }));
  }
  // SerpAPI
  const p = new URLSearchParams();
  p.set("q", query);
  p.set("api_key", process.env.SERPAPI_API_KEY!);
  p.set("engine", "google");
  p.set("num", String(max));
  const res = await fetch(`https://serpapi.com/search.json?${p.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { organic_results?: Array<{ title: string; link: string; snippet?: string }> };
  return (data.organic_results || []).slice(0, max).map((r) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet,
    source: "serpapi",
  }));
}
