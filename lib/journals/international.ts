/**
 * Curated international medical journal seed.
 *
 * This is a *representative* high-value seed (flagship SCIE journals, strong
 * ESCI/emerging titles, and broad specialty journals) — NOT the full universe.
 * The full universe (~2.1k SCIE medical, ~12k ESCI/emerging, ~35k PubMed) is
 * produced at deploy time by scripts/ingest-journals.mjs, which pulls from
 * DOAJ + Crossref + OpenAlex + NLM and writes lib/journals/generated.ts.
 * The finder merges curated + generated, de-duping by ISSN/name. Curated
 * entries win on conflict because their indexing/metrics are hand-verified.
 */

import type { JournalRecord } from "./types";

const v = {
  wos: "https://mjl.clarivate.com/home",
  scopus: "https://www.scopus.com/sources",
  nlm: "https://www.ncbi.nlm.nih.gov/nlmcatalog/journals/",
  doaj: "https://doaj.org/",
  scimago: "https://www.scimagojr.com/journalsearch.php",
};

export const internationalJournals: JournalRecord[] = [
  // ---- General & internal medicine flagships (SCIE Q1) ----
  {
    id: "nejm", name: "New England Journal of Medicine", abbrev: "N Engl J Med",
    publisher: "Massachusetts Medical Society", country: "United States",
    issnPrint: "0028-4793", issnOnline: "1533-4406", homepage: "https://www.nejm.org/",
    authorGuideUrl: "https://www.nejm.org/author-center", scope: "Highest-impact general and internal medicine; practice-changing clinical trials and major findings.",
    specialties: ["general medicine", "internal medicine", "clinical trials"],
    acceptedTypes: ["original_investigation", "review", "correspondence"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 96.2, quartile: "Q1", metricsYear: 2023 }, oaModel: "subscription",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE", "PRISMA"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "lancet", name: "The Lancet", abbrev: "Lancet",
    publisher: "Elsevier", country: "United Kingdom",
    issnPrint: "0140-6736", issnOnline: "1474-547X", homepage: "https://www.thelancet.com/",
    authorGuideUrl: "https://www.thelancet.com/for-authors", scope: "Global general medicine; major clinical and public-health research.",
    specialties: ["general medicine", "internal medicine", "public health", "global health"],
    acceptedTypes: ["original_investigation", "review", "correspondence"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 98.4, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE", "PRISMA"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "jama", name: "JAMA", abbrev: "JAMA",
    publisher: "American Medical Association", country: "United States",
    issnPrint: "0098-7484", issnOnline: "1538-3598", homepage: "https://jamanetwork.com/journals/jama",
    authorGuideUrl: "https://jamanetwork.com/journals/jama/pages/instructions-for-authors", scope: "General medicine; clinical research, reviews, and viewpoints.",
    specialties: ["general medicine", "internal medicine", "clinical trials"],
    acceptedTypes: ["original_investigation", "review", "viewpoint"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 63.1, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE", "PRISMA", "TRIPOD"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "bmj", name: "The BMJ", abbrev: "BMJ",
    publisher: "BMJ Publishing Group", country: "United Kingdom",
    issnPrint: "0959-8138", issnOnline: "1756-1833", homepage: "https://www.bmj.com/",
    authorGuideUrl: "https://www.bmj.com/about-bmj/resources-authors", scope: "General medicine, evidence-based practice, and health policy.",
    specialties: ["general medicine", "public health", "health policy", "epidemiology"],
    acceptedTypes: ["original_investigation", "systematic_review", "review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 93.6, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE", "PRISMA", "STARD"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "annals-im", name: "Annals of Internal Medicine", abbrev: "Ann Intern Med",
    publisher: "American College of Physicians", country: "United States",
    issnPrint: "0003-4819", issnOnline: "1539-3704", homepage: "https://www.acpjournals.org/journal/aim",
    authorGuideUrl: "https://www.acpjournals.org/journal/aim/authors", scope: "Internal medicine clinical research and guidelines.",
    specialties: ["internal medicine", "general medicine", "clinical research"],
    acceptedTypes: ["original_investigation", "systematic_review", "review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 19.6, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE", "PRISMA", "TRIPOD"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "plos-med", name: "PLOS Medicine", abbrev: "PLoS Med",
    publisher: "Public Library of Science", country: "United States",
    issnOnline: "1549-1676", homepage: "https://journals.plos.org/plosmedicine/",
    authorGuideUrl: "https://journals.plos.org/plosmedicine/s/submission-guidelines", scope: "Global medicine and public health; fully open access.",
    specialties: ["general medicine", "public health", "global health", "epidemiology"],
    acceptedTypes: ["original_investigation", "systematic_review", "review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "indexed", doaj: "indexed" },
    metrics: { impactFactor: 15.8, quartile: "Q1", metricsYear: 2023 }, oaModel: "gold", apcUsd: 5300,
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE", "PRISMA"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "bmc-medicine", name: "BMC Medicine", abbrev: "BMC Med",
    publisher: "BMC (Springer Nature)", country: "United Kingdom",
    issnOnline: "1741-7015", homepage: "https://bmcmedicine.biomedcentral.com/",
    authorGuideUrl: "https://bmcmedicine.biomedcentral.com/submission-guidelines", scope: "Broad medicine; open access flagship of the BMC series.",
    specialties: ["general medicine", "internal medicine", "epidemiology", "public health"],
    acceptedTypes: ["original_investigation", "systematic_review", "review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "indexed", doaj: "indexed" },
    metrics: { impactFactor: 7.0, quartile: "Q1", metricsYear: 2023 }, oaModel: "gold", apcUsd: 3690,
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE", "PRISMA"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "plos-one", name: "PLOS ONE", abbrev: "PLoS One",
    publisher: "Public Library of Science", country: "United States",
    issnOnline: "1932-6203", homepage: "https://journals.plos.org/plosone/",
    authorGuideUrl: "https://journals.plos.org/plosone/s/submission-guidelines", scope: "Multidisciplinary; rigorous-but-not-novelty-gated, very broad scope including all medical fields.",
    specialties: ["multidisciplinary", "general medicine", "public health", "biomedical"],
    acceptedTypes: ["original_investigation", "systematic_review", "review", "case_report"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "indexed", doaj: "indexed" },
    metrics: { impactFactor: 3.7, quartile: "Q2", metricsYear: 2023 }, oaModel: "gold", apcUsd: 1931,
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE", "PRISMA", "ARRIVE"], dataConfidence: "curated", verifyUrls: v,
    notes: "Large-scope megajournal; good fit for sound studies that are a niche fit elsewhere.",
  },
  {
    id: "cureus", name: "Cureus Journal of Medical Science", abbrev: "Cureus",
    publisher: "Springer Nature", country: "United States",
    issnOnline: "2168-8184", homepage: "https://www.cureus.com/",
    authorGuideUrl: "https://www.cureus.com/author_guide", scope: "Broad medicine and case reports; rapid open-access publishing.",
    specialties: ["general medicine", "case reports", "multidisciplinary"],
    acceptedTypes: ["original_investigation", "case_report", "review"],
    indexing: { wos: "ESCI", scopus: "unknown", pubmed: "indexed", medline: "not-indexed", pmc: "indexed", doaj: "unknown" },
    metrics: { metricsYear: 2023 }, oaModel: "gold", apcUsd: 0,
    endorsedGuidelines: ["ICMJE", "CARE", "STROBE"], dataConfidence: "curated", verifyUrls: v,
    notes: "PubMed/PMC indexed but not MEDLINE; ESCI not SCIE. Popular for case reports.",
  },

  // ---- Cardiology ----
  {
    id: "circulation", name: "Circulation", abbrev: "Circulation",
    publisher: "American Heart Association (Wolters Kluwer)", country: "United States",
    issnPrint: "0009-7322", issnOnline: "1524-4539", homepage: "https://www.ahajournals.org/journal/circ",
    authorGuideUrl: "https://www.ahajournals.org/circ/author-instructions", scope: "Cardiovascular medicine and science.",
    specialties: ["cardiology", "cardiovascular", "internal medicine"],
    acceptedTypes: ["original_investigation", "review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 35.5, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "eur-heart-j", name: "European Heart Journal", abbrev: "Eur Heart J",
    publisher: "Oxford University Press (ESC)", country: "United Kingdom",
    issnPrint: "0195-668X", issnOnline: "1522-9645", homepage: "https://academic.oup.com/eurheartj",
    authorGuideUrl: "https://academic.oup.com/eurheartj/pages/General_Instructions", scope: "Cardiovascular medicine; flagship of the European Society of Cardiology.",
    specialties: ["cardiology", "cardiovascular"],
    acceptedTypes: ["original_investigation", "review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 37.6, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE"], dataConfidence: "curated", verifyUrls: v,
  },

  // ---- Oncology ----
  {
    id: "jco", name: "Journal of Clinical Oncology", abbrev: "J Clin Oncol",
    publisher: "American Society of Clinical Oncology", country: "United States",
    issnPrint: "0732-183X", issnOnline: "1527-7755", homepage: "https://ascopubs.org/journal/jco",
    authorGuideUrl: "https://ascopubs.org/jco/authors", scope: "Clinical oncology and cancer research.",
    specialties: ["oncology", "hematology", "cancer"],
    acceptedTypes: ["original_investigation", "review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 42.1, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "REMARK"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "frontiers-oncology", name: "Frontiers in Oncology", abbrev: "Front Oncol",
    publisher: "Frontiers Media", country: "Switzerland",
    issnOnline: "2234-943X", homepage: "https://www.frontiersin.org/journals/oncology",
    authorGuideUrl: "https://www.frontiersin.org/guidelines/author-guidelines", scope: "Broad oncology; open access.",
    specialties: ["oncology", "cancer", "radiation oncology"],
    acceptedTypes: ["original_investigation", "systematic_review", "review", "case_report"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "indexed", doaj: "indexed" },
    metrics: { impactFactor: 3.5, quartile: "Q2", metricsYear: 2023 }, oaModel: "gold", apcUsd: 2950,
    endorsedGuidelines: ["ICMJE", "CONSORT", "PRISMA"], dataConfidence: "curated", verifyUrls: v,
  },

  // ---- Public health / epidemiology ----
  {
    id: "ije", name: "International Journal of Epidemiology", abbrev: "Int J Epidemiol",
    publisher: "Oxford University Press", country: "United Kingdom",
    issnPrint: "0300-5771", issnOnline: "1464-3685", homepage: "https://academic.oup.com/ije",
    authorGuideUrl: "https://academic.oup.com/ije/pages/General_Instructions", scope: "Epidemiology and population health methods.",
    specialties: ["epidemiology", "public health", "biostatistics"],
    acceptedTypes: ["original_investigation", "systematic_review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 6.4, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "STROBE", "PRISMA"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "ijerph", name: "International Journal of Environmental Research and Public Health", abbrev: "Int J Environ Res Public Health",
    publisher: "MDPI", country: "Switzerland",
    issnOnline: "1660-4601", homepage: "https://www.mdpi.com/journal/ijerph",
    authorGuideUrl: "https://www.mdpi.com/journal/ijerph/instructions", scope: "Environmental health and public health; open access.",
    specialties: ["public health", "environmental health", "epidemiology", "occupational health"],
    acceptedTypes: ["original_investigation", "systematic_review", "review"],
    indexing: { wos: "none", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "indexed", doaj: "indexed" },
    metrics: { metricsYear: 2023 }, oaModel: "gold", apcUsd: 2500,
    endorsedGuidelines: ["ICMJE", "STROBE", "PRISMA"], dataConfidence: "curated", verifyUrls: v,
    notes: "Delisted from WoS in 2023; still Scopus/MEDLINE indexed — verify current status.",
  },

  // ---- Surgery ----
  {
    id: "ann-surg", name: "Annals of Surgery", abbrev: "Ann Surg",
    publisher: "Wolters Kluwer", country: "United States",
    issnPrint: "0003-4932", issnOnline: "1528-1140", homepage: "https://journals.lww.com/annalsofsurgery/",
    authorGuideUrl: "https://journals.lww.com/annalsofsurgery/pages/informationforauthors.aspx", scope: "Surgical science and practice.",
    specialties: ["surgery", "general surgery"],
    acceptedTypes: ["original_investigation", "review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 7.5, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE"], dataConfidence: "curated", verifyUrls: v,
  },

  // ---- Pediatrics ----
  {
    id: "pediatrics", name: "Pediatrics", abbrev: "Pediatrics",
    publisher: "American Academy of Pediatrics", country: "United States",
    issnPrint: "0031-4005", issnOnline: "1098-4275", homepage: "https://publications.aap.org/pediatrics",
    authorGuideUrl: "https://publications.aap.org/pediatrics/pages/authorguidelines", scope: "General pediatrics and child health.",
    specialties: ["pediatrics", "child health"],
    acceptedTypes: ["original_investigation", "review", "case_report"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 6.2, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE", "CARE"], dataConfidence: "curated", verifyUrls: v,
  },

  // ---- Endocrinology / diabetes ----
  {
    id: "diabetes-care", name: "Diabetes Care", abbrev: "Diabetes Care",
    publisher: "American Diabetes Association", country: "United States",
    issnPrint: "0149-5992", issnOnline: "1935-5548", homepage: "https://diabetesjournals.org/care",
    authorGuideUrl: "https://diabetesjournals.org/care/pages/instructions-for-authors", scope: "Clinical diabetes research and care.",
    specialties: ["endocrinology", "diabetes", "internal medicine"],
    acceptedTypes: ["original_investigation", "review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 14.8, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE"], dataConfidence: "curated", verifyUrls: v,
  },

  // ---- Neurology / psychiatry ----
  {
    id: "neurology", name: "Neurology", abbrev: "Neurology",
    publisher: "American Academy of Neurology (Wolters Kluwer)", country: "United States",
    issnPrint: "0028-3878", issnOnline: "1526-632X", homepage: "https://www.neurology.org/",
    authorGuideUrl: "https://www.neurology.org/author-center", scope: "Clinical neurology.",
    specialties: ["neurology", "neuroscience"],
    acceptedTypes: ["original_investigation", "review", "case_report"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 8.4, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE"], dataConfidence: "curated", verifyUrls: v,
  },

  // ---- Infectious disease ----
  {
    id: "cid", name: "Clinical Infectious Diseases", abbrev: "Clin Infect Dis",
    publisher: "Oxford University Press (IDSA)", country: "United States",
    issnPrint: "1058-4838", issnOnline: "1537-6591", homepage: "https://academic.oup.com/cid",
    authorGuideUrl: "https://academic.oup.com/cid/pages/General_Instructions", scope: "Clinical infectious diseases.",
    specialties: ["infectious diseases", "microbiology", "internal medicine"],
    acceptedTypes: ["original_investigation", "review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "unknown", doaj: "not-indexed" },
    metrics: { impactFactor: 8.2, quartile: "Q1", metricsYear: 2023 }, oaModel: "hybrid",
    endorsedGuidelines: ["ICMJE", "CONSORT", "STROBE"], dataConfidence: "curated", verifyUrls: v,
  },

  // ---- Emerging / regional (ESCI) examples ----
  {
    id: "frontiers-med", name: "Frontiers in Medicine", abbrev: "Front Med",
    publisher: "Frontiers Media", country: "Switzerland",
    issnOnline: "2296-858X", homepage: "https://www.frontiersin.org/journals/medicine",
    authorGuideUrl: "https://www.frontiersin.org/guidelines/author-guidelines", scope: "Broad clinical and translational medicine; open access.",
    specialties: ["general medicine", "internal medicine", "translational"],
    acceptedTypes: ["original_investigation", "systematic_review", "review", "case_report"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "indexed", doaj: "indexed" },
    metrics: { impactFactor: 3.1, quartile: "Q2", metricsYear: 2023 }, oaModel: "gold", apcUsd: 2950,
    endorsedGuidelines: ["ICMJE", "CONSORT", "PRISMA", "CARE"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "medicine-baltimore", name: "Medicine", abbrev: "Medicine (Baltimore)",
    publisher: "Wolters Kluwer", country: "United States",
    issnPrint: "0025-7974", issnOnline: "1536-5964", homepage: "https://journals.lww.com/md-journal/",
    authorGuideUrl: "https://journals.lww.com/md-journal/pages/informationforauthors.aspx", scope: "Broad medicine; open access, large volume.",
    specialties: ["general medicine", "multidisciplinary"],
    acceptedTypes: ["original_investigation", "systematic_review", "case_report"],
    indexing: { wos: "ESCI", scopus: "indexed", pubmed: "indexed", medline: "indexed", pmc: "indexed", doaj: "indexed" },
    metrics: { impactFactor: 1.3, quartile: "Q3", metricsYear: 2023 }, oaModel: "gold", apcUsd: 2050,
    endorsedGuidelines: ["ICMJE", "CONSORT", "PRISMA", "CARE", "STROBE"], dataConfidence: "curated", verifyUrls: v,
  },
  {
    id: "heliyon", name: "Heliyon", abbrev: "Heliyon",
    publisher: "Elsevier (Cell Press)", country: "United Kingdom",
    issnOnline: "2405-8440", homepage: "https://www.cell.com/heliyon/home",
    authorGuideUrl: "https://www.cell.com/heliyon/authors", scope: "Multidisciplinary including medicine and health sciences; open access.",
    specialties: ["multidisciplinary", "general medicine", "public health"],
    acceptedTypes: ["original_investigation", "systematic_review", "review"],
    indexing: { wos: "SCIE", scopus: "indexed", pubmed: "indexed", medline: "not-indexed", pmc: "indexed", doaj: "indexed" },
    metrics: { impactFactor: 4.0, quartile: "Q2", metricsYear: 2023 }, oaModel: "gold", apcUsd: 2200,
    endorsedGuidelines: ["ICMJE", "PRISMA", "STROBE"], dataConfidence: "curated", verifyUrls: v,
  },
];
