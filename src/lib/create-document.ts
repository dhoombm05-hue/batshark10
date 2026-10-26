import logoUrl from '@/assets/batshark-logo-official.png';

export type CreatedFileType = 'pdf' | 'docx' | 'txt' | 'md' | 'xlsx';

export async function createDocumentFile(title: string, content: string, type: CreatedFileType): Promise<File> {
  const name = title.trim().replace(/[\\/:*?"<>|]/g, '-') || 'مستند';
  if (type === 'txt' || type === 'md') {
    return new File([type === 'md' ? `# ${title}\n\n${content}` : `${title}\n\n${content}`], `${name}.${type}`, { type: type === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' });
  }
  if (type === 'xlsx') {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const rows = content.split('\n').map(line => line.split('\t'));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'المستند');
    return new File([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], `${name}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  if (type === 'docx') {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } = await import('docx');
    const logo = await fetch(logoUrl).then(response => response.arrayBuffer());
    const document = new Document({ sections: [{ children: [
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new ImageRun({ data: logo, type: 'png', transformation: { width: 72, height: 72 } })] }),
      new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, bidirectional: true, alignment: AlignmentType.RIGHT }),
      ...content.split('\n').map(line => new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 180 }, children: [new TextRun({ text: line, rightToLeft: true, font: 'Arial', size: 24 })] })),
    ] }] });
    return new File([await Packer.toBlob(document)], `${name}.docx`, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  const { PDFDocument } = await import('pdf-lib');
  await document.fonts.ready;
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setAuthor('BatShark');
  const logo = new Image();
  logo.src = logoUrl;
  await logo.decode();
  const palette = getComputedStyle(document.documentElement);
  const ink = palette.getPropertyValue('--document-paper-ink').trim() || palette.getPropertyValue('--foreground').trim();
  const paper = palette.getPropertyValue('--document-paper').trim() || palette.getPropertyValue('--card').trim();
  const accent = palette.getPropertyValue('--primary').trim();
  const canvas = document.createElement('canvas');
  canvas.width = 1190;
  canvas.height = 1684;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('تعذر إنشاء ملف PDF');
  const font = palette.getPropertyValue('--font-body').trim() || 'sans-serif';
  let pageNumber = 0;
  const beginPage = () => {
    pageNumber++;
    ctx.fillStyle = `hsl(${paper})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(logo, 998, 60, 100, 100);
    ctx.fillStyle = `hsl(${ink})`;
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.font = `bold 38px ${font}`;
    // Constrain long titles without allowing them to overlap the logo.
    ctx.fillText(title, 960, 120, 850);
    ctx.fillStyle = `hsl(${accent})`;
    ctx.fillRect(90, 185, 1010, 3);
    ctx.fillStyle = `hsl(${ink})`;
    ctx.font = `28px ${font}`;
  };
  const finishPage = async () => {
    ctx.font = `22px ${font}`;
    ctx.fillText(`${pageNumber} · BatShark`, 1100, 1610);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('تعذر حفظ الصفحة')), 'image/png'));
    const image = await pdf.embedPng(await blob.arrayBuffer());
    pdf.addPage([595, 842]).drawImage(image, { x: 0, y: 0, width: 595, height: 842 });
  };
  beginPage();
  let y = 250;
  const lines: string[] = [];
  for (const paragraph of content.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      if (ctx.measureText(`${line} ${word}`).width > 1010 && line) {
        lines.push(line);
        line = '';
      }
      // Break oversized tokens so even URLs cannot cross page margins.
      for (const character of word) {
        if (ctx.measureText(`${line}${character}`).width > 1010) {
          lines.push(line);
          line = '';
        }
        line += character;
      }
      line += ' ';
    }
    lines.push(line.trimEnd(), '');
  }
  for (const line of lines) {
    if (y > 1510) {
      await finishPage();
      beginPage();
      y = 250;
    }
    ctx.fillText(line, 1100, y);
    y += line ? 46 : 22;
  }
  await finishPage();
  return new File([await pdf.save() as Uint8Array<ArrayBuffer>], `${name}.pdf`, { type: 'application/pdf' });
}