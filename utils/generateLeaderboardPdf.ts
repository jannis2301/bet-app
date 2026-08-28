import PDFDocument from 'pdfkit';

interface ArchivedLeaderboardEntry {
  name: string;
  totalPoints: number;
  exactHits: number;
}

const COLUMN_X = { rank: 50, name: 100, points: 320, exactHits: 420 };

export const generateLeaderboardPdf = (
  season: number,
  leaderboard: ArchivedLeaderboardEntry[]
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc
      .fontSize(20)
      .text(`Saison ${season}/${season + 1} – Endtabelle`, { align: 'center' });
    doc.moveDown(2);

    const startY = doc.y;
    doc
      .fontSize(11)
      .text('#', COLUMN_X.rank, startY)
      .text('Name', COLUMN_X.name, startY)
      .text('Punkte', COLUMN_X.points, startY)
      .text('Exakt', COLUMN_X.exactHits, startY);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    leaderboard.forEach((entry, index) => {
      const rowY = doc.y;
      doc
        .fontSize(11)
        .text(String(index + 1), COLUMN_X.rank, rowY)
        .text(entry.name, COLUMN_X.name, rowY)
        .text(String(entry.totalPoints), COLUMN_X.points, rowY)
        .text(String(entry.exactHits), COLUMN_X.exactHits, rowY);
      doc.moveDown();
    });

    if (leaderboard.length === 0) {
      doc.fontSize(11).text('Keine Tipps für diese Saison.');
    }

    doc.end();
  });
};
