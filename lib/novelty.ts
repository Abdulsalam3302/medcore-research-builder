import type { NoveltyReport, SimilarPaper, TitleInputs } from "./types";
import { pubmedSearchAndSummarize } from "./scholarly/pubmed";
import { crossrefSearch } from "./scholarly/crossref";
import { openalexSearch } from "./scholarly/openalex";
import { webSearch, webSearchConfigured } from "./scholarly/websearch";
import { jaccard } from "./references/verify";

function normalize(s: string): string {
  return s
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildQueries(inputs: TitleInputs): {
  exact: string;
  normalized: string;
  pico: string;
  designLine: string;
} {
  const title = (inputs.draftTitle || "").trim();
  const exact = title;
  const normalized = normalize(title);
  const picoTerms = [
    inputs.population,
    inputs.problem,
    inputs.intervention,
    inputs.comparator,
    inputs.outcome,
    inputs.design,
  ]
    .filter(Boolean)
    .join(" ");
  const designLine = [
    inputs.problem,
    inputs.intervention,
    inputs.outcome,
    inputs.design,
  ]
    .filter(Boolean)
    .join(" ");
  return { exact, normalized, pico: picoTerms, designLine };
}

export async function runNoveltyCheck(args: {
  inputs: TitleInputs;
}): Promise<NoveltyReport> {
  const queries = buildQueries(args.inputs);
  const used: NoveltyReport["queriesUsed"] = [];
  const exactMatches: SimilarPaper[] = [];
  const similar: SimilarPaper[] = [];

  const title = (args.inputs.draftTitle || "").trim();
  if (!title) {
    return {
      risk: "low_duplicate_risk",
      exactMatches: [],
      similar: [],
      queriesUsed: [],
      gapsRemaining: ["No draft title supplied — nothing to compare."],
      refinementSuggestions: ["Provide a draft title to run a similarity search."],
      disclaimer:
        "This is not proof of absolute uniqueness — only an evidence-based similarity scan.",
    };
  }

  // PubMed — exact title
  try {
    const exactQuery = `"${title}"[Title]`;
    used.push({ source: "pubmed", query: exactQuery });
    const exact = await pubmedSearchAndSummarize({ query: exactQuery, retmax: 5 });
    for (const e of exact) {
      exactMatches.push({
        title: e.title,
        authors: e.authors,
        journal: e.journal,
        year: e.year,
        pmid: e.pmid,
        doi: e.doi,
        url: e.url,
        source: "pubmed",
        similarity: "exact",
        whySimilar: "Exact title match in PubMed.",
      });
    }
  } catch {
    /* swallow */
  }

  // PubMed — PICO terms
  if (queries.pico) {
    try {
      used.push({ source: "pubmed", query: queries.pico });
      const r = await pubmedSearchAndSummarize({ query: queries.pico, retmax: 15 });
      for (const e of r) {
        if (exactMatches.find((x) => x.pmid === e.pmid)) continue;
        const sim = jaccard(e.title, title);
        if (sim >= 0.7) {
          similar.push({
            title: e.title,
            authors: e.authors,
            journal: e.journal,
            year: e.year,
            pmid: e.pmid,
            doi: e.doi,
            url: e.url,
            source: "pubmed",
            similarity: "near",
            whySimilar: `High title-keyword overlap (${Math.round(sim * 100)}%).`,
          });
        } else if (sim >= 0.35) {
          similar.push({
            title: e.title,
            authors: e.authors,
            journal: e.journal,
            year: e.year,
            pmid: e.pmid,
            doi: e.doi,
            url: e.url,
            source: "pubmed",
            similarity: "keyword",
            whySimilar: `Shared PICO-style keywords (${Math.round(sim * 100)}% overlap).`,
          });
        }
      }
    } catch {
      /* swallow */
    }
  }

  // Crossref bibliographic
  try {
    used.push({ source: "crossref", query: title });
    const cr = await crossrefSearch({ bibliographic: title, rows: 15 });
    for (const w of cr) {
      const sim = jaccard(w.title, title);
      const isExact = normalize(w.title) === queries.normalized;
      if (isExact) {
        if (!exactMatches.find((x) => x.doi === w.doi)) {
          exactMatches.push({
            title: w.title,
            authors: w.authors,
            journal: w.journal,
            year: w.year,
            doi: w.doi,
            url: w.url,
            source: "crossref",
            similarity: "exact",
            whySimilar: "Exact title match in Crossref.",
          });
        }
        continue;
      }
      if (sim >= 0.5) {
        if (!similar.find((x) => x.doi === w.doi && x.doi)) {
          similar.push({
            title: w.title,
            authors: w.authors,
            journal: w.journal,
            year: w.year,
            doi: w.doi,
            url: w.url,
            source: "crossref",
            similarity: sim >= 0.7 ? "near" : "keyword",
            whySimilar: `Crossref title overlap (${Math.round(sim * 100)}%).`,
          });
        }
      }
    }
  } catch {
    /* swallow */
  }

  // OpenAlex
  try {
    used.push({ source: "openalex", query: title });
    const oa = await openalexSearch({ query: title, perPage: 15 });
    for (const w of oa) {
      const sim = jaccard(w.title, title);
      const isExact = normalize(w.title) === queries.normalized;
      if (isExact) {
        if (
          !exactMatches.find(
            (x) =>
              (x.doi && w.doi && x.doi.toLowerCase() === w.doi.toLowerCase()) ||
              x.pmid === w.pmid
          )
        ) {
          exactMatches.push({
            title: w.title,
            authors: w.authors,
            journal: w.journal,
            year: w.year,
            doi: w.doi,
            pmid: w.pmid,
            url: w.url,
            source: "openalex",
            similarity: "exact",
            whySimilar: "Exact title match in OpenAlex.",
          });
        }
        continue;
      }
      if (sim >= 0.5) {
        if (
          !similar.find(
            (x) =>
              (x.doi && w.doi && x.doi.toLowerCase() === w.doi.toLowerCase()) ||
              x.pmid === w.pmid
          )
        ) {
          similar.push({
            title: w.title,
            authors: w.authors,
            journal: w.journal,
            year: w.year,
            doi: w.doi,
            pmid: w.pmid,
            url: w.url,
            source: "openalex",
            similarity: sim >= 0.7 ? "near" : "keyword",
            whySimilar: `OpenAlex title overlap (${Math.round(sim * 100)}%).`,
          });
        }
      }
    }
  } catch {
    /* swallow */
  }

  // Optional web search
  if (webSearchConfigured()) {
    try {
      used.push({ source: "web", query: `"${title}"` });
      const w = await webSearch(`"${title}"`, 8);
      for (const hit of w) {
        similar.push({
          title: hit.title,
          url: hit.url,
          source: "web",
          similarity: "keyword",
          whySimilar: `Web search hit: ${hit.snippet || hit.url}`,
        });
      }
    } catch {
      /* swallow */
    }
  }

  // Determine risk
  let risk: NoveltyReport["risk"] = "low_duplicate_risk";
  if (exactMatches.length > 0) risk = "exact_or_near_exact_match";
  else if (similar.filter((s) => s.similarity === "near").length >= 2)
    risk = "high_duplicate_risk";
  else if (similar.length >= 3) risk = "moderate_similarity_risk";

  // Refinement suggestions
  const refinements: string[] = [];
  if (risk !== "low_duplicate_risk") {
    refinements.push(
      "Consider narrowing the population (e.g., age range, comorbidity, region) to differentiate from similar work."
    );
    refinements.push(
      "Consider specifying the comparator or sub-outcome more precisely."
    );
    refinements.push(
      "If your study adds external validation, methodological refinement, or new context (setting, time period), state that in the title."
    );
  }
  const gaps: string[] = [];
  if (similar.length === 0) {
    gaps.push(
      "No similar studies were located, but databases are incomplete — phrase claims modestly."
    );
  }

  return {
    risk,
    exactMatches,
    similar: similar.slice(0, 40),
    queriesUsed: used,
    gapsRemaining: gaps,
    refinementSuggestions: refinements,
    disclaimer:
      "This is an evidence-based similarity scan across PubMed, Crossref, OpenAlex" +
      (webSearchConfigured() ? " and web search" : "") +
      ". It is NOT a guarantee of absolute uniqueness. Indexing lags, paywalls, and language coverage limit completeness.",
  };
}
