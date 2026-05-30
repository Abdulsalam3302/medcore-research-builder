// Research Skills Library
// Authored, actionable skills that empower specific research-writing tasks.
// These are first-party expertise (not external facts to verify): each skill is
// written to be concrete, correct, and immediately usable.

export type SkillArea =
  | "title"
  | "abstract"
  | "introduction"
  | "methods"
  | "results"
  | "discussion"
  | "conclusion"
  | "references"
  | "review"
  | "revision"
  | "reproducibility"
  | "statistics"
  | "figures"
  | "ethics"
  | "writing"
  | "search"
  | "peer-review"
  | "productivity";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type ResearchSkill = {
  id: string;
  title: string;
  area: SkillArea;
  level: SkillLevel;
  whatYouLearn: string;
  steps: string[];
  pitfalls: string[];
  promptTemplate?: string;
  standards?: string[];
};

export const researchSkills: ResearchSkill[] = [
  // ──────────────────────────────────────────────────────────── TITLE
  {
    id: "title-informative",
    title: "Write an informative, design-declaring title",
    area: "title",
    level: "beginner",
    whatYouLearn:
      "How to pack population, exposure/intervention, outcome, and study design into a single readable line that survives database indexing.",
    steps: [
      "Draft a sentence stating what you studied, in whom, and what you measured.",
      "Append the study design (e.g., 'a retrospective cohort study').",
      "Cut filler words ('A study of', 'Investigation into') and redundant phrasing.",
      "Check the title reads as a noun phrase under ~15 words where the journal allows.",
      "Verify every claim in the title is supported by your actual results.",
    ],
    pitfalls: [
      "Declaring a design the data does not support (e.g., 'RCT' for an observational dataset).",
      "Using 'impact' or 'effect' when the design cannot establish causation.",
    ],
    standards: ["ICMJE"],
    promptTemplate:
      "Generate 5 manuscript titles for a {design} in {population} examining {intervention/exposure} versus {comparator} on {primary outcome}. Each <=15 words, no causal language unless justified, include the design. Rank strongest first with one-line rationale.",
  },
  {
    id: "title-avoid-spin",
    title: "Strip hype and spin from a title",
    area: "title",
    level: "intermediate",
    whatYouLearn:
      "How to remove 'novel', 'first', 'breakthrough', and overstated causal verbs that trigger reviewer skepticism.",
    steps: [
      "Flag every superlative and causal verb in the draft title.",
      "Replace causal verbs ('improves', 'reduces') with associative ones ('is associated with') unless from a trial.",
      "Remove 'novel'/'first' unless you can cite a duplicate-risk check supporting it.",
      "Re-read aloud to confirm a neutral, factual tone.",
    ],
    pitfalls: [
      "Keeping 'significant' to mean 'important' — readers will read it as statistical significance.",
      "Promising generalizability the sample cannot support.",
    ],
    standards: ["ICMJE"],
  },
  {
    id: "title-running-head",
    title: "Craft a running head and short title",
    area: "title",
    level: "beginner",
    whatYouLearn:
      "How to compress the full title into the journal's character-limited running head without losing the core message.",
    steps: [
      "Identify the single most important concept (usually outcome + population).",
      "Write a version within the journal's character limit (often 40-50 chars).",
      "Confirm it is still intelligible standing alone in a page footer.",
    ],
    pitfalls: [
      "Using undefined abbreviations the reader has not yet met.",
      "Exceeding the character limit and triggering a desk return.",
    ],
  },

  // ──────────────────────────────────────────────────────────── ABSTRACT
  {
    id: "abstract-structured",
    title: "Write a structured abstract (IMRaD)",
    area: "abstract",
    level: "beginner",
    whatYouLearn:
      "How to fill Background/Methods/Results/Conclusions sub-headings so each carries its required information within the word budget.",
    steps: [
      "Write Background as 1-2 sentences ending in the explicit objective.",
      "State design, setting, participants, and primary outcome in Methods.",
      "Report the primary result with a number, effect size, and CI — not just 'significant'.",
      "Limit Conclusions to what the primary result supports; no new data.",
      "Trim to the exact word limit, protecting the Results numbers.",
    ],
    pitfalls: [
      "Conclusions overreaching beyond the primary outcome.",
      "Reporting p-values without effect sizes or confidence intervals.",
    ],
    standards: ["CONSORT for Abstracts", "PRISMA for Abstracts", "ICMJE"],
    promptTemplate:
      "Rewrite this abstract into Background/Methods/Results/Conclusions under {word limit} words. Keep every number I provided; do not invent any. Ensure the primary result includes an effect size and 95% CI. Draft:\n\"\"\"{draft}\"\"\"",
  },
  {
    id: "abstract-conclusion-match",
    title: "Align abstract conclusions with the data",
    area: "abstract",
    level: "intermediate",
    whatYouLearn:
      "How to detect 'spin' where the abstract conclusion is more positive than the primary result warrants.",
    steps: [
      "Locate the pre-specified primary outcome and its result.",
      "Check whether the abstract conclusion is framed around that primary outcome.",
      "If the primary outcome was null, ensure the conclusion says so plainly.",
      "Demote secondary or subgroup findings to clearly labelled exploratory statements.",
    ],
    pitfalls: [
      "Leading with a positive secondary outcome when the primary was negative.",
      "Using 'trend toward significance' for a non-significant result.",
    ],
    standards: ["CONSORT for Abstracts"],
  },
  {
    id: "abstract-lay-summary",
    title: "Write a plain-language (lay) summary",
    area: "abstract",
    level: "intermediate",
    whatYouLearn:
      "How to translate a technical abstract into a patient- and public-facing summary at a ~grade 8 reading level.",
    steps: [
      "List the 3 key takeaways a non-specialist needs.",
      "Replace each technical term with a plain equivalent or a one-clause gloss.",
      "Use short sentences and active voice; state why it matters to patients.",
      "End with what is and is not yet known.",
    ],
    pitfalls: [
      "Oversimplifying to the point of overstating certainty.",
      "Leaving in acronyms or statistics a lay reader cannot interpret.",
    ],
    standards: ["PLS (Plain Language Summary) guidance"],
  },

  // ──────────────────────────────────────────────────────────── INTRODUCTION
  {
    id: "intro-cars",
    title: "Write a 4-move introduction (CARS model)",
    area: "introduction",
    level: "intermediate",
    whatYouLearn:
      "How to build an introduction using Create-a-Research-Space: establish territory, establish a niche, occupy the niche, and state the objective.",
    steps: [
      "Move 1: establish the territory — why the topic matters (1 short paragraph).",
      "Move 2: review what is known, grouped by theme not by paper.",
      "Move 3: establish the gap — what is missing, conflicting, or untested.",
      "Move 4: occupy the gap — state your objective and (optionally) hypothesis.",
      "Cut any sentence that does not advance one of the four moves.",
    ],
    pitfalls: [
      "Writing a textbook-style literature dump with no gap.",
      "Stating an objective that does not match the gap you just described.",
    ],
    promptTemplate:
      "Rewrite my introduction using the CARS model (territory -> known -> gap -> objective). Keep my citations as placeholders; do not invent references. Make the gap explicit and ensure the final sentence states the objective. Draft:\n\"\"\"{draft}\"\"\"",
  },
  {
    id: "intro-gap-statement",
    title: "Articulate a sharp knowledge gap",
    area: "introduction",
    level: "intermediate",
    whatYouLearn:
      "How to convert a vague 'little is known' into a specific, defensible gap that motivates your study.",
    steps: [
      "Name the specific population, exposure, or outcome that is understudied.",
      "Cite the closest prior work and state precisely what it left unanswered.",
      "Show why closing the gap matters (clinical, methodological, or policy stakes).",
      "Phrase the gap so your objective is the obvious next step.",
    ],
    pitfalls: [
      "Claiming a gap that a quick search would refute.",
      "Listing a gap unrelated to the analysis you actually ran.",
    ],
  },
  {
    id: "intro-objective-hypothesis",
    title: "State a precise objective and hypothesis",
    area: "introduction",
    level: "beginner",
    whatYouLearn:
      "How to write the closing objective sentence so it names population, comparison, and outcome and matches your analysis.",
    steps: [
      "Write 'We aimed to determine whether [exposure] is associated with [outcome] in [population].'",
      "For confirmatory work, add a directional hypothesis.",
      "Confirm the objective maps one-to-one onto your primary analysis.",
      "Avoid introducing secondary aims as if they were primary.",
    ],
    pitfalls: [
      "Multiple co-primary aims that dilute the study's focus.",
      "An objective broader than the data can address.",
    ],
  },
  {
    id: "intro-funnel",
    title: "Use the funnel structure (broad to specific)",
    area: "introduction",
    level: "beginner",
    whatYouLearn:
      "How to order paragraphs from general context down to your specific question without losing the reader.",
    steps: [
      "Open with the broadest relevant context (disease burden, clinical problem).",
      "Narrow to the specific subdomain your study addresses.",
      "Narrow again to the unresolved question.",
      "End at the single point: your study's objective.",
    ],
    pitfalls: [
      "Starting too broad ('Since the dawn of medicine...').",
      "Jumping straight to the niche with no orienting context.",
    ],
  },

  // ──────────────────────────────────────────────────────────── METHODS
  {
    id: "methods-strobe",
    title: "Structure a STROBE-compliant methods section",
    area: "methods",
    level: "intermediate",
    whatYouLearn:
      "How to organize an observational-study methods section so a reader could replicate it and a checklist reviewer finds every item.",
    steps: [
      "State design and setting (dates, locations, recruitment) up front.",
      "Define participants with explicit eligibility criteria and selection.",
      "Define all variables: outcomes, exposures, predictors, confounders, effect modifiers.",
      "Describe data sources and measurement for each variable.",
      "Specify the statistical methods, including confounder handling and missing data.",
    ],
    pitfalls: [
      "Mixing results into methods ('We found that...').",
      "Omitting how confounders were selected and adjusted for.",
    ],
    standards: ["STROBE"],
    promptTemplate:
      "Reorganize my methods to satisfy the STROBE checklist (design, setting, participants, variables, data sources/measurement, bias, study size, statistical methods, missing data). Flag any STROBE item I have not addressed under 'missing'. Do not invent details. Draft:\n\"\"\"{draft}\"\"\"",
  },
  {
    id: "methods-consort",
    title: "Write a CONSORT-aligned trial methods section",
    area: "methods",
    level: "advanced",
    whatYouLearn:
      "How to report randomization, allocation concealment, blinding, and analysis populations so a trial passes CONSORT review.",
    steps: [
      "Describe the randomization sequence generation and allocation concealment mechanism.",
      "State who was blinded (participants, clinicians, outcome assessors, analysts).",
      "Define the primary and secondary outcomes exactly as pre-registered.",
      "Specify the analysis population (ITT vs per-protocol) and how it was defined.",
      "Reference the trial registration number and the protocol/SAP.",
    ],
    pitfalls: [
      "Confusing 'randomized' with 'concealed' — they are distinct.",
      "Switching the primary outcome from the registered one without disclosure.",
    ],
    standards: ["CONSORT", "SPIRIT"],
  },
  {
    id: "methods-pico",
    title: "Frame a testable PICO question",
    area: "methods",
    level: "beginner",
    whatYouLearn:
      "How to convert a vague clinical curiosity into a structured Population-Intervention-Comparator-Outcome question.",
    steps: [
      "Define the Population precisely (age, condition, setting).",
      "Define the Intervention or exposure of interest.",
      "Define the Comparator (placebo, standard care, alternative, or none).",
      "Define the primary Outcome with its measurement and timeframe.",
      "Optionally add Timeframe/Study design (PICOT / PICOS).",
    ],
    pitfalls: [
      "A composite outcome that hides which component drives the effect.",
      "An undefined comparator ('usual care') that varies across sites.",
    ],
    promptTemplate:
      "Turn this clinical question into a structured PICO(T) statement and propose the matching study design: \"{question}\".",
  },
  {
    id: "methods-eligibility",
    title: "Write precise eligibility criteria",
    area: "methods",
    level: "intermediate",
    whatYouLearn:
      "How to write inclusion/exclusion criteria that are operational, reproducible, and free of hidden selection bias.",
    steps: [
      "Separate inclusion (defines the target population) from exclusion (safety/feasibility).",
      "Make each criterion measurable with a threshold and timeframe.",
      "Justify each exclusion that could limit generalizability.",
      "Confirm criteria match what was actually applied in the data.",
    ],
    pitfalls: [
      "Over-restrictive criteria that destroy external validity.",
      "Post-hoc exclusions introduced after seeing outcomes.",
    ],
  },
  {
    id: "methods-prisma-p",
    title: "Plan a systematic review with PRISMA-P",
    area: "methods",
    level: "advanced",
    whatYouLearn:
      "How to pre-specify a systematic review protocol: question, eligibility, sources, screening, extraction, and synthesis.",
    steps: [
      "State the PICO/eligibility and registration plan (PROSPERO).",
      "List databases, date ranges, and the full search strategy for at least one database.",
      "Define dual independent screening and conflict resolution.",
      "Pre-specify data extraction fields and risk-of-bias tool.",
      "Pre-specify synthesis: meta-analysis model, heterogeneity, subgroup/sensitivity analyses.",
    ],
    pitfalls: [
      "Not registering the protocol before screening begins.",
      "Deciding the synthesis approach after seeing the included studies.",
    ],
    standards: ["PRISMA-P", "PROSPERO"],
  },
  {
    id: "methods-missing-data",
    title: "Pre-specify a missing-data strategy",
    area: "methods",
    level: "advanced",
    whatYouLearn:
      "How to state your missingness assumptions and handling (complete-case, multiple imputation) before analysis.",
    steps: [
      "Quantify missingness per variable and describe the likely mechanism (MCAR/MAR/MNAR).",
      "Choose a method justified by the mechanism (e.g., multiple imputation under MAR).",
      "Specify the imputation model variables and number of imputations.",
      "Plan a sensitivity analysis under a different missingness assumption.",
    ],
    pitfalls: [
      "Defaulting to complete-case analysis without checking the mechanism.",
      "Imputing the outcome without disclosing it.",
    ],
  },
  {
    id: "methods-reproducible-protocol",
    title: "Write a methods section someone could replicate",
    area: "methods",
    level: "intermediate",
    whatYouLearn:
      "How to test your methods for reproducibility by checking each step can be re-executed from the text alone.",
    steps: [
      "List every procedural decision (instruments, versions, settings, thresholds).",
      "Specify software with version numbers and key package versions.",
      "State the exact analysis sequence and any random seeds.",
      "Have a colleague read it and list any step they could not reproduce.",
    ],
    pitfalls: [
      "'Standard methods were used' with no citation or detail.",
      "Omitting software versions that change default behavior.",
    ],
  },

  // ──────────────────────────────────────────────────────────── RESULTS
  {
    id: "results-effect-ci",
    title: "Report effect sizes with confidence intervals, not just p-values",
    area: "results",
    level: "intermediate",
    whatYouLearn:
      "How to present results so readers see magnitude and precision, not only a significance verdict.",
    steps: [
      "For each key result, report the point estimate (difference, RR, OR, HR).",
      "Add the 95% confidence interval immediately after the estimate.",
      "Report the p-value as supporting, not primary, evidence.",
      "Interpret the estimate in clinically meaningful units.",
    ],
    pitfalls: [
      "Reporting 'p < 0.05' with no effect size.",
      "Treating a wide CI that crosses the null as a confirmed effect.",
    ],
    standards: ["ICMJE", "SAMPL"],
    promptTemplate:
      "Reformat these results so each primary/secondary finding shows estimate + 95% CI + p-value in that order, in clinically interpretable units. Do not alter or invent any number. Results:\n\"\"\"{draft}\"\"\"",
  },
  {
    id: "results-table1",
    title: "Construct a Table 1 (baseline characteristics)",
    area: "results",
    level: "intermediate",
    whatYouLearn:
      "How to build a clean baseline table that summarizes the sample by group without misusing significance tests.",
    steps: [
      "List clinically relevant baseline variables in logical groups.",
      "Report mean (SD) or median (IQR) for continuous, n (%) for categorical.",
      "Stratify by the main comparison group in columns.",
      "Add a footnote defining abbreviations and the denominator for percentages.",
    ],
    pitfalls: [
      "Adding p-values to a randomized trial's Table 1 (discouraged by CONSORT).",
      "Mixing mean and median without saying which, or omitting the spread.",
    ],
    standards: ["CONSORT", "STROBE"],
  },
  {
    id: "results-flow",
    title: "Report participant flow accurately",
    area: "results",
    level: "intermediate",
    whatYouLearn:
      "How to account for every participant from screening to analysis so the numbers reconcile.",
    steps: [
      "State numbers screened, eligible, enrolled, allocated, and analyzed.",
      "Report losses and exclusions at each step with reasons.",
      "Ensure the analyzed n matches the denominators used in the results.",
      "Mirror the narrative in a flow diagram.",
    ],
    pitfalls: [
      "Numbers that do not add up across stages.",
      "Silent exclusions that change the analysis denominator.",
    ],
    standards: ["CONSORT", "PRISMA"],
  },
  {
    id: "results-no-interpretation",
    title: "Keep interpretation out of results",
    area: "results",
    level: "beginner",
    whatYouLearn:
      "How to report findings objectively and reserve meaning-making for the discussion.",
    steps: [
      "State what you found in past tense with numbers.",
      "Remove causal or evaluative language ('importantly', 'surprisingly').",
      "Move any 'this suggests...' sentence to the discussion.",
      "Order results to follow the methods and primary-then-secondary outcomes.",
    ],
    pitfalls: [
      "Editorializing in results ('a remarkable improvement').",
      "Reporting outcomes not described in methods.",
    ],
  },
  {
    id: "results-subgroup",
    title: "Report subgroup analyses honestly",
    area: "results",
    level: "advanced",
    whatYouLearn:
      "How to present subgroup findings with interaction tests and an explicit exploratory label.",
    steps: [
      "Report the test of interaction, not just within-subgroup p-values.",
      "State whether each subgroup analysis was pre-specified or post-hoc.",
      "Avoid over-interpreting subgroups with small n or wide CIs.",
      "Label post-hoc subgroups as hypothesis-generating.",
    ],
    pitfalls: [
      "Claiming a subgroup effect from a significant within-group p without interaction.",
      "Multiplicity from many unplanned subgroups.",
    ],
  },

  // ──────────────────────────────────────────────────────────── DISCUSSION
  {
    id: "discussion-avoid-spin",
    title: "Avoid spin in the discussion",
    area: "discussion",
    level: "advanced",
    whatYouLearn:
      "How to detect and remove the common spin patterns that overstate a study's findings.",
    steps: [
      "Open by restating the primary finding in plain, proportionate terms.",
      "If the primary outcome was null, do not pivot to a secondary as the headline.",
      "Replace causal verbs with associative ones for observational data.",
      "Compare your effect size to clinical relevance, not just statistical significance.",
    ],
    pitfalls: [
      "Concluding 'effective' from a non-significant trial.",
      "Generalizing beyond the studied population.",
    ],
    standards: ["EQUATOR"],
    promptTemplate:
      "Audit this discussion for spin: claiming benefit from a null primary, leading with secondary outcomes, causal language from observational data, and overgeneralization. List each instance and a corrected sentence. Discussion:\n\"\"\"{draft}\"\"\"",
  },
  {
    id: "discussion-structure",
    title: "Structure a discussion (findings to implications)",
    area: "discussion",
    level: "intermediate",
    whatYouLearn:
      "How to order a discussion: key findings, comparison with prior work, mechanisms, limitations, implications.",
    steps: [
      "Paragraph 1: state the principal findings against the objective.",
      "Paragraphs 2-3: compare with prior literature, explaining agreement and conflict.",
      "Paragraph 4: offer plausible mechanisms or explanations.",
      "Paragraph 5: state limitations candidly.",
      "Final paragraph: implications for practice/research and a measured conclusion.",
    ],
    pitfalls: [
      "Repeating the results verbatim instead of interpreting them.",
      "Burying limitations or treating them as a formality.",
    ],
  },
  {
    id: "discussion-limitations",
    title: "Write a candid, useful limitations paragraph",
    area: "discussion",
    level: "intermediate",
    whatYouLearn:
      "How to disclose limitations with their likely direction and magnitude of bias, not as boilerplate.",
    steps: [
      "List the most consequential limitations first.",
      "For each, state the likely direction of bias (toward or away from the null).",
      "Note what you did to mitigate it and what residual risk remains.",
      "Avoid trivial limitations that distract from real ones.",
    ],
    pitfalls: [
      "'Small sample size' with no statement of its actual effect.",
      "Listing limitations then dismissing them all as inconsequential.",
    ],
  },
  {
    id: "discussion-mechanism",
    title: "Propose mechanisms without overreaching",
    area: "discussion",
    level: "advanced",
    whatYouLearn:
      "How to offer biologically or statistically plausible explanations while signalling their speculative status.",
    steps: [
      "State the most plausible mechanism and cite supporting evidence.",
      "Offer at least one alternative explanation.",
      "Flag the explanation as hypothesis where direct evidence is absent.",
      "Connect the mechanism back to your specific finding.",
    ],
    pitfalls: [
      "Presenting speculation as established mechanism.",
      "Ignoring confounding as an alternative explanation.",
    ],
  },

  // ──────────────────────────────────────────────────────────── CONCLUSION
  {
    id: "conclusion-proportionate",
    title: "Write a proportionate conclusion",
    area: "conclusion",
    level: "beginner",
    whatYouLearn:
      "How to close with a take-home message scaled exactly to the evidence and design.",
    steps: [
      "Restate the primary finding in one sentence.",
      "State what it means for practice or research, hedged to the design.",
      "Avoid introducing new data or new claims.",
      "End with the single most important next step.",
    ],
    pitfalls: [
      "Calls for practice change from a single small study.",
      "A conclusion that ignores the null primary outcome.",
    ],
  },
  {
    id: "conclusion-future-work",
    title: "Frame future work specifically",
    area: "conclusion",
    level: "intermediate",
    whatYouLearn:
      "How to turn 'more research is needed' into a concrete, fundable next study.",
    steps: [
      "Name the specific unanswered question your study raised.",
      "Suggest the design that would answer it (e.g., a powered RCT).",
      "Note the population and outcome the next study should target.",
      "Keep it to what logically follows your data.",
    ],
    pitfalls: [
      "Generic 'further studies are warranted' with no specifics.",
      "Proposing future work unconnected to your findings.",
    ],
  },

  // ──────────────────────────────────────────────────────────── REFERENCES
  {
    id: "ref-vancouver",
    title: "Manage references in Vancouver style",
    area: "references",
    level: "beginner",
    whatYouLearn:
      "How to format and number references in the ICMJE/Vancouver style most biomedical journals require.",
    steps: [
      "Number references in the order first cited in the text.",
      "List up to 6 authors then 'et al.'; use standard journal abbreviations.",
      "Include volume, issue, pages, and DOI where available.",
      "Use a reference manager and verify it against the journal's exact style.",
    ],
    pitfalls: [
      "Renumbering by hand and breaking the citation order.",
      "Trusting the reference manager's output without checking abbreviations.",
    ],
    standards: ["ICMJE", "Vancouver"],
  },
  {
    id: "ref-primary-source",
    title: "Cite the primary source, not the review",
    area: "references",
    level: "intermediate",
    whatYouLearn:
      "How to trace a claim to its original study so your citation actually supports the statement.",
    steps: [
      "Find the statement you want to support.",
      "Open the review you were going to cite and find its source for that claim.",
      "Read the primary source to confirm it says what you claim.",
      "Cite the primary source (and the review only for synthesis claims).",
    ],
    pitfalls: [
      "Citation laundering — propagating an error from review to review.",
      "Citing an abstract or a paper you have not read.",
    ],
    standards: ["ICMJE"],
  },
  {
    id: "ref-avoid-retracted",
    title: "Screen out retracted and flagged references",
    area: "references",
    level: "intermediate",
    whatYouLearn:
      "How to check your reference list against retraction and expression-of-concern databases before submission.",
    steps: [
      "Export your final reference list with DOIs/PMIDs.",
      "Check each against a retraction source (e.g., Retraction Watch / publisher notices).",
      "Remove or replace any retracted citation; never cite it as valid evidence.",
      "Re-verify DOIs resolve to the correct article.",
    ],
    pitfalls: [
      "Citing a paper retracted after you first read it.",
      "A DOI that resolves to a different article than intended.",
    ],
  },
  {
    id: "ref-accurate-quotation",
    title: "Quote and paraphrase sources accurately",
    area: "references",
    level: "beginner",
    whatYouLearn:
      "How to ensure each citation faithfully represents the cited work and avoids quotation errors.",
    steps: [
      "Re-read the cited passage when writing the claim.",
      "Paraphrase in your own words and re-check the meaning matches.",
      "Reserve direct quotes for definitions or precise wording.",
      "Confirm the citation supports the specific sentence it follows.",
    ],
    pitfalls: [
      "Citing a paper for a claim it does not actually make.",
      "Paraphrasing so loosely the original meaning shifts.",
    ],
  },

  // ──────────────────────────────────────────────────────────── REVIEW (literature/synthesis)
  {
    id: "review-narrative",
    title: "Build a coherent narrative review",
    area: "review",
    level: "intermediate",
    whatYouLearn:
      "How to organize a non-systematic review thematically with an explicit scope and transparent selection.",
    steps: [
      "Define the scope and the questions the review will answer.",
      "State how you found and chose the literature (even if not systematic).",
      "Organize by theme or concept, not chronologically by paper.",
      "Synthesize across studies rather than summarizing each in turn.",
      "End with a synthesis: what is settled, contested, and unknown.",
    ],
    pitfalls: [
      "An annotated bibliography masquerading as a review.",
      "Cherry-picking studies that fit a preferred conclusion.",
    ],
  },
  {
    id: "review-systematic-screening",
    title: "Run dual independent screening",
    area: "review",
    level: "advanced",
    whatYouLearn:
      "How to screen records for a systematic review with two reviewers and documented conflict resolution.",
    steps: [
      "Pilot the screening form on a sample to align reviewers.",
      "Screen titles/abstracts independently in duplicate.",
      "Record reasons for full-text exclusions.",
      "Resolve disagreements by discussion or a third reviewer; report agreement.",
    ],
    pitfalls: [
      "Single-reviewer screening introducing selection bias.",
      "Not logging exclusion reasons for the PRISMA diagram.",
    ],
    standards: ["PRISMA", "Cochrane"],
  },
  {
    id: "review-risk-of-bias",
    title: "Assess risk of bias with the right tool",
    area: "review",
    level: "advanced",
    whatYouLearn:
      "How to choose and apply a validated risk-of-bias tool matched to each included study's design.",
    steps: [
      "Match the tool to design (RoB 2 for RCTs, ROBINS-I for non-randomized, QUADAS-2 for diagnostic).",
      "Assess each domain with supporting quotes from the study.",
      "Reach domain and overall judgments in duplicate.",
      "Incorporate the assessment into the synthesis (e.g., sensitivity by risk).",
    ],
    pitfalls: [
      "Using a generic quality score instead of a domain-based tool.",
      "Assessing bias but never using it in the analysis.",
    ],
    standards: ["RoB 2", "ROBINS-I", "QUADAS-2", "Cochrane"],
  },
  {
    id: "review-meta-analysis",
    title: "Synthesize effects in a meta-analysis",
    area: "review",
    level: "advanced",
    whatYouLearn:
      "How to pool effect estimates appropriately, assess heterogeneity, and interpret the summary effect.",
    steps: [
      "Choose a common effect measure and extract estimates with variances.",
      "Select fixed- vs random-effects based on expected heterogeneity.",
      "Quantify heterogeneity (I-squared, tau-squared, prediction interval).",
      "Plan subgroup/meta-regression for substantial heterogeneity.",
      "Assess small-study effects (funnel plot, Egger) when enough studies.",
    ],
    pitfalls: [
      "Pooling clinically incomparable studies.",
      "Reporting a summary effect while ignoring high heterogeneity.",
    ],
    standards: ["PRISMA", "Cochrane"],
  },

  // ──────────────────────────────────────────────────────────── REVISION
  {
    id: "revision-point-by-point",
    title: "Write a point-by-point reviewer response",
    area: "revision",
    level: "intermediate",
    whatYouLearn:
      "How to structure a response letter that addresses every comment with the change made and where to find it.",
    steps: [
      "Copy each reviewer comment verbatim into the letter.",
      "Respond directly: agree/disagree with reasoning, and what you changed.",
      "Quote the revised manuscript text and give the page/line location.",
      "Thank reviewers and keep a professional, non-defensive tone.",
      "Add a summary of major changes at the top.",
    ],
    pitfalls: [
      "Claiming a change you did not actually make.",
      "Arguing without conceding any reasonable point.",
    ],
    promptTemplate:
      "Draft a point-by-point response to this reviewer comment. Structure: restate comment, our response, exact revised text, and location. Professional tone. If the comment requires data I do not have, say so honestly. Comment:\n\"\"\"{comment}\"\"\"\nMy planned change: {change}",
  },
  {
    id: "revision-major",
    title: "Handle a major revision strategically",
    area: "revision",
    level: "advanced",
    whatYouLearn:
      "How to triage a major-revision decision into must-do, negotiate, and decline-with-rationale items.",
    steps: [
      "List every requested change and classify it (do / negotiate / decline).",
      "Do all feasible scientific requests first; they carry the most weight.",
      "For requests you decline, give an evidence-based rationale, not refusal.",
      "Track that every comment receives an explicit response.",
      "Re-read the whole manuscript for consistency after edits.",
    ],
    pitfalls: [
      "Ignoring a comment hoping the editor forgets it.",
      "Over-promising new experiments you cannot deliver in time.",
    ],
  },
  {
    id: "revision-disagree",
    title: "Disagree with a reviewer respectfully",
    area: "revision",
    level: "advanced",
    whatYouLearn:
      "How to push back on an incorrect or infeasible request while keeping the editor on your side.",
    steps: [
      "Acknowledge the reviewer's concern and its legitimacy.",
      "Present evidence or a citation supporting your position.",
      "Offer a partial accommodation where possible (e.g., a sensitivity analysis).",
      "Defer to the editor's judgment courteously.",
    ],
    pitfalls: [
      "A dismissive or sarcastic tone.",
      "Refusing without offering any alternative.",
    ],
  },
  {
    id: "revision-track-changes",
    title: "Prepare a clean tracked-changes resubmission",
    area: "revision",
    level: "beginner",
    whatYouLearn:
      "How to package a revision so editors can verify changes quickly.",
    steps: [
      "Provide both a tracked-changes and a clean version if requested.",
      "Cross-reference response-letter line numbers to the tracked file.",
      "Update figures, tables, supplements, and the abstract to match edits.",
      "Re-run the submission checklist before uploading.",
    ],
    pitfalls: [
      "Line numbers in the letter that do not match the file.",
      "Forgetting to update the abstract after changing results.",
    ],
  },

  // ──────────────────────────────────────────────────────────── REPRODUCIBILITY
  {
    id: "repro-prereg",
    title: "Pre-register a study",
    area: "reproducibility",
    level: "advanced",
    whatYouLearn:
      "How to lock in hypotheses, outcomes, and analysis plan before data collection to prevent HARKing and p-hacking.",
    steps: [
      "Choose a registry (ClinicalTrials.gov, PROSPERO, OSF) appropriate to the study.",
      "Specify the primary and secondary outcomes with exact definitions.",
      "Pre-specify the full analysis plan, including covariates and subgroups.",
      "Register before enrolling participants or accessing outcome data.",
      "Disclose and justify any later deviations transparently.",
    ],
    pitfalls: [
      "Registering after data are in hand.",
      "Vague outcome definitions that permit outcome switching.",
    ],
    standards: ["ICMJE", "ClinicalTrials.gov", "PROSPERO", "OSF"],
  },
  {
    id: "repro-data-sharing",
    title: "Write a FAIR data-availability statement",
    area: "reproducibility",
    level: "intermediate",
    whatYouLearn:
      "How to make data Findable, Accessible, Interoperable, and Reusable, and state availability honestly.",
    steps: [
      "Decide what can be shared (deidentified data, code, materials).",
      "Deposit in a recognized repository and obtain a DOI/accession.",
      "Write a precise availability statement (where, under what conditions).",
      "Provide a data dictionary and license.",
    ],
    pitfalls: [
      "'Data available on reasonable request' with no real intent to share.",
      "Sharing data without proper deidentification.",
    ],
    standards: ["FAIR", "ICMJE", "TOP Guidelines"],
  },
  {
    id: "repro-code",
    title: "Share analysis code reproducibly",
    area: "reproducibility",
    level: "advanced",
    whatYouLearn:
      "How to package analysis code so an independent analyst can reproduce your numbers.",
    steps: [
      "Organize code into a clear pipeline from raw data to results.",
      "Pin software and package versions (lockfile or environment file).",
      "Set and record random seeds.",
      "Include a README mapping scripts to manuscript tables/figures.",
      "Archive a snapshot with a DOI (e.g., Zenodo).",
    ],
    pitfalls: [
      "Hard-coded local paths that break on another machine.",
      "Unpinned dependencies that change results over time.",
    ],
    standards: ["TOP Guidelines", "FAIR"],
  },
  {
    id: "repro-sap",
    title: "Write a statistical analysis plan (SAP)",
    area: "reproducibility",
    level: "advanced",
    whatYouLearn:
      "How to document every analytical decision before unblinding so the analysis is confirmatory.",
    steps: [
      "Define the estimand: population, endpoint, intercurrent-event handling, summary measure.",
      "Specify the primary analysis model and its assumptions.",
      "Pre-list secondary, sensitivity, and subgroup analyses.",
      "State handling of missing data and multiplicity.",
      "Finalize and date the SAP before database lock.",
    ],
    pitfalls: [
      "Leaving model choices to be decided after seeing the data.",
      "No multiplicity control across many endpoints.",
    ],
    standards: ["ICH E9", "ICH E9(R1)"],
  },

  // ──────────────────────────────────────────────────────────── STATISTICS
  {
    id: "stats-sample-size",
    title: "Calculate sample size and power",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How to justify your sample size from the primary outcome, expected effect, alpha, and power.",
    steps: [
      "Identify the primary outcome and its variability or event rate.",
      "Specify the minimal clinically important difference to detect.",
      "Set alpha (usually 0.05 two-sided) and power (usually 80-90%).",
      "Compute n with the correct formula/test and inflate for attrition.",
      "Report all assumptions so the calculation is reproducible.",
    ],
    pitfalls: [
      "Reverse-engineering a sample size to match available data.",
      "Powering on a secondary outcome but reporting it as primary.",
    ],
    standards: ["CONSORT", "SPIRIT"],
    promptTemplate:
      "Help me document a sample size justification for a {design} with primary outcome {outcome}, expected effect {effect}, alpha {alpha}, power {power}. List every assumption explicitly and note attrition inflation. Do not invent values I have not given.",
  },
  {
    id: "stats-avoid-phacking",
    title: "Detect and avoid p-hacking",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How to recognize researcher degrees of freedom that inflate false positives and how to neutralize them.",
    steps: [
      "Pre-specify the primary analysis and stick to it.",
      "Avoid testing many outcomes/subgroups and reporting only significant ones.",
      "Do not add covariates or exclude cases until p crosses a threshold.",
      "Report all analyses run, not just the favorable ones.",
    ],
    pitfalls: [
      "Optional stopping — peeking at data and stopping when significant.",
      "Selectively reporting the analysis that 'worked'.",
    ],
  },
  {
    id: "stats-multiplicity",
    title: "Control for multiple comparisons",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How to plan and report multiplicity adjustment so family-wise error stays controlled.",
    steps: [
      "Define the family of hypotheses in advance.",
      "Choose a method (hierarchical testing, Bonferroni, Holm, FDR) and justify it.",
      "Apply it as pre-specified, not after seeing results.",
      "Report both adjusted and unadjusted estimates transparently.",
    ],
    pitfalls: [
      "Declaring many endpoints 'significant' with no adjustment.",
      "Switching adjustment methods to obtain significance.",
    ],
  },
  {
    id: "stats-choose-test",
    title: "Choose the right statistical test",
    area: "statistics",
    level: "intermediate",
    whatYouLearn:
      "How to match the test to the outcome type, design, and assumptions rather than defaulting to t-tests.",
    steps: [
      "Classify the outcome (continuous, binary, count, time-to-event, ordinal).",
      "Account for design features (paired, clustered, repeated measures).",
      "Check assumptions (distribution, independence, variance).",
      "Select the model and pre-specify it; use robust alternatives if assumptions fail.",
    ],
    pitfalls: [
      "Ignoring clustering and treating correlated data as independent.",
      "Using parametric tests when assumptions are clearly violated.",
    ],
  },
  {
    id: "stats-interpret-p",
    title: "Interpret p-values correctly",
    area: "statistics",
    level: "intermediate",
    whatYouLearn:
      "How to describe statistical significance without the common fallacies that mislead readers.",
    steps: [
      "State that p is the probability of data as extreme under the null, not P(H0).",
      "Never equate non-significance with 'no effect'.",
      "Pair every p with an effect size and CI.",
      "Avoid dichotomizing borderline results into 'trends'.",
    ],
    pitfalls: [
      "'p > 0.05 means the groups are equal.'",
      "Treating p = 0.049 and p = 0.051 as categorically different.",
    ],
    standards: ["ASA Statement on p-values"],
  },
  {
    id: "stats-confounding",
    title: "Adjust for confounding transparently",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How to select confounders with a causal rationale (DAG) rather than stepwise selection.",
    steps: [
      "Draw a DAG to identify confounders, mediators, and colliders.",
      "Select adjustment variables to block confounding paths only.",
      "Avoid adjusting for mediators or colliders.",
      "Report both crude and adjusted estimates.",
    ],
    pitfalls: [
      "Adjusting for a mediator and attenuating the true effect.",
      "Stepwise selection that inflates the false-positive rate.",
    ],
    standards: ["STROBE"],
  },
  {
    id: "stats-report-sampl",
    title: "Report statistics to SAMPL standards",
    area: "statistics",
    level: "intermediate",
    whatYouLearn:
      "How to report numbers, tests, and uncertainty with the precision and completeness SAMPL recommends.",
    steps: [
      "Report numbers to an appropriate precision (avoid spurious decimals).",
      "Name every test and state one- vs two-sided.",
      "Give denominators for all percentages.",
      "Report estimates with CIs and exact p-values (not 'NS').",
    ],
    pitfalls: [
      "Percentages without denominators.",
      "'p = NS' instead of the exact value.",
    ],
    standards: ["SAMPL", "ICMJE"],
  },

  // ──────────────────────────────────────────────────────────── FIGURES
  {
    id: "fig-self-explanatory",
    title: "Make figures self-explanatory",
    area: "figures",
    level: "intermediate",
    whatYouLearn:
      "How to design a figure and caption so a reader understands it without the main text.",
    steps: [
      "Give the figure a caption stating what, in whom, and the key comparison.",
      "Label axes with units and define every symbol/abbreviation.",
      "Show uncertainty (error bars/CIs) and define what they represent.",
      "Ensure the figure makes the intended point at a glance.",
    ],
    pitfalls: [
      "A caption that requires the reader to hunt through methods.",
      "Error bars with no definition (SD? SE? CI?).",
    ],
    standards: ["ICMJE"],
  },
  {
    id: "fig-prisma-flow",
    title: "Build a PRISMA flow diagram",
    area: "figures",
    level: "intermediate",
    whatYouLearn:
      "How to depict identification, screening, eligibility, and inclusion with reconciling numbers.",
    steps: [
      "Record counts at identification (per database) and after deduplication.",
      "Record records screened, excluded, and full texts assessed.",
      "Record full texts excluded with reasons and final included studies.",
      "Verify every number reconciles down the diagram.",
    ],
    pitfalls: [
      "Numbers that do not add up between boxes.",
      "Omitting exclusion reasons at full-text stage.",
    ],
    standards: ["PRISMA"],
  },
  {
    id: "fig-forest",
    title: "Read and build a forest plot",
    area: "figures",
    level: "advanced",
    whatYouLearn:
      "How to present per-study and pooled effects with weights, CIs, and heterogeneity.",
    steps: [
      "Plot each study's estimate with its CI and marker sized by weight.",
      "Add the pooled estimate as a diamond at the bottom.",
      "Annotate heterogeneity (I-squared) and the model used.",
      "Order studies meaningfully (by year, weight, or subgroup).",
    ],
    pitfalls: [
      "Omitting the heterogeneity statistic.",
      "Pooling fixed-effect when heterogeneity is high.",
    ],
    standards: ["PRISMA", "Cochrane"],
  },
  {
    id: "fig-accessible-color",
    title: "Use accessible, honest color and scales",
    area: "figures",
    level: "intermediate",
    whatYouLearn:
      "How to choose color and axes that are colorblind-safe and do not distort the data.",
    steps: [
      "Use colorblind-safe palettes and redundant encodings (shape/line).",
      "Start bar-chart axes at zero; do not truncate to exaggerate.",
      "Keep aspect ratios honest; avoid 3D effects.",
      "Ensure sufficient contrast and font size for print.",
    ],
    pitfalls: [
      "Red/green palettes unreadable for many readers.",
      "Truncated axes that inflate apparent differences.",
    ],
  },

  // ──────────────────────────────────────────────────────────── ETHICS
  {
    id: "ethics-irb",
    title: "Report ethics approval and consent",
    area: "ethics",
    level: "beginner",
    whatYouLearn:
      "How to state IRB/ethics committee approval, approval numbers, and consent procedures correctly.",
    steps: [
      "Name the approving committee and the approval/reference number.",
      "State the consent type obtained (written, verbal, waived) and from whom.",
      "Reference the Declaration of Helsinki for human research.",
      "Note assent for minors and proxy consent where relevant.",
    ],
    pitfalls: [
      "Omitting the approval number editors now routinely require.",
      "Claiming consent procedures inconsistent with the study.",
    ],
    standards: ["Declaration of Helsinki", "ICMJE"],
  },
  {
    id: "ethics-authorship",
    title: "Apply ICMJE authorship criteria",
    area: "ethics",
    level: "intermediate",
    whatYouLearn:
      "How to decide who qualifies as an author using the four ICMJE criteria and how to credit others.",
    steps: [
      "Apply all four criteria: contribution, drafting/revising, final approval, accountability.",
      "List contributors who do not meet all four in acknowledgements.",
      "Agree author order and corresponding author early.",
      "Use a contributorship (CRediT) statement to specify roles.",
    ],
    pitfalls: [
      "Gift authorship or ghost authorship.",
      "Adding a senior figure who made no qualifying contribution.",
    ],
    standards: ["ICMJE", "CRediT"],
  },
  {
    id: "ethics-coi",
    title: "Disclose conflicts of interest fully",
    area: "ethics",
    level: "beginner",
    whatYouLearn:
      "How to identify and declare financial and non-financial conflicts using the ICMJE disclosure framework.",
    steps: [
      "List all relevant financial relationships within the disclosure window.",
      "Include non-financial conflicts (advocacy, personal relationships).",
      "Complete the ICMJE disclosure form for every author.",
      "State funding sources and the funder's role (or lack thereof).",
    ],
    pitfalls: [
      "Omitting an indirect or non-financial conflict.",
      "Vague 'the authors declare no conflict' when ones exist.",
    ],
    standards: ["ICMJE"],
  },
  {
    id: "ethics-plagiarism",
    title: "Avoid plagiarism and text recycling",
    area: "ethics",
    level: "beginner",
    whatYouLearn:
      "How to avoid plagiarism, self-plagiarism, and improper reuse of your own prior text.",
    steps: [
      "Paraphrase and cite rather than copy, even from your own prior papers.",
      "Quote and attribute any verbatim text.",
      "Disclose any legitimate overlap (e.g., shared methods) to the editor.",
      "Run a similarity check before submission and review flagged passages.",
    ],
    pitfalls: [
      "Reusing your own methods text verbatim without disclosure.",
      "Paraphrasing too lightly to count as original.",
    ],
    standards: ["COPE", "ICMJE"],
  },

  // ──────────────────────────────────────────────────────────── WRITING
  {
    id: "writing-active-concise",
    title: "Write in concise, active scientific prose",
    area: "writing",
    level: "beginner",
    whatYouLearn:
      "How to cut nominalizations and passive constructions that bury your meaning.",
    steps: [
      "Find the actor and the action in each sentence; make the actor the subject.",
      "Convert nominalizations back to verbs ('made a comparison' -> 'compared').",
      "Cut hedges and filler ('it is important to note that').",
      "Keep one idea per sentence; split run-ons.",
    ],
    pitfalls: [
      "Reflexive passive voice that hides who did what.",
      "Long sentences chaining three or more clauses.",
    ],
  },
  {
    id: "writing-dejargonize",
    title: "De-jargonize for a broader audience",
    area: "writing",
    level: "intermediate",
    whatYouLearn:
      "How to replace or define jargon and acronyms so a non-specialist can follow your argument.",
    steps: [
      "Highlight every term a non-specialist might not know.",
      "Define each acronym at first use; limit total acronyms.",
      "Replace jargon with plain words where precision allows.",
      "Read aloud to catch dense, technical stretches.",
    ],
    pitfalls: [
      "A wall of undefined acronyms in the abstract.",
      "Removing precision while simplifying.",
    ],
  },
  {
    id: "writing-paragraph-structure",
    title: "Build paragraphs with topic sentences",
    area: "writing",
    level: "beginner",
    whatYouLearn:
      "How to lead each paragraph with its point so a skimming reader still follows the argument.",
    steps: [
      "Start each paragraph with a sentence stating its single claim.",
      "Support the claim with evidence and citations.",
      "End with a sentence that links to the next paragraph.",
      "Confirm one paragraph carries one idea.",
    ],
    pitfalls: [
      "Burying the point in the middle of the paragraph.",
      "Paragraphs that mix several unrelated ideas.",
    ],
  },
  {
    id: "writing-reverse-outline",
    title: "Reverse-outline to fix structure",
    area: "writing",
    level: "intermediate",
    whatYouLearn:
      "How to diagnose structural problems by extracting the point of each paragraph after drafting.",
    steps: [
      "Write a one-line summary of each existing paragraph in the margin.",
      "Read the list of summaries as the document's skeleton.",
      "Reorder, merge, or cut to create a logical flow.",
      "Rewrite paragraphs whose summary does not match their content.",
    ],
    pitfalls: [
      "Editing sentences before fixing the overall structure.",
      "Keeping paragraphs that do not advance the argument.",
    ],
  },
  {
    id: "writing-cohesion",
    title: "Create flow with old-to-new information",
    area: "writing",
    level: "advanced",
    whatYouLearn:
      "How to chain sentences so each begins with familiar information and ends with the new point.",
    steps: [
      "Open each sentence with information the reader already has.",
      "Place the new, emphasized information at the sentence's end.",
      "Use consistent terms for the same concept (avoid elegant variation).",
      "Add transitions only where the logic genuinely shifts.",
    ],
    pitfalls: [
      "Starting sentences with brand-new jargon.",
      "Synonym-swapping a key term and confusing the reader.",
    ],
  },

  // ──────────────────────────────────────────────────────────── SEARCH
  {
    id: "search-pubmed-mesh",
    title: "Search PubMed with MeSH and filters",
    area: "search",
    level: "intermediate",
    whatYouLearn:
      "How to combine MeSH terms, free-text, field tags, and filters into a precise, reproducible PubMed query.",
    steps: [
      "Identify MeSH terms for your core concepts via the MeSH database.",
      "Combine MeSH with text-word synonyms using OR inside concepts.",
      "Combine concept blocks with AND.",
      "Apply filters (species, dates, article type) deliberately.",
      "Save the full query string for the methods/appendix.",
    ],
    pitfalls: [
      "Relying on MeSH only — recent articles are not yet indexed.",
      "Over-filtering and silently excluding relevant studies.",
    ],
    standards: ["PRISMA-S"],
    promptTemplate:
      "Build a PubMed search strategy for: population {population}, intervention {intervention}, outcome {outcome}. Give MeSH terms and text-word synonyms per concept, combine with AND/OR, and explain each filter. Output the full copy-pasteable query.",
  },
  {
    id: "search-document-strategy",
    title: "Document a reproducible search strategy (PRISMA-S)",
    area: "search",
    level: "advanced",
    whatYouLearn:
      "How to report your search so another team could reproduce it exactly.",
    steps: [
      "List every database/source and the platform/interface used.",
      "Record the full search string per database and the date run.",
      "Note any limits, filters, and supplementary searching (citation chasing).",
      "Report deduplication method and total records.",
    ],
    pitfalls: [
      "Reporting only the keywords, not the executable query.",
      "Not recording the date the search was run.",
    ],
    standards: ["PRISMA-S"],
  },
  {
    id: "search-grey-literature",
    title: "Search grey literature and trial registries",
    area: "search",
    level: "advanced",
    whatYouLearn:
      "How to reduce publication bias by searching registries, preprints, theses, and conference abstracts.",
    steps: [
      "Search trial registries (ClinicalTrials.gov, WHO ICTRP) for unpublished trials.",
      "Search preprint servers and theses/dissertation databases.",
      "Scan conference proceedings in the field.",
      "Document each grey source like a database search.",
    ],
    pitfalls: [
      "Ignoring registered-but-unpublished studies (publication bias).",
      "Treating a preprint as peer-reviewed evidence.",
    ],
    standards: ["PRISMA-S"],
  },
  {
    id: "search-citation-chasing",
    title: "Snowball with forward and backward citations",
    area: "search",
    level: "intermediate",
    whatYouLearn:
      "How to find relevant studies a keyword search missed by following references and citing articles.",
    steps: [
      "Backward: scan reference lists of key included papers.",
      "Forward: find newer papers that cite a key paper.",
      "Screen the new candidates with your eligibility criteria.",
      "Record the additions and their source for transparency.",
    ],
    pitfalls: [
      "Stopping at keyword search and missing seminal work.",
      "Not documenting snowballed additions.",
    ],
  },

  // ──────────────────────────────────────────────────────────── PEER-REVIEW (as a reviewer)
  {
    id: "peer-structured-review",
    title: "Write a structured, constructive peer review",
    area: "peer-review",
    level: "intermediate",
    whatYouLearn:
      "How to produce a review with a summary, major points, and minor points that helps authors and editors.",
    steps: [
      "Open with a brief, neutral summary of the study and its claim.",
      "List major concerns (validity, analysis, overreach) with specifics.",
      "List minor points (clarity, typos, formatting) separately.",
      "Make each comment actionable and reference section/line.",
      "Give the editor a clear, evidence-based recommendation.",
    ],
    pitfalls: [
      "Vague criticism the author cannot act on.",
      "Mixing trivial and major issues without prioritization.",
    ],
    standards: ["COPE Ethical Guidelines for Peer Reviewers"],
    promptTemplate:
      "Draft a structured peer review for a manuscript: a 3-sentence summary, then numbered Major Comments and Minor Comments, each specific and actionable, ending with a recommendation rationale. Base it only on what I paste; do not assume facts. Manuscript notes:\n\"\"\"{notes}\"\"\"",
  },
  {
    id: "peer-assess-methods",
    title: "Critically appraise a study's methods",
    area: "peer-review",
    level: "advanced",
    whatYouLearn:
      "How to evaluate validity by examining design, bias, confounding, and analysis appropriateness.",
    steps: [
      "Check whether the design can answer the stated question.",
      "Identify selection, information, and confounding bias risks.",
      "Assess whether the statistical methods match the data and design.",
      "Judge whether conclusions are supported by the results.",
    ],
    pitfalls: [
      "Focusing on writing style over methodological validity.",
      "Demanding a different study rather than appraising this one.",
    ],
  },
  {
    id: "peer-reviewer-ethics",
    title: "Review ethically and confidentially",
    area: "peer-review",
    level: "intermediate",
    whatYouLearn:
      "How to handle confidentiality, conflicts, and AI tools when peer reviewing.",
    steps: [
      "Decline if you have a conflict of interest.",
      "Keep the manuscript confidential; do not share or reuse its data.",
      "Do not upload confidential manuscripts to external tools that retain data.",
      "Be timely and disclose limits of your expertise.",
    ],
    pitfalls: [
      "Using ideas from a manuscript under review in your own work.",
      "Sharing the manuscript with unauthorized colleagues.",
    ],
    standards: ["COPE Ethical Guidelines for Peer Reviewers"],
  },

  // ──────────────────────────────────────────────────────────── PRODUCTIVITY
  {
    id: "prod-target-journal-first",
    title: "Target the journal before you write",
    area: "productivity",
    level: "beginner",
    whatYouLearn:
      "How to choose a target journal early so scope, structure, and length guide your draft.",
    steps: [
      "Shortlist journals that publish your study type and audience.",
      "Read the aims/scope and 2-3 recent similar articles.",
      "Note word limits, structure, and reference style.",
      "Draft to that journal's requirements from the start.",
    ],
    pitfalls: [
      "Writing first and reformatting for each rejection.",
      "Choosing on impact factor alone, ignoring scope fit.",
    ],
  },
  {
    id: "prod-cover-letter",
    title: "Write a persuasive cover letter",
    area: "productivity",
    level: "intermediate",
    whatYouLearn:
      "How to convince an editor in three short paragraphs that your paper fits and matters.",
    steps: [
      "State the title, manuscript type, and the single key finding.",
      "Explain why it fits this journal's scope and readership.",
      "Confirm originality, ethics, and no competing submission.",
      "List suggested/excluded reviewers if invited.",
    ],
    pitfalls: [
      "A generic letter that names the wrong journal.",
      "Restating the abstract instead of selling the fit.",
    ],
    promptTemplate:
      "Draft a 3-paragraph cover letter to {journal} for a {manuscript type} titled \"{title}\". Key finding: {finding}. Explain fit with the journal's scope, confirm originality and ethics. Professional, concise. Do not overstate.",
  },
  {
    id: "prod-outline-first",
    title: "Draft from a one-page outline",
    area: "productivity",
    level: "beginner",
    whatYouLearn:
      "How to plan the whole paper as bullet points before prose to avoid structural rewrites.",
    steps: [
      "List the section headings and one-line purpose for each.",
      "Under each, bullet the key points and the figures/tables.",
      "Sequence the figures first; they anchor the results narrative.",
      "Expand bullets into prose only once the skeleton holds together.",
    ],
    pitfalls: [
      "Polishing prose before the structure is settled.",
      "Writing the introduction first and over-investing in it.",
    ],
  },
  {
    id: "prod-checklist-before-draft",
    title: "Use a reporting checklist before the first draft",
    area: "productivity",
    level: "intermediate",
    whatYouLearn:
      "How to load the relevant EQUATOR checklist up front so every required item is captured as you write.",
    steps: [
      "Identify your study design and the matching EQUATOR guideline.",
      "Open the checklist and keep it beside your outline.",
      "Map each checklist item to where it will appear in the manuscript.",
      "Tick items as you draft; address gaps before submission.",
    ],
    pitfalls: [
      "Discovering missing checklist items at submission.",
      "Using the wrong guideline for the design.",
    ],
    standards: ["EQUATOR", "CONSORT", "STROBE", "PRISMA"],
  },
  {
    id: "prod-write-methods-during",
    title: "Write the methods while you collect data",
    area: "productivity",
    level: "beginner",
    whatYouLearn:
      "How to capture procedural details in real time so the methods are accurate and complete.",
    steps: [
      "Draft methods text alongside data collection, not months later.",
      "Record instrument versions, settings, and deviations as they happen.",
      "Keep a decision log for analytical choices.",
      "Reconcile the draft with the protocol at study end.",
    ],
    pitfalls: [
      "Reconstructing methods from memory and getting details wrong.",
      "Forgetting protocol deviations that should be reported.",
    ],
  },
  {
    id: "prod-handle-rejection",
    title: "Respond productively to rejection",
    area: "productivity",
    level: "intermediate",
    whatYouLearn:
      "How to extract value from a rejection and reposition the manuscript for the next journal.",
    steps: [
      "Separate desk rejection (scope/fit) from peer-review rejection (substance).",
      "Address legitimate reviewer concerns even when resubmitting elsewhere.",
      "Reformat for the next journal's scope and style before resubmitting.",
      "Keep a log of where it was submitted and the feedback.",
    ],
    pitfalls: [
      "Resubmitting unchanged to a similar journal.",
      "Taking reviewer critique personally and ignoring it.",
    ],
  },
  {
    id: "prod-reference-manager",
    title: "Run a clean reference-manager workflow",
    area: "productivity",
    level: "beginner",
    whatYouLearn:
      "How to set up a reference manager so citations stay accurate and reformatting is one click.",
    steps: [
      "Import references with verified metadata (DOI lookup).",
      "Deduplicate the library regularly.",
      "Cite-while-you-write with a journal CSL style.",
      "Audit the final bibliography against the source records.",
    ],
    pitfalls: [
      "Accepting auto-imported metadata without checking.",
      "Manual edits to the bibliography that the manager later overwrites.",
    ],
  },

  // ──────────────────────── additional skills to exceed 100 and deepen coverage
  {
    id: "title-keywords",
    title: "Optimize title and keywords for discoverability",
    area: "title",
    level: "intermediate",
    whatYouLearn:
      "How to place searchable terms in the title and choose keywords that surface your paper to the right readers.",
    steps: [
      "Identify the terms your target readers would actually search.",
      "Place the most important term early in the title.",
      "Choose keywords that complement (not repeat) the title.",
      "Prefer MeSH-aligned keywords for indexing.",
    ],
    pitfalls: [
      "Keywords identical to the title words (wasted discoverability).",
      "Clever titles with no searchable content.",
    ],
  },
  {
    id: "abstract-keypoints",
    title: "Write a key-points / highlights box",
    area: "abstract",
    level: "beginner",
    whatYouLearn:
      "How to distill the paper into 3-4 bullet takeaways many journals now require.",
    steps: [
      "State the question this study answers.",
      "State the main finding with direction and magnitude.",
      "State the clinical or research implication.",
      "Keep each bullet to one sentence within the character limit.",
    ],
    pitfalls: [
      "Highlights that overstate beyond the abstract.",
      "Repeating the abstract verbatim.",
    ],
  },
  {
    id: "methods-spirit",
    title: "Write a SPIRIT-compliant trial protocol",
    area: "methods",
    level: "advanced",
    whatYouLearn:
      "How to draft a trial protocol covering objectives, design, participants, interventions, outcomes, and monitoring.",
    steps: [
      "State objectives, hypotheses, and design with allocation ratio.",
      "Define interventions in replicable detail and the schedule of assessments.",
      "Pre-specify primary/secondary outcomes and the analysis plan.",
      "Describe data monitoring, harms, auditing, and dissemination.",
    ],
    pitfalls: [
      "Vague intervention descriptions that prevent replication.",
      "Outcomes in the protocol that differ from the registration.",
    ],
    standards: ["SPIRIT", "CONSORT"],
  },
  {
    id: "methods-tripod",
    title: "Report a prediction model with TRIPOD",
    area: "methods",
    level: "advanced",
    whatYouLearn:
      "How to report development and validation of a clinical prediction model transparently.",
    steps: [
      "Describe the source of data and the outcome being predicted.",
      "Specify predictors, how they were measured, and timing.",
      "Report model development (selection, shrinkage) and performance (discrimination, calibration).",
      "Report internal/external validation and present the final model usably.",
    ],
    pitfalls: [
      "Reporting discrimination (AUC) but omitting calibration.",
      "Optimistic performance from no validation.",
    ],
    standards: ["TRIPOD"],
  },
  {
    id: "methods-stard",
    title: "Report diagnostic accuracy with STARD",
    area: "methods",
    level: "advanced",
    whatYouLearn:
      "How to report a diagnostic-accuracy study so sensitivity, specificity, and the reference standard are clear.",
    steps: [
      "Define the index test, the reference standard, and their rationale.",
      "Describe participant selection and the spectrum of disease.",
      "Report blinding between index test and reference standard.",
      "Present a 2x2 table and accuracy estimates with CIs.",
    ],
    pitfalls: [
      "Verification bias when only test-positives get the reference standard.",
      "An unrepresentative spectrum inflating accuracy.",
    ],
    standards: ["STARD", "QUADAS-2"],
  },
  {
    id: "ethics-care-casereport",
    title: "Write a case report with CARE",
    area: "writing",
    level: "intermediate",
    whatYouLearn:
      "How to structure a case report with timeline, findings, and a clear take-home lesson.",
    steps: [
      "Provide patient demographics, history, and a clear timeline.",
      "Report diagnostic assessment, intervention, and follow-up/outcomes.",
      "State the take-home message and its transferability.",
      "Obtain and report patient consent for publication.",
    ],
    pitfalls: [
      "Overgeneralizing from a single case to prevalence or causation.",
      "Insufficient detail in the clinical timeline.",
    ],
    standards: ["CARE"],
  },
  {
    id: "results-numbers-precision",
    title: "Report numbers with appropriate precision",
    area: "results",
    level: "beginner",
    whatYouLearn:
      "How to choose decimal places and significant figures that match measurement precision.",
    steps: [
      "Report percentages to whole or one decimal place for typical samples.",
      "Match decimals to the precision of the underlying measurement.",
      "Avoid implying precision your data do not have.",
      "Be consistent across tables and text.",
    ],
    pitfalls: [
      "'48.3271%' from a sample of 40.",
      "Inconsistent rounding between text and tables.",
    ],
    standards: ["SAMPL"],
  },
  {
    id: "discussion-compare-literature",
    title: "Situate findings within prior evidence",
    area: "discussion",
    level: "intermediate",
    whatYouLearn:
      "How to compare your results with existing studies and explain agreements and discrepancies.",
    steps: [
      "Identify the closest prior studies on the same question.",
      "State where your findings agree and where they differ.",
      "Offer reasons for discrepancies (population, design, measurement).",
      "Position your contribution within the body of evidence.",
    ],
    pitfalls: [
      "Citing only studies that agree with you.",
      "Listing prior studies without synthesizing them.",
    ],
  },
  {
    id: "stats-regression-reporting",
    title: "Report regression models completely",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How to report a regression so readers can interpret coefficients, adjustment, and fit.",
    steps: [
      "State the outcome, model type, and link function.",
      "List all covariates and the rationale for including them.",
      "Report coefficients/odds-or-hazard ratios with CIs.",
      "Report model fit/assumptions checks and the n analyzed.",
    ],
    pitfalls: [
      "Reporting only significant predictors.",
      "Omitting the number of observations and events per variable.",
    ],
    standards: ["STROBE", "SAMPL"],
  },
  {
    id: "stats-survival",
    title: "Report time-to-event (survival) analyses",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How to report Kaplan-Meier and Cox analyses with censoring, follow-up, and assumption checks.",
    steps: [
      "Report median follow-up and the censoring scheme.",
      "Present Kaplan-Meier curves with numbers at risk.",
      "Report hazard ratios with CIs from the Cox model.",
      "Check the proportional-hazards assumption and report it.",
    ],
    pitfalls: [
      "Ignoring the proportional-hazards assumption.",
      "Omitting numbers-at-risk under the curve.",
    ],
    standards: ["STROBE", "SAMPL"],
  },
  {
    id: "repro-equator-select",
    title: "Select the correct EQUATOR guideline",
    area: "reproducibility",
    level: "beginner",
    whatYouLearn:
      "How to match your study design to the right reporting guideline on the EQUATOR Network.",
    steps: [
      "Classify your study design precisely.",
      "Search the EQUATOR library for the matching guideline.",
      "Check for design-specific extensions (e.g., CONSORT extensions).",
      "Adopt the checklist from the planning stage.",
    ],
    pitfalls: [
      "Using STROBE for a randomized trial.",
      "Missing a relevant extension guideline.",
    ],
    standards: ["EQUATOR"],
  },
  {
    id: "ethics-data-protection",
    title: "Protect participant privacy in publications",
    area: "ethics",
    level: "intermediate",
    whatYouLearn:
      "How to deidentify data and case details so individuals cannot be re-identified.",
    steps: [
      "Remove direct identifiers and risky quasi-identifier combinations.",
      "Blur or obtain consent for identifiable images.",
      "Avoid rare detail combinations that single out a person.",
      "Follow applicable data-protection law (e.g., HIPAA/GDPR) and consent terms.",
    ],
    pitfalls: [
      "Identifiable details in a case report without consent.",
      "Sharing a dataset with residual re-identification risk.",
    ],
    standards: ["HIPAA", "GDPR", "Declaration of Helsinki"],
  },
  {
    id: "writing-respond-to-editor",
    title: "Address an editor's editorial requests",
    area: "revision",
    level: "intermediate",
    whatYouLearn:
      "How to distinguish editor requests from reviewer comments and respond to both clearly.",
    steps: [
      "Separate the editor's decision letter requests from reviewer comments.",
      "Address editorial/policy items (data sharing, reporting checklist) explicitly.",
      "Confirm compliance with any new journal requirements.",
      "Summarize how the editor's specific concerns were resolved.",
    ],
    pitfalls: [
      "Answering reviewers but ignoring the editor's own asks.",
      "Missing a required checklist or statement.",
    ],
  },
  {
    id: "figures-table-vs-figure",
    title: "Choose between a table and a figure",
    area: "figures",
    level: "beginner",
    whatYouLearn:
      "How to decide whether precise values (table) or patterns/trends (figure) serve the reader better.",
    steps: [
      "Use a table when exact values matter or there are many categories.",
      "Use a figure to reveal a trend, distribution, or relationship.",
      "Avoid duplicating the same data in both a table and a figure.",
      "Ensure each display earns its place against the word/display limit.",
    ],
    pitfalls: [
      "Showing the same numbers twice in table and figure.",
      "A dense table where a figure would reveal the pattern.",
    ],
  },
  {
    id: "search-screening-tools",
    title: "Manage screening at scale",
    area: "search",
    level: "intermediate",
    whatYouLearn:
      "How to organize large-scale screening with deduplication, tracking, and audit trails.",
    steps: [
      "Deduplicate records before screening to avoid double work.",
      "Use a tracking sheet/tool to log decisions and reasons.",
      "Keep an audit trail to reconstruct the PRISMA numbers.",
      "Pilot and calibrate the eligibility criteria before full screening.",
    ],
    pitfalls: [
      "Losing the audit trail needed for the flow diagram.",
      "Inconsistent criteria application across reviewers.",
    ],
    standards: ["PRISMA"],
  },
  {
    id: "prod-collaboration-version",
    title: "Coordinate multi-author drafting cleanly",
    area: "productivity",
    level: "intermediate",
    whatYouLearn:
      "How to manage versions, comments, and roles across co-authors without losing work.",
    steps: [
      "Agree a single source of truth and a naming/version convention.",
      "Assign sections and a timeline to each co-author.",
      "Use tracked changes/comments and resolve them in rounds.",
      "Freeze the manuscript before submission and circulate the final.",
    ],
    pitfalls: [
      "Multiple divergent copies emailed around.",
      "No final sign-off, leading to last-minute conflicting edits.",
    ],
  },
  {
    id: "writing-define-terms",
    title: "Define terms and abbreviations systematically",
    area: "writing",
    level: "beginner",
    whatYouLearn:
      "How to introduce abbreviations once and keep terminology consistent throughout.",
    steps: [
      "Spell out each term at first use with the abbreviation in parentheses.",
      "Use the abbreviation consistently thereafter.",
      "Maintain an abbreviations list if the journal requires it.",
      "Avoid abbreviating terms used only once or twice.",
    ],
    pitfalls: [
      "Reintroducing an abbreviation or switching between forms.",
      "Over-abbreviating and reducing readability.",
    ],
  },
  {
    id: "discussion-clinical-significance",
    title: "Distinguish statistical from clinical significance",
    area: "discussion",
    level: "advanced",
    whatYouLearn:
      "How to interpret whether a statistically significant effect is large enough to matter clinically.",
    steps: [
      "Compare the effect size to a minimal clinically important difference.",
      "Discuss the CI relative to clinically meaningful thresholds.",
      "Avoid calling a tiny but significant effect 'important'.",
      "State the practical implication for patients or practice.",
    ],
    pitfalls: [
      "Equating a small p-value with clinical importance.",
      "Ignoring a clinically meaningful but non-significant trend's uncertainty.",
    ],
  },
  {
    id: "results-adverse-events",
    title: "Report harms and adverse events fully",
    area: "results",
    level: "advanced",
    whatYouLearn:
      "How to report safety outcomes with the same rigor as efficacy, per the CONSORT Harms extension.",
    steps: [
      "Pre-specify how harms were collected and defined.",
      "Report all adverse events by group with denominators.",
      "Distinguish serious from non-serious events.",
      "Avoid burying harms or reporting only favorable safety data.",
    ],
    pitfalls: [
      "Reporting efficacy in detail but harms in a sentence.",
      "Omitting the denominator for adverse-event rates.",
    ],
    standards: ["CONSORT Harms"],
  },
  {
    id: "intro-theoretical-framework",
    title: "Anchor the study in a framework",
    area: "introduction",
    level: "advanced",
    whatYouLearn:
      "How to ground your question in a theoretical or conceptual framework that justifies the variables.",
    steps: [
      "Identify the framework or model relevant to your question.",
      "Explain how it predicts the relationship you test.",
      "Connect the framework to your chosen variables and hypotheses.",
      "Use it again in the discussion to interpret findings.",
    ],
    pitfalls: [
      "Naming a framework but never using it.",
      "Choosing variables with no conceptual justification.",
    ],
  },
  {
    id: "abstract-trial-registration",
    title: "Include trial registration in the abstract",
    area: "abstract",
    level: "intermediate",
    whatYouLearn:
      "How to report the registration identifier in the abstract as journals and ICMJE require.",
    steps: [
      "Locate the registry name and trial identifier.",
      "Add a 'Trial registration' line at the end of the abstract.",
      "Ensure the registered outcomes match the reported ones.",
      "Confirm registration occurred before enrollment.",
    ],
    pitfalls: [
      "Omitting the registration ICMJE journals require.",
      "Registered outcomes that differ from reported ones.",
    ],
    standards: ["ICMJE", "CONSORT for Abstracts"],
  },
  {
    id: "peer-review-statistics",
    title: "Review the statistics in a manuscript",
    area: "peer-review",
    level: "advanced",
    whatYouLearn:
      "How to scrutinize whether the analyses are appropriate, complete, and correctly interpreted.",
    steps: [
      "Check the test/model matches the data type and design.",
      "Verify effect sizes and CIs accompany p-values.",
      "Look for multiplicity, selective reporting, and outcome switching.",
      "Confirm the conclusions follow from the actual estimates.",
    ],
    pitfalls: [
      "Accepting 'significant' results without checking the analysis.",
      "Missing undisclosed subgroup or outcome switching.",
    ],
    standards: ["SAMPL"],
  },
  {
    id: "repro-deviation-log",
    title: "Document and disclose protocol deviations",
    area: "reproducibility",
    level: "intermediate",
    whatYouLearn:
      "How to track deviations from the registered protocol and report them transparently.",
    steps: [
      "Keep a dated log of every deviation and its reason.",
      "Distinguish pre-specified from post-hoc analyses in the manuscript.",
      "Report deviations and their potential impact in the limitations.",
      "Update or note discrepancies against the registration.",
    ],
    pitfalls: [
      "Silently changing the primary outcome.",
      "Presenting post-hoc analyses as pre-specified.",
    ],
    standards: ["CONSORT", "SPIRIT"],
  },
  {
    id: "writing-titles-headings",
    title: "Write informative section headings",
    area: "writing",
    level: "beginner",
    whatYouLearn:
      "How to use headings and subheadings to make a long manuscript navigable.",
    steps: [
      "Use the standard IMRaD headings unless the journal differs.",
      "Add informative subheadings within long methods/results.",
      "Keep heading wording parallel and concise.",
      "Ensure headings match the journal's hierarchy.",
    ],
    pitfalls: [
      "Cryptic or cute headings in scientific writing.",
      "Inconsistent heading levels.",
    ],
  },
  {
    id: "ethics-ai-disclosure",
    title: "Disclose AI assistance appropriately",
    area: "ethics",
    level: "beginner",
    whatYouLearn:
      "How to use and disclose AI writing tools in line with current journal and ICMJE policy.",
    steps: [
      "Check the journal's policy on AI-assisted writing.",
      "Do not list an AI tool as an author.",
      "Disclose how AI tools were used in the methods/acknowledgements.",
      "Verify every AI-suggested fact, citation, and number yourself.",
    ],
    pitfalls: [
      "Listing an AI tool as a co-author.",
      "Trusting AI-generated citations without verification.",
    ],
    standards: ["ICMJE", "COPE"],
  },
  {
    id: "results-confounder-table",
    title: "Present adjusted vs unadjusted results",
    area: "results",
    level: "advanced",
    whatYouLearn:
      "How to show both crude and adjusted estimates so readers see the effect of adjustment.",
    steps: [
      "Report the unadjusted (crude) estimate first.",
      "Report the adjusted estimate with the covariate set named.",
      "Explain meaningful changes between crude and adjusted.",
      "Avoid presenting only the model that gives the desired result.",
    ],
    pitfalls: [
      "Reporting only the adjusted estimate that suits the narrative.",
      "Not naming which covariates were in the model.",
    ],
    standards: ["STROBE"],
  },
  {
    id: "discussion-generalizability",
    title: "State external validity honestly",
    area: "discussion",
    level: "intermediate",
    whatYouLearn:
      "How to define to whom your findings apply based on the sample and setting.",
    steps: [
      "Describe how the sample compares to the target population.",
      "State the settings/conditions under which findings should hold.",
      "Flag features limiting transfer to other populations.",
      "Avoid claiming broad applicability the sample cannot support.",
    ],
    pitfalls: [
      "Generalizing from a single-center sample to all patients.",
      "Ignoring how eligibility criteria narrow applicability.",
    ],
    standards: ["STROBE"],
  },
  {
    id: "prod-submission-checklist",
    title: "Run a pre-submission checklist",
    area: "productivity",
    level: "beginner",
    whatYouLearn:
      "How to verify every required component is present before you hit submit.",
    steps: [
      "Confirm the reporting-guideline checklist is completed and attached.",
      "Verify ethics, registration, funding, and COI statements are present.",
      "Check figures/tables, supplements, and the data-availability statement.",
      "Confirm the manuscript meets word/reference limits and style.",
    ],
    pitfalls: [
      "Missing a required statement that triggers a desk return.",
      "Exceeding limits and being asked to resubmit.",
    ],
    standards: ["EQUATOR", "ICMJE"],
  },
  {
    id: "review-scoping",
    title: "Design a scoping review (PRISMA-ScR)",
    area: "review",
    level: "advanced",
    whatYouLearn:
      "How to map a broad field with a scoping review when the question is exploratory.",
    steps: [
      "Define a broad question and inclusion criteria suited to mapping.",
      "Search comprehensively across sources.",
      "Chart the data (concepts, populations, methods) rather than pooling.",
      "Summarize the breadth of evidence and gaps, not effect estimates.",
    ],
    pitfalls: [
      "Treating a scoping review as a meta-analysis.",
      "Drawing effect conclusions a scoping review cannot support.",
    ],
    standards: ["PRISMA-ScR"],
  },
  {
    id: "stats-bayesian-basics",
    title: "Report a Bayesian analysis transparently",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How to report priors, models, and posteriors so a Bayesian analysis is interpretable and reproducible.",
    steps: [
      "State and justify the priors used.",
      "Describe the model and the estimation/sampling method.",
      "Report posterior summaries with credible intervals.",
      "Run and report a sensitivity analysis to prior choice.",
    ],
    pitfalls: [
      "Hiding influential priors that drive the conclusion.",
      "Reporting a credible interval as if it were a confidence interval.",
    ],
  },
  {
    id: "intro-avoid-overcite",
    title: "Cite efficiently in the introduction",
    area: "introduction",
    level: "beginner",
    whatYouLearn:
      "How to support claims with the strongest, most relevant citations rather than long citation strings.",
    steps: [
      "Support each claim with the most authoritative primary source.",
      "Use a recent systematic review for synthesis-level claims.",
      "Avoid stacking many citations to a single uncontroversial point.",
      "Ensure each cited paper genuinely supports its sentence.",
    ],
    pitfalls: [
      "Citation stuffing to appear thorough.",
      "Citing reviews where a primary source is needed.",
    ],
  },
  {
    id: "methods-blinding-detail",
    title: "Describe blinding precisely",
    area: "methods",
    level: "advanced",
    whatYouLearn:
      "How to specify who was blinded and how, instead of the ambiguous 'double-blind'.",
    steps: [
      "Name each blinded party (participants, providers, assessors, analysts).",
      "Describe the blinding mechanism (matched placebo, masked codes).",
      "State how blinding was maintained and assessed.",
      "Report any unblinding and its handling.",
    ],
    pitfalls: [
      "'Double-blind' with no statement of who was blinded.",
      "Claiming blinding incompatible with the intervention.",
    ],
    standards: ["CONSORT"],
  },
  {
    id: "figures-consort-flow",
    title: "Build a CONSORT participant flow diagram",
    area: "figures",
    level: "advanced",
    whatYouLearn:
      "How to depict enrollment, allocation, follow-up, and analysis for a randomized trial.",
    steps: [
      "Report assessed for eligibility, excluded (with reasons), and randomized.",
      "Show allocation to each arm and how many received the intervention.",
      "Show losses to follow-up and discontinuations per arm.",
      "Show how many were analyzed per arm and why any were excluded.",
    ],
    pitfalls: [
      "Mismatched numbers between the diagram and results text.",
      "Not reporting reasons for exclusions and losses.",
    ],
    standards: ["CONSORT"],
  },
  {
    id: "writing-cut-words",
    title: "Cut a manuscript to the word limit",
    area: "writing",
    level: "intermediate",
    whatYouLearn:
      "How to reduce length without losing content by trimming redundancy and tightening prose.",
    steps: [
      "Delete sentences that repeat results in the discussion.",
      "Merge overlapping paragraphs and remove throat-clearing phrases.",
      "Move non-essential detail to supplementary material.",
      "Tighten sentences (remove 'in order to', 'due to the fact that').",
    ],
    pitfalls: [
      "Cutting essential methods detail to save words.",
      "Removing limitations to fit the limit.",
    ],
  },
  {
    id: "revision-rebuttal-summary",
    title: "Open the response with a change summary",
    area: "revision",
    level: "beginner",
    whatYouLearn:
      "How to give editors a quick overview of the major changes before the point-by-point detail.",
    steps: [
      "List the 3-5 most important changes made in revision.",
      "Note any new analyses or data added.",
      "Thank the reviewers and editor briefly.",
      "Then proceed to the point-by-point responses.",
    ],
    pitfalls: [
      "Diving into details with no overview.",
      "Overclaiming changes not reflected in the manuscript.",
    ],
  },
  {
    id: "stats-equivalence",
    title: "Frame equivalence and non-inferiority correctly",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How to pre-specify margins and interpret CIs for equivalence/non-inferiority designs.",
    steps: [
      "Pre-specify and justify the equivalence/non-inferiority margin.",
      "Power the study for the margin, not for superiority.",
      "Interpret based on whether the CI lies within the margin.",
      "Avoid concluding 'no difference' from a failed superiority test.",
    ],
    pitfalls: [
      "Treating a non-significant superiority test as proof of equivalence.",
      "Choosing the margin after seeing the data.",
    ],
    standards: ["CONSORT Non-inferiority"],
  },
  {
    id: "ethics-funding-statement",
    title: "Write a clear funding and role statement",
    area: "ethics",
    level: "beginner",
    whatYouLearn:
      "How to report funding sources and the funder's role transparently.",
    steps: [
      "Name each funder and grant number.",
      "State the funder's role in design, analysis, and reporting (or none).",
      "Confirm authors had access to the data and final say.",
      "Place the statement where the journal requires.",
    ],
    pitfalls: [
      "Omitting a funder's role in analysis or decision to publish.",
      "Hidden industry sponsorship.",
    ],
    standards: ["ICMJE"],
  },
  {
    id: "discussion-strengths",
    title: "State genuine strengths without boasting",
    area: "discussion",
    level: "beginner",
    whatYouLearn:
      "How to present the study's real methodological strengths in proportion.",
    steps: [
      "Identify design strengths (size, prospective design, validation).",
      "State each strength factually, tied to validity.",
      "Balance strengths against the limitations paragraph.",
      "Avoid hype words ('robust', 'rigorous') without substance.",
    ],
    pitfalls: [
      "Listing strengths that are not actually present.",
      "Using strengths to mask serious limitations.",
    ],
  },
  {
    id: "search-deduplicate",
    title: "Deduplicate search results reliably",
    area: "search",
    level: "intermediate",
    whatYouLearn:
      "How to remove duplicate records across databases without dropping unique studies.",
    steps: [
      "Combine exports into one library.",
      "Match on DOI/PMID first, then on title-author-year.",
      "Manually review near-duplicates before removing.",
      "Record the number removed for the PRISMA diagram.",
    ],
    pitfalls: [
      "Auto-dedup removing distinct studies with similar titles.",
      "Not recording the duplicate count.",
    ],
    standards: ["PRISMA"],
  },
  {
    id: "intro-no-results",
    title: "Keep results out of the introduction",
    area: "introduction",
    level: "beginner",
    whatYouLearn:
      "How to motivate the study without revealing findings, preserving the reader's narrative arc.",
    steps: [
      "End the introduction at the objective, not the answer.",
      "Move any 'we found' statements to results/abstract.",
      "Resist summarizing conclusions early.",
      "Keep the focus on the question and its importance.",
    ],
    pitfalls: [
      "Spoiling the main finding in the last paragraph.",
      "Stating the conclusion as the objective.",
    ],
  },
  {
    id: "conclusion-no-new-data",
    title: "Avoid introducing new data in the conclusion",
    area: "conclusion",
    level: "beginner",
    whatYouLearn:
      "How to keep the conclusion synthetic, not a place for unreported results or citations.",
    steps: [
      "Restate only findings already presented in results.",
      "Avoid new numbers, references, or analyses.",
      "Keep it interpretive and forward-looking.",
      "Ensure consistency with the abstract conclusion.",
    ],
    pitfalls: [
      "New statistics appearing for the first time.",
      "A conclusion contradicting the abstract.",
    ],
  },
  {
    id: "references-completeness",
    title: "Verify reference completeness and links",
    area: "references",
    level: "beginner",
    whatYouLearn:
      "How to ensure each reference has the fields and identifiers the journal requires and resolves correctly.",
    steps: [
      "Check each reference has authors, title, source, year, and locator.",
      "Add DOIs/PMIDs where available and confirm they resolve.",
      "Match in-text citation numbers to the list.",
      "Confirm formatting matches the journal's exact style.",
    ],
    pitfalls: [
      "Broken DOIs or missing page/volume data.",
      "In-text numbers out of sync with the list.",
    ],
    standards: ["ICMJE", "Vancouver"],
  },
  {
    id: "peer-review-timeliness",
    title: "Triage a review invitation",
    area: "peer-review",
    level: "beginner",
    whatYouLearn:
      "How to decide quickly whether to accept a review based on fit, conflict, and capacity.",
    steps: [
      "Check the abstract for fit with your expertise.",
      "Declare or decline if you have a conflict of interest.",
      "Confirm you can meet the deadline.",
      "Respond promptly so the editor can find alternatives.",
    ],
    pitfalls: [
      "Accepting outside your expertise and giving a weak review.",
      "Sitting on an invitation and delaying the process.",
    ],
    standards: ["COPE Ethical Guidelines for Peer Reviewers"],
  },
  {
    id: "writing-tense-consistency",
    title: "Use tenses consistently across sections",
    area: "writing",
    level: "beginner",
    whatYouLearn:
      "How to apply the conventional tense for each manuscript section.",
    steps: [
      "Use present tense for established knowledge in the introduction.",
      "Use past tense for what you did (methods) and found (results).",
      "Use present tense for interpretation and implications in the discussion.",
      "Check tense consistency within each paragraph.",
    ],
    pitfalls: [
      "Mixing tenses within the results.",
      "Past tense for well-established facts.",
    ],
  },
  {
    id: "prod-anticipate-reviewers",
    title: "Pre-empt likely reviewer objections",
    area: "productivity",
    level: "advanced",
    whatYouLearn:
      "How to address foreseeable weaknesses in the manuscript before reviewers raise them.",
    steps: [
      "List the most likely methodological objections to your study.",
      "Address each in the methods/limitations proactively.",
      "Add sensitivity analyses that answer the obvious 'what ifs'.",
      "Frame limitations with mitigation, not apology.",
    ],
    pitfalls: [
      "Hiding a known weakness and hoping it goes unnoticed.",
      "Over-defending and signalling insecurity.",
    ],
  },
  {
    id: "results-report-all-outcomes",
    title: "Report all pre-specified outcomes",
    area: "results",
    level: "advanced",
    whatYouLearn:
      "How to avoid selective outcome reporting by presenting every pre-registered outcome, positive or null.",
    steps: [
      "List every outcome in the registration/protocol.",
      "Report the result for each, including null and unfavorable ones.",
      "Distinguish pre-specified from post-hoc outcomes.",
      "Place secondary outcomes in tables/supplements if space-limited.",
    ],
    pitfalls: [
      "Dropping outcomes that did not reach significance.",
      "Adding unregistered outcomes without labelling them post-hoc.",
    ],
    standards: ["CONSORT", "ICMJE"],
  },
  {
    id: "discussion-null-results",
    title: "Interpret null results constructively",
    area: "discussion",
    level: "advanced",
    whatYouLearn:
      "How to present a non-significant primary result as informative rather than a failure.",
    steps: [
      "Distinguish 'no evidence of effect' from 'evidence of no effect'.",
      "Use the CI to discuss what effect sizes remain plausible.",
      "Consider power and whether the study could detect a meaningful effect.",
      "State the value of the null result for the field.",
    ],
    pitfalls: [
      "Calling a null result a failed study.",
      "Spinning a null primary into a positive secondary headline.",
    ],
  },
  {
    id: "methods-data-collection",
    title: "Describe data collection and instruments",
    area: "methods",
    level: "intermediate",
    whatYouLearn:
      "How to report how each variable was measured, including instrument validity and reliability.",
    steps: [
      "Name each instrument/measure and cite its validation.",
      "State who collected data, when, and how it was recorded.",
      "Report reliability (e.g., inter-rater agreement) where relevant.",
      "Describe quality-control and data-cleaning procedures.",
    ],
    pitfalls: [
      "Using an unvalidated instrument without acknowledgement.",
      "Vague 'data were collected' with no procedure.",
    ],
    standards: ["STROBE"],
  },
  {
    id: "abstract-word-budget",
    title: "Allocate the abstract word budget",
    area: "abstract",
    level: "beginner",
    whatYouLearn:
      "How to distribute a tight word limit so methods and results get the space they need.",
    steps: [
      "Reserve most words for Methods and Results.",
      "Keep Background to 1-2 sentences.",
      "Protect the primary-result numbers from being cut.",
      "Trim Conclusions to a single proportionate sentence.",
    ],
    pitfalls: [
      "A long background crowding out the results.",
      "Cutting the effect size to save words.",
    ],
  },
  {
    id: "ethics-trial-reporting-timeliness",
    title: "Meet results-reporting obligations",
    area: "ethics",
    level: "intermediate",
    whatYouLearn:
      "How to fulfil registry results-posting and publication obligations for registered studies.",
    steps: [
      "Know the registry's results-posting deadline for your trial.",
      "Post summary results even if not yet published.",
      "Publish negative and null trials, not only positive ones.",
      "Keep the registration record updated through the study.",
    ],
    pitfalls: [
      "Leaving a completed trial unreported (reporting bias).",
      "Failing to post results within the required window.",
    ],
    standards: ["ICMJE", "WHO", "FDAAA"],
  },
  {
    id: "writing-signposting",
    title: "Signpost the argument for the reader",
    area: "writing",
    level: "intermediate",
    whatYouLearn:
      "How to use roadmap sentences and transitions so readers always know where they are.",
    steps: [
      "Add a roadmap sentence where structure is non-obvious.",
      "Use transitions that name the logical relationship (however, therefore).",
      "Recap briefly before pivoting to a new sub-topic.",
      "Avoid over-signposting that clutters concise prose.",
    ],
    pitfalls: [
      "No transitions, leaving the reader to infer the logic.",
      "Mechanical 'firstly/secondly' that adds no information.",
    ],
  },
  {
    id: "stats-baseline-imbalance",
    title: "Handle baseline imbalance correctly",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How to address chance baseline differences in trials without misusing significance tests.",
    steps: [
      "Avoid significance testing of randomized baseline differences.",
      "Pre-specify covariate adjustment for strong prognostic factors.",
      "Report adjusted analyses as planned, not chosen post-hoc.",
      "Discuss imbalance in terms of prognostic importance, not p-values.",
    ],
    pitfalls: [
      "Adjusting for whichever baseline variable shows p < 0.05.",
      "Testing baseline differences in a randomized trial.",
    ],
    standards: ["CONSORT"],
  },

  // ════════════════════════════════════════════════════════════════════════
  // ADVANCED & EXPERT DEPTH — added to deepen the library
  // ════════════════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────── ADVANCED META-ANALYSIS (review)
  {
    id: "meta-heterogeneity-deep",
    title: "Diagnose and act on heterogeneity (not just report I-squared)",
    area: "review",
    level: "expert",
    whatYouLearn:
      "How to characterize between-study heterogeneity with tau-squared and a prediction interval, decide whether pooling is defensible, and choose the right response (subgroup, meta-regression, or no pooling).",
    steps: [
      "Report tau-squared (absolute heterogeneity) and a 95% prediction interval, not I-squared alone — I-squared is relative and inflates with study precision.",
      "Interpret the prediction interval clinically: if it spans benefit and harm, a single summary effect is misleading.",
      "Pre-specify candidate effect modifiers and probe them with subgroup analysis or meta-regression, requiring ~10 studies per covariate.",
      "If heterogeneity is unexplained and substantial, present the range and prediction interval rather than over-trusting the pooled point.",
      "Re-estimate tau-squared with an appropriate method (REML or Paule-Mandel) rather than DerSimonian-Laird by default.",
    ],
    pitfalls: [
      "Treating I-squared as the amount of heterogeneity rather than the proportion of variance due to it.",
      "Running meta-regression on too few studies, producing spurious 'explanations'.",
      "Reporting a tidy pooled effect while the prediction interval crosses the null.",
    ],
    standards: ["Cochrane", "PRISMA"],
    promptTemplate:
      "I have a random-effects meta-analysis with these per-study effects and variances: {data}. Help me report tau-squared and a 95% prediction interval, interpret whether pooling is defensible, and list pre-specified effect modifiers worth probing. Do not invent studies or numbers.",
  },
  {
    id: "meta-regression",
    title: "Run and report meta-regression rigorously",
    area: "review",
    level: "expert",
    whatYouLearn:
      "How to use study-level covariates to explain heterogeneity without falling into ecological fallacy or overfitting.",
    steps: [
      "Pre-specify covariates in the protocol; limit to roughly one per ten studies.",
      "Use a mixed-effects (random-effects) meta-regression, reporting the residual tau-squared and R-squared analog.",
      "Interpret coefficients as associations between study-level characteristics and effect size, not individual-level effects.",
      "Check for confounding among covariates and report the permutation-test p-value for robustness.",
    ],
    pitfalls: [
      "Aggregation/ecological bias: inferring patient-level relationships from study-level means.",
      "Fishing across many covariates and reporting only the significant one.",
    ],
    standards: ["Cochrane"],
  },
  {
    id: "meta-publication-bias",
    title: "Assess small-study effects and publication bias correctly",
    area: "review",
    level: "expert",
    whatYouLearn:
      "How to investigate publication bias with the right tools for your effect measure and number of studies, and how to express the conclusion cautiously.",
    steps: [
      "Use a funnel plot and a formal test only with enough studies (typically >=10) and adequate variance in study sizes.",
      "Match the test to the effect: Egger for continuous/log-ratio measures, Peters or Harbord for binary outcomes to avoid artefactual asymmetry.",
      "Distinguish publication bias from other causes of asymmetry (true heterogeneity, poor methodology in small studies, chance).",
      "Consider trim-and-fill or a selection model as sensitivity analyses, framing them as exploratory, not corrective.",
    ],
    pitfalls: [
      "Reading a funnel plot with 5 studies and over-interpreting asymmetry.",
      "Using Egger's test on a log-odds-ratio outcome where it is biased.",
      "Presenting trim-and-fill's adjusted estimate as the 'true' effect.",
    ],
    standards: ["Cochrane", "PRISMA"],
  },
  {
    id: "meta-grade",
    title: "Rate certainty of evidence with GRADE",
    area: "review",
    level: "expert",
    whatYouLearn:
      "How to move from a pooled estimate to a defensible certainty rating by assessing risk of bias, inconsistency, indirectness, imprecision, and publication bias.",
    steps: [
      "Start RCT evidence at high certainty and observational evidence at low, then rate down or up per domain.",
      "Rate down for serious risk of bias, inconsistency (unexplained heterogeneity), indirectness, imprecision (CI crossing a decision threshold or few events), and suspected publication bias.",
      "Rate up observational evidence for a large effect, dose-response, or when plausible confounding would reduce a demonstrated effect.",
      "Assemble a Summary of Findings table with absolute effects and the certainty rating per outcome.",
      "Write the certainty rationale explicitly so a reader can audit each judgment.",
    ],
    pitfalls: [
      "Conflating quality of individual studies with certainty of the body of evidence.",
      "Rating down twice for the same underlying problem.",
      "Reporting only relative effects without absolute risk differences in the SoF table.",
    ],
    standards: ["GRADE", "Cochrane", "PRISMA"],
    promptTemplate:
      "Walk me through a GRADE assessment for this outcome: design {design}, pooled effect {effect}, heterogeneity {heterogeneity}, risk of bias {rob}, event count {events}. For each of the five domains, state the judgment and rationale, then give the overall certainty. Do not invent data.",
  },
  {
    id: "meta-ipd",
    title: "Plan an individual-participant-data (IPD) meta-analysis",
    area: "review",
    level: "expert",
    whatYouLearn:
      "How an IPD synthesis differs from aggregate-data meta-analysis and when its extra cost is justified.",
    steps: [
      "Justify IPD: harmonized outcome definitions, time-to-event analysis, and patient-level effect modification.",
      "Choose one-stage (single model with study as a random effect) vs two-stage (analyze each study then pool) and keep the clustering by study.",
      "Pre-specify a data-sharing and harmonization plan and a risk-of-bias assessment for each contributing dataset.",
      "Examine treatment-covariate interactions at the patient level, avoiding the aggregation bias of meta-regression.",
    ],
    pitfalls: [
      "Ignoring clustering by study in a one-stage model (treating all patients as one sample).",
      "Availability bias when only some trials share data.",
    ],
    standards: ["PRISMA-IPD", "Cochrane"],
  },
  {
    id: "meta-network",
    title: "Interpret a network meta-analysis",
    area: "review",
    level: "expert",
    whatYouLearn:
      "How to combine direct and indirect comparisons across multiple treatments while checking the assumptions that make it valid.",
    steps: [
      "Assess transitivity: are the trials similar enough in effect modifiers to support indirect comparison?",
      "Check consistency between direct and indirect evidence (node-splitting or design-by-treatment interaction).",
      "Report the network geometry and rank treatments cautiously (SUCRA/rankograms), noting rankings can mislead when CIs overlap.",
      "Apply GRADE for network meta-analysis to each comparison.",
    ],
    pitfalls: [
      "Trusting a treatment ranking when the credible intervals overlap heavily.",
      "Combining trials whose populations violate transitivity.",
    ],
    standards: ["PRISMA-NMA", "GRADE"],
  },

  // ──────────────────────────────────────────── CAUSAL INFERENCE (statistics)
  {
    id: "causal-dag",
    title: "Use DAGs to choose an adjustment set",
    area: "statistics",
    level: "expert",
    whatYouLearn:
      "How to encode causal assumptions in a directed acyclic graph and identify the minimal sufficient adjustment set that blocks confounding without opening collider paths.",
    steps: [
      "Draw the exposure, outcome, and every common cause, mediator, and collider you can justify.",
      "Apply the backdoor criterion: block all backdoor paths by adjusting for confounders only.",
      "Identify the minimal sufficient adjustment set (a tool like a DAG checker can confirm it).",
      "Explicitly NOT adjust for mediators (which would estimate a direct effect) or colliders (which induce bias).",
      "Report the DAG and adjustment set so reviewers can challenge the assumptions, not just the model.",
    ],
    pitfalls: [
      "Adjusting for a collider (e.g., a common effect of exposure and outcome) and creating selection bias.",
      "Adjusting for a mediator when the target is the total effect.",
      "Choosing covariates by statistical significance rather than causal role.",
    ],
    standards: ["STROBE"],
    promptTemplate:
      "Here is my causal question: effect of {exposure} on {outcome}. Candidate variables: {variables}. Help me classify each as confounder, mediator, collider, or competing exposure, and propose a minimal sufficient adjustment set using the backdoor criterion. Flag any variable I should NOT adjust for and why.",
  },
  {
    id: "causal-propensity",
    title: "Apply propensity score methods correctly",
    area: "statistics",
    level: "expert",
    whatYouLearn:
      "How to estimate and use a propensity score (matching, weighting, or adjustment), check balance, and report the estimand it targets.",
    steps: [
      "Model the propensity (probability of treatment) on pre-treatment confounders only — never post-treatment variables.",
      "Choose the approach to match the estimand: matching/ATT, IPTW for ATE, or overlap weights for the population with equipoise.",
      "Assess covariate balance with standardized mean differences (target < 0.1), not significance tests.",
      "Check positivity/overlap of the score distributions and trim or report the region of common support.",
      "Use a robust or matched variance estimator and report the effective sample size after weighting.",
    ],
    pitfalls: [
      "Including instruments or post-treatment variables in the propensity model.",
      "Judging balance with p-values rather than standardized differences.",
      "Extreme weights from poor overlap inflating variance and bias.",
    ],
    standards: ["STROBE"],
  },
  {
    id: "causal-iv",
    title: "Use instrumental variables to address unmeasured confounding",
    area: "statistics",
    level: "expert",
    whatYouLearn:
      "How to identify a valid instrument, defend the three core assumptions, and interpret the local (complier) effect it estimates.",
    steps: [
      "Defend relevance: the instrument strongly predicts exposure (report the first-stage F; weak if < 10).",
      "Defend the exclusion restriction: the instrument affects the outcome only through the exposure.",
      "Defend independence: the instrument is unrelated to unmeasured confounders.",
      "Estimate with two-stage least squares (or the appropriate analog) and report it as a local average treatment effect among compliers.",
      "Probe assumptions with falsification/negative-control tests where possible.",
    ],
    pitfalls: [
      "A weak instrument that biases the estimate toward the confounded observational result.",
      "Interpreting the IV estimate as the population average effect rather than the complier effect.",
      "Assuming the untestable exclusion restriction without argument.",
    ],
    standards: ["STROBE"],
  },
  {
    id: "causal-target-trial",
    title: "Emulate a target trial from observational data",
    area: "statistics",
    level: "expert",
    whatYouLearn:
      "How to specify the hypothetical randomized trial you would run, then emulate each component to avoid immortal-time and prevalent-user biases.",
    steps: [
      "Write the protocol of the target trial: eligibility, treatment strategies, assignment, follow-up start, outcome, and estimand.",
      "Align time zero so eligibility, treatment assignment, and follow-up start coincide — this prevents immortal-time bias.",
      "Use a new-user (incident) design to avoid prevalent-user and depletion-of-susceptibles bias.",
      "Emulate randomization with adjustment, weighting, or g-methods for time-varying confounding.",
      "Report the explicit correspondence between each trial component and its emulation.",
    ],
    pitfalls: [
      "Misaligned time zero creating immortal-time bias (the classic 'survivor treatment' advantage).",
      "Including prevalent users and conditioning on having survived to treatment.",
    ],
    standards: ["STROBE", "RECORD"],
    promptTemplate:
      "Help me draft a target-trial-emulation protocol for the effect of {treatment strategies} on {outcome} in {population} using {data source}. Specify eligibility, time zero alignment, treatment strategies, the estimand, and the confounding-control approach. Flag immortal-time risks.",
  },
  {
    id: "causal-mediation",
    title: "Conduct a causal mediation analysis",
    area: "statistics",
    level: "expert",
    whatYouLearn:
      "How to decompose a total effect into direct and indirect (mediated) components under explicit identification assumptions.",
    steps: [
      "Define the estimands: controlled direct effect or natural direct/indirect effects.",
      "State the four no-unmeasured-confounding assumptions (exposure-outcome, mediator-outcome, exposure-mediator, and no mediator-outcome confounder affected by exposure).",
      "Model the mediator and outcome, allowing for exposure-mediator interaction.",
      "Report the proportion mediated with a sensitivity analysis for unmeasured mediator-outcome confounding.",
    ],
    pitfalls: [
      "Using the old Baron-Kenny product method while ignoring exposure-mediator interaction.",
      "Ignoring a confounder of the mediator-outcome relationship that is affected by exposure.",
    ],
    standards: ["STROBE"],
  },
  {
    id: "causal-negative-controls",
    title: "Use negative controls to detect residual bias",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How negative-control outcomes and exposures can reveal unmeasured confounding or systematic error in observational studies.",
    steps: [
      "Choose a negative-control outcome that the exposure cannot plausibly cause but shares the confounding structure.",
      "Estimate the 'effect' on the negative control; a non-null result signals residual bias.",
      "Optionally calibrate your primary estimate using the negative-control distribution.",
      "Report negative-control findings alongside the primary result.",
    ],
    pitfalls: [
      "Choosing a negative control that does not share the confounders of interest.",
      "Ignoring a clearly biased negative-control result.",
    ],
    standards: ["STROBE"],
  },

  // ──────────────────────────────────────────── SURVIVAL / TIME-TO-EVENT (statistics)
  {
    id: "stats-competing-risks",
    title: "Handle competing risks in time-to-event analysis",
    area: "statistics",
    level: "expert",
    whatYouLearn:
      "How to choose between cause-specific hazards and subdistribution (Fine-Gray) models and why naive Kaplan-Meier overestimates incidence under competing events.",
    steps: [
      "Identify competing events (e.g., death from another cause) that preclude the event of interest.",
      "Report cumulative incidence functions, not 1 minus Kaplan-Meier, which overstates risk with competing events.",
      "Use cause-specific Cox for etiology questions; use Fine-Gray subdistribution hazards for prediction/risk questions.",
      "State which question you are answering and interpret the hazard ratio accordingly.",
    ],
    pitfalls: [
      "Censoring competing events and using 1-KM, inflating the estimated incidence.",
      "Interpreting a subdistribution hazard ratio as if it were cause-specific.",
    ],
    standards: ["STROBE", "SAMPL"],
  },
  {
    id: "stats-time-varying",
    title: "Model time-varying covariates and effects",
    area: "statistics",
    level: "expert",
    whatYouLearn:
      "How to handle covariates that change over follow-up and hazard ratios that are not constant, avoiding time-dependent bias.",
    steps: [
      "Use the counting-process (start-stop) data format so a covariate's value applies only to the interval it covers.",
      "Distinguish a time-varying covariate from a time-varying effect (non-proportional hazards).",
      "Test proportional hazards (e.g., Schoenfeld residuals); if violated, model an interaction with time or report time-specific effects.",
      "Avoid conditioning on the future — a covariate measured after baseline must not classify earlier person-time.",
    ],
    pitfalls: [
      "Immortal-time bias from assigning a later treatment status to earlier follow-up.",
      "Forcing a single hazard ratio when the effect clearly changes over time.",
    ],
    standards: ["STROBE", "SAMPL"],
  },
  {
    id: "stats-rmst",
    title: "Report restricted mean survival time when hazards are non-proportional",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How to summarize a survival difference without assuming proportional hazards, using restricted mean survival time (RMST).",
    steps: [
      "Choose a clinically meaningful time horizon for the restriction.",
      "Estimate RMST in each arm as the area under the survival curve up to that horizon.",
      "Report the RMST difference (extra event-free time) with its CI as the effect measure.",
      "Use RMST when the proportional-hazards assumption fails or curves cross.",
    ],
    pitfalls: [
      "Reporting a hazard ratio when curves cross and the HR is uninterpretable.",
      "Choosing the time horizon after seeing the curves to favor a result.",
    ],
    standards: ["SAMPL"],
  },

  // ──────────────────────────────────────────── MISSING DATA (statistics)
  {
    id: "stats-multiple-imputation",
    title: "Run multiple imputation that satisfies reviewers",
    area: "statistics",
    level: "expert",
    whatYouLearn:
      "How to implement and report multiple imputation by chained equations so the analysis is valid under MAR and the uncertainty is propagated.",
    steps: [
      "State the missingness mechanism assumption (MAR) and why it is plausible given the design.",
      "Build the imputation model to be at least as rich as the analysis model, including the outcome and any interactions/non-linearities (congeniality).",
      "Use enough imputations (a common rule: at least as many as the percentage of incomplete cases) and report the number.",
      "Pool estimates across imputations with Rubin's rules and report between- vs within-imputation variance where relevant.",
      "Run a sensitivity analysis departing from MAR (e.g., delta-adjustment or pattern-mixture) for outcomes.",
    ],
    pitfalls: [
      "Omitting the outcome from the imputation model, biasing associations toward the null.",
      "Imputing then naively averaging point estimates without Rubin's rules (understating uncertainty).",
      "Claiming MAR without any argument or sensitivity check.",
    ],
    standards: ["STROBE", "ICH E9(R1)"],
    promptTemplate:
      "Help me document a multiple-imputation plan for {variables} missing under a presumed {mechanism} mechanism, with analysis model {model}. Specify the imputation model, number of imputations, pooling, and a sensitivity analysis departing from MAR. Do not invent missingness rates.",
  },

  // ──────────────────────────────────────────── PREDICTION MODELS (methods)
  {
    id: "methods-prediction-development",
    title: "Develop a clinical prediction model that will validate",
    area: "methods",
    level: "expert",
    whatYouLearn:
      "How to develop a prediction model with enough events per variable, sensible predictor handling, shrinkage, and honest internal validation.",
    steps: [
      "Estimate the required sample size for development (events per candidate predictor and the new EPV/sample-size criteria), not a rule-of-thumb alone.",
      "Pre-specify candidate predictors clinically; avoid univariable screening that discards useful predictors.",
      "Keep continuous predictors continuous (splines), not dichotomized, to preserve information.",
      "Apply shrinkage/penalization (e.g., ridge/LASSO or a uniform shrinkage factor) to curb optimism.",
      "Internally validate by bootstrapping the entire modelling process and report the optimism-corrected performance.",
    ],
    pitfalls: [
      "Dichotomizing continuous predictors and losing predictive information.",
      "Stepwise selection in small data inflating optimism and instability.",
      "Reporting apparent (training) performance as if it were validated.",
    ],
    standards: ["TRIPOD", "TRIPOD+AI"],
  },
  {
    id: "methods-prediction-validation",
    title: "Validate and present a prediction model (discrimination + calibration)",
    area: "methods",
    level: "expert",
    whatYouLearn:
      "How to evaluate a model on external data with discrimination, calibration, and clinical utility, and present it for use.",
    steps: [
      "Assess discrimination (C-statistic/AUC) AND calibration (calibration plot, calibration-in-the-large and slope) — discrimination alone is insufficient.",
      "Add a decision-curve analysis to show net benefit across threshold probabilities.",
      "Validate externally (different time, place, or setting); report case-mix and whether recalibration was needed.",
      "Present the final model usably: equation, nomogram, or a transparent risk calculator.",
      "Report following TRIPOD (and TRIPOD+AI for machine-learning models, including data provenance and fairness).",
    ],
    pitfalls: [
      "Reporting AUC but omitting calibration, hiding systematic over/under-prediction.",
      "Calling temporal split-sample 'external' validation.",
      "No decision-curve/net-benefit analysis, so clinical usefulness is unknown.",
    ],
    standards: ["TRIPOD", "TRIPOD+AI"],
    promptTemplate:
      "Help me structure the validation report for my prediction model: outcome {outcome}, validation data {data}, C-statistic {auc}. Remind me which calibration metrics and which clinical-utility analysis to report per TRIPOD, and how to describe external validity. Do not fabricate metrics.",
  },
  {
    id: "methods-ml-rigor",
    title: "Avoid leakage and overfitting in ML for health research",
    area: "methods",
    level: "expert",
    whatYouLearn:
      "How to prevent the data-leakage and evaluation errors that make machine-learning health models look far better than they generalize.",
    steps: [
      "Split data before any preprocessing; fit scaling, imputation, and feature selection inside cross-validation folds only.",
      "Keep all records from one patient/site within a single fold to prevent group leakage.",
      "Use nested cross-validation when tuning hyperparameters to avoid optimistic model selection.",
      "Report performance with uncertainty, calibration, and a subgroup/fairness breakdown.",
      "Document data provenance and the intended use following TRIPOD+AI.",
    ],
    pitfalls: [
      "Fitting imputation or feature selection on the whole dataset before splitting (leakage).",
      "Tuning on the test set and reporting that performance.",
      "Reporting only AUC with no calibration or fairness assessment.",
    ],
    standards: ["TRIPOD+AI"],
  },

  // ──────────────────────────────────────────── QUALITATIVE RIGOR (methods)
  {
    id: "qual-rigor",
    title: "Demonstrate qualitative rigor (trustworthiness)",
    area: "methods",
    level: "advanced",
    whatYouLearn:
      "How to establish credibility, transferability, dependability, and confirmability rather than borrowing quantitative validity language.",
    steps: [
      "Credibility: use triangulation, member checking, and prolonged engagement where appropriate.",
      "Transferability: provide thick description of context so readers judge applicability.",
      "Dependability and confirmability: keep an audit trail and reflexive memos.",
      "Report against COREQ (interviews/focus groups) or SRQR.",
    ],
    pitfalls: [
      "Reporting inter-rater 'reliability' as if qualitative coding were a measurement test.",
      "Thin description that prevents readers judging transferability.",
    ],
    standards: ["COREQ", "SRQR"],
  },
  {
    id: "qual-reflexivity",
    title: "Write a reflexivity statement",
    area: "methods",
    level: "advanced",
    whatYouLearn:
      "How to make the researcher's position, assumptions, and influence on data generation explicit.",
    steps: [
      "State your disciplinary background, prior beliefs, and relationship to participants.",
      "Explain how your position could shape data collection and interpretation.",
      "Describe steps taken to examine and mitigate that influence (memos, peer debriefing).",
      "Locate the statement transparently in methods or a dedicated section.",
    ],
    pitfalls: [
      "A token reflexivity sentence with no engagement with actual influence.",
      "Claiming a 'neutral' stance that denies positionality.",
    ],
    standards: ["COREQ", "SRQR"],
  },
  {
    id: "qual-saturation",
    title: "Justify sample size and saturation in qualitative work",
    area: "methods",
    level: "advanced",
    whatYouLearn:
      "How to define and evidence data/thematic saturation instead of asserting it.",
    steps: [
      "Define the type of saturation used (code, meaning, or theoretical) up front.",
      "Describe the analytic point at which new data stopped generating new codes/themes.",
      "Report the sampling strategy (purposive, maximum variation) that supports the claim.",
      "Avoid claiming saturation as a numeric target unrelated to the data.",
    ],
    pitfalls: [
      "Asserting saturation without any operational definition or evidence.",
      "Treating a fixed n as proof of saturation.",
    ],
    standards: ["SRQR", "COREQ"],
  },
  {
    id: "methods-mixed-methods",
    title: "Report a mixed-methods design coherently",
    area: "methods",
    level: "advanced",
    whatYouLearn:
      "How to specify the integration of quantitative and qualitative strands rather than reporting two studies side by side.",
    steps: [
      "Name the design (convergent, explanatory-sequential, exploratory-sequential) and its rationale.",
      "State the timing, priority, and point of integration of the two strands.",
      "Report integration explicitly (joint displays, meta-inferences), not just parallel results.",
      "Discuss where the strands converge, diverge, and how you reconcile them.",
    ],
    pitfalls: [
      "Two disconnected analyses with no integration ('quant + qual' not 'mixed').",
      "No stated rationale for why mixing adds value.",
    ],
    standards: ["GRAMMS"],
  },

  // ──────────────────────────────────────────── DEALING WITH REVIEWERS / REVISION
  {
    id: "revision-reviewer-2",
    title: "Disarm a hostile 'Reviewer 2'",
    area: "revision",
    level: "expert",
    whatYouLearn:
      "How to turn an aggressive, dismissive, or partly-wrong review into accepted revisions without escalating or capitulating.",
    steps: [
      "Read the review twice, then wait a day; separate the substance from the tone.",
      "Extract every actionable kernel even from rude comments — reviewers are often right about the symptom if wrong about the cause.",
      "Respond to the strongest version of each criticism (steelman it), with data or citation, never matching the hostility.",
      "Where the reviewer is factually wrong, correct courteously with evidence and offer a clarifying manuscript edit so future readers are not confused.",
      "If a reviewer demands an out-of-scope study, explain the scope, offer a feasible analysis, and let the editor adjudicate.",
    ],
    pitfalls: [
      "Mirroring the reviewer's tone or sarcasm in the response.",
      "Conceding scientifically incorrect demands just to appease.",
      "Dismissing a rude comment that nonetheless contains a valid point.",
    ],
    standards: ["COPE"],
    promptTemplate:
      "This reviewer comment is harsh and partly mistaken: \"\"\"{comment}\"\"\". Help me draft a calm, evidence-based response that (1) acknowledges any valid kernel, (2) corrects the error with reasoning, (3) proposes a concrete manuscript change, and (4) defers to the editor where needed. Keep it professional and non-defensive.",
  },
  {
    id: "revision-rebuttal-mastery",
    title: "Master the rebuttal letter as a persuasive document",
    area: "revision",
    level: "expert",
    whatYouLearn:
      "How to architect a response letter that makes the editor's accept decision easy: navigable, evidence-led, and visibly complete.",
    steps: [
      "Open with a concise summary of the major changes and the overall improvement.",
      "Reproduce each comment, then respond with: position, what changed, and the exact revised text with location.",
      "Use formatting (bold for reviewer text, indentation for new manuscript text) so the editor can scan in minutes.",
      "Quantify your responsiveness ('all 14 comments addressed; 3 new analyses added').",
      "Close by reaffirming fit and thanking reviewers for specific improvements.",
    ],
    pitfalls: [
      "A wall of unformatted text the editor cannot navigate.",
      "Vague 'we have revised the text accordingly' with no quote or location.",
      "Claiming changes the manuscript does not actually contain.",
    ],
    standards: ["ICMJE", "COPE"],
  },
  {
    id: "revision-conflicting-reviewers",
    title: "Reconcile contradictory reviewer demands",
    area: "revision",
    level: "expert",
    whatYouLearn:
      "How to respond when two reviewers ask for opposite changes without alienating either or the editor.",
    steps: [
      "State plainly that the two comments conflict and quote both.",
      "Explain the scientific trade-off and your reasoned choice.",
      "Offer a compromise that partially satisfies each where feasible (e.g., main text + supplement).",
      "Explicitly invite the editor to arbitrate the remaining tension.",
    ],
    pitfalls: [
      "Silently siding with one reviewer and ignoring the other's comment.",
      "Trying to satisfy both literally and producing an incoherent manuscript.",
    ],
    standards: ["COPE"],
  },
  {
    id: "revision-new-analysis-scope",
    title: "Negotiate requests for new experiments or analyses",
    area: "revision",
    level: "advanced",
    whatYouLearn:
      "How to decide which additional analyses to run, which to decline, and how to frame each to the editor.",
    steps: [
      "Classify each request: cheap-and-strengthening (do it), expensive-but-fair (negotiate), or out-of-scope (decline with rationale).",
      "Run feasible sensitivity analyses that pre-empt the underlying worry even if not the literal request.",
      "For declined requests, explain why the existing data answer the question or why the request changes the study's scope.",
      "Document any analysis as exploratory and pre-empt multiplicity concerns.",
    ],
    pitfalls: [
      "Agreeing to unfunded, infeasible experiments to avoid conflict.",
      "Declining everything and appearing unresponsive.",
    ],
    standards: ["COPE"],
  },
  {
    id: "revision-resubmission-strategy",
    title: "Plan a strategic resubmission after rejection",
    area: "revision",
    level: "expert",
    whatYouLearn:
      "How to convert a rejection into a stronger submission elsewhere by triaging feedback, repositioning, and choosing the next venue deliberately.",
    steps: [
      "Classify the rejection: desk/scope (reposition and reformat) vs peer-review/substance (fix the science first).",
      "Implement the legitimate reviewer fixes even though you are moving journals — reviewers talk and rigor compounds.",
      "Reframe the framing, abstract, and cover letter to the new journal's scope and audience.",
      "Decide the next venue by fit and likely reviewer pool, not impact factor alone; keep a submission log.",
      "If resubmitting to the same journal after a 'reject and resubmit', treat it as a new paper that visibly addresses prior concerns.",
    ],
    pitfalls: [
      "Resubmitting unchanged to a near-identical journal and drawing the same reviewers.",
      "Ignoring substantive critique because 'it was just one reviewer'.",
    ],
    standards: ["COPE"],
  },
  {
    id: "revision-appeal",
    title: "Write a measured appeal of an editorial decision",
    area: "revision",
    level: "advanced",
    whatYouLearn:
      "How to appeal a rejection when a review contains a clear factual error, without antagonizing the editor.",
    steps: [
      "Appeal only for a demonstrable factual/technical error, not because you disagree with the verdict.",
      "Address the editor respectfully, cite the specific erroneous statement, and provide the evidence.",
      "State precisely what you request (re-review, second opinion) and acknowledge the editor's final authority.",
      "Keep it short, factual, and free of grievance.",
    ],
    pitfalls: [
      "Appealing on taste or disappointment rather than a concrete error.",
      "An emotional tone that hardens the editor's position.",
    ],
    standards: ["COPE"],
  },

  // ──────────────────────────────────────────── IMPACT / FRAMING / GRANTS
  {
    id: "writing-significance-statement",
    title: "Write a compelling significance / impact statement",
    area: "writing",
    level: "expert",
    whatYouLearn:
      "How to articulate why the work matters to a broad reader in a few sentences without hype, the way high-impact journals and funders require.",
    steps: [
      "State the problem and its scale in one sentence a non-specialist grasps.",
      "State what was unknown and what your work now establishes.",
      "State the concrete consequence: what changes in understanding, practice, or policy.",
      "Calibrate certainty to the design — significance is about importance, not overstatement.",
    ],
    pitfalls: [
      "Inflating significance with 'paradigm-shifting' language the data cannot support.",
      "Describing what you did instead of why it matters.",
    ],
    promptTemplate:
      "Draft a 4-sentence significance statement for a {design} that found {finding}. Sentence 1: the problem and its scale. Sentence 2: the gap. Sentence 3: what we now establish. Sentence 4: the concrete implication. No hype; certainty matched to design.",
  },
  {
    id: "writing-grant-framing",
    title: "Frame a manuscript to align with a funding narrative",
    area: "writing",
    level: "advanced",
    whatYouLearn:
      "How to position a paper so it visibly advances the aims of the funding that supported it and seeds the next proposal.",
    steps: [
      "Connect the study's contribution to the broader programmatic goal it serves.",
      "Use language that maps to the funder's mission without overclaiming this single study.",
      "Highlight the methodological capability built, which strengthens future grant competitiveness.",
      "State the next logical aim the findings justify (feeding a future application).",
    ],
    pitfalls: [
      "Overclaiming translational impact from an early-stage study.",
      "Framing so promotional it reads as marketing, not science.",
    ],
  },
  {
    id: "intro-so-what",
    title: "Pass the 'so what?' test in the first paragraph",
    area: "introduction",
    level: "advanced",
    whatYouLearn:
      "How to make the opening establish stakes high enough that an editor reads on, without resorting to cliche.",
    steps: [
      "Lead with the concrete consequence of the unsolved problem (clinical, economic, scientific).",
      "Avoid generic openers ('X is a major public health problem') unless quantified and cited.",
      "Make the reader feel the cost of the gap before you name it.",
      "Ensure the stakes you raise are exactly the ones your study addresses.",
    ],
    pitfalls: [
      "A cliche opening sentence editors have read a thousand times.",
      "Raising stakes the study does not actually speak to.",
    ],
  },

  // ──────────────────────────────────────────── OPEN SCIENCE / REPRODUCIBILITY (expert)
  {
    id: "repro-registered-report",
    title: "Submit a Registered Report",
    area: "reproducibility",
    level: "expert",
    whatYouLearn:
      "How the two-stage Registered Report format works and how it protects against publication bias and HARKing by peer-reviewing the protocol before data collection.",
    steps: [
      "Stage 1: submit Introduction, Methods, and analysis plan for peer review before collecting data.",
      "Address Stage 1 review to earn in-principle acceptance (IPA), which commits the journal to publish regardless of results.",
      "Collect data and execute exactly the registered analyses; clearly separate pre-registered from exploratory analyses.",
      "Stage 2: submit the full paper; reviewers check adherence, not whether results are exciting.",
    ],
    pitfalls: [
      "Adding unregistered analyses at Stage 2 without labelling them exploratory.",
      "Treating IPA as a guarantee even if you deviate from the registered protocol.",
    ],
    standards: ["OSF", "Registered Reports"],
  },
  {
    id: "repro-pipeline",
    title: "Build a reproducible end-to-end analysis pipeline",
    area: "reproducibility",
    level: "expert",
    whatYouLearn:
      "How to wire raw data to final tables/figures so anyone can reproduce every number with one command.",
    steps: [
      "Separate raw (read-only) data from derived data and outputs; never edit raw data in place.",
      "Script every transformation; eliminate manual spreadsheet steps that cannot be reproduced.",
      "Use a workflow/build tool (e.g., Make or a workflow manager) so outputs regenerate deterministically.",
      "Pin the computational environment (lockfile/container) and record seeds.",
      "Map each manuscript table/figure to the exact script that produces it in a README.",
    ],
    pitfalls: [
      "A manual click-through analysis that cannot be re-run.",
      "Outputs that silently depend on the order scripts were run.",
    ],
    standards: ["TOP Guidelines", "FAIR"],
  },
  {
    id: "repro-data-availability-real",
    title: "Write a data/code availability statement that holds up",
    area: "reproducibility",
    level: "advanced",
    whatYouLearn:
      "How to write an availability statement that is specific, honest, and actually actionable rather than a placeholder.",
    steps: [
      "State exactly what is available (data, code, materials) and what is restricted, with the reason for any restriction.",
      "Give the persistent identifier (DOI/accession) and the repository, not a personal website.",
      "If access is controlled, name the access mechanism, the committee, and the realistic timeline.",
      "Match the statement to what you have genuinely deposited before submission.",
    ],
    pitfalls: [
      "'Available on reasonable request' with no intent or mechanism to share.",
      "Linking to a lab website that will rot, instead of an archived DOI.",
    ],
    standards: ["FAIR", "ICMJE", "TOP Guidelines"],
  },
  {
    id: "repro-computational-env",
    title: "Capture the computational environment for the long term",
    area: "reproducibility",
    level: "advanced",
    whatYouLearn:
      "How to ensure your analysis still runs years later by freezing dependencies and the runtime.",
    steps: [
      "Record exact versions of language, packages, and the OS-level dependencies.",
      "Provide a lockfile and, where feasible, a container image or environment definition.",
      "Archive the environment specification alongside the code with a DOI.",
      "Test reproduction on a clean machine before submission.",
    ],
    pitfalls: [
      "Unpinned 'latest' dependencies that change behaviour over time.",
      "An environment that only works on the original author's laptop.",
    ],
    standards: ["FAIR", "TOP Guidelines"],
  },

  // ──────────────────────────────────────────── ETHICS / AUTHORSHIP (expert edge cases)
  {
    id: "ethics-authorship-dispute",
    title: "Prevent and resolve authorship disputes",
    area: "ethics",
    level: "expert",
    whatYouLearn:
      "How to use upfront agreements and recognized processes to handle disagreements over who is an author and in what order.",
    steps: [
      "Agree authorship and order in writing at project start, revisiting as contributions evolve.",
      "Apply the four ICMJE criteria to each person; do not trade authorship for funding or seniority.",
      "Document contributions with CRediT roles so claims are auditable.",
      "If a dispute persists, escalate to the institution or use COPE guidance/flowcharts rather than unilateral removal.",
      "Never add or remove an author after submission without all authors' written agreement.",
    ],
    pitfalls: [
      "Gift, guest, or ghost authorship that breaches all four criteria.",
      "Removing a contributor's name without consent during a dispute.",
    ],
    standards: ["ICMJE", "CRediT", "COPE"],
  },
  {
    id: "ethics-credit-roles",
    title: "Assign CRediT contributor roles precisely",
    area: "ethics",
    level: "intermediate",
    whatYouLearn:
      "How to map each author to specific CRediT taxonomy roles so contributions are transparent and disputes are pre-empted.",
    steps: [
      "Review the 14 CRediT roles (conceptualization, methodology, analysis, writing, etc.).",
      "Assign each author the specific roles they genuinely performed.",
      "Confirm everyone listed still meets the ICMJE authorship criteria, with CRediT as a supplement, not a substitute.",
      "Record the roles in the manuscript's contributorship statement.",
    ],
    pitfalls: [
      "Using CRediT to justify authorship for someone who fails ICMJE criteria.",
      "Assigning every author every role generically.",
    ],
    standards: ["CRediT", "ICMJE"],
  },
  {
    id: "ethics-research-edge-cases",
    title: "Navigate research-ethics edge cases",
    area: "ethics",
    level: "expert",
    whatYouLearn:
      "How to handle ambiguous situations: secondary use of data, waiver of consent, vulnerable populations, dual-use concerns, and incidental findings.",
    steps: [
      "For secondary data use, confirm the original consent and ethics approval cover the new purpose, or seek a waiver.",
      "For vulnerable populations, document additional safeguards and justify their inclusion.",
      "For incidental findings, pre-specify a disclosure plan that respects autonomy and clinical duty.",
      "For dual-use or sensitive findings, consult institutional and biosafety review before dissemination.",
      "When in doubt, ask the ethics committee in writing rather than assuming.",
    ],
    pitfalls: [
      "Reusing data for a purpose the original consent never covered.",
      "Assuming a waiver applies without committee confirmation.",
    ],
    standards: ["Declaration of Helsinki", "COPE", "ICMJE"],
  },
  {
    id: "ethics-image-integrity",
    title: "Ensure image and data integrity",
    area: "ethics",
    level: "advanced",
    whatYouLearn:
      "How to prepare images and data so they pass integrity screening and meet what journals consider acceptable manipulation.",
    steps: [
      "Apply only adjustments that affect the whole image equally (brightness/contrast) and disclose them.",
      "Never selectively erase, clone, or splice features; keep unprocessed originals.",
      "Disclose any grouping/cropping of blots or gels with clear delineation.",
      "Retain raw data and image files to answer post-publication queries.",
    ],
    pitfalls: [
      "Selective enhancement that changes the scientific meaning.",
      "Undisclosed splicing of lanes or fields.",
    ],
    standards: ["COPE", "ICMJE"],
  },

  // ──────────────────────────────────────────── JOURNAL STRATEGY / SUBMISSION
  {
    id: "prod-journal-fit-strategy",
    title: "Choose the right journal with a fit-and-feasibility matrix",
    area: "productivity",
    level: "advanced",
    whatYouLearn:
      "How to select a target journal by weighing scope fit, audience, likely acceptance, speed, cost, and indexing, instead of impact factor alone.",
    steps: [
      "Shortlist journals that recently published your study type and question.",
      "Score each on scope fit, audience reach, acceptance likelihood, time-to-decision, APC/cost, and indexing.",
      "Sanity-check legitimacy (indexing, transparent editorial board) to avoid predatory venues.",
      "Sequence a primary and two fallback journals before submitting.",
    ],
    pitfalls: [
      "Chasing impact factor into a journal whose scope does not fit (desk reject).",
      "Submitting to an unindexed/predatory journal that harms the record.",
    ],
  },
  {
    id: "prod-presubmission-inquiry",
    title: "Write a presubmission inquiry to an editor",
    area: "productivity",
    level: "intermediate",
    whatYouLearn:
      "How to ask an editor whether your study fits before investing in full submission, especially for high-impact venues.",
    steps: [
      "Summarize the question, design, and headline finding in a short paragraph.",
      "State explicitly why it matters to this journal's readership.",
      "Ask directly whether the editors would consider a full submission.",
      "Keep it brief and free of attachments unless requested.",
    ],
    pitfalls: [
      "Sending the whole manuscript instead of a concise inquiry.",
      "Overstating the finding to secure interest.",
    ],
  },
  {
    id: "prod-equator-extension-select",
    title: "Select the precise EQUATOR guideline and extension",
    area: "productivity",
    level: "advanced",
    whatYouLearn:
      "How to pick not just the base reporting guideline but the correct extension for your design's specifics.",
    steps: [
      "Classify the design precisely (e.g., cluster RCT, pilot/feasibility, non-inferiority, AI intervention).",
      "Start from the base guideline (CONSORT/STROBE/PRISMA/etc.).",
      "Identify the matching extension (e.g., CONSORT cluster, CONSORT-AI, PRISMA-S, SPIRIT-AI, STARD-AI, PRISMA-ScR).",
      "Adopt both the base checklist and the extension from the planning stage.",
    ],
    pitfalls: [
      "Using only base CONSORT for a cluster or AI trial and missing extension items.",
      "Choosing an extension that does not match the actual design.",
    ],
    standards: ["EQUATOR", "CONSORT", "SPIRIT", "PRISMA"],
  },

  // ──────────────────────────────────────────── STATISTICS (further expert)
  {
    id: "stats-estimand",
    title: "Define the estimand before the analysis (ICH E9(R1))",
    area: "statistics",
    level: "expert",
    whatYouLearn:
      "How to specify the precise quantity to be estimated — including how intercurrent events are handled — before choosing any analysis method.",
    steps: [
      "Specify the five estimand attributes: population, treatment, endpoint, intercurrent-event strategy, and summary measure.",
      "Choose an intercurrent-event strategy (treatment-policy, hypothetical, composite, while-on-treatment, principal-stratum) and justify it clinically.",
      "Align the main analysis and sensitivity analyses to the chosen estimand.",
      "State the estimand in the protocol/SAP so the analysis answers a pre-defined question.",
    ],
    pitfalls: [
      "Jumping to 'ITT vs per-protocol' without first defining the estimand.",
      "Letting the available analysis define the question after the fact.",
    ],
    standards: ["ICH E9(R1)"],
  },
  {
    id: "stats-cluster-design",
    title: "Account for clustering in design and analysis",
    area: "statistics",
    level: "expert",
    whatYouLearn:
      "How to design and analyze cluster-randomized and multilevel data so the intracluster correlation is respected throughout.",
    steps: [
      "Inflate the sample size by the design effect (1 + (m-1)*ICC) for cluster designs.",
      "Analyze with a mixed-effects model or GEE that accounts for within-cluster correlation.",
      "Report the ICC and the number of clusters, not just the number of individuals.",
      "Beware too few clusters, which undermines the analysis regardless of total n.",
    ],
    pitfalls: [
      "Analyzing cluster data as if observations were independent (false precision).",
      "Many individuals but too few clusters to support the model.",
    ],
    standards: ["CONSORT cluster", "SAMPL"],
  },
  {
    id: "stats-interrupted-time-series",
    title: "Analyze an interrupted time series",
    area: "statistics",
    level: "advanced",
    whatYouLearn:
      "How to evaluate a population-level intervention using segmented regression while handling trend, autocorrelation, and seasonality.",
    steps: [
      "Model level and slope changes at the intervention point with segmented regression.",
      "Test and adjust for autocorrelation in the residuals.",
      "Account for seasonality and any concurrent events that threaten the inference.",
      "Use enough pre- and post-intervention points to estimate trends reliably.",
    ],
    pitfalls: [
      "Ignoring autocorrelation and overstating precision.",
      "Too few time points to distinguish a level change from noise.",
    ],
    standards: ["SAMPL"],
  },
  {
    id: "stats-dag-table-two",
    title: "Avoid the Table 2 fallacy",
    area: "statistics",
    level: "expert",
    whatYouLearn:
      "How to interpret a multivariable model's coefficients correctly, recognizing that adjustment coefficients for covariates are not all causal effects.",
    steps: [
      "Recognize that a single model can validly estimate the effect of the exposure but not simultaneously of every covariate.",
      "Do not present every adjustment-variable coefficient as a causal effect with the same interpretation.",
      "Report the primary effect estimate prominently; treat covariate coefficients as adjustment, not findings.",
      "Use a DAG to state which single effect the model is designed to estimate.",
    ],
    pitfalls: [
      "Interpreting a confounder's coefficient as its causal effect on the outcome.",
      "Listing all coefficients with equal causal weight in 'Table 2'.",
    ],
    standards: ["STROBE"],
  },

  // ──────────────────────────────────────────── FIGURES (advanced)
  {
    id: "fig-calibration-plot",
    title: "Build and read a calibration plot",
    area: "figures",
    level: "advanced",
    whatYouLearn:
      "How to display agreement between predicted and observed risk for a prediction model.",
    steps: [
      "Plot observed outcome frequency against predicted probability, with a smoothed (loess) curve.",
      "Add the 45-degree line of perfect calibration and a histogram of predicted risks.",
      "Report calibration-in-the-large and the calibration slope alongside the plot.",
      "Avoid only coarse decile grouping, which can hide miscalibration.",
    ],
    pitfalls: [
      "Showing discrimination (ROC) but never calibration.",
      "Relying on the Hosmer-Lemeshow test alone, which is insensitive and arbitrary.",
    ],
    standards: ["TRIPOD"],
  },
  {
    id: "fig-decision-curve",
    title: "Present a decision-curve (net benefit) analysis",
    area: "figures",
    level: "expert",
    whatYouLearn:
      "How to show whether using a model or marker improves clinical decisions across a range of threshold probabilities.",
    steps: [
      "Plot net benefit against threshold probability for the model, treat-all, and treat-none strategies.",
      "Identify the threshold range where the model adds net benefit.",
      "Interpret net benefit in terms of the harm-benefit trade-off the threshold encodes.",
      "Report it as a complement to discrimination and calibration, not a replacement.",
    ],
    pitfalls: [
      "Claiming clinical utility from AUC alone without net benefit.",
      "Reading net benefit outside a clinically plausible threshold range.",
    ],
    standards: ["TRIPOD"],
  },

  // ──────────────────────────────────────────── WRITING (advanced)
  {
    id: "writing-storyline",
    title: "Build a single-sentence storyline (the spine)",
    area: "writing",
    level: "advanced",
    whatYouLearn:
      "How to articulate the one-sentence argument that every section must serve, so the manuscript reads as one coherent story.",
    steps: [
      "Write the paper's claim in one sentence: in X, we show Y, which means Z.",
      "Check every section advances that single claim; cut what does not.",
      "Ensure the title, abstract, and conclusion all express the same spine.",
      "Use the spine to arbitrate inclusion of every figure and analysis.",
    ],
    pitfalls: [
      "A paper with two competing stories that dilutes both.",
      "Sections that are individually fine but do not serve one argument.",
    ],
  },
  {
    id: "writing-revise-in-passes",
    title: "Revise in structured passes, not all at once",
    area: "writing",
    level: "intermediate",
    whatYouLearn:
      "How to separate structural, paragraph, sentence, and proofreading edits so each is done well.",
    steps: [
      "Pass 1: structure — reverse-outline and fix section/paragraph order.",
      "Pass 2: paragraphs — one idea each, topic sentence first.",
      "Pass 3: sentences — active voice, cohesion, concision.",
      "Pass 4: surface — numbers, citations, typos, formatting.",
    ],
    pitfalls: [
      "Polishing sentences before the structure is settled, then cutting them.",
      "Trying to fix everything in one read and missing structural problems.",
    ],
  },

  // ──────────────────────────────────────────── PEER REVIEW (expert)
  {
    id: "peer-review-reproducibility",
    title: "Appraise reproducibility and transparency as a reviewer",
    area: "peer-review",
    level: "advanced",
    whatYouLearn:
      "How to evaluate whether a manuscript's data, code, and reporting would let others reproduce the work.",
    steps: [
      "Check the data/code availability statement is specific and actionable.",
      "Verify the reporting guideline checklist is completed and matches the text.",
      "Look for pre-registration and whether the analyses match it.",
      "Flag any result that cannot be traced to a described method.",
    ],
    pitfalls: [
      "Reviewing only the narrative and ignoring transparency artefacts.",
      "Accepting 'available on request' as adequate.",
    ],
    standards: ["TOP Guidelines", "COPE"],
  },
  {
    id: "peer-detect-misconduct",
    title: "Recognize and report suspected misconduct as a reviewer",
    area: "peer-review",
    level: "expert",
    whatYouLearn:
      "How to spot signs of fabrication, falsification, plagiarism, or image manipulation and escalate appropriately.",
    steps: [
      "Note implausible precision, duplicated images, or statistics that cannot arise from the described design.",
      "Do not accuse in the review; describe the concern factually to the editor confidentially.",
      "Let the editor and journal follow the COPE process; your role is to flag, not adjudicate.",
      "Keep the manuscript confidential throughout.",
    ],
    pitfalls: [
      "Making a public accusation rather than a confidential editor note.",
      "Ignoring a clear integrity signal because it is uncomfortable.",
    ],
    standards: ["COPE Ethical Guidelines for Peer Reviewers"],
  },

  // ──────────────────────────────────────────── ABSTRACT / DISCUSSION (advanced extras)
  {
    id: "abstract-prisma",
    title: "Write a PRISMA-compliant systematic review abstract",
    area: "abstract",
    level: "advanced",
    whatYouLearn:
      "How to report a review's objective, eligibility, sources, synthesis, included-study count, and certainty within the abstract structure.",
    steps: [
      "State the objective and eligibility criteria explicitly.",
      "Report sources searched and the last search date.",
      "Report the number of included studies/participants and the main synthesized effect with CI.",
      "State the certainty of evidence (GRADE) and the registration number.",
    ],
    pitfalls: [
      "Omitting the number of included studies or the search date.",
      "Reporting a pooled effect without heterogeneity or certainty.",
    ],
    standards: ["PRISMA for Abstracts", "GRADE"],
  },
  {
    id: "discussion-evidence-to-recommendation",
    title: "Move from evidence to a calibrated recommendation",
    area: "discussion",
    level: "expert",
    whatYouLearn:
      "How to translate findings into a practice or policy implication scaled to the certainty of the evidence.",
    steps: [
      "State the implication explicitly tied to the certainty (e.g., GRADE) of the evidence.",
      "Distinguish what the evidence supports now from what requires confirmation.",
      "Consider values, preferences, and the balance of benefits and harms before recommending.",
      "Avoid a strong recommendation from low-certainty evidence.",
    ],
    pitfalls: [
      "A strong 'clinicians should' from a single underpowered study.",
      "Ignoring harms and costs when recommending a practice change.",
    ],
    standards: ["GRADE"],
  },
];

export function skillsByArea(): Record<SkillArea, ResearchSkill[]> {
  const map = {} as Record<SkillArea, ResearchSkill[]>;
  for (const skill of researchSkills) {
    (map[skill.area] ||= []).push(skill);
  }
  return map;
}

export function skillCount(): number {
  return researchSkills.length;
}
