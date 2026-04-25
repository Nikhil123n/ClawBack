import { useState } from "react";
import { Printer, Scale, Shield, AlertTriangle, FileDown, Loader2 } from "lucide-react";
import { generateDojDocument } from "./generateDojDocument";
import type { AttorneyBrief, Case } from "../../shared/types";

interface Props {
  caseData: Case;
  brief: AttorneyBrief;
}

export function ComplaintViewer({ caseData, brief }: Props) {
  const [downloading, setDownloading] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateDojDocument(caseData, brief);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {/* Toolbar — hidden when printing */}
      <div className="no-print">
        {/* DOJ Export Banner */}
        <div className="glass rounded-lg p-5 mb-4 border border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <Scale size={20} className="text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">DOJ Submission Package Ready</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Formal qui tam complaint with numbered allegations, statutory citations, prayer for relief, and signature block.
                  Formatted to Federal Rules of Civil Procedure standards.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="btn-ghost flex items-center gap-2 text-sm"
              >
                <Printer size={14} />
                Print / PDF
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary flex items-center gap-2"
              >
                {downloading ? (
                  <><Loader2 size={15} className="animate-spin" /> Building .docx…</>
                ) : (
                  <><FileDown size={15} /> Download .docx</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="glass rounded-lg p-4 mb-6 border-l-4 border-amber-400 bg-amber-50">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Attorney Review Required.</strong> {brief.disclaimer}
            </p>
          </div>
        </div>
      </div>

      {/* The complaint document — this is what gets printed */}
      <div
        id="complaint-document"
        className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 max-w-3xl mx-auto font-serif text-slate-900 leading-relaxed print:shadow-none print:border-none print:rounded-none print:max-w-none print:p-8"
      >
        {/* Print header — only visible when printing */}
        <div className="hidden print:block text-center mb-2">
          <p className="text-xs text-red-700 font-semibold tracking-widest">
            FILED UNDER SEAL — DO NOT DISCLOSE — 31 U.S.C. § 3730(b)(2)
          </p>
        </div>

        {/* Court Caption */}
        <div className="text-center mb-8 pb-6 border-b border-slate-300">
          <p className="text-xs font-sans uppercase tracking-widest text-slate-500 mb-3">
            In the United States District Court
          </p>
          <p className="text-xs font-sans text-slate-400 mb-4">
            For the [District — To Be Completed by Counsel]
          </p>
          <div className="grid grid-cols-2 gap-8 mt-6 text-left text-sm border border-slate-300 divide-x divide-slate-300">
            <div className="p-4">
              <p className="font-semibold">UNITED STATES OF AMERICA,</p>
              <p className="text-slate-500 pl-4">ex rel. [RELATOR — SEALED],</p>
              <p className="pl-8 text-slate-500 mt-1">Plaintiff-Relator,</p>
              <p className="my-2 text-slate-400 text-xs pl-2">v.</p>
              <p className="font-semibold">[DEFENDANT — SEALED],</p>
              <p className="pl-8 text-slate-500 mt-1">Defendant.</p>
            </div>
            <div className="p-4 flex flex-col justify-center gap-2 text-sm">
              <p><span className="text-slate-500">Civil Action No.:</span> <span className="font-mono">___________</span></p>
              <p><span className="text-slate-500">Date Filed:</span> {today}</p>
              <p className="font-bold mt-2 text-xs uppercase tracking-wide">
                Qui Tam Complaint Under the False Claims Act
                <br />31 U.S.C. §§ 3729–3733
              </p>
              <p className="text-xs text-red-700 font-bold mt-1 border border-red-300 rounded px-2 py-1 w-fit">
                FILED UNDER SEAL
              </p>
              <p className="text-xs font-semibold text-slate-600">JURY TRIAL DEMANDED</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-lg font-bold uppercase tracking-wide underline mb-1">
            Complaint for Damages and Other Relief
          </h1>
          <p className="text-sm text-slate-500">{brief.case_title}</p>
        </div>

        {/* Opening */}
        <section className="mb-8">
          <p className="text-sm">
            COMES NOW, Relator, by and through undersigned counsel, and alleges as follows against
            Defendant for violations of the False Claims Act ("FCA"), 31 U.S.C. §§ 3729–3733, and
            seeks treble damages, civil penalties, and all other relief authorized by law.
          </p>
        </section>

        {/* I. Nature of Action */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-4">
            I. Nature of the Action
          </h2>
          <p className="text-sm mb-3">
            <span className="font-semibold">1.</span>{"  "}
            This is a civil action filed by Relator on behalf of the United States of America pursuant
            to the qui tam provisions of the False Claims Act, 31 U.S.C. §§ 3729–3733, to recover treble
            damages, civil penalties, and other relief for false and fraudulent claims submitted to the
            United States Government.
          </p>
          <p className="text-sm">
            <span className="font-semibold">2.</span>{"  "}
            {brief.executive_summary}
          </p>
        </section>

        {/* II. Jurisdiction & Venue */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-4">
            II. Jurisdiction and Venue
          </h2>
          <p className="text-sm mb-3">
            <span className="font-semibold">3.</span>{"  "}
            This Court has subject matter jurisdiction pursuant to 28 U.S.C. §§ 1331 and 1345, and 31 U.S.C. § 3732(a).
          </p>
          <p className="text-sm">
            <span className="font-semibold">4.</span>{"  "}
            Venue is proper pursuant to 31 U.S.C. § 3732(a) and 28 U.S.C. § 1391(b) because the acts
            complained of occurred in this district and Defendant transacts business here.
          </p>
        </section>

        {/* III. Legal Framework */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-4">
            III. Legal Framework — The False Claims Act
          </h2>
          <p className="text-sm mb-3">
            <span className="font-semibold">5.</span>{"  "}
            Under 31 U.S.C. § 3729(a)(1)(A), any person who knowingly presents a false or fraudulent claim
            is liable for a civil penalty of not less than <strong>$13,946</strong> and not more than <strong>$27,894</strong> per
            claim, plus <strong>three times</strong> the amount of damages sustained.
          </p>
          <p className="text-sm mb-3">
            <span className="font-semibold">6.</span>{"  "}
            "Knowingly" includes actual knowledge, deliberate ignorance, and reckless disregard of the truth.
            31 U.S.C. § 3729(b)(1). No proof of specific intent to defraud is required.
          </p>
          <p className="text-sm">
            <span className="font-semibold">7.</span>{"  "}
            Under the qui tam provisions of 31 U.S.C. § 3730(b), Relator is entitled to between 15% and 30%
            of any proceeds recovered by the United States.
          </p>
        </section>

        {/* IV. Specific Allegations */}
        {brief.allegations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-4">
              IV. Specific Allegations
            </h2>
            <div className="space-y-6">
              {brief.allegations.map((a, i) => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold">{8 + i}.</span>
                    <span className="text-xs font-mono font-semibold text-blue-700">{a.statutory_basis}</span>
                    {a.severity === "HIGH" && (
                      <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5 font-sans">
                        HIGH
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium mb-2 pl-5">{a.allegation}</p>
                  <div className="pl-5 border-l-2 border-slate-300 ml-2">
                    <p className="text-xs text-slate-600 italic">
                      Supporting evidence: "{a.supporting_evidence}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* V. Prayer for Relief */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-4">
            V. Prayer for Relief
          </h2>
          <p className="text-sm mb-4 font-medium">
            WHEREFORE, Relator respectfully prays that this Court enter judgment against Defendant and grant:
          </p>
          <ol className="space-y-2 text-sm pl-2">
            {[
              "Judgment against Defendant for all violations of the False Claims Act alleged herein;",
              "Three times the amount of damages sustained by the United States;",
              "Civil monetary penalties of not less than $13,946 and not more than $27,894 per false claim;",
              "Relator's maximum share of proceeds under 31 U.S.C. § 3730(d);",
              "All reasonable attorneys' fees, costs, and expenses incurred by Relator;",
              "A permanent injunction against further submission of false claims;",
              "Such other relief as the Court deems just and proper.",
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-semibold shrink-0">({String.fromCharCode(97 + i)})</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* VI. Jury Demand */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-3">
            VI. Demand for Jury Trial
          </h2>
          <p className="text-sm font-semibold">
            Pursuant to Rule 38(b) of the Federal Rules of Civil Procedure, Relator hereby demands
            a trial by jury on all issues so triable.
          </p>
        </section>

        {/* Recommended Next Steps — screen only */}
        {brief.recommended_next_steps.length > 0 && (
          <section className="mb-8 no-print">
            <h2 className="text-sm font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-3">
              CaseFile AI — Recommended Next Steps
            </h2>
            <ol className="space-y-2">
              {brief.recommended_next_steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold font-sans">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Signature Block */}
        <div className="mt-12 pt-6 border-t border-slate-400 text-sm">
          <p className="mb-8 font-medium">Respectfully submitted,</p>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <div className="border-b border-slate-500 mb-2 h-10" />
              <p className="text-xs text-slate-600">Attorney for Relator</p>
              <p className="text-xs text-slate-600">State Bar No.: ________________</p>
              <p className="text-xs text-slate-600 mt-1">Date: {today}</p>
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-sans no-print">
                <Shield size={11} />
                <span>Drafted by CaseFile AI · Requires attorney review before filing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-slate-400 font-sans italic no-print">
          Document generated by CaseFile AI on {today}. This document requires review and
          certification by a licensed attorney before filing with any court or federal agency.
        </p>
      </div>
    </div>
  );
}
