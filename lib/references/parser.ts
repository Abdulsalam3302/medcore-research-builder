import type { ParsedReference } from "../types";

/**
 * Split raw reference text into individual references.
 * Strategy:
 * 1. Numbered entries: "1." or "[1]" at the start of a line.
 * 2. Otherwise blank-line separated blocks.
 * 3. Otherwise one reference per line (treat each line as a separate ref).
 */
export function splitReferenceBlocks(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  const text = raw.replace(/\r\n/g, "\n").trim();

  // Numbered list "1. ...", "(1) ...", "[1] ..."
  const numberedRe = /(?:^|\n)\s*(?:\[(\d{1,4})\]|\((\d{1,4})\)|(\d{1,4})\.)\s+/g;
  const hits: { idx: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = numberedRe.exec(text))) {
    hits.push({ idx: m.index + (m[0].startsWith("\n") ? 1 : 0) });
  }
  if (hits.length >= 2) {
    const blocks: string[] = [];
    for (let i = 0; i < hits.length; i++) {
      const start = hits[i].idx;
      const end = i + 1 < hits.length ? hits[i + 1].idx : text.length;
      const chunk = text
        .slice(start, end)
        .replace(/^\s*(?:\[\d+\]|\(\d+\)|\d+\.)\s+/, "")
        .trim();
      if (chunk) blocks.push(chunk);
    }
    return blocks;
  }

  // Blank line separation
  const blockSplit = text.split(/\n\s*\n+/).map((s) => s.trim()).filter(Boolean);
  if (blockSplit.length >= 2) return blockSplit;

  // Fallback: line-by-line (only if multiple plausible lines)
  const lineSplit = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  if (lineSplit.length >= 2) return lineSplit;

  return [text];
}

const DOI_RE = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;
const PMID_LABEL_RE = /(?:PMID|PubMed\s*ID)[:\s]*([0-9]{1,9})/i;
const PMID_FREE_RE = /\b([0-9]{6,9})\b/;
const URL_RE = /https?:\/\/\S+/i;
const YEAR_RE = /\b(19|20)\d{2}\b/;

/**
 * Try to parse a single reference string into a ParsedReference.
 * Best-effort regex parser for Vancouver-like, AMA-like, APA-like inputs.
 * The LLM-based parser is a more robust alternative for messy inputs.
 */
export function parseSingleReference(input: string): ParsedReference {
  const original = input.trim();
  let s = original;
  const out: ParsedReference = {};

  // DOI
  const doiMatch = s.match(DOI_RE);
  if (doiMatch) {
    out.doi = doiMatch[0].replace(/[.,;]+$/, "");
  } else {
    // doi:10.xxxx form already covered by DOI_RE
    const u = s.match(URL_RE);
    if (u) {
      const inner = u[0].match(DOI_RE);
      if (inner) out.doi = inner[0].replace(/[.,;]+$/, "");
    }
  }

  // PMID
  const pmidLabeled = s.match(PMID_LABEL_RE);
  if (pmidLabeled) {
    out.pmid = pmidLabeled[1];
  }

  // Year
  const yearMatch = s.match(YEAR_RE);
  if (yearMatch) out.year = yearMatch[0];

  // Authors — try Vancouver: "Smith J, Jones A, ..." up to the first ". "
  // followed by a title-looking sentence.
  const firstDot = s.indexOf(". ");
  if (firstDot > 0 && firstDot < 400) {
    const possibleAuthors = s.slice(0, firstDot).trim();
    // Reject if it contains a 4-digit year (then it's not author block)
    if (!/\b(19|20)\d{2}\b/.test(possibleAuthors) && possibleAuthors.length < 400) {
      const parts = possibleAuthors
        .split(/,\s*/)
        .map((p) => p.replace(/\s+et\s+al\.?$/i, "").trim())
        .filter(Boolean);
      // Each "author" should be short
      if (parts.length >= 1 && parts.every((p) => p.length < 80) && parts.length <= 30) {
        out.authors = parts;
      }
    }
  }

  // After authors, try title then journal year.
  if (out.authors && firstDot > 0) {
    const rest = s.slice(firstDot + 2).trim();
    // Title ends at the first ". " followed by something resembling a journal/year
    const titleEnd = rest.indexOf(". ");
    if (titleEnd > 0) {
      out.title = rest.slice(0, titleEnd).trim().replace(/[.;]+$/, "");
      const tail = rest.slice(titleEnd + 2).trim();
      // Journal . Year ; Vol(Issue) : Pages.
      const journalMatch = tail.match(
        /^([^.;]+?)\.\s*(?:(\d{4})[;:.\s]*)?(?:(\d+)\s*(?:\((\d+)\))?:?\s*([0-9eE\-]+)?)?/
      );
      if (journalMatch) {
        out.journal = journalMatch[1].replace(/\s+$/, "").replace(/[.;]+$/, "");
        if (!out.year && journalMatch[2]) out.year = journalMatch[2];
        if (journalMatch[3]) out.volume = journalMatch[3];
        if (journalMatch[4]) out.issue = journalMatch[4];
        if (journalMatch[5]) out.pages = journalMatch[5];
      }
    }
  }

  // If no title found yet, try to grab the longest sentence as a best-effort title.
  if (!out.title) {
    const sentences = original
      .split(/(?<=[.?!])\s+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 15 && !DOI_RE.test(x));
    if (sentences[0]) {
      out.title = sentences[0].replace(/[.;]+$/, "");
    }
  }

  // PMID free-floating (rare): if very long input contains a 7-9 digit number alone
  if (!out.pmid) {
    // Only attempt for pure PMID lists or short inputs.
    if (s.length < 30) {
      const m = s.match(PMID_FREE_RE);
      if (m) out.pmid = m[1];
    }
  }

  return out;
}

export function parseReferenceBlock(raw: string): { originalText: string; parsed: ParsedReference }[] {
  const blocks = splitReferenceBlocks(raw);
  return blocks.map((b) => ({ originalText: b, parsed: parseSingleReference(b) }));
}

export function formatVancouver(parsed: ParsedReference): string | undefined {
  const a = (parsed.authors || []).slice(0, 6);
  const etal = (parsed.authors?.length || 0) > 6 ? ", et al" : "";
  const authorsStr = a.join(", ") + etal;
  const title = parsed.title || "";
  const journal = parsed.journal || "";
  const year = parsed.year || "";
  const vol = parsed.volume || "";
  const issue = parsed.issue ? `(${parsed.issue})` : "";
  const pages = parsed.pages || "";
  const doi = parsed.doi ? ` doi:${parsed.doi}` : "";
  const pmid = parsed.pmid ? ` PMID:${parsed.pmid}` : "";
  if (!title && !journal) return undefined;
  let tail = "";
  if (year) tail += `. ${year}`;
  if (vol) tail += `;${vol}${issue}`;
  if (pages) tail += `:${pages}`;
  return `${authorsStr ? authorsStr + ". " : ""}${title}${
    title ? "." : ""
  } ${journal}${tail}.${doi}${pmid}`
    .replace(/\s+/g, " ")
    .trim();
}
