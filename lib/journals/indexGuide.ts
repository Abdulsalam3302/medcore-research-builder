/**
 * Plain-language explainer for the indexes researchers care about when choosing
 * a journal: Web of Science (SCIE/ESCI), Scopus, PubMed, MEDLINE, PMC, DOAJ.
 * Each entry covers WHAT it is, WHY it matters, HOW to verify it officially,
 * and the key DIFFERENCE that confuses people. Facts reflect 2026 reality;
 * always confirm a specific journal at the linked official source.
 */

export type IndexExplainer = {
  id: string;
  name: string;
  short: string;
  what: string;
  importance: string;
  verifyLabel: string;
  verifyUrl: string;
  difference?: string;
};

export const indexExplainers: IndexExplainer[] = [
  {
    id: "scie",
    name: "Web of Science — SCIE",
    short: "Science Citation Index Expanded",
    what: "The flagship science collection in Clarivate's Web of Science Core Collection. SCIE journals undergo a rigorous quality + impact evaluation and are the ones that receive a Journal Impact Factor (JIF) in the Journal Citation Reports.",
    importance: "Being in SCIE is a strong credibility marker and is what most institutions mean by 'Web of Science indexed with an impact factor'. Many promotion and funding committees count SCIE/JIF publications specifically.",
    verifyLabel: "Master Journal List (Clarivate)",
    verifyUrl: "https://mjl.clarivate.com/home",
    difference: "SCIE journals get a Journal Impact Factor; ESCI journals (below) generally do NOT, even though both are 'Web of Science'.",
  },
  {
    id: "esci",
    name: "Web of Science — ESCI",
    short: "Emerging Sources Citation Index",
    what: "A Web of Science collection for journals that have passed Clarivate's quality criteria but are still being evaluated for the higher SCIE/SSCI collections. Many newer, regional, or growing journals sit here.",
    importance: "ESCI signals a journal that is legitimately Web-of-Science-evaluated and improving — but it is NOT the same as SCIE. An ESCI journal may or may not have a Journal Impact Factor (Clarivate began assigning JIFs to some ESCI titles from 2023, but coverage is uneven).",
    verifyLabel: "Master Journal List (Clarivate)",
    verifyUrl: "https://mjl.clarivate.com/home",
    difference: "ESCI = 'emerging / under evaluation'. Don't accept a journal's claim of 'Web of Science indexed' at face value — confirm whether it's SCIE (top tier, JIF) or ESCI (emerging).",
  },
  {
    id: "scopus",
    name: "Scopus",
    short: "Elsevier's abstract & citation database",
    what: "Elsevier's large curated database of peer-reviewed literature. Scopus assigns the CiteScore metric and feeds SCImago Journal Rank (SJR) and quartiles (Q1–Q4). It is broader than Web of Science but still selectively curated by an independent board.",
    importance: "In many countries and institutions Scopus indexing (and Scopus quartile) is the primary benchmark — sometimes weighted more than Web of Science. CiteScore and SJR are the standard Scopus metrics.",
    verifyLabel: "Scopus Sources / Scimago",
    verifyUrl: "https://www.scopus.com/sources",
    difference: "Scopus ≠ Web of Science — they are competing databases with different coverage and metrics (CiteScore/SJR vs JIF). A journal can be in one but not the other.",
  },
  {
    id: "pubmed",
    name: "PubMed",
    short: "NLM's biomedical search interface",
    what: "The free search interface from the US National Library of Medicine. PubMed contains MEDLINE records PLUS additional content (e.g. articles in PubMed Central, ahead-of-print citations). Being 'in PubMed' is therefore broader and easier than being in MEDLINE.",
    importance: "PubMed is where clinicians and researchers actually search, so discoverability there matters. But 'indexed in PubMed' is a weaker claim than 'indexed in MEDLINE' — some PubMed content arrives via PMC deposit rather than selective indexing.",
    verifyLabel: "NLM Catalog",
    verifyUrl: "https://www.ncbi.nlm.nih.gov/nlmcatalog/journals/",
    difference: "PubMed is the search engine; MEDLINE is the selectively-curated core database inside it. 'In PubMed' can mean 'in MEDLINE' OR 'only in PMC' — check which.",
  },
  {
    id: "medline",
    name: "MEDLINE",
    short: "NLM's selectively-indexed core",
    what: "The premier subset of PubMed: journals selected by the NLM's Literature Selection Technical Review Committee (LSTRC) for scientific quality. MEDLINE articles are tagged with MeSH (Medical Subject Headings) terms.",
    importance: "MEDLINE indexing is one of the strongest credibility signals for a biomedical journal — selection is competitive and quality-based. If a journal is MEDLINE-indexed, it is almost certainly legitimate.",
    verifyLabel: "NLM Catalog (look for 'Currently indexed for MEDLINE')",
    verifyUrl: "https://www.ncbi.nlm.nih.gov/nlmcatalog/journals/",
    difference: "MEDLINE ⊂ PubMed. A journal can be searchable in PubMed without being MEDLINE-indexed — verify the exact phrase 'Currently indexed for MEDLINE' in the NLM Catalog.",
  },
  {
    id: "pmc",
    name: "PubMed Central (PMC)",
    short: "Free full-text archive",
    what: "A free full-text archive of biomedical literature run by the NLM. Open-access journals and funder-mandated articles are deposited here. PMC is about full-text preservation/access, not selective quality indexing.",
    importance: "PMC ensures your full text is freely readable and preserved, which boosts access and citations. But PMC inclusion alone is not a quality stamp the way MEDLINE is.",
    verifyLabel: "PMC journal list",
    verifyUrl: "https://www.ncbi.nlm.nih.gov/pmc/journals/",
    difference: "PMC = free full text; MEDLINE = selective indexing. A journal can be in PMC but not MEDLINE (and vice versa).",
  },
  {
    id: "doaj",
    name: "DOAJ",
    short: "Directory of Open Access Journals",
    what: "An independent, community-curated directory that vets open-access journals for transparent editorial and publishing practices. DOAJ applies strict criteria and removes journals that fail them.",
    importance: "DOAJ listing is a meaningful trust signal for an OA journal — DOAJ deliberately does not list predatory journals. It also records APC/licensing transparency.",
    verifyLabel: "DOAJ directory",
    verifyUrl: "https://doaj.org/",
    difference: "DOAJ is about open-access legitimacy and transparency, not citation impact. A respected subscription journal won't be in DOAJ; a vetted OA journal will.",
  },
];

/** A short cross-cutting note on verifying claims and spotting fake metrics. */
export const indexVerificationNote =
  "Always verify an indexing claim on the OFFICIAL source above — never on the journal's own marketing page. Predatory journals routinely advertise fake 'impact factors' (e.g. Global Impact Factor / GIF, Universal Impact Factor / UIF, Index Copernicus Value, Citefactor). Only the Clarivate Journal Impact Factor (from SCIE/SSCI), Scopus CiteScore, and SCImago SJR are standard, recognized journal metrics.";
