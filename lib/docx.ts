/**
 * DOCX exporters for manuscript + compliance report.
 * Uses the `docx` npm package on the client.
 */

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  ShadingType,
  BorderStyle,
} from "docx";
import type { ProjectState } from "./types";

function p(text: string, opts: { bold?: boolean; italic?: boolean; size?: number } = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: !!opts.bold,
        italics: !!opts.italic,
        size: opts.size,
      }),
    ],
  });
}

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel]) {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, bold: true })],
  });
}

function blankLine() {
  return new Paragraph({});
}

function ensureNonEmpty(s?: string) {
  return (s || "").trim() || "[not yet written]";
}

function paragraphsFromText(s: string): Paragraph[] {
  return ensureNonEmpty(s)
    .split(/\n{2,}/)
    .map((block) =>
      new Paragraph({
        children: block
          .split("\n")
          .map((line, i, arr) => [
            new TextRun({ text: line, break: i < arr.length - 1 ? 1 : 0 }),
          ])
          .flat(),
      })
    );
}

function row(cells: string[], header = false): TableRow {
  return new TableRow({
    children: cells.map(
      (c) =>
        new TableCell({
          width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
          shading: header
            ? { type: ShadingType.CLEAR, color: "auto", fill: "EEF2FF" }
            : undefined,
          children: [
            new Paragraph({
              children: [new TextRun({ text: c, bold: header })],
            }),
          ],
        })
    ),
  });
}

export async function projectToDocxBlob(p_: ProjectState): Promise<Blob> {
  const title = p_.titleFinal || p_.titleInputs.draftTitle || "(untitled)";
  const a = p_.researchTypeAnswers || {};
  const r = p_.researchTypeResult;

  const children: Paragraph[] = [];

  /* Title block */
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: title, bold: true, size: 32 })],
    }),
    blankLine()
  );

  if (r?.primaryGuidelineName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Reporting guideline: ${r.primaryGuidelineName}`, italics: true })],
      })
    );
  }
  if (a.journalId) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Target journal: ${a.journalId}`, italics: true })],
      })
    );
  }
  children.push(blankLine());

  /* Abstract placeholder */
  children.push(heading("Abstract", HeadingLevel.HEADING_1));
  children.push(p("[Generate from sections — currently placeholder]", { italic: true }));
  children.push(blankLine());

  /* Sections */
  const sections: Array<["Introduction" | "Methods" | "Results" | "Discussion" | "Conclusion", string]> = [
    ["Introduction", p_.sections.introduction],
    ["Methods", p_.sections.methods],
    ["Results", p_.sections.results],
    ["Discussion", p_.sections.discussion],
    ["Conclusion", p_.sections.conclusion],
  ];
  for (const [name, body] of sections) {
    children.push(heading(name, HeadingLevel.HEADING_1));
    for (const para of paragraphsFromText(body)) children.push(para);
    children.push(blankLine());
  }

  /* Appendices */
  const appendices = p_.appendices || [];
  if (appendices.length) {
    children.push(heading("Appendices", HeadingLevel.HEADING_1));
    appendices.forEach((apx, i) => {
      children.push(heading(`${apx.title || `Appendix ${i + 1}`}`, HeadingLevel.HEADING_2));
      for (const para of paragraphsFromText(apx.content || "")) children.push(para);
      children.push(blankLine());
    });
  }

  /* References */
  children.push(heading("References", HeadingLevel.HEADING_1));
  if (!p_.references.verifications.length) {
    children.push(p("[no references added]", { italic: true }));
  } else {
    p_.references.verifications.forEach((v, i) => {
      children.push(
        new Paragraph({
          numbering: undefined,
          children: [
            new TextRun({
              text: `${i + 1}. ${v.correctedCitationVancouver || v.originalText}`,
            }),
          ],
        })
      );
    });
  }
  children.push(blankLine());

  /* Reporting-guideline compliance */
  if (r?.sectionChecklists) {
    children.push(heading("Reporting guideline compliance", HeadingLevel.HEADING_1));
    children.push(p(`Primary: ${r.primaryGuidelineName || "(unspecified)"}`, { bold: true }));
    if (r.possibleExtensionIds?.length) {
      children.push(p(`Extensions: ${r.possibleExtensionIds.join(", ")}`));
    }
    children.push(blankLine());
    for (const [section, items] of Object.entries(r.sectionChecklists)) {
      const fb = p_.sectionFeedback[section as keyof typeof p_.sectionFeedback];
      children.push(heading(section[0].toUpperCase() + section.slice(1), HeadingLevel.HEADING_2));
      if (fb) {
        for (const c of fb.checklistCoverage) {
          const mark = c.status === "covered" ? "✓" : c.status === "partial" ? "◐" : "✗";
          children.push(p(`${mark} ${c.item}${c.comment ? " — " + c.comment : ""}`));
        }
      } else {
        for (const c of items as string[]) children.push(p(`☐ ${c}`));
      }
      children.push(blankLine());
    }
  }

  /* Reference verification table */
  if (p_.references.verifications.length) {
    children.push(heading("Reference verification (multi-database)", HeadingLevel.HEADING_1));
    const rows: TableRow[] = [
      row(["#", "Title", "PubMed", "DOI", "OA", "Match", "Conf"], true),
    ];
    p_.references.verifications.forEach((v, i) => {
      rows.push(
        row([
          String(i + 1),
          (v.parsed.title || v.pubmed?.title || v.originalText.slice(0, 60) || "").slice(0, 80),
          v.pubmed?.pmid ? `PMID ${v.pubmed.pmid}` : v.checks.pubmedIndexed === false ? "✗" : "?",
          (v.crossref?.doi || v.pubmed?.doi || v.parsed.doi || "—").slice(0, 30),
          v.checks.openAccess === true ? "OA" : "—",
          v.checks.metadataMatch,
          v.confidence,
        ])
      );
    });
    children.push(
      new Paragraph({
        children: [],
      })
    );
    const doc = new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
      },
    });
    /* Append table by building one doc only at the end. */
    const document = new Document({
      sections: [{ children: [...children, doc, blankLine(), p(`Generated by MedCore on ${new Date().toISOString().slice(0, 10)}.`, { italic: true })] }],
    });
    const blob = await Packer.toBlob(document);
    return blob;
  }

  const document = new Document({
    sections: [
      {
        children: [
          ...children,
          blankLine(),
          p(`Generated by MedCore on ${new Date().toISOString().slice(0, 10)}.`, { italic: true }),
        ],
      },
    ],
  });
  return await Packer.toBlob(document);
}

