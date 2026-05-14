import { jsPDF } from 'jspdf';
import type { Debate } from '@/types/debate';

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function writeBlock(
  doc: jsPDF,
  text: string,
  opts: { x: number; y: number; maxW: number; size?: number; line?: number; bold?: boolean }
) {
  const { x, maxW, size = 10, line = 13, bold = false } = opts;
  let y = opts.y;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text, maxW);
  const pageH = doc.internal.pageSize.getHeight();
  const bottom = pageH - 48;
  for (const ln of lines) {
    if (y > bottom) {
      doc.addPage();
      y = 48;
    }
    doc.text(ln, x, y);
    y += line;
  }
  return y;
}

export function exportDebatePdf(debate: Debate) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const m = 48;
  const maxW = pageW - m * 2;
  let y = m;

  doc.setFillColor(30, 27, 75);
  doc.rect(0, 0, pageW, 72, 'F');
  doc.setTextColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AI Debate Arena', m, 46);
  doc.setTextColor(15, 23, 42);

  y = 96;
  y = writeBlock(doc, 'Official transcript export', { x: m, y, maxW, size: 9, line: 12, bold: true });
  y += 6;
  y = writeBlock(doc, `Topic`, { x: m, y, maxW, size: 10, line: 12, bold: true });
  y += 2;
  y = writeBlock(doc, debate.topic, { x: m, y, maxW, size: 11, line: 15 });

  y += 8;
  y = writeBlock(doc, `Category · ${debate.category ?? 'Technology'}`, { x: m, y, maxW, size: 10, line: 13 });
  y += 4;
  y = writeBlock(
    doc,
    `Models\nSide A: ${debate.sideALabel} (${debate.sideAModelId})\nSide B: ${debate.sideBLabel} (${debate.sideBModelId})\nRounds configured: ${debate.totalRounds}`,
    { x: m, y, maxW, size: 10, line: 14 }
  );

  const j = debate.judge;
  if (j?.status === 'complete') {
    y += 10;
    y = writeBlock(doc, 'AI Judge evaluation', { x: m, y, maxW, size: 11, line: 14, bold: true });
    y += 2;
    y = writeBlock(doc, `Winner: ${j.winner === 'tie' ? 'Tie' : j.winner}`, { x: m, y, maxW, size: 10, line: 13 });
    y += 4;
    y = writeBlock(doc, j.summary || '', { x: m, y, maxW, size: 10, line: 13 });
    if (j.scores) {
      y += 8;
      const rows = ['logic', 'clarity', 'relevance', 'persuasiveness'] as const;
      const table = rows
        .map(
          (k) =>
            `${k}: A ${j.scores![k].A} · B ${j.scores![k].B}`
        )
        .join('\n');
      y = writeBlock(doc, `Scores\n${table}`, { x: m, y, maxW, size: 10, line: 14 });
    }
    if (j.reasoning) {
      y += 8;
      y = writeBlock(doc, 'Judge reasoning', { x: m, y, maxW, size: 10, line: 13, bold: true });
      y += 2;
      y = writeBlock(doc, j.reasoning, { x: m, y, maxW, size: 9, line: 12 });
    }
  }

  const vs = debate.engagement?.judgeVersusAudience;
  if (vs) {
    y += 10;
    y = writeBlock(
      doc,
      `Audience vs AI Judge\nAI Judge winner: ${vs.judgeWinner}\nAudience winner: ${vs.audienceWinner}\nAligned: ${vs.aligned ? 'Yes' : 'No'}`,
      { x: m, y, maxW, size: 10, line: 14, bold: true }
    );
  }

  const v = debate.voteSummary;
  if (v) {
    y += 10;
    y = writeBlock(
      doc,
      `Vote summary\nSide A: ${v.A} · Side B: ${v.B} · Total: ${v.total}`,
      { x: m, y, maxW, size: 10, line: 14, bold: true }
    );
  }

  if (debate.engagement) {
    y += 8;
    const r = debate.engagement.reactionTotals;
    y = writeBlock(
      doc,
      `Engagement\nHeat score: ${debate.engagement.heatScore}\nReactions — Strong: ${r.fire}, Smart: ${r.smart}, Insightful: ${r.insight}, AI bias: ${r.bias}`,
      { x: m, y, maxW, size: 10, line: 14 }
    );
  }

  y += 14;
  y = writeBlock(doc, 'Transcript (by turn)', { x: m, y, maxW, size: 12, line: 15, bold: true });
  y += 4;

  for (const t of debate.turns) {
    const header = `Round ${t.round} · Side ${t.side} · ${t.modelLabel}${t.usedFallback ? ' (fallback)' : ''}`;
    y = writeBlock(doc, header, { x: m, y, maxW, size: 10, line: 13, bold: true });
    y += 2;
    y = writeBlock(doc, t.content, { x: m, y, maxW, size: 9, line: 12 });
    y += 10;
  }

  const name = `debate-${slugify(debate.topic) || debate.id}.pdf`;
  doc.save(name);
}
