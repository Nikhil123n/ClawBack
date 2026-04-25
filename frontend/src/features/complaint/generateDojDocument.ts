import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  PageNumber,
  Header,
  Footer,
  SectionType,
  convertInchesToTwip,
  UnderlineType,
} from "docx";
import { saveAs } from "file-saver";
import type { AttorneyBrief, Case } from "../../shared/types";

const today = () =>
  new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

// ─── helpers ─────────────────────────────────────────────────────────────────

function h(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 320, after: 120 },
  });
}

function body(text: string, opts: { bold?: boolean; italic?: boolean; indent?: boolean } = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: opts.indent ? { left: convertInchesToTwip(0.5) } : undefined,
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italics: opts.italic,
        size: 24, // 12pt
        font: "Times New Roman",
      }),
    ],
  });
}

function numbered(num: number, text: string) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.3) },
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 24, font: "Times New Roman" }),
      new TextRun({ text, size: 24, font: "Times New Roman" }),
    ],
  });
}

function rule() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
    spacing: { before: 200, after: 200 },
    text: "",
  });
}

function spacer() {
  return new Paragraph({ text: "", spacing: { before: 120, after: 0 } });
}

function centered(text: string, opts: { bold?: boolean; size?: number; underline?: boolean } = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: opts.size ?? 24,
        font: "Times New Roman",
        underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
      }),
    ],
  });
}

// ─── caption table ────────────────────────────────────────────────────────────
// Letter page (8.5") with 1.25" margins = 6" printable = 8640 twips total
const TOTAL_WIDTH = 8640;
const COL_LEFT   = 5040; // ~3.5"
const COL_RIGHT  = 3600; // ~2.5"

const BORDER_SINGLE = { style: BorderStyle.SINGLE, size: 6, color: "000000" } as const;
const ALL_BORDERS   = { top: BORDER_SINGLE, bottom: BORDER_SINGLE, left: BORDER_SINGLE, right: BORDER_SINGLE };

function captionCell(lines: { text: string; bold?: boolean; size?: number }[], colWidth: number) {
  return new TableCell({
    width: { size: colWidth, type: WidthType.DXA },
    borders: ALL_BORDERS,
    margins: { top: 120, bottom: 120, left: 180, right: 180 },
    children: lines.map(({ text, bold, size }) =>
      new Paragraph({
        spacing: { before: 40, after: 40, line: 280, lineRule: "auto" as any },
        children: [
          new TextRun({ text, bold: bold ?? false, size: size ?? 20, font: "Times New Roman" }),
        ],
      }),
    ),
  });
}

function captionTable() {
  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    columnWidths: [COL_LEFT, COL_RIGHT],
    rows: [
      new TableRow({
        children: [
          captionCell([
            { text: "UNITED STATES OF AMERICA,", bold: true, size: 20 },
            { text: "    ex rel. [RELATOR — SEALED],", size: 20 },
            { text: "                Plaintiff-Relator,", size: 20 },
            { text: "" },
            { text: "    v.", bold: true, size: 20 },
            { text: "" },
            { text: "[DEFENDANT — SEALED],", bold: true, size: 20 },
            { text: "                Defendant.", size: 20 },
          ], COL_LEFT),
          captionCell([
            { text: `Civil Action No.: ___________`, bold: false, size: 20 },
            { text: "" },
            { text: `Date Filed: ${today()}`, size: 20 },
            { text: "" },
            { text: "QUI TAM COMPLAINT UNDER THE", bold: true, size: 20 },
            { text: "FALSE CLAIMS ACT", bold: true, size: 20 },
            { text: "31 U.S.C. §§ 3729–3733", size: 18 },
            { text: "" },
            { text: "[ FILED UNDER SEAL ]", bold: true, size: 20 },
            { text: "" },
            { text: "JURY TRIAL DEMANDED", bold: true, size: 20 },
          ], COL_RIGHT),
        ],
      }),
    ],
  });
}

// ─── main generator ──────────────────────────────────────────────────────────

