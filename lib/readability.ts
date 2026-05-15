/**
 * Local readability metrics — runs in browser or node, no API call.
 * Sources:
 *  - Flesch-Kincaid grade level / reading ease
 *  - Gunning fog
 *  - Average sentence length, % long words, % passive voice (heuristic).
 */

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  let count = 0;
  let prevIsVowel = false;
  for (const ch of w) {
    const isVowel = "aeiouy".includes(ch);
    if (isVowel && !prevIsVowel) count++;
    prevIsVowel = isVowel;
  }
  if (w.endsWith("e")) count = Math.max(1, count - 1);
  return Math.max(1, count);
}

const PASSIVE_PATTERNS = [
  /\b(is|are|was|were|be|been|being)\s+\w+(?:ed|en)\b/gi,
  /\b(got|gets|getting)\s+\w+(?:ed|en)\b/gi,
];

export type ReadabilityReport = {
  words: number;
  sentences: number;
  syllables: number;
  flesch: number;          // higher = easier (~60–70 ideal for general medical)
  fleschKincaidGrade: number; // US grade level
  gunningFog: number;
  avgSentenceLength: number;
  pctLongWords: number;
  passiveVoiceCount: number;
  passiveVoicePct: number;
  verdict: "very-easy" | "easy" | "average" | "hard" | "very-hard";
  recommendation: string;
};

export function readability(text: string): ReadabilityReport {
  const clean = text.replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) {
    return {
      words: 0,
      sentences: 0,
      syllables: 0,
      flesch: 0,
      fleschKincaidGrade: 0,
      gunningFog: 0,
      avgSentenceLength: 0,
      pctLongWords: 0,
      passiveVoiceCount: 0,
      passiveVoicePct: 0,
      verdict: "average",
      recommendation: "No text to analyse.",
    };
  }
  const sentenceList = clean.split(/[.!?]+\s/).filter(Boolean);
  const sentenceCount = Math.max(1, sentenceList.length);
  const wordList = clean.split(/\s+/).filter(Boolean);
  const wordCount = wordList.length;
  const syllableCount = wordList.reduce((acc, w) => acc + syllables(w), 0);
  const longWords = wordList.filter((w) => syllables(w) >= 3).length;
  const flesch = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
  const fkGrade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59;
  const fog = 0.4 * (wordCount / sentenceCount + (100 * longWords) / wordCount);

  const passiveCount = PASSIVE_PATTERNS.reduce(
    (acc, p) => acc + (clean.match(p) || []).length,
    0
  );

  const verdict: ReadabilityReport["verdict"] =
    flesch >= 80 ? "very-easy" : flesch >= 60 ? "easy" : flesch >= 50 ? "average" : flesch >= 30 ? "hard" : "very-hard";
  const recommendation =
    flesch < 30
      ? "Very hard to read for a general medical audience. Break up long sentences; replace polysyllabic Latin/Greek with shorter equivalents where possible."
      : flesch < 50
      ? "Aim for shorter sentences (≤20 words average) and a higher proportion of one- and two-syllable words."
      : "Readable. Watch for passive-voice creep and overlong sentences (>25 words).";

  return {
    words: wordCount,
    sentences: sentenceCount,
    syllables: syllableCount,
    flesch: Number(flesch.toFixed(1)),
    fleschKincaidGrade: Number(fkGrade.toFixed(1)),
    gunningFog: Number(fog.toFixed(1)),
    avgSentenceLength: Number((wordCount / sentenceCount).toFixed(1)),
    pctLongWords: Number(((100 * longWords) / wordCount).toFixed(1)),
    passiveVoiceCount: passiveCount,
    passiveVoicePct: Number(((100 * passiveCount) / sentenceCount).toFixed(1)),
    verdict,
    recommendation,
  };
}

/**
 * Heuristic, no-API "likely AI" detector.
 * NOT a substitute for a real classifier — we surface the warning in the UI.
 * Signals it looks at:
 *  - Very low sentence-length variance (AI tends to even-out lengths).
 *  - Overuse of transition words (furthermore, moreover, additionally, in conclusion).
 *  - High Flesch-Kincaid grade combined with low burstiness.
 */
export type AiHeuristicReport = {
  burstiness: number;                  // higher = more human-like
  transitionDensity: number;           // % sentences starting with transition word
  hedgeWordDensity: number;            // generic AI hedge density
  score0to100: number;                 // 0 = looks human, 100 = looks AI
  verdict: "likely-human" | "uncertain" | "likely-ai";
  notes: string[];
};

const TRANSITIONS = [
  "moreover",
  "furthermore",
  "additionally",
  "in addition",
  "in conclusion",
  "consequently",
  "thus",
  "therefore",
  "however",
  "nevertheless",
  "overall",
  "indeed",
  "notably",
];
const AI_HEDGES = [
  "it is important to note",
  "it should be noted",
  "in summary",
  "in essence",
  "as such",
  "as well as",
  "delve into",
  "tapestry",
  "navigate the landscape",
  "robust",
  "leverage",
];

export function aiHeuristic(text: string): AiHeuristicReport {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentences = clean.split(/[.!?]+\s/).filter(Boolean);
  if (sentences.length < 3) {
    return {
      burstiness: 0,
      transitionDensity: 0,
      hedgeWordDensity: 0,
      score0to100: 0,
      verdict: "uncertain",
      notes: ["Not enough text for a reliable heuristic."],
    };
  }
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((acc, l) => acc + (l - mean) ** 2, 0) / lengths.length;
  const sd = Math.sqrt(variance);
  const burstiness = mean ? Number((sd / mean).toFixed(3)) : 0;

  const transitionStarts = sentences.filter((s) => {
    const head = s.toLowerCase().trim().split(/\s+/, 3).join(" ");
    return TRANSITIONS.some((t) => head.startsWith(t));
  }).length;
  const transitionDensity = Number(((100 * transitionStarts) / sentences.length).toFixed(1));

  const lower = clean.toLowerCase();
  const hedgeMatches = AI_HEDGES.reduce(
    (acc, h) => acc + (lower.split(h).length - 1),
    0
  );
  const hedgeWordDensity = Number(((100 * hedgeMatches) / sentences.length).toFixed(1));

  let score = 0;
  if (burstiness < 0.25) score += 35;
  else if (burstiness < 0.4) score += 18;
  if (transitionDensity > 25) score += 25;
  else if (transitionDensity > 15) score += 12;
  if (hedgeWordDensity > 20) score += 25;
  else if (hedgeWordDensity > 10) score += 12;
  score = Math.min(100, score);

  const verdict: AiHeuristicReport["verdict"] =
    score >= 60 ? "likely-ai" : score >= 35 ? "uncertain" : "likely-human";

  const notes: string[] = [];
  if (burstiness < 0.25) notes.push("Very uniform sentence length (low burstiness) — AI signature.");
  if (transitionDensity > 25) notes.push("High density of generic transition words.");
  if (hedgeWordDensity > 20) notes.push("High density of generic AI hedge phrases.");
  if (notes.length === 0) notes.push("Sentence variety and phrasing look human.");
  notes.push(
    "Heuristic only. For a definitive screen, run an external detector (GPTZero, Originality.ai, Copyleaks)."
  );

  return {
    burstiness,
    transitionDensity,
    hedgeWordDensity,
    score0to100: score,
    verdict,
    notes,
  };
}
