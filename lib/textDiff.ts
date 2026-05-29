// Lightweight token-level diff (Hunt–McIlroy LCS).
// Tokens are words + whitespace + punctuation, preserved verbatim so we can rebuild text faithfully.

export type DiffOp = "eq" | "ins" | "del";
export type DiffToken = { op: DiffOp; text: string };
export type DiffHunk = {
  op: "eq" | "change";
  // for eq: shared text; for change: del then ins
  before?: string;
  after?: string;
  text?: string;
};

const TOKEN_RE = /(\s+|[A-Za-z0-9_'’\-]+|[^A-Za-z0-9\s])/g;

export function tokenize(s: string): string[] {
  if (!s) return [];
  return s.match(TOKEN_RE) || [];
}

// Beyond this size the (n+1)x(m+1) LCS matrix is too expensive to allocate, so
// we fall back to a coarse whole-string diff instead.
const MAX_TOKENS = 4000;
const MAX_PRODUCT = 2_000_000;

export function diffTokens(a: string[], b: string[]): DiffToken[] {
  const n = a.length;
  const m = b.length;

  // Guard: short-circuit for very large inputs without allocating the matrix.
  if (n > MAX_TOKENS || m > MAX_TOKENS || n * m > MAX_PRODUCT) {
    if (n === m && a.every((t, k) => t === b[k])) {
      return a.map((text) => ({ op: "eq", text }));
    }
    const out: DiffToken[] = [];
    for (const text of a) out.push({ op: "del", text });
    for (const text of b) out.push({ op: "ins", text });
    return out;
  }

  // LCS length matrix
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const out: DiffToken[] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out.push({ op: "eq", text: a[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      out.push({ op: "del", text: a[i - 1] });
      i--;
    } else {
      out.push({ op: "ins", text: b[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    out.push({ op: "del", text: a[--i] });
  }
  while (j > 0) {
    out.push({ op: "ins", text: b[--j] });
  }
  return out.reverse();
}

// Group runs of contiguous deletions+insertions into "change" hunks; the rest stays as eq.
export function toHunks(tokens: DiffToken[]): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t.op === "eq") {
      let buf = "";
      while (i < tokens.length && tokens[i].op === "eq") {
        buf += tokens[i].text;
        i++;
      }
      hunks.push({ op: "eq", text: buf });
    } else {
      let del = "";
      let ins = "";
      while (i < tokens.length && tokens[i].op !== "eq") {
        if (tokens[i].op === "del") del += tokens[i].text;
        else ins += tokens[i].text;
        i++;
      }
      hunks.push({ op: "change", before: del, after: ins });
    }
  }
  return hunks;
}

export function diffStrings(a: string, b: string): DiffHunk[] {
  return toHunks(diffTokens(tokenize(a), tokenize(b)));
}

// Apply user-resolved hunks back into a single text.
// `accept[i]` = true means "use the after side" (or the eq text if op==eq); false = keep before.
export function applyResolutions(hunks: DiffHunk[], accept: boolean[]): string {
  let out = "";
  hunks.forEach((h, i) => {
    if (h.op === "eq") {
      out += h.text || "";
    } else {
      out += accept[i] ? h.after || "" : h.before || "";
    }
  });
  return out;
}

export function changeCount(hunks: DiffHunk[]): number {
  return hunks.filter((h) => h.op === "change").length;
}

export function wordCount(s: string): number {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}