export async function generateDojDocument(caseData: Case, brief: AttorneyBrief): Promise<void> {
  const highAllegations = brief.allegations.filter((a) => a.severity === "HIGH");
  const allAllegations = brief.allegations;

  let paraIdx = 1;

  const doc = new Document({
    creator: "CaseFile AI",
    title: `DOJ Submission — ${brief.case_title}`,
    description: "Qui Tam Complaint under the False Claims Act",
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 24 },
          paragraph: { spacing: { line: 360 } },
        },
      },
      paragraphStyles: [
        {
          id: "CourtCenter",
          name: "Court Center",
          basedOn: "Normal",
          run: { font: "Times New Roman", bold: true },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60, line: 280, lineRule: "auto" as any },
          },
        },
        {
          id: "DocTitle",
          name: "Doc Title",
          basedOn: "Normal",
          run: { font: "Times New Roman", bold: true },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 60, line: 280, lineRule: "auto" as any },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            margin: {
              top:    convertInchesToTwip(1.0),
              bottom: convertInchesToTwip(1.0),
              left:   convertInchesToTwip(1.25),  // 1800 twips — matches TOTAL_WIDTH
              right:  convertInchesToTwip(1.25),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "FILED UNDER SEAL — DO NOT DISCLOSE — 31 U.S.C. § 3730(b)(2)", size: 18, color: "CC0000", font: "Times New Roman" }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page ", size: 20, font: "Times New Roman" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 20, font: "Times New Roman" }),
                  new TextRun({ text: " of ", size: 20, font: "Times New Roman" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20, font: "Times New Roman" }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "QUI TAM COMPLAINT — CONFIDENTIAL", size: 18, color: "888888", font: "Times New Roman" })],
              }),
            ],
          }),
        },
        children: [
          // ── Cover ──────────────────────────────────────────────────────────
          new Paragraph({
            style: "CourtCenter",
            spacing: { before: 80, after: 40, line: 280, lineRule: "auto" as any },
            children: [new TextRun({ text: "IN THE UNITED STATES DISTRICT COURT", bold: true, size: 26, font: "Times New Roman" })],
          }),
          new Paragraph({
            style: "CourtCenter",
            spacing: { before: 0, after: 120, line: 280, lineRule: "auto" as any },
            children: [new TextRun({ text: "FOR THE [DISTRICT — TO BE COMPLETED BY COUNSEL]", bold: true, size: 24, font: "Times New Roman" })],
          }),
          captionTable(),
          new Paragraph({ text: "", spacing: { before: 200, after: 0 } }),
          rule(),
          new Paragraph({
            style: "DocTitle",
            spacing: { before: 160, after: 40, line: 280, lineRule: "auto" as any },
            children: [
              new TextRun({ text: "QUI TAM COMPLAINT FOR DAMAGES AND OTHER RELIEF", bold: true, size: 28, font: "Times New Roman", underline: { type: UnderlineType.SINGLE } }),
            ],
          }),
          new Paragraph({
            style: "DocTitle",
            spacing: { before: 0, after: 160, line: 280, lineRule: "auto" as any },
            children: [new TextRun({ text: "UNDER THE FALSE CLAIMS ACT, 31 U.S.C. §§ 3729–3733", bold: true, size: 24, font: "Times New Roman" })],
          }),
          rule(),
          spacer(),

          // ── I. Nature of Action ────────────────────────────────────────────
          h("I.  NATURE OF ACTION", HeadingLevel.HEADING_1),
          numbered(paraIdx++,
            "This is a civil action filed by Relator on behalf of the United States of America " +
            "pursuant to the qui tam provisions of the False Claims Act (\"FCA\"), 31 U.S.C. §§ 3729–3733, " +
            "to recover treble damages, civil penalties, and other relief for false and fraudulent claims " +
            "submitted to the United States Government."
          ),
          numbered(paraIdx++, brief.executive_summary),
          numbered(paraIdx++,
            "The fraudulent scheme identified herein results in significant financial harm to federal healthcare " +
            "programs, including Medicare and Medicaid, in violation of 31 U.S.C. § 3729(a)(1)(A) and (B)."
          ),
          spacer(),

          // ── II. Jurisdiction & Venue ───────────────────────────────────────
          h("II.  JURISDICTION AND VENUE", HeadingLevel.HEADING_1),
          numbered(paraIdx++,
            "This Court has subject matter jurisdiction over this action pursuant to 28 U.S.C. §§ 1331 and 1345, " +
            "and 31 U.S.C. § 3732(a), which vests jurisdiction in the federal district courts for all civil actions " +
            "brought under the False Claims Act."
          ),
          numbered(paraIdx++,
            "Venue is proper in this district pursuant to 31 U.S.C. § 3732(a) and 28 U.S.C. § 1391(b) " +
            "because the acts complained of herein occurred in this district and Defendant transacts business in this district."
          ),
          spacer(),

          // ── III. Parties ───────────────────────────────────────────────────
          h("III.  PARTIES", HeadingLevel.HEADING_1),
          numbered(paraIdx++,
            "Plaintiff-Relator is an individual with direct and independent knowledge of the fraudulent scheme " +
            "described herein. Relator's identity is sealed pursuant to 31 U.S.C. § 3730(b)(2)."
          ),
          numbered(paraIdx++,
            "The United States of America, acting through the Department of Justice and relevant federal agencies, " +
            "is the real party in interest in this action."
          ),
          numbered(paraIdx++,
            `Defendant is an entity or individual engaged in the submission of false and fraudulent claims to federal ` +
            `programs as described herein. Defendant's identity is contained in sealed attachments pursuant to Court order.`
          ),
          spacer(),

          // ── IV. Legal Framework ────────────────────────────────────────────
          h("IV.  LEGAL FRAMEWORK — THE FALSE CLAIMS ACT", HeadingLevel.HEADING_1),
          numbered(paraIdx++,
            "The False Claims Act, 31 U.S.C. §§ 3729–3733, imposes liability on any person who knowingly presents, " +
            "or causes to be presented, a false or fraudulent claim for payment or approval to the United States Government."
          ),
          numbered(paraIdx++,
            "Under 31 U.S.C. § 3729(a)(1)(A), any person who knowingly presents a false or fraudulent claim for payment " +
            "is liable for a civil penalty of not less than $13,946 and not more than $27,894 per claim, plus three times " +
            "the amount of damages sustained by the Government."
          ),
          numbered(paraIdx++,
            "The FCA defines \"knowingly\" to include actual knowledge, deliberate ignorance, and reckless disregard " +
            "of the truth or falsity of information. 31 U.S.C. § 3729(b)(1). No proof of specific intent to defraud is required."
          ),
          numbered(paraIdx++,
            "Under the qui tam provisions of 31 U.S.C. § 3730(b), private citizens (\"relators\") with knowledge of fraud " +
            "against the Government may bring suit on behalf of the United States. Relators are entitled to between " +
            "15% and 30% of proceeds recovered."
          ),
          spacer(),

          // ── V. Factual Background ──────────────────────────────────────────
          h("V.  FACTUAL BACKGROUND", HeadingLevel.HEADING_1),
          numbered(paraIdx++, brief.executive_summary),
          ...(allAllegations.length > 0
            ? [
                numbered(paraIdx++,
                  "Relator obtained documentary evidence supporting the allegations set forth herein through direct " +
                  "observation and access to billing records, medical records, and internal communications."
                ),
              ]
            : []),
          spacer(),

          // ── VI. Fraudulent Scheme ──────────────────────────────────────────
          h("VI.  THE FRAUDULENT SCHEME — SPECIFIC ALLEGATIONS", HeadingLevel.HEADING_1),
          ...allAllegations.flatMap((a, i) => [
            new Paragraph({
              spacing: { before: 160, after: 60 },
              children: [
                new TextRun({ text: `Allegation ${i + 1} — `, bold: true, size: 24, font: "Times New Roman" }),
                new TextRun({ text: a.statutory_basis, bold: true, italics: true, size: 24, font: "Times New Roman", color: "1d4ed8" }),
              ],
            }),
            numbered(paraIdx++, a.allegation),
            new Paragraph({
              spacing: { before: 60, after: 60 },
              indent: { left: convertInchesToTwip(0.75) },
              children: [
                new TextRun({ text: "Supporting Evidence: ", bold: true, size: 22, font: "Times New Roman" }),
                new TextRun({ text: `"${a.supporting_evidence}"`, italics: true, size: 22, font: "Times New Roman", color: "374151" }),
              ],
            }),
            ...(a.severity === "HIGH"
              ? [
                  new Paragraph({
                    spacing: { before: 40, after: 100 },
                    indent: { left: convertInchesToTwip(0.75) },
                    children: [
                      new TextRun({ text: "⬛ SEVERITY: HIGH — Document-supported evidence of fraud.", bold: true, size: 20, font: "Times New Roman", color: "991b1b" }),
                    ],
                  }),
                ]
              : [spacer()]),
          ]),
          spacer(),

          // ── VII. Causes of Action ──────────────────────────────────────────
          h("VII.  CAUSES OF ACTION", HeadingLevel.HEADING_1),
          spacer(),
          h("COUNT I — Presenting False Claims (31 U.S.C. § 3729(a)(1)(A))", HeadingLevel.HEADING_2),
          numbered(paraIdx++,
            "Relator re-alleges and incorporates by reference all preceding paragraphs as if fully set forth herein."
          ),
          numbered(paraIdx++,
            "Defendant knowingly presented, or caused to be presented, false or fraudulent claims for payment to " +
            "the United States through the Medicare and/or Medicaid programs, in violation of 31 U.S.C. § 3729(a)(1)(A)."
          ),
          ...(highAllegations.length > 0
            ? [
                numbered(paraIdx++,
                  `The false claims include, without limitation: ${highAllegations.map((a) => a.allegation).join("; ")}.`
                ),
              ]
            : []),
          spacer(),
          h("COUNT II — Making or Using False Records (31 U.S.C. § 3729(a)(1)(B))", HeadingLevel.HEADING_2),
          numbered(paraIdx++,
            "Relator re-alleges and incorporates by reference all preceding paragraphs as if fully set forth herein."
          ),
          numbered(paraIdx++,
            "Defendant knowingly made, used, or caused to be made or used, false records or statements material " +
            "to false or fraudulent claims, in violation of 31 U.S.C. § 3729(a)(1)(B)."
          ),
          spacer(),

          // ── VIII. Prayer for Relief ────────────────────────────────────────
          h("VIII.  PRAYER FOR RELIEF", HeadingLevel.HEADING_1),
          body("WHEREFORE, Relator respectfully prays that this Court enter judgment against Defendant and grant the following relief:", { bold: true }),
          spacer(),
          ...[
            "(a)  That judgment be entered against Defendant for all violations of the False Claims Act alleged herein;",
            "(b)  That Defendant be ordered to pay three times the amount of damages sustained by the United States as a result of Defendant's fraudulent conduct;",
            "(c)  That civil monetary penalties of not less than $13,946 and not more than $27,894 per false claim be imposed against Defendant;",
            "(d)  That Relator be awarded the maximum share of the proceeds of this action as allowed under 31 U.S.C. § 3730(d);",
            "(e)  That Relator be awarded all reasonable attorneys' fees, costs, and expenses incurred in connection with this action under 31 U.S.C. § 3730(d);",
            "(f)  That Defendant be permanently enjoined from submitting false claims to the United States;",
            "(g)  That the United States receive all other relief, both at law and in equity, to which it may be justly entitled.",
          ].map((line) => body(line, { indent: true })),
          spacer(),

          // ── IX. Jury Demand ────────────────────────────────────────────────
          h("IX.  DEMAND FOR JURY TRIAL", HeadingLevel.HEADING_1),
          body(
            "Pursuant to Rule 38(b) of the Federal Rules of Civil Procedure, Relator hereby demands a trial by jury " +
            "on all issues so triable.",
            { bold: true }
          ),
          spacer(),

          // ── X. Recommended Next Steps ─────────────────────────────────────
          h("X.  RECOMMENDED NEXT STEPS (CaseFile AI Advisory)", HeadingLevel.HEADING_1),
          body("The following steps are recommended prior to final DOJ submission:", {}),
          ...brief.recommended_next_steps.map((step, i) =>
            body(`${i + 1}.  ${step}`, { indent: true })
          ),
          spacer(),

          // ── XI. Certification ──────────────────────────────────────────────
          h("XI.  ATTORNEY CERTIFICATION", HeadingLevel.HEADING_1),
          numbered(paraIdx++,
            "The undersigned attorney certifies that, to the best of their knowledge, information, and belief, " +
            "formed after an inquiry reasonable under the circumstances: (a) this complaint is not being presented " +
            "for any improper purpose; (b) the claims, defenses, and legal contentions are warranted by existing " +
            "law; and (c) the factual contentions have evidentiary support."
          ),
          numbered(paraIdx++,
            brief.disclaimer
          ),
          spacer(),
          spacer(),
          body("Respectfully submitted,", { bold: true }),
          spacer(),
          spacer(),
          body("_____________________________________________"),
          body("Attorney for Relator (to be signed by licensed counsel)"),
          body("State Bar No.: ________________"),
          body(`Date: ${today()}`),
          spacer(),
          rule(),
          spacer(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Document generated by CaseFile AI on ${today()}. This document requires review and certification by a licensed attorney before filing. Do not file without attorney review.`,
                size: 18,
                color: "888888",
                italics: true,
                font: "Times New Roman",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = brief.case_title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 50);
  saveAs(blob, `DOJ_Complaint_${safeName}_${new Date().toISOString().slice(0, 10)}.docx`);
}
