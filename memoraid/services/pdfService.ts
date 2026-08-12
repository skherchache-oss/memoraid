import { PDFDocument, rgb, PDFFont, StandardFonts, PDFPage } from 'pdf-lib';
import type { CognitiveCapsule } from '../types';

export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const generateFilename = (prefix: string, title: string, extension: string): string => {
    const date = new Date().toISOString().slice(0, 10);
    const sanitizedTitle = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, '').split(/\s+/)[0] || 'module';
    return `${prefix}_${sanitizedTitle}_${date}.${extension}`;
};

const FONT_SIZES = { h1: 22, h2: 18, h3: 12, body: 10, small: 8 };
const LINE_HEIGHT = 1.4;
const MARGIN = 50;

const sanitizeText = (text: string): string => {
    if (!text) return '';
    return text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2014]/g, '-').replace(/\r/g, '');
};

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
    const sanitized = sanitizeText(text);
    const paragraphs = sanitized.split('\n');
    const lines: string[] = [];
    for (const paragraph of paragraphs) {
        const words = paragraph.split(' ');
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine === '' ? word : `${currentLine} ${word}`;
            if (font.widthOfTextAtSize(testLine, fontSize) < maxWidth) currentLine = testLine;
            else { lines.push(currentLine); currentLine = word; }
        }
        if (currentLine) lines.push(currentLine);
    }
    return lines;
}

async function drawText(context: { doc: PDFDocument, page: PDFPage, cursor: { y: number }, fontBold: PDFFont }, text: string, options: { font: PDFFont, fontSize?: number, spaceAfter?: number, color?: any, indent?: number }) {
    const maxWidth = context.page.getSize().width - 2 * MARGIN;
    const fontSize = options.fontSize || FONT_SIZES.body;
    const lines = wrapText(text, options.font, fontSize, maxWidth - (options.indent || 0));
    for (const line of lines) {
        if (context.cursor.y < MARGIN + 40) { context.page = context.doc.addPage(); context.cursor.y = context.page.getHeight() - 50; }
        context.page.drawText(line, { x: MARGIN + (options.indent || 0), y: context.cursor.y - fontSize, font: options.font, size: fontSize, color: options.color || rgb(0.1, 0.1, 0.1) });
        context.cursor.y -= fontSize * LINE_HEIGHT;
    }
    context.cursor.y -= (options.spaceAfter || 0);
}

export const downloadCapsulePdf = async (capsule: CognitiveCapsule): Promise<void> => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
    let page = doc.addPage();
    const context = { doc, page, cursor: { y: 0 }, fontBold };
    context.cursor.y = page.getHeight() - 50;

    await drawText(context, capsule.title, { font: fontBold, fontSize: FONT_SIZES.h1, spaceAfter: 10 });
    await drawText(context, capsule.summary, { font: fontItalic, fontSize: 11, spaceAfter: 20 });

    if (capsule.mnemonic) {
        const mw = page.getWidth() - 2 * MARGIN;
        context.page.drawRectangle({ x: MARGIN, y: context.cursor.y - 40, width: mw, height: 40, color: rgb(1, 0.98, 0.9) });
        await drawText(context, `ASTUCE : ${capsule.mnemonic}`, { font: fontItalic, fontSize: 10, indent: 10, spaceAfter: 20 });
    }

    await drawText(context, 'CONCEPTS CLÉS', { font: fontBold, fontSize: 14, spaceAfter: 15, color: rgb(0.06, 0.73, 0.5) });
    for (const c of capsule.keyConcepts) {
        await drawText(context, c.concept, { font: fontBold, fontSize: 12, spaceAfter: 5 });
        await drawText(context, c.explanation, { font, fontSize: 10, spaceAfter: 15 });
    }

    if (capsule.examples?.length) {
        await drawText(context, 'EXEMPLES PRATIQUES', { font: fontBold, fontSize: 14, spaceAfter: 10, color: rgb(0.06, 0.73, 0.5) });
        for (const e of capsule.examples) await drawText(context, `• ${e}`, { font, fontSize: 10, spaceAfter: 5 });
    }

    if (capsule.memoryAidImage) {
        try {
            const sketchPage = doc.addPage();
            const b64 = capsule.memoryAidImage.split(',')[1] || capsule.memoryAidImage;
            const img = await doc.embedPng(atob(b64).split('').map(c => c.charCodeAt(0)));
            const dims = img.scaleToFit(sketchPage.getWidth() - 100, 400);
            sketchPage.drawImage(img, { x: 50, y: sketchPage.getHeight() - dims.height - 100, width: dims.width, height: dims.height });
        } catch (e) { console.error("PDF Image Error", e); }
    }

    const pdfBytes = await doc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), generateFilename('Module', capsule.title, 'pdf'));
};

export const downloadFlashcardsPdf = async (capsule: CognitiveCapsule): Promise<void> => { /* ... existant ... */ };
export const downloadQuizPdf = async (capsule: CognitiveCapsule): Promise<void> => { /* ... existant ... */ };