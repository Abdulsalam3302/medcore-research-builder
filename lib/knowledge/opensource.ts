/**
 * Knowledge registry — open-source projects that empower medical / academic
 * research and AI-for-science workflows.
 *
 * SOURCE-VERIFIED: Every GitHub-hosted entry below was checked against the live
 * GitHub API on 2026-05-30 (see `verifiedAt`). `verifyUrl` points at the exact
 * canonical repository, `stars` is the real `stargazers_count` returned by the
 * API at verification time, and `language` reflects GitHub's primary-language
 * detection. Star counts are live metrics that drift over time — `stars` is a
 * point-in-time snapshot, not a guarantee. Entries not hosted on GitHub (e.g.
 * the base R language) keep `verifyUrl` pointed at their authoritative home and
 * leave `stars` undefined, with the reason noted.
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
  /** Real GitHub stargazers_count captured at verification time (undefined for non-GitHub projects). */
  stars?: number;
  /** Date (YYYY-MM-DD) the entry was verified against the live source. */
  verifiedAt?: string;
  /** One friendly sentence a non-technical researcher understands. */
  plainSummary?: string;
  /** A single emoji representing the tool/category. */
  icon?: string;
  /** A concrete "you'd use this when…" example in plain language. */
  useCase?: string;
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
    language: "Jupyter Notebook",
    license: "Apache-2.0",
    confidence: "established",
    verifyUrl: "https://github.com/SakanaAI/AI-Scientist",
    note: "Canonical repo SakanaAI/AI-Scientist; a follow-up SakanaAI/AI-Scientist-v2 also exists. GitHub reports its primary language as Jupyter Notebook.",
    stars: 13828,
    verifiedAt: "2026-05-30",
    icon: "🤖",
    plainSummary:
      "An experimental robot-scientist that can dream up an idea, run the experiment, and write a draft paper on its own.",
    useCase:
      "You're curious how far AI can take a whole research project end to end, or want a starting point for building your own research assistant.",
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
    verifyUrl: "https://github.com/allenai/OLMo",
    note: "Verified against the flagship allenai/OLMo repo (modeling, training, eval, inference). AI2 also maintains related repos such as allenai/dolma and allenai/olmocr; stars/url here reflect OLMo specifically.",
    stars: 6513,
    verifiedAt: "2026-05-30",
    icon: "🧠",
    plainSummary:
      "Fully open AI language models where the weights, data, and training code are all public so anyone can inspect them.",
    useCase:
      "You need an AI model you can study and reproduce transparently, rather than a closed black box.",
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
    verifyUrl: "https://github.com/zotero/zotero",
    stars: 14330,
    verifiedAt: "2026-05-30",
    icon: "📚",
    plainSummary:
      "Finds, saves, and organizes the papers you cite, and builds your bibliography automatically.",
    useCase:
      "You're collecting sources for a review and want one tidy library that can spit out a formatted reference list.",
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
    verifyUrl: "https://github.com/JabRef/jabref",
    stars: 4347,
    verifiedAt: "2026-05-30",
    icon: "🗂️",
    plainSummary:
      "Keeps your references in the BibTeX format that LaTeX manuscripts use, and fills in details from a DOI or PMID.",
    useCase:
      "You write in LaTeX and want a clean, reusable reference database for your papers.",
  },

  /* ── Systematic review & evidence synthesis ──────────────────────────── */
  {
    id: "revtools",
    name: "revtools",
    org: "mjwestgate",
    category: "Systematic review & evidence synthesis",
    whatItDoes:
      "R package for screening and visualizing bibliographic data during evidence synthesis, including deduplication and topic modelling of titles/abstracts.",
    howItHelpsResearch:
      "Speeds up the screening phase of systematic reviews by clustering and visualizing large reference sets imported from databases.",
    language: "R",
    license: "GPL-3.0",
    confidence: "established",
    verifyUrl: "https://github.com/mjwestgate/revtools",
    note: "Canonical repo mjwestgate/revtools (maintained by Martin Westgate; homepage revtools.net). A small but real, confirmed project; last pushed 2023.",
    stars: 57,
    verifiedAt: "2026-05-30",
    icon: "🔎",
    plainSummary:
      "Helps you sift through thousands of search results for a systematic review by grouping and visualizing them.",
    useCase:
      "You imported a huge pile of references and need to screen and de-duplicate them faster.",
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
    note: "Canonical repo wviechtb/metafor (homepage metafor-project.org); also distributed via CRAN. The de-facto open meta-analysis package, though its GitHub star count is modest.",
    stars: 297,
    verifiedAt: "2026-05-30",
    icon: "📊",
    plainSummary:
      "Combines the results of many studies into one pooled answer, with the classic forest and funnel plots.",
    useCase:
      "You're running a meta-analysis and need to compute a combined effect size and check for publication bias.",
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
    language: "Jupyter Notebook",
    license: "BSD-3-Clause",
    confidence: "established",
    verifyUrl: "https://github.com/jupyter/notebook",
    note: "Project Jupyter spans many repos (jupyterlab/jupyterlab, jupyter/notebook, etc.); verified here against jupyter/notebook (the classic/Notebook 7 app). stars reflect that repo specifically.",
    stars: 13171,
    verifiedAt: "2026-05-30",
    icon: "📓",
    plainSummary:
      "A digital lab notebook that mixes live code, charts, and notes so others can re-run your analysis step by step.",
    useCase:
      "You want to share an analysis where reviewers can reproduce every figure and number from the data.",
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
    language: "JavaScript",
    license: "MIT",
    confidence: "established",
    verifyUrl: "https://github.com/quarto-dev/quarto-cli",
    note: "Canonical repo quarto-dev/quarto-cli. GitHub reports the primary language as JavaScript (TypeScript/Lua also present).",
    stars: 5683,
    verifiedAt: "2026-05-30",
    icon: "📄",
    plainSummary:
      "Turns your writing plus code into a polished article, report, or slides — exporting to Word, PDF, or web.",
    useCase:
      "You want a single document that runs your analysis and produces a submission-ready manuscript.",
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
    note: "NOT primarily GitHub-hosted: the authoritative source and SVN repository live at r-project.org (read-only GitHub mirrors exist). No canonical org repo to attach a star count to, so stars is intentionally left undefined.",
    verifiedAt: "2026-05-30",
    icon: "📐",
    plainSummary:
      "The free statistics language that powers most biostatistics and epidemiology, with thousands of add-on packages.",
    useCase:
      "You need rigorous, reproducible statistical analysis (regression, survival, mixed models) with publication-quality output.",
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
    stars: 11435,
    verifiedAt: "2026-05-30",
    icon: "📈",
    plainSummary:
      "A Python toolbox for statistical models and tests that prints detailed result tables ready for a paper.",
    useCase:
      "You analyze data in Python and need trustworthy regression, GLM, or hypothesis-test results with full summaries.",
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
    stars: 14725,
    verifiedAt: "2026-05-30",
    icon: "🧮",
    plainSummary:
      "The math engine behind Python science — statistical tests, curve fitting, and number crunching.",
    useCase:
      "You need a quick t-test, a distribution, or a curve fit as part of a Python analysis.",
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
    language: "C++",
    license: "AGPL-3.0",
    confidence: "established",
    verifyUrl: "https://github.com/jasp-stats/jasp-desktop",
    note: "Canonical repo jasp-stats/jasp-desktop. GitHub reports the primary language as C++ (R modules also present).",
    stars: 964,
    verifiedAt: "2026-05-30",
    icon: "🖱️",
    plainSummary:
      "Point-and-click statistics software for people who don't want to write code, with results formatted for journals.",
    useCase:
      "You're a clinician who wants proper statistics (including Bayesian) without learning to program.",
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
    stars: 22845,
    verifiedAt: "2026-05-30",
    icon: "📉",
    plainSummary:
      "Makes precise, print-quality charts in Python that meet strict journal figure requirements.",
    useCase:
      "You need a high-resolution figure (with exact labels and export format) that a journal will accept.",
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
    verifyUrl: "https://github.com/plotly/plotly.py",
    note: "Plotly's open-source graphing libraries span multiple repos (plotly/plotly.py, plotly/plotly.js, plotly/dash); verified here against plotly/plotly.py (the Python library). stars/url reflect that repo specifically.",
    stars: 18562,
    verifiedAt: "2026-05-30",
    icon: "📊",
    plainSummary:
      "Builds interactive charts you can hover and zoom — great for online supplements and dashboards.",
    useCase:
      "You want a clickable, explorable figure for an online appendix rather than a static image.",
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
    stars: 6939,
    verifiedAt: "2026-05-30",
    icon: "🎨",
    plainSummary:
      "The go-to way to make clean, consistent statistical graphics in R from your data.",
    useCase:
      "You analyze in R and want elegant, reproducible figures that flow straight from your data tables.",
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
    stars: 66202,
    verifiedAt: "2026-05-30",
    icon: "🤖",
    plainSummary:
      "A friendly toolkit of classic machine-learning methods for prediction, classification, and clustering.",
    useCase:
      "You want to build and properly validate a predictive model (e.g. a risk score or biomarker classifier).",
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
    stars: 100273,
    verifiedAt: "2026-05-30",
    icon: "🔥",
    plainSummary:
      "The engine most researchers use to build and train deep-learning (neural network) models.",
    useCase:
      "You're training a deep-learning model for medical images, genomics, or clinical prediction.",
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
    stars: 161065,
    verifiedAt: "2026-05-30",
    icon: "🤗",
    plainSummary:
      "A library of thousands of ready-made AI models you can apply to text, images, or audio.",
    useCase:
      "You want to use or fine-tune a state-of-the-art (including biomedical) AI model to classify or summarize papers.",
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
    stars: 33620,
    verifiedAt: "2026-05-30",
    icon: "💬",
    plainSummary:
      "Reads text the way a computer can understand it — splitting sentences and spotting names, places, and terms.",
    useCase:
      "You want to automatically pull structured facts out of clinical notes or abstracts at scale.",
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
    stars: 1959,
    verifiedAt: "2026-05-30",
    icon: "🧬",
    plainSummary:
      "A version of spaCy trained on medical text that recognizes diseases, drugs, and genes and links them to official lists.",
    useCase:
      "You're mining lots of papers and need to detect biomedical terms and match them to standard ontologies.",
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
    confidence: "likely",
    verifyUrl: "https://github.com/iterative/dvc",
    note: "Highly confident the canonical repo is iterative/dvc (referenced as the upstream by the iterative org's many DVC tutorial/example repos and across the wider DVC ecosystem). However, the live GitHub search index did not return the main repo and direct repo access was unavailable in this session, so its stargazers_count could not be fetched — stars is intentionally left undefined and confidence is downgraded to \"likely\" pending a direct star-count confirmation.",
    verifiedAt: "2026-05-30",
    icon: "🗃️",
    plainSummary:
      "Version control for your data and models, like Git but for the big files that don't fit in code repositories.",
    useCase:
      "You want every version of your dataset and model tracked alongside the code so results stay reproducible.",
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
    stars: 2793,
    verifiedAt: "2026-05-30",
    icon: "🐍",
    plainSummary:
      "Writes down the recipe for your analysis so the whole thing can be re-run start to finish with one command.",
    useCase:
      "Your study has many analysis steps and you want anyone to reproduce all of them automatically.",
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
    note: "Canonical repo nextflow-io/nextflow. GitHub reports the primary language as Groovy (Java also present). Now developed under Seqera (formerly Seqera Labs).",
    stars: 3406,
    verifiedAt: "2026-05-30",
    icon: "🔗",
    plainSummary:
      "Runs the same analysis pipeline identically on your laptop, a cluster, or the cloud.",
    useCase:
      "You run bioinformatics pipelines and need them to behave the same everywhere for reproducibility.",
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
