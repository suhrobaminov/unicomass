import { jsPDF } from "jspdf";
import type { Major } from "@/lib/assessment-data";

export type PdfReportData = {
  profileLabel: string;
  narrative: string;
  strengths: string[];
  improvements: string[];
  ranked: Array<{ major: Major; score: number }>;
};

const INK = [24, 26, 32] as const;
const MUTED = [110, 116, 128] as const;
const RULE = [222, 224, 230] as const;
const ACCENT = [79, 70, 229] as const;

const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const M = 56;
const CONTENT_W = PAGE_W - M * 2;

export function generateAssessmentPdf(data: PdfReportData, meta: { name?: string; date: Date }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = 0;
  let page = 1;

  const setInk = (c: readonly number[]) => doc.setTextColor(c[0], c[1], c[2]);

  const footer = () => {
    doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
    doc.setLineWidth(0.5);
    doc.line(M, PAGE_H - 52, PAGE_W - M, PAGE_H - 52);
    doc.setFont("helvetica", "normal").setFontSize(8);
    setInk(MUTED);
    doc.text("youradviser — Major Assessment Report", M, PAGE_H - 38);
    doc.text(`Page ${page}`, PAGE_W - M, PAGE_H - 38, { align: "right" });
  };

  const newPage = () => {
    footer();
    doc.addPage();
    page += 1;
    y = M;
  };

  const room = (h: number) => {
    if (y + h > PAGE_H - 76) newPage();
  };

  const heading = (text: string) => {
    room(56);
    y += 26;
    doc.setFont("helvetica", "bold").setFontSize(12);
    setInk(INK);
    doc.text(text.toUpperCase(), M, y);
    y += 8;
    doc.setDrawColor(RULE[0], RULE[1], RULE[2]).setLineWidth(0.5);
    doc.line(M, y, PAGE_W - M, y);
    y += 22;
  };

  const body = (text: string, size = 10, color: readonly number[] = INK, indent = 0) => {
    doc.setFont("helvetica", "normal").setFontSize(size);
    setInk(color);
    const lines = doc.splitTextToSize(text, CONTENT_W - indent) as string[];
    for (const line of lines) {
      room(size + 5);
      doc.text(line, M + indent, y);
      y += size + 5;
    }
  };

  const label = (text: string) => {
    room(20);
    doc.setFont("helvetica", "bold").setFontSize(8.5);
    setInk(MUTED);
    doc.text(text.toUpperCase(), M, y);
    y += 16;
  };

  // ---------- Cover header ----------
  y = M;
  doc.setFont("helvetica", "bold").setFontSize(9);
  setInk(ACCENT);
  doc.text("YOURADVISER", M, y);
  doc.setFont("helvetica", "normal").setFontSize(9);
  setInk(MUTED);
  doc.text(
    meta.date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
    PAGE_W - M,
    y,
    { align: "right" },
  );
  y += 16;
  doc.setDrawColor(RULE[0], RULE[1], RULE[2]).setLineWidth(0.5);
  doc.line(M, y, PAGE_W - M, y);

  y += 46;
  doc.setFont("helvetica", "normal").setFontSize(10);
  setInk(MUTED);
  doc.text("Major Assessment Report", M, y);
  y += 30;
  doc.setFont("helvetica", "bold").setFontSize(26);
  setInk(INK);
  const titleLines = doc.splitTextToSize(data.profileLabel, CONTENT_W) as string[];
  for (const line of titleLines) {
    doc.text(line, M, y);
    y += 31;
  }
  if (meta.name) {
    doc.setFont("helvetica", "normal").setFontSize(10);
    setInk(MUTED);
    doc.text(`Prepared for ${meta.name}`, M, y);
    y += 18;
  }

  y += 12;
  body(data.narrative, 10.5, INK);
  y += 6;

  // ---------- Summary strip ----------
  const top = data.ranked[0];
  if (top) {
    room(66);
    const boxY = y;
    doc.setDrawColor(RULE[0], RULE[1], RULE[2]).setLineWidth(0.5);
    doc.rect(M, boxY, CONTENT_W, 54);
    const cell = CONTENT_W / 3;
    const cells: Array<[string, string]> = [
      ["Top match", top.major.name],
      ["Compatibility", `${Math.round(top.score * 100)}%`],
      ["Majors compared", String(data.ranked.length)],
    ];
    cells.forEach(([k, v], i) => {
      const x = M + cell * i + 14;
      doc.setFont("helvetica", "normal").setFontSize(8);
      setInk(MUTED);
      doc.text(k.toUpperCase(), x, boxY + 21);
      doc.setFont("helvetica", "bold").setFontSize(11.5);
      setInk(INK);
      doc.text(doc.splitTextToSize(v, cell - 26)[0] as string, x, boxY + 39);
      if (i > 0) doc.line(M + cell * i, boxY, M + cell * i, boxY + 54);
    });
    y = boxY + 54 + 10;
  }

  // ---------- Ranked majors ----------
  heading("Recommended majors");
  data.ranked.slice(0, 5).forEach((r, i) => {
    const pct = Math.round(r.score * 100);
    room(40);
    doc.setFont("helvetica", "bold").setFontSize(11);
    setInk(INK);
    doc.text(`${i + 1}.  ${r.major.name}`, M, y);
    doc.text(`${pct}%`, PAGE_W - M, y, { align: "right" });
    y += 12;
    doc.setFont("helvetica", "normal").setFontSize(9);
    setInk(MUTED);
    doc.text(r.major.category, M, y);
    y += 11;
    // bar
    doc.setFillColor(238, 239, 243);
    doc.rect(M, y, CONTENT_W, 3, "F");
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.rect(M, y, (CONTENT_W * pct) / 100, 3, "F");
    y += 22;
  });

  // ---------- Detail per major ----------
  data.ranked.slice(0, 5).forEach((r) => {
    const m = r.major;
    heading(m.name);
    body(m.blurb, 10, INK);
    y += 8;

    const pairs: Array<[string, string]> = [
      ["Average salary", m.salaryUSD],
      ["Job outlook", m.outlook],
      ["Difficulty", m.difficulty],
    ];
    pairs.forEach(([k, v]) => {
      room(16);
      doc.setFont("helvetica", "normal").setFontSize(9.5);
      setInk(MUTED);
      doc.text(k, M, y);
      setInk(INK);
      doc.text(v, M + 130, y);
      y += 14;
    });
    y += 6;

    const lists: Array<[string, string[]]> = [
      ["Required skills", m.requiredSkills],
      ["Focus subjects", m.focusSubjects],
      ["Typical careers", m.careers],
      ["Universities to consider", m.topSchools],
      ["Scholarships", m.scholarships],
    ];
    lists.forEach(([k, items]) => {
      label(k);
      items.forEach((it) => body(`•  ${it}`, 9.5, INK, 8));
      y += 6;
    });
  });

  // ---------- Strengths / growth ----------
  heading("Strengths");
  if (data.strengths.length === 0) body("No dominant strengths detected.", 10, MUTED);
  data.strengths.forEach((s) => body(`•  ${s}`, 10, INK, 8));

  heading("Areas to grow");
  if (data.improvements.length === 0) body("Well-rounded across all measured traits.", 10, MUTED);
  data.improvements.forEach((s) => body(`•  ${s}`, 10, INK, 8));

  heading("Recommended next steps");
  [
    "Shortlist 3 universities that offer your top-matched major and note their entry requirements.",
    "Map the focus subjects above onto your remaining school terms.",
    "Research one scholarship per shortlisted university and record its deadline.",
    "Reach out to a current student or professional in your top-matched field.",
  ].forEach((s, i) => body(`${i + 1}.  ${s}`, 10, INK, 8));

  footer();

  const stamp = meta.date.toISOString().slice(0, 10);
  doc.save(`youradviser-major-report-${stamp}.pdf`);
}
