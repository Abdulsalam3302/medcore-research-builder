import type { ExpandedNotes, ProjectState } from "./types";
import { designById } from "./registry/designs";

/** Shared study context for stats, flow diagrams, and copilot panels. */
export function projectStudyContext(project: ProjectState): {
  designId?: string;
  manuscriptType?: string;
  expandedNotes?: ExpandedNotes;
  guidelineAcronym?: string;
} {
  const answers = project.researchTypeAnswers;
  const result = project.researchTypeResult;
  const designId = answers?.designId || result?.designId || result?.primaryGuidelineId;
  const design = designId ? designById(designId) : undefined;
  const name = result?.primaryGuidelineName || "";
  const acronymFromName = name.match(/^([A-Z][A-Z0-9-]+)/)?.[1];
  return {
    designId,
    manuscriptType: answers?.manuscriptType,
    expandedNotes: answers?.expandedNotes,
    guidelineAcronym: design?.primaryGuideline.acronym || acronymFromName,
  };
}
