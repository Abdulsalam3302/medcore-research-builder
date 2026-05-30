/**
 * Knowledge registry — Model Context Protocol (MCP) servers useful for medical /
 * academic research workflows.
 *
 * HONESTY NOTE: This file is curated by hand. We do NOT invent specific GitHub
 * URLs we are unsure of. For servers maintained in the official
 * `modelcontextprotocol` organisation we use `confidence: "established"` and link
 * the canonical reference-servers repo. For ecosystem / community servers (or
 * capabilities that "exist or are buildable" against a known public API) we use
 * `confidence: "likely"` and an honest `note`, and the `verifyUrl` points at the
 * official MCP servers repo or the vendor's own known site rather than an
 * unverified third-party repo path. Consistent with the platform's
 * no-fabrication ethos — always verify at the source before relying on a server.
 */

export type MCPConfidence = "established" | "likely";

export type MCPCategory =
  | "Databases"
  | "Filesystem & version control"
  | "Search & web"
  | "Biomedical & scientific data"
  | "Reasoning & memory"
  | "Analysis & code execution"
  | "Documents & PDF"
  | "Productivity & collaboration"
  | "Cloud & DevOps";

export type MCPServer = {
  id: string;
  name: string;
  vendor?: string;
  category: MCPCategory;
  capability: string;
  useInResearch: string;
  confidence: MCPConfidence;
  verifyUrl: string;
  note?: string;
  /** One friendly sentence a non-technical researcher understands. */
  plainSummary?: string;
  /** A single emoji representing the tool/category. */
  icon?: string;
  /** A concrete "you'd use this when…" example in plain language. */
  useCase?: string;
};

/** Canonical homes we are confident about. */
const MCP_SERVERS_REPO = "https://github.com/modelcontextprotocol/servers";
const MCP_SITE = "https://modelcontextprotocol.io/";