export async function complianceToDocxBlob(p_: ProjectState): Promise<Blob> {
  const r = p_.researchTypeResult;
  const children: Paragraph[] = [];
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Reporting Guideline Compliance Report", bold: true, size: 28 })],
    }),
    blankLine()
  );
  if (!r) {
    children.push(p("No reporting guideline selected.", { italic: true }));
  } else {
    children.push(p(`Primary guideline: ${r.primaryGuidelineName}`, { bold: true }));
    if (r.possibleExtensionIds?.length) {
      children.push(p(`Extensions: ${r.possibleExtensionIds.join(", ")}`));
    }
    children.push(blankLine());
    for (const [section, items] of Object.entries(r.sectionChecklists || {})) {
      const fb = p_.sectionFeedback[section as keyof typeof p_.sectionFeedback];
      children.push(heading(section[0].toUpperCase() + section.slice(1), HeadingLevel.HEADING_1));
      if (fb) {
        for (const c of fb.checklistCoverage) {
          const mark = c.status === "covered" ? "✓" : c.status === "partial" ? "◐" : "✗";
          children.push(p(`${mark} ${c.item}${c.comment ? " — " + c.comment : ""}`));
        }
        if (fb.missingInformation.length) {
          children.push(p("Missing information:", { bold: true }));
          for (const m of fb.missingInformation) children.push(p(`• ${m}`));
        }
        if (fb.riskWarnings.length) {
          children.push(p("Risk warnings:", { bold: true }));
          for (const m of fb.riskWarnings) children.push(p(`• ${m}`));
        }
      } else {
        for (const c of items as string[]) children.push(p(`☐ ${c}`));
      }
      children.push(blankLine());
    }
  }
  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBlob(doc);
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
