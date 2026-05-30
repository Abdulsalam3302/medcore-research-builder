/**
 * Knowledge registry — open-source projects that empower medical / academic
 * research and AI-for-science workflows.
 *
 * HONESTY NOTE: This file is curated by hand from well-established, widely-known
 * projects. We do NOT assert star counts or other live metrics. Each entry
 * carries a `confidence` and a `verifyUrl` pointing at the canonical project
 * homepage or GitHub org so the user can confirm everything at the source —
 * consistent with the platform's no-fabrication ethos. When the exact repo path
 * is uncertain, we link the org and say so in `note`.
 */

export type OSSConfidence = "established" | "likely";

export type OSSCategory =
  | "AI for science / autonomous discovery"
  | "Literature & reference management"
  | "Systematic review & evidence synthesis"
  | "Reproducible research & notebooks"
  | "Statistics"
  | "Data visualization"
  | "Machine learning"
  | "Biomedical NLP"
  | "Reproducibility & workflows";

export type OSSProject = {
  id: string;
  name: string;
  org: string;
  category: OSSCategory;
  whatItDoes: string;
  howItHelpsResearch: string;
  language?: string;
  license?: string;
  confidence: OSSConfidence;
  verifyUrl: string;
  note?: string;
};

export const ossProjects: OSSProject[] = [
  /* ── AI for science / autonomous discovery ───────────────────────────── */
  {
    id: "ai-scientist",
    name: "The AI Scientist",
    org: "Sakana AI",
    category: "AI for science / autonomous discovery",
    whatItDoes:
      "Framework for fully automated, end-to-end scientific discovery — ideation, experiment coding, execution, and paper write-up driven by large language models.",
    howItHelpsResearch:
      "Demonstrates and provides scaffolding for autonomous hypothesis generation and experiment loops, useful as a reference for building agentic research pipelines.",
    language: "Python",
    license: "Apache-2.0",
    confidence: "established",
    verifyUrl: "https://github.com/SakanaAI",
    note: "Project released by Sakana AI on their GitHub org; confirm the exact repo (commonly 'AI-Scientist') at the org link.",
  },
  {
    id: "allennlp-olmo",
    name: "AllenAI open models & tooling (OLMo / allennlp ecosystem)",
    org: "Allen Institute for AI (AI2)",
    category: "AI for science / autonomous discovery",
    whatItDoes:
      "Open language models, datasets, and NLP tooling for reproducible AI research released by the Allen Institute for AI.",
    howItHelpsResearch:
      "Provides fully open model weights, training data, and evaluation code so methods can be reproduced and scrutinized — a model for transparent AI-for-science.",
    language: "Python",
    license: "Apache-2.0",
    confidence: "established",
    verifyUrl: "https://github.com/allenai",
    note: "AI2 maintains several repos (e.g. OLMo, allennlp, s2 tooling); see the org for the current canonical projects.",
  },

  /* ── Literature & reference management ────────────────────────────────── */
  {
    id: "zotero",
    name: "Zotero",
    org: "Zotero / Corporation for Digital Scholarship",
    category: "Literature & reference management",
    whatItDoes:
      "Free, open-source reference manager that collects, organizes, cites, and shares research sources, with browser capture and PDF management.",
    howItHelpsResearch:
      "Centralizes citations and PDFs, auto-generates bibliographies in thousands of styles, and supports shared group libraries for collaborative literature reviews.",
    language: "JavaScript",
    license: "AGPL-3.0",
    confidence: "established",
    verifyUrl: "https://github.com/zotero",
  },
  {
    id: "jabref",
    name: "JabRef",
    org: "JabRef",
    category: "Literature & reference management",
    whatItDoes:
      "Open-source, cross-platform citation and reference manager built around the BibTeX/BibLaTeX format.",
    howItHelpsResearch:
      "Ideal for LaTeX-based manuscripts — organizes references, fetches metadata by DOI/PMID, and keeps a clean .bib database for reproducible bibliographies.",
    language: "Java",
    license: "MIT",
    confidence: "established",
    verifyUrl: "https://github.com/JabRef",
  },

  /* ── Systematic review & evidence synthesis ──────────────────────────── */
  {
    id: "revtools",
    name: "revtools",
    org: "rOpenSci / mjwestgate",
    category: "Systematic review & evidence synthesis",
    whatItDoes:
      "R package for screening and visualizing bibliographic data during evidence synthesis, including deduplication and topic modelling of titles/abstracts.",
    howItHelpsResearch:
      "Speeds up the screening phase of systematic reviews by clustering and visualizing large reference sets imported from databases.",
    language: "R",
    license: "GPL-3.0",
    confidence: "likely",
    verifyUrl: "https://github.com/mjwestgate",
    note: "Maintained by Martin Westgate (mjwestgate) and associated with rOpenSci; confirm the exact repo at the maintainer/org.",
  },
  {
    id: "metafor",
    name: "metafor",
    org: "wviechtb",
    category: "Systematic review & evidence synthesis",
    whatItDoes:
      "Comprehensive R package for conducting meta-analyses — effect-size calculation, fixed/random-effects models, forest and funnel plots.",
    howItHelpsResearch:
      "The de-facto open toolkit for quantitative evidence synthesis, enabling reproducible meta-analyses with publication-bias diagnostics.",
    language: "R",
    license: "GPL-2.0-or-later",
    confidence: "established",
    verifyUrl: "https://github.com/wviechtb/metafor",
  },

  /* ── Reproducible research & notebooks ───────────────────────────────── */
  {
    id: "jupyter",
    name: "Jupyter (JupyterLab / Notebook)",
    org: "Project Jupyter",
    category: "Reproducible research & notebooks",
    whatItDoes:
      "Interactive computing environment for notebooks that combine live code, equations, visualizations, and narrative text across many languages.",
    howItHelpsResearch:
      "The standard medium for shareable, re-runnable analyses; lets reviewers reproduce figures and stats step by step from data to result.",
    language: "Python / TypeScript",
    license: "BSD-3-Clause",
    confidence: "established",
    verifyUrl: "https://github.com/jupyter",
  },
  {
    id: "quarto",
    name: "Quarto",
    org: "Quarto / Posit",
    category: "Reproducible research & notebooks",
    whatItDoes:
      "Open-source scientific and technical publishing system that turns Markdown + code (R, Python, Julia) into articles, reports, slides, and websites.",
    howItHelpsResearch:
      "Enables literate, reproducible manuscripts with executable code and citation support, exporting to PDF/HTML/Word for journal submission.",
    language: "TypeScript / Lua",
    license: "MIT",
    confidence: "established",
    verifyUrl: "https://github.com/quarto-dev",
  },

  /* ── Statistics ──────────────────────────────────────────────────────── */
  {
    id: "r-project",
    name: "R (base R language & environment)",
    org: "R Project / R Foundation",
    category: "Statistics",
    whatItDoes:
      "Language and environment for statistical computing and graphics, with a vast CRAN ecosystem of analysis packages.",
    howItHelpsResearch:
      "Workhorse for biostatistics and epidemiology — regression, survival analysis, mixed models — with reproducible scripts and publication-quality output.",
    language: "R / C",
    license: "GPL-2.0-or-later",
    confidence: "established",
    verifyUrl: "https://www.r-project.org/",
    note: "Canonical home is r-project.org; source is mirrored on GitHub but the project's own site is authoritative.",
  },
  {
    id: "statsmodels",
    name: "statsmodels",
    org: "statsmodels",
    category: "Statistics",
    whatItDoes:
      "Python library for estimating statistical models, conducting tests, and statistical data exploration.",
    howItHelpsResearch:
      "Provides rigorous, well-documented implementations of regression, GLMs, time-series, and hypothesis tests with detailed result summaries for papers.",
    language: "Python",
    license: "BSD-3-Clause",
    confidence: "established",
    verifyUrl: "https://github.com/statsmodels/statsmodels",
  },
  {
    id: "scipy",
    name: "SciPy",
    org: "SciPy",
    category: "Statistics",
    whatItDoes:
      "Fundamental Python library for scientific computing — optimization, integration, statistics, signal processing, and linear algebra.",
    howItHelpsResearch:
      "Supplies the numerical and statistical primitives (tests, distributions, curve fitting) underlying most quantitative research in Python.",
    language: "Python",
    license: "BSD-3-Clause",
    confidence: "established",
    verifyUrl: "https://github.com/scipy/scipy",
  },
  {
    id: "jasp",
    name: "JASP",
    org: "JASP Stats",
    category: "Statistics",
    whatItDoes:
      "Free, open-source statistics program with a point-and-click interface supporting both classical (frequentist) and Bayesian analyses.",
    howItHelpsResearch:
      "Lowers the barrier to rigorous analysis for clinicians and offers Bayesian methods and APA-formatted output suitable for manuscripts.",
    language: "C++ / R",
    license: "AGPL-3.0",
    confidence: "established",
    verifyUrl: "https://github.com/jasp-stats",
  },

  /* ── Data visualization ──────────────────────────────────────────────── */
  {
    id: "matplotlib",
    name: "Matplotlib",
    org: "Matplotlib",
    category: "Data visualization",
    whatItDoes:
      "Comprehensive Python library for creating static, animated, and interactive visualizations.",
    howItHelpsResearch:
      "Produces precise, publication-quality figures (300+ DPI, vector export) that meet journal figure requirements.",
    language: "Python",
    license: "Matplotlib (BSD-style/PSF)",
    confidence: "established",
    verifyUrl: "https://github.com/matplotlib/matplotlib",
  },
  {
    id: "plotly",
    name: "Plotly (plotly.py / plotly.js)",
    org: "Plotly",
    category: "Data visualization",
    whatItDoes:
      "Open-source graphing libraries for interactive, browser-based charts across Python, R, and JavaScript.",
    howItHelpsResearch:
      "Enables interactive supplementary figures and dashboards for exploratory analysis and online appendices.",
    language: "Python / JavaScript",
    license: "MIT",
    confidence: "established",
    verifyUrl: "https://github.com/plotly",
  },
  {
    id: "ggplot2",
    name: "ggplot2",
    org: "tidyverse",
    category: "Data visualization",
    whatItDoes:
      "R package implementing the Grammar of Graphics for declarative, layered statistical visualizations.",
    howItHelpsResearch:
      "Standard for clear, reproducible statistical graphics in R; integrates tightly with tidyverse data-wrangling for analysis-to-figure pipelines.",
    language: "R",
    license: "MIT",
    confidence: "established",
    verifyUrl: "https://github.com/tidyverse/ggplot2",
  },

  /* ── Machine learning ────────────────────────────────────────────────── */
  {
    id: "scikit-learn",
    name: "scikit-learn",
    org: "scikit-learn",
    category: "Machine learning",
    whatItDoes:
      "Python library for classical machine learning — classification, regression, clustering, model selection, and preprocessing.",
    howItHelpsResearch:
      "Provides well-validated ML algorithms with consistent APIs and cross-validation tooling for predictive modelling and biomarker studies.",
    language: "Python",
    license: "BSD-3-Clause",
    confidence: "established",
    verifyUrl: "https://github.com/scikit-learn/scikit-learn",
  },
  {
    id: "pytorch",
    name: "PyTorch",
    org: "PyTorch Foundation",
    category: "Machine learning",
    whatItDoes:
      "Deep-learning framework with tensor computation and automatic differentiation, widely used for research-grade neural networks.",
    howItHelpsResearch:
      "Backbone for medical imaging, genomics, and clinical-prediction deep-learning models, with a large ecosystem of pretrained architectures.",
    language: "Python / C++",
    license: "BSD-3-Clause",
    confidence: "established",
    verifyUrl: "https://github.com/pytorch/pytorch",
  },
  {
    id: "hf-transformers",
    name: "Transformers",
    org: "Hugging Face",
    category: "Machine learning",
    whatItDoes:
      "Library providing thousands of pretrained transformer models for NLP, vision, and audio with a unified API.",
    howItHelpsResearch:
      "Lets researchers apply and fine-tune state-of-the-art models (including biomedical ones) for text classification, extraction, and summarization of literature.",
    language: "Python",
    license: "Apache-2.0",
    confidence: "established",
    verifyUrl: "https://github.com/huggingface/transformers",
  },

  /* ── Biomedical NLP ──────────────────────────────────────────────────── */
  {
    id: "spacy",
    name: "spaCy",
    org: "Explosion",
    category: "Biomedical NLP",
    whatItDoes:
      "Industrial-strength natural language processing library for Python with fast tokenization, tagging, parsing, and NER.",
    howItHelpsResearch:
      "Foundation for extracting structured information from clinical notes and abstracts; the base on which biomedical pipelines are built.",
    language: "Python / Cython",
    license: "MIT",
    confidence: "established",
    verifyUrl: "https://github.com/explosion/spaCy",
  },
  {
    id: "scispacy",
    name: "scispaCy",
    org: "Allen Institute for AI (AI2)",
    category: "Biomedical NLP",
    whatItDoes:
      "spaCy pipelines and models specialized for biomedical and scientific text, including entity recognition and UMLS entity linking.",
    howItHelpsResearch:
      "Extracts diseases, chemicals, genes, and other biomedical entities from papers and links them to ontologies for large-scale literature mining.",
    language: "Python",
    license: "Apache-2.0",
    confidence: "established",
    verifyUrl: "https://github.com/allenai/scispacy",
  },

  /* ── Reproducibility & workflows ─────────────────────────────────────── */
  {
    id: "dvc",
    name: "DVC (Data Version Control)",
    org: "Iterative",
    category: "Reproducibility & workflows",
    whatItDoes:
      "Git-like version control for datasets, models, and ML experiments, with pipeline definition and reproducible runs.",
    howItHelpsResearch:
      "Tracks large data and model artifacts alongside code so analyses are versioned and reproducible across a team.",
    language: "Python",
    license: "Apache-2.0",
    confidence: "established",
    verifyUrl: "https://github.com/iterative/dvc",
  },
  {
    id: "snakemake",
    name: "Snakemake",
    org: "Snakemake",
    category: "Reproducibility & workflows",
    whatItDoes:
      "Workflow management system for reproducible, scalable data analyses defined as rule-based pipelines.",
    howItHelpsResearch:
      "Standard in bioinformatics for encoding analysis steps so an entire study can be re-run end to end on any machine or cluster.",
    language: "Python",
    license: "MIT",
    confidence: "established",
    verifyUrl: "https://github.com/snakemake/snakemake",
  },
  {
    id: "nextflow",
    name: "Nextflow",
    org: "Seqera Labs",
    category: "Reproducibility & workflows",
    whatItDoes:
      "Workflow framework for scalable, portable, and reproducible computational pipelines across clusters and clouds.",
    howItHelpsResearch:
      "Powers reproducible bioinformatics pipelines (e.g. the nf-core community) that run identically from a laptop to HPC and cloud.",
    language: "Groovy / Java",
    license: "Apache-2.0",
    confidence: "established",
    verifyUrl: "https://github.com/nextflow-io/nextflow",
  },
];

/** Group projects by category, preserving first-seen category order. */
export function ossByCategory(): Map<OSSCategory, OSSProject[]> {
  const map = new Map<OSSCategory, OSSProject[]>();
  for (const project of ossProjects) {
    const bucket = map.get(project.category);
    if (bucket) {
      bucket.push(project);
    } else {
      map.set(project.category, [project]);
    }
  }
  return map;
}