export const mcpServers: MCPServer[] = [
  /* ── Databases ───────────────────────────────────────────────────────── */
  {
    id: "postgres",
    name: "PostgreSQL",
    vendor: "modelcontextprotocol (reference)",
    category: "Databases",
    capability: "Read-only SQL access to a PostgreSQL database with schema inspection.",
    useInResearch:
      "Query a study database (REDCap export, registry, EHR extract) in natural language and pull tabular results for analysis.",
    confidence: "established",
    verifyUrl: MCP_SERVERS_REPO,
    note: "Reference/community server in the official MCP servers repo (some reference servers have moved to the archived set; confirm current location).",
    icon: "🗄️",
    plainSummary:
      "Lets an AI assistant safely read your study database and answer questions about it in plain English.",
    useCase:
      "You'd use this when you want to ask questions about a REDCap or registry export without writing SQL yourself.",
  },
  {
    id: "sqlite",
    name: "SQLite",
    vendor: "modelcontextprotocol (reference)",
    category: "Databases",
    capability: "Query and inspect a local SQLite database file.",
    useInResearch:
      "Explore a self-contained analysis dataset shipped as a .sqlite file without standing up a database server.",
    confidence: "established",
    verifyUrl: MCP_SERVERS_REPO,
    icon: "🗄️",
    plainSummary:
      "Opens a single-file database so an assistant can explore your dataset with no setup.",
    useCase:
      "You'd use this when a colleague hands you a .sqlite data file and you just want to ask it questions.",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    vendor: "MongoDB",
    category: "Databases",
    capability: "Query and manage MongoDB collections and documents.",
    useInResearch:
      "Work with semi-structured study data (e.g. JSON questionnaire responses, device telemetry) stored in document collections.",
    confidence: "likely",
    verifyUrl: "https://www.mongodb.com/",
    note: "MongoDB publishes an official MCP server; verify the current package/repo via the vendor site.",
    icon: "🗄️",
    plainSummary:
      "Connects to a flexible document database so an assistant can read free-form study data.",
    useCase:
      "You'd use this when your data is stored as JSON-style records, like questionnaire responses or device readings.",
  },
  {
    id: "mysql",
    name: "MySQL / MariaDB",
    category: "Databases",
    capability: "Execute SQL queries against MySQL-compatible databases.",
    useInResearch:
      "Pull cohorts or measurements from an institutional MySQL data warehouse for downstream analysis.",
    confidence: "likely",
    verifyUrl: MCP_SERVERS_REPO,
    note: "Multiple community MySQL MCP servers exist; pick and verify one rather than assuming a single canonical repo.",
    icon: "🗄️",
    plainSummary:
      "Lets an assistant pull data from a common type of institutional database.",
    useCase:
      "You'd use this to fetch a cohort or set of measurements from your institution's data warehouse.",
  },
  {
    id: "redis",
    name: "Redis",
    vendor: "Redis",
    category: "Databases",
    capability: "Interact with a Redis key-value store.",
    useInResearch:
      "Cache intermediate computation, manage job queues, or store ephemeral state in an analysis pipeline.",
    confidence: "likely",
    verifyUrl: "https://redis.io/",
    note: "Redis has published MCP tooling; confirm the exact server at the vendor site.",
    icon: "⚡",
    plainSummary:
      "A super-fast temporary store an assistant can use to remember things mid-task.",
    useCase:
      "You'd use this in a data pipeline to cache results or manage a queue of jobs.",
  },

  /* ── Filesystem & version control ────────────────────────────────────── */
  {
    id: "filesystem",
    name: "Filesystem",
    vendor: "modelcontextprotocol (reference)",
    category: "Filesystem & version control",
    capability: "Read, write, and list files within configured, sandboxed directories.",
    useInResearch:
      "Let an assistant read your manuscript drafts, data files, and outputs from a project folder and write revised versions back.",
    confidence: "established",
    verifyUrl: MCP_SERVERS_REPO,
    icon: "📁",
    plainSummary:
      "Gives an assistant safe access to a specific project folder to read and update your files.",
    useCase:
      "You'd use this so an assistant can read your draft and data and save revised versions back to your folder.",
  },
  {
    id: "git",
    name: "Git",
    vendor: "modelcontextprotocol (reference)",
    category: "Filesystem & version control",
    capability: "Read, search, and inspect a local Git repository (status, log, diff).",
    useInResearch:
      "Track and review changes to analysis code and manuscript revisions for reproducibility and provenance.",
    confidence: "established",
    verifyUrl: MCP_SERVERS_REPO,
    icon: "🕓",
    plainSummary:
      "Lets an assistant see the full history of changes to your project files.",
    useCase:
      "You'd use this to review what changed in your analysis or manuscript over time.",
  },
  {
    id: "github",
    name: "GitHub",
    vendor: "GitHub",
    category: "Filesystem & version control",
    capability: "Interact with GitHub repos, issues, pull requests, code search, and releases.",
    useInResearch:
      "Manage a study's code repository, open issues for analysis tasks, and review collaborators' contributions.",
    confidence: "established",
    verifyUrl: "https://github.com/github/github-mcp-server",
    note: "GitHub maintains an official MCP server (github-mcp-server); a reference variant also exists in the MCP servers repo.",
    icon: "🐙",
    plainSummary:
      "Lets an assistant work with your shared online code project — its files, tasks, and reviews.",
    useCase:
      "You'd use this to manage your study's code repository and coordinate with collaborators.",
  },
  {
    id: "gitlab",
    name: "GitLab",
    vendor: "modelcontextprotocol (reference) / GitLab",
    category: "Filesystem & version control",
    capability: "Interact with GitLab projects, issues, and merge requests.",
    useInResearch:
      "Coordinate analysis code and documentation for teams hosting on institutional GitLab instances.",
    confidence: "likely",
    verifyUrl: MCP_SERVERS_REPO,
    note: "A GitLab server appears among MCP reference/community servers; verify the current location and maintainer.",
    icon: "🦊",
    plainSummary:
      "Like the GitHub connector, but for teams hosting their code on GitLab instead.",
    useCase:
      "You'd use this if your institution runs its own GitLab for project code and docs.",
  },

  /* ── Search & web ────────────────────────────────────────────────────── */
  {
    id: "fetch",
    name: "Fetch",
    vendor: "modelcontextprotocol (reference)",
    category: "Search & web",
    capability: "Fetch a URL and convert its content to Markdown for the model to read.",
    useInResearch:
      "Pull the text of a guideline page, a journal author-instructions page, or a public dataset description for summarization.",
    confidence: "established",
    verifyUrl: MCP_SERVERS_REPO,
    icon: "🌐",
    plainSummary:
      "Grabs the readable text from a web page so an assistant can summarize it for you.",
    useCase:
      "You'd use this to pull a journal's author-instructions page and have it summarized.",
  },
  {
    id: "brave-search",
    name: "Brave Search",
    vendor: "Brave",
    category: "Search & web",
    capability: "Web and local search via the Brave Search API.",
    useInResearch:
      "Run background web searches to scope a topic, find institutional pages, or locate reporting guidelines.",
    confidence: "established",
    verifyUrl: MCP_SERVERS_REPO,
    note: "Brave Search server is part of the MCP servers ecosystem; requires a Brave Search API key.",
    icon: "🔍",
    plainSummary:
      "Lets an assistant run web searches for you to scope out a topic.",
    useCase:
      "You'd use this for background searches, like finding reporting guidelines or institutional pages.",
  },
  {
    id: "tavily",
    name: "Tavily",
    vendor: "Tavily",
    category: "Search & web",
    capability: "Search and web-content extraction optimized for LLM/agent use.",
    useInResearch:
      "Agentic literature/context gathering with cleaned, citation-friendly extracts of web sources.",
    confidence: "likely",
    verifyUrl: "https://tavily.com/",
    note: "Tavily provides an MCP integration; confirm the current package at the vendor site. Requires an API key.",
    icon: "🔍",
    plainSummary:
      "A web search built for AI that returns clean, quotable extracts instead of messy pages.",
    useCase:
      "You'd use this when you want an assistant to gather web context it can cite cleanly.",
  },
  {
    id: "puppeteer-playwright",
    name: "Browser automation (Puppeteer / Playwright)",
    vendor: "modelcontextprotocol (reference) / Microsoft",
    category: "Search & web",
    capability: "Drive a headless browser to navigate pages, click, and capture content or screenshots.",
    useInResearch:
      "Retrieve content from JavaScript-heavy pages (e.g. dynamic dashboards) when a plain fetch is insufficient.",
    confidence: "likely",
    verifyUrl: MCP_SERVERS_REPO,
    note: "Both a reference Puppeteer server and Microsoft's Playwright MCP exist; verify which you adopt and its current home.",
    icon: "🖥️",
    plainSummary:
      "Drives a web browser automatically to reach content that a simple page-grab can't.",
    useCase:
      "You'd use this for interactive dashboards or pages that only load content after clicking.",
  },

  /* ── Biomedical & scientific data ────────────────────────────────────── */
  {
    id: "pubmed",
    name: "PubMed / NCBI E-utilities",
    vendor: "Community (NCBI API)",
    category: "Biomedical & scientific data",
    capability: "Search and retrieve biomedical citations and abstracts from PubMed/MEDLINE.",
    useInResearch:
      "Run structured literature searches, pull abstracts and PMIDs, and seed reference lists for a review.",
    confidence: "likely",
    verifyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK25501/",
    note: "An MCP server exists or is readily buildable over the public NCBI E-utilities API; verify a specific community server before relying on it. Respect NCBI rate limits / API key policy.",
    icon: "📚",
    plainSummary:
      "Searches the world's biggest medical-literature database and pulls back abstracts and IDs.",
    useCase:
      "You'd use this to run a structured literature search and start a reference list for a review.",
  },
  {
    id: "clinicaltrials",
    name: "ClinicalTrials.gov",
    vendor: "Community (ClinicalTrials.gov API v2)",
    category: "Biomedical & scientific data",
    capability: "Search and retrieve registered clinical trials, eligibility, and outcome measures.",
    useInResearch:
      "Scope the trial landscape for a condition/intervention, find investigators, and benchmark endpoints during protocol design.",
    confidence: "likely",
    verifyUrl: "https://clinicaltrials.gov/data-api/api",
    note: "Wraps the official ClinicalTrials.gov API v2; an MCP server exists or is buildable. Verify the specific server.",
    icon: "🧪",
    plainSummary:
      "Looks up registered clinical trials — who's running them, who can join, and what they measure.",
    useCase:
      "You'd use this to scope existing trials for a condition and benchmark outcome measures when designing a protocol.",
  },
  {
    id: "biorxiv-medrxiv",
    name: "bioRxiv / medRxiv",
    vendor: "Community (bioRxiv API, CSHL)",
    category: "Biomedical & scientific data",
    capability: "Search preprints and retrieve metadata/abstracts from bioRxiv and medRxiv.",
    useInResearch:
      "Track the latest non-peer-reviewed findings in a field and check whether a preprint has since been published.",
    confidence: "likely",
    verifyUrl: "https://api.biorxiv.org/",
    note: "Built over the official bioRxiv/medRxiv API. Preprints are NOT peer reviewed — treat findings with caution.",
    icon: "📰",
    plainSummary:
      "Finds the newest preprints (early papers shared before peer review) in biology and medicine.",
    useCase:
      "You'd use this to track cutting-edge findings, but remember these papers haven't been peer reviewed yet.",
  },
  {
    id: "europepmc",
    name: "Europe PMC",
    vendor: "Community (Europe PMC RESTful API, EMBL-EBI)",
    category: "Biomedical & scientific data",
    capability: "Search biomedical literature and full text, with citation and reference links.",
    useInResearch:
      "Broaden a literature search beyond PubMed (includes preprints, patents, and full text where open).",
    confidence: "likely",
    verifyUrl: "https://europepmc.org/RestfulWebService",
    note: "Wraps the public Europe PMC RESTful API; an MCP server exists or is buildable. Verify the specific server.",
    icon: "📚",
    plainSummary:
      "A broad literature search that includes full text, preprints, and patents — wider than PubMed alone.",
    useCase:
      "You'd use this when you want to cast a wider net than PubMed for your evidence search.",
  },
  {
    id: "openalex",
    name: "OpenAlex",
    vendor: "Community (OpenAlex API, OurResearch)",
    category: "Biomedical & scientific data",
    capability: "Query a large open scholarly graph of works, authors, venues, institutions, and concepts.",
    useInResearch:
      "Map a research landscape, find related works and citation networks, and gather open metadata for bibliometrics.",
    confidence: "likely",
    verifyUrl: "https://docs.openalex.org/",
    note: "Built over the open, free OpenAlex API; an MCP server exists or is buildable. Verify the specific server.",
    icon: "🕸️",
    plainSummary:
      "Maps how papers, authors, and institutions connect, so you can see a whole research landscape.",
    useCase:
      "You'd use this to find related work and citation networks around your topic.",
  },
  {
    id: "semantic-scholar",
    name: "Semantic Scholar",
    vendor: "Community (Semantic Scholar API, AI2)",
    category: "Biomedical & scientific data",
    capability: "Search papers, fetch metadata, abstracts, citations, and references (Academic Graph API).",
    useInResearch:
      "Discover influential and related papers, build citation graphs, and pull TLDR summaries for triage.",
    confidence: "likely",
    verifyUrl: "https://www.semanticscholar.org/product/api",
    note: "Wraps the Semantic Scholar Academic Graph API; an MCP server exists or is buildable. Verify the specific server.",
    icon: "🔬",
    plainSummary:
      "Finds influential and related papers and gives you short AI summaries to triage them quickly.",
    useCase:
      "You'd use this to discover the most important papers on a topic and skim their gist fast.",
  },
  {
    id: "crossref",
    name: "Crossref",
    vendor: "Community (Crossref REST API)",
    category: "Biomedical & scientific data",
    capability: "Resolve DOIs and retrieve authoritative bibliographic metadata for works.",
    useInResearch:
      "Validate and complete reference metadata by DOI for accurate, machine-checkable bibliographies.",
    confidence: "likely",
    verifyUrl: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/",
    note: "Built over the public Crossref REST API; an MCP server exists or is buildable. Verify the specific server.",
    icon: "🔖",
    plainSummary:
      "Looks up the official details of a paper from its DOI so your citations are accurate.",
    useCase:
      "You'd use this to confirm and complete reference details by DOI before finalizing a bibliography.",
  },
  {
    id: "arxiv",
    name: "arXiv",
    vendor: "Community (arXiv API)",
    category: "Biomedical & scientific data",
    capability: "Search arXiv preprints and retrieve metadata and abstracts.",
    useInResearch:
      "Track methods/ML preprints relevant to computational and AI-for-health research.",
    confidence: "likely",
    verifyUrl: "https://info.arxiv.org/help/api/index.html",
    note: "Built over the public arXiv API; multiple community MCP servers exist. Verify the specific one.",
    icon: "📰",
    plainSummary:
      "Searches the main preprint archive for math, physics, and AI/methods papers.",
    useCase:
      "You'd use this to track new machine-learning or methods papers relevant to AI-for-health work.",
  },
  {
    id: "openfda",
    name: "openFDA",
    vendor: "Community (openFDA API, U.S. FDA)",
    category: "Biomedical & scientific data",
    capability: "Query FDA drug labels, adverse-event reports, recalls, and device data.",
    useInResearch:
      "Pharmacovigilance background, drug-label checks, and safety-signal context for clinical research.",
    confidence: "likely",
    verifyUrl: "https://open.fda.gov/apis/",
    note: "Built over the public openFDA API; an MCP server exists or is buildable. Verify the specific server.",
    icon: "💊",
    plainSummary:
      "Looks up official FDA data on drug labels, side-effect reports, and recalls.",
    useCase:
      "You'd use this for drug-safety background or to check a label during clinical research.",
  },
  {
    id: "who-gho",
    name: "WHO Global Health Observatory",
    vendor: "Community (WHO GHO OData API)",
    category: "Biomedical & scientific data",
    capability: "Retrieve global health indicators and datasets.",
    useInResearch:
      "Pull population-level health statistics for background, denominators, and global-burden context.",
    confidence: "likely",
    verifyUrl: "https://www.who.int/data/gho/info/gho-odata-api",
    note: "Built over the WHO GHO OData API; an MCP server exists or is buildable. Verify the specific server.",
    icon: "🌍",
    plainSummary:
      "Pulls global health statistics from the World Health Organization.",
    useCase:
      "You'd use this for population-level numbers and global-burden context in your background section.",
  },
  {
    id: "europe-pmc-grist-icite",
    name: "iCite / NIH RePORTER",
    vendor: "Community (NIH APIs)",
    category: "Biomedical & scientific data",
    capability: "Access NIH bibliometrics (iCite) and funded-project data (RePORTER).",
    useInResearch:
      "Assess citation influence (RCR) and identify funding landscape and related funded projects.",
    confidence: "likely",
    verifyUrl: "https://api.reporter.nih.gov/",
    note: "Built over public NIH iCite/RePORTER APIs; an MCP server exists or is buildable. Verify the specific server.",
    icon: "💰",
    plainSummary:
      "Shows how influential a paper is and which NIH grants fund work in your area.",
    useCase:
      "You'd use this to gauge a paper's citation impact or scout the funding landscape for a topic.",
  },

  /* ── Reasoning & memory ──────────────────────────────────────────────── */
  {
    id: "memory",
    name: "Memory (knowledge graph)",
    vendor: "modelcontextprotocol (reference)",
    category: "Reasoning & memory",
    capability: "Persistent knowledge-graph memory of entities, relations, and observations.",
    useInResearch:
      "Maintain durable context across a long literature review or project (key papers, definitions, decisions).",
    confidence: "established",
    verifyUrl: MCP_SERVERS_REPO,
    icon: "🧠",
    plainSummary:
      "Gives an assistant a long-term memory so it remembers your project's key facts between sessions.",
    useCase:
      "You'd use this on a long review so the assistant keeps track of key papers and decisions over weeks.",
  },
  {
    id: "sequential-thinking",
    name: "Sequential Thinking",
    vendor: "modelcontextprotocol (reference)",
    category: "Reasoning & memory",
    capability: "Structured, step-by-step reasoning scaffold for complex multi-step problems.",
    useInResearch:
      "Break a complex analysis plan or methods-design problem into auditable reasoning steps.",
    confidence: "established",
    verifyUrl: MCP_SERVERS_REPO,
    icon: "🪜",
    plainSummary:
      "Encourages an assistant to think through a hard problem one clear step at a time.",
    useCase:
      "You'd use this when planning a complex analysis and want the reasoning laid out you can check.",
  },
  {
    id: "time",
    name: "Time",
    vendor: "modelcontextprotocol (reference)",
    category: "Reasoning & memory",
    capability: "Current time and timezone conversions.",
    useInResearch:
      "Timestamp analyses and coordinate deadlines/scheduling across collaborator timezones.",
    confidence: "established",
    verifyUrl: MCP_SERVERS_REPO,
    icon: "⏰",
    plainSummary:
      "Tells the assistant the current time and converts between time zones.",
    useCase:
      "You'd use this to coordinate deadlines across collaborators in different time zones.",
  },

  /* ── Analysis & code execution ───────────────────────────────────────── */
  {
    id: "jupyter",
    name: "Jupyter",
    vendor: "Community / datalayer",
    category: "Analysis & code execution",
    capability: "Connect to a Jupyter kernel/server to run cells and read outputs.",
    useInResearch:
      "Execute reproducible analysis notebooks and surface figures/tables to the assistant for interpretation.",
    confidence: "likely",
    verifyUrl: "https://jupyter.org/",
    note: "Community Jupyter MCP servers exist (e.g. from the Jupyter/datalayer ecosystem); verify the specific server.",
    icon: "📓",
    plainSummary:
      "Lets an assistant run your analysis notebook and read the resulting figures and tables.",
    useCase:
      "You'd use this to have an assistant run a notebook and explain the outputs.",
  },
  {
    id: "code-execution",
    name: "Code execution sandbox",
    category: "Analysis & code execution",
    capability: "Run code (often Python) in a sandboxed interpreter and return results.",
    useInResearch:
      "Perform quick statistics, data transforms, or plot generation without a separate environment.",
    confidence: "likely",
    verifyUrl: MCP_SERVERS_REPO,
    note: "Several community code-execution/sandbox MCP servers exist with differing isolation guarantees; vet sandboxing before use.",
    icon: "🧮",
    plainSummary:
      "Lets an assistant run small bits of code safely to do quick calculations or make a plot.",
    useCase:
      "You'd use this for a fast statistic or chart without setting up your own environment.",
  },
  {
    id: "e2b",
    name: "E2B code interpreter",
    vendor: "E2B",
    category: "Analysis & code execution",
    capability: "Cloud sandboxed runtime for executing AI-generated code.",
    useInResearch:
      "Run heavier or untrusted analysis code in an isolated cloud sandbox rather than locally.",
    confidence: "likely",
    verifyUrl: "https://e2b.dev/",
    note: "E2B provides sandbox tooling with MCP integrations; confirm the current package at the vendor site.",
    icon: "📦",
    plainSummary:
      "Runs code in an isolated cloud sandbox, keeping heavier or untrusted analysis off your machine.",
    useCase:
      "You'd use this to run AI-generated analysis code safely away from your own computer.",
  },
  {
    id: "wolfram",
    name: "Wolfram Alpha",
    vendor: "Wolfram",
    category: "Analysis & code execution",
    capability: "Computational knowledge queries and symbolic/numeric computation.",
    useInResearch:
      "Quick symbolic math, unit conversions, and sanity checks on statistical/derivation steps.",
    confidence: "likely",
    verifyUrl: "https://www.wolframalpha.com/",
    note: "Wolfram offers LLM/MCP-compatible tooling; verify the current integration. Requires an API key.",
    icon: "🧮",
    plainSummary:
      "Answers math and computation questions and double-checks calculations for you.",
    useCase:
      "You'd use this for a quick unit conversion or a sanity check on a statistical formula.",
  },

  /* ── Documents & PDF ─────────────────────────────────────────────────── */
  {
    id: "pdf-reader",
    name: "PDF reader / extractor",
    category: "Documents & PDF",
    capability: "Extract text (and sometimes tables/figures) from PDF documents.",
    useInResearch:
      "Pull text from downloaded papers or protocol PDFs for summarization, extraction, or screening.",
    confidence: "likely",
    verifyUrl: MCP_SERVERS_REPO,
    note: "Multiple community PDF MCP servers exist with varying extraction quality; verify the specific one for your needs.",
    icon: "📄",
    plainSummary:
      "Pulls the text out of a PDF so an assistant can read and summarize it.",
    useCase:
      "You'd use this to extract text from a downloaded paper or protocol PDF for screening.",
  },
  {
    id: "markitdown",
    name: "MarkItDown",
    vendor: "Microsoft",
    category: "Documents & PDF",
    capability: "Convert Office/PDF/HTML documents to Markdown for LLM consumption.",
    useInResearch:
      "Normalize heterogeneous documents (DOCX, PPTX, PDF) into clean Markdown before analysis.",
    confidence: "likely",
    verifyUrl: "https://github.com/microsoft/markitdown",
    note: "Microsoft's MarkItDown ships an MCP server component; verify the current location/usage in the repo.",
    icon: "📑",
    plainSummary:
      "Converts Word, PowerPoint, and PDF files into clean text an assistant can work with.",
    useCase:
      "You'd use this to tidy up a mix of documents into one consistent format before analysis.",
  },
  {
    id: "pandoc",
    name: "Pandoc converter",
    category: "Documents & PDF",
    capability: "Convert between document formats (Markdown, DOCX, LaTeX, PDF, HTML).",
    useInResearch:
      "Transform a Markdown/LaTeX manuscript into the DOCX/PDF format a journal requires.",
    confidence: "likely",
    verifyUrl: "https://pandoc.org/",
    note: "Community MCP wrappers around Pandoc exist; verify the specific server. Pandoc itself is the authoritative tool.",
    icon: "🔄",
    plainSummary:
      "Converts a document between formats — like turning your draft into the Word or PDF a journal wants.",
    useCase:
      "You'd use this to reformat your manuscript into the exact file type a journal requires.",
  },

  /* ── Productivity & collaboration ────────────────────────────────────── */
  {
    id: "slack",
    name: "Slack",
    vendor: "modelcontextprotocol (reference) / community",
    category: "Productivity & collaboration",
    capability: "Read and post messages, list channels, and search a Slack workspace.",
    useInResearch:
      "Coordinate a research team — post analysis updates, fetch decisions, and surface discussion context.",
    confidence: "likely",
    verifyUrl: MCP_SERVERS_REPO,
    note: "A Slack server appears among MCP reference/community servers; verify current location and required scopes.",
    icon: "💬",
    plainSummary:
      "Lets an assistant read and post in your team's Slack to keep everyone in the loop.",
    useCase:
      "You'd use this to post analysis updates or pull team decisions into your work.",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    vendor: "modelcontextprotocol (reference) / community",
    category: "Productivity & collaboration",
    capability: "List, search, and read files from Google Drive.",
    useInResearch:
      "Access shared datasets, manuscripts, and supplementary files stored in a lab's Drive.",
    confidence: "likely",
    verifyUrl: MCP_SERVERS_REPO,
    note: "A Google Drive server appears among MCP servers; OAuth setup and scopes vary — verify before use.",
    icon: "📁",
    plainSummary:
      "Lets an assistant find and read files stored in your Google Drive.",
    useCase:
      "You'd use this to reach shared datasets and manuscripts kept in your lab's Drive.",
  },
  {
    id: "notion",
    name: "Notion",
    vendor: "Notion",
    category: "Productivity & collaboration",
    capability: "Read and write Notion pages and databases.",
    useInResearch:
      "Manage a study's notes, task tracker, and living protocol/data dictionary in Notion.",
    confidence: "likely",
    verifyUrl: "https://www.notion.so/",
    note: "Notion provides official MCP/API tooling; confirm the current server at the vendor site.",
    icon: "🗒️",
    plainSummary:
      "Lets an assistant read and update your notes and trackers in Notion.",
    useCase:
      "You'd use this to keep a study's notes, tasks, and data dictionary current in Notion.",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    vendor: "Community",
    category: "Productivity & collaboration",
    capability: "Read and write spreadsheet data in Google Sheets.",
    useInResearch:
      "Maintain shared data-collection sheets and extract them for analysis.",
    confidence: "likely",
    verifyUrl: "https://developers.google.com/sheets/api",
    note: "Community Sheets MCP servers exist over the Google Sheets API; verify the specific server and OAuth scopes.",
    icon: "📋",
    plainSummary:
      "Lets an assistant read and write your shared spreadsheets in Google Sheets.",
    useCase:
      "You'd use this to maintain a shared data-collection sheet and pull it in for analysis.",
  },
  {
    id: "zotero-mcp",
    name: "Zotero",
    vendor: "Community (Zotero API)",
    category: "Productivity & collaboration",
    capability: "Search a Zotero library and retrieve items, metadata, and notes.",
    useInResearch:
      "Let an assistant draw on your curated reference library when drafting or checking citations.",
    confidence: "likely",
    verifyUrl: "https://www.zotero.org/support/dev/web_api/v3/start",
    note: "Built over the public Zotero Web API; community MCP servers exist. Verify the specific server.",
    icon: "📚",
    plainSummary:
      "Lets an assistant draw on your personal Zotero reference library while you write.",
    useCase:
      "You'd use this so an assistant can cite from the papers you've already collected.",
  },

  /* ── Cloud & DevOps ──────────────────────────────────────────────────── */
  {
    id: "aws",
    name: "AWS",
    vendor: "Amazon Web Services",
    category: "Cloud & DevOps",
    capability: "Interact with AWS services (e.g. S3 storage, and others) via official MCP servers.",
    useInResearch:
      "Access datasets in S3, manage compute, and orchestrate cloud analysis resources.",
    confidence: "likely",
    verifyUrl: "https://github.com/awslabs/mcp",
    note: "AWS Labs maintains a suite of official MCP servers; pick the specific service server and verify in that repo.",
    icon: "☁️",
    plainSummary:
      "Lets an assistant work with your Amazon cloud — like datasets stored in S3 or cloud computing.",
    useCase:
      "You'd use this to reach big datasets or run analysis on Amazon's cloud.",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    vendor: "Cloudflare",
    category: "Cloud & DevOps",
    capability: "Manage and query Cloudflare services (Workers, KV, R2, etc.).",
    useInResearch:
      "Operate lightweight data endpoints or storage backing a research tool or dashboard.",
    confidence: "likely",
    verifyUrl: "https://github.com/cloudflare/mcp-server-cloudflare",
    note: "Cloudflare maintains official MCP servers; verify the current repo/package.",
    icon: "☁️",
    plainSummary:
      "Lets an assistant manage lightweight cloud storage and services on Cloudflare.",
    useCase:
      "You'd use this to run a small data endpoint behind a research tool or dashboard.",
  },
  {
    id: "docker",
    name: "Docker",
    vendor: "Community / Docker",
    category: "Cloud & DevOps",
    capability: "Manage containers and images for reproducible environments.",
    useInResearch:
      "Spin up the exact pinned environment a published analysis requires, improving reproducibility.",
    confidence: "likely",
    verifyUrl: "https://www.docker.com/",
    note: "Docker-related MCP servers exist (community and official efforts); verify the specific one.",
    icon: "📦",
    plainSummary:
      "Packages an analysis with its exact software so it runs the same way for anyone.",
    useCase:
      "You'd use this to recreate the precise environment a published analysis needs.",
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    vendor: "Community",
    category: "Cloud & DevOps",
    capability: "Inspect and manage Kubernetes cluster resources.",
    useInResearch:
      "Operate scaled analysis jobs or services on an institutional/cloud cluster.",
    confidence: "likely",
    verifyUrl: "https://kubernetes.io/",
    note: "Several community Kubernetes MCP servers exist with differing permissions models; vet access scope before use.",
    icon: "⚙️",
    plainSummary:
      "Manages large analysis jobs running across many machines.",
    useCase:
      "You'd use this to operate scaled-up analysis on an institutional or cloud cluster.",
  },
  {
    id: "sentry",
    name: "Sentry",
    vendor: "Sentry",
    category: "Cloud & DevOps",
    capability: "Query errors and issues from Sentry.",
    useInResearch:
      "Diagnose failures in a research web tool or data pipeline you operate.",
    confidence: "likely",
    verifyUrl: "https://sentry.io/",
    note: "Sentry provides MCP tooling; confirm the current server at the vendor site.",
    icon: "🐞",
    plainSummary:
      "Surfaces errors from a tool or pipeline you run so you can fix what's breaking.",
    useCase:
      "You'd use this to diagnose failures in a research web tool or data pipeline you operate.",
  },
  {
    id: "everything",
    name: "Everything (reference/test server)",
    vendor: "modelcontextprotocol (reference)",
    category: "Analysis & code execution",
    capability: "Exercises MCP features (prompts, tools, resources) — a reference/test server.",
    useInResearch:
      "Useful for learning MCP and testing a client; not a data source itself.",
    confidence: "established",
    verifyUrl: MCP_SERVERS_REPO,
    icon: "🧰",
    plainSummary:
      "A demo connector for learning how these tools work — not a real data source.",
    useCase:
      "You'd use this only to try out and test how MCP connectors behave.",
  },
  {
    id: "sentry-placeholder-protocol",
    name: "MCP protocol & SDKs (foundation)",
    vendor: "modelcontextprotocol",
    category: "Reasoning & memory",
    capability: "The open MCP specification and official SDKs that all servers above build on.",
    useInResearch:
      "Reference point for building or auditing any custom research MCP server (e.g. wrapping an institutional API).",
    confidence: "established",
    verifyUrl: MCP_SITE,
    note: "Authoritative spec and SDKs; consult before building a bespoke server for your data source.",
    icon: "🧱",
    plainSummary:
      "The open standard that all the connectors above are built on.",
    useCase:
      "You'd use this as the starting point if you wanted to build a custom connector to your own data.",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    vendor: "Community",
    category: "Productivity & collaboration",
    capability: "Read and search an Obsidian vault of Markdown notes.",
    useInResearch:
      "Surface a researcher's personal knowledge base (notes, paper summaries) during drafting.",
    confidence: "likely",
    verifyUrl: "https://obsidian.md/",
    note: "Community Obsidian MCP servers exist (often via the Local REST API plugin); verify the specific one.",
    icon: "🗒️",
    plainSummary:
      "Lets an assistant search your personal notes vault while you write.",
    useCase:
      "You'd use this to surface your own paper summaries and notes during drafting.",
  },
  {
    id: "elasticsearch",
    name: "Elasticsearch / OpenSearch",
    vendor: "Elastic / community",
    category: "Databases",
    capability: "Full-text and vector search over indexed documents.",
    useInResearch:
      "Search a corpus of indexed papers or notes (including semantic/vector retrieval) for evidence synthesis.",
    confidence: "likely",
    verifyUrl: "https://www.elastic.co/",
    note: "Elastic and community maintainers provide MCP servers; verify the specific server and index access.",
    icon: "🔍",
    plainSummary:
      "Searches a big collection of documents fast, including by meaning, not just exact words.",
    useCase:
      "You'd use this to search a large corpus of papers or notes for evidence synthesis.",
  },
  {
    id: "qdrant",
    name: "Qdrant (vector DB)",
    vendor: "Qdrant",
    category: "Databases",
    capability: "Store and query embeddings in a vector database for semantic retrieval.",
    useInResearch:
      "Back a retrieval-augmented literature assistant with semantic search over paper embeddings.",
    confidence: "likely",
    verifyUrl: "https://qdrant.tech/",
    note: "Qdrant provides an MCP server; confirm the current package at the vendor site.",
    icon: "🧲",
    plainSummary:
      "Stores papers by meaning so an assistant can find the most relevant ones by topic, not keywords.",
    useCase:
      "You'd use this to power a 'find papers like this one' literature assistant.",
  },
  {
    id: "google-maps",
    name: "Google Maps",
    vendor: "modelcontextprotocol (reference) / community",
    category: "Search & web",
    capability: "Geocoding, places, and directions via the Google Maps API.",
    useInResearch:
      "Geolocate study sites, compute distances for site-selection or accessibility analyses.",
    confidence: "likely",
    verifyUrl: MCP_SERVERS_REPO,
    note: "A Google Maps server appears among MCP servers; requires a Maps API key. Verify the current location.",
    icon: "🗺️",
    plainSummary:
      "Finds locations and distances on a map for an assistant.",
    useCase:
      "You'd use this to map study sites or work out travel distances for accessibility analyses.",
  },
  {
    id: "datasette",
    name: "Datasette",
    vendor: "Community",
    category: "Databases",
    capability: "Query data published as Datasette (SQLite-backed) instances.",
    useInResearch:
      "Explore and query open datasets that researchers publish via Datasette.",
    confidence: "likely",
    verifyUrl: "https://datasette.io/",
    note: "Community MCP integrations for Datasette exist; verify the specific server.",
    icon: "🗄️",
    plainSummary:
      "Lets an assistant query open datasets that researchers publish online.",
    useCase:
      "You'd use this to explore a public dataset someone shared as a Datasette site.",
  },
];

/** Group servers by category, preserving first-seen category order. */
export function mcpByCategory(): Map<MCPCategory, MCPServer[]> {
  const map = new Map<MCPCategory, MCPServer[]>();
  for (const server of mcpServers) {
    const bucket = map.get(server.category);
    if (bucket) {
      bucket.push(server);
    } else {
      map.set(server.category, [server]);
    }
  }
  return map;
}
