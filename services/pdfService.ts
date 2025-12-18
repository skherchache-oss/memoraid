
import { PDFDocument, rgb, PDFFont, StandardFonts, PDFPage, PDFImage } from 'pdf-lib';
import type { CognitiveCapsule, FlashcardContent } from '../types';
import { MEMORAID_LOGO_BASE64 } from './logoAsset';

// Utility to trigger blob download.
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
    const sanitizedTitle = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/\s+/)[0] || 'capsule';
    return `${prefix}_${sanitizedTitle}_${date}.${extension}`;
};

const FONT_SIZES = { h1: 22, h2: 16, h3: 12, body: 10, small: 8 };
const LINE_HEIGHT = 1.4;
const MARGIN = 50;

const sanitizeText = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[^\x00-\xFF]/g, '')
        .replace(/\r/g, '');
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
            if (font.widthOfTextAtSize(testLine, fontSize) < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        if (currentLine) lines.push(currentLine);
    }
    return lines;
}

const drawBranding = (page: PDFPage, fontBold: PDFFont) => {
    const { width, height } = page.getSize();
    page.drawText('MEMORAID', {
        x: width - 100,
        y: height - 30,
        size: 10,
        font: fontBold,
        color: rgb(0.02, 0.59, 0.41),
    });
};

async function drawText(context: { doc: PDFDocument, page: PDFPage, cursor: { y: number }, fontBold: PDFFont }, text: string, options: { font: PDFFont, fontSize?: number, spaceAfter?: number, color?: any, indent?: number }) {
    const maxWidth = context.page.getSize().width - 2 * MARGIN;
    const fontSize = options.fontSize || FONT_SIZES.body;
    const indent = options.indent || 0;
    const lines = wrapText(text, options.font, fontSize, maxWidth - indent);

    for (const line of lines) {
        if (context.cursor.y < MARGIN + 20) {
            context.page = context.doc.addPage();
            drawBranding(context.page, context.fontBold);
            context.cursor.y = context.page.getHeight() - MARGIN;
        }
        context.page.drawText(line, { x: MARGIN + indent, y: context.cursor.y - fontSize, font: options.font, size: fontSize, color: options.color || rgb(0.1, 0.1, 0.1) });
        context.cursor.y -= fontSize * LINE_HEIGHT;
    }
    context.cursor.y -= (options.spaceAfter || 0);
}

export const downloadCapsulePdf = async (capsule: CognitiveCapsule): Promise<void> => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
    
    const context = { doc, page: doc.addPage(), cursor: { y: 0 }, fontBold };
    context.cursor.y = context.page.getHeight() - MARGIN;
    drawBranding(context.page, fontBold);

    await drawText(context, capsule.title, { font: fontBold, fontSize: FONT_SIZES.h1, spaceAfter: 10 });
    await drawText(context, capsule.summary, { font: fontItalic, fontSize: FONT_SIZES.body, spaceAfter: 20 });

    // SECRET DE MÉMORISATION (MNEMONIC)
    if (capsule.mnemonic) {
        const boxWidth = context.page.getSize().width - 2 * MARGIN;
        context.page.drawRectangle({
            x: MARGIN, y: context.cursor.y - 45, width: boxWidth, height: 40,
            color: rgb(1, 0.97, 0.9), borderColor: rgb(0.96, 0.5, 0.15), borderWidth: 1
        });
        await drawText(context, "Secret de Mémorisation :", { font: fontBold, fontSize: 9, color: rgb(0.8, 0.4, 0), indent: 10 });
        context.cursor.y += 5;
        await drawText(context, `"${capsule.mnemonic}"`, { font: fontItalic, fontSize: 11, color: rgb(0.2, 0.2, 0.2), indent: 10, spaceAfter: 25 });
    }

    await drawText(context, 'Concepts Clés', { font: fontBold, fontSize: FONT_SIZES.h2, spaceAfter: 10 });
    for (const c of capsule.keyConcepts) {
        await drawText(context, c.concept, { font: fontBold, fontSize: FONT_SIZES.h3, spaceAfter: 2 });
        await drawText(context, c.explanation, { font, fontSize: FONT_SIZES.body, spaceAfter: 12 });
    }

    if (capsule.examples.length > 0) {
        await drawText(context, 'Exemples Pratiques', { font: fontBold, fontSize: FONT_SIZES.h2, spaceAfter: 10 });
        for (const e of capsule.examples) {
            await drawText(context, `• ${e}`, { font, fontSize: FONT_SIZES.body, spaceAfter: 6 });
        }
    }

    const pdfBytes = await doc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), generateFilename('Fiche', capsule.title, 'pdf'));
};

export const downloadFlashcardsPdf = async (capsule: CognitiveCapsule): Promise<void> => {
    if (!capsule.flashcards || capsule.flashcards.length === 0) throw new Error("Pas de flashcards.");
    
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    
    const CARDS_PER_PAGE = 8; // 2 cols x 4 rows
    const CARD_WIDTH = 240;
    const CARD_HEIGHT = 160;
    const GUTTER = 20;

    for (let i = 0; i < capsule.flashcards.length; i += CARDS_PER_PAGE) {
        const page = doc.addPage();
        const chunk = capsule.flashcards.slice(i, i + CARDS_PER_PAGE);
        drawBranding(page, fontBold);
        
        chunk.forEach((card, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const x = MARGIN + col * (CARD_WIDTH + GUTTER);
            const y = page.getHeight() - MARGIN - (row + 1) * (CARD_HEIGHT + GUTTER / 2);

            // Card border
            page.drawRectangle({ x, y, width: CARD_WIDTH, height: CARD_HEIGHT, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5 });
            
            // Middle fold line (dotted)
            page.drawLine({ start: { x, y: y + CARD_HEIGHT/2 }, end: { x: x + CARD_WIDTH, y: y + CARD_HEIGHT/2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8), dashArray: [2, 2] });

            // Recto text
            page.drawText("RECTO", { x: x + 5, y: y + CARD_HEIGHT - 12, size: 7, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
            const frontLines = wrapText(card.front, font, 10, CARD_WIDTH - 20);
            frontLines.slice(0, 4).forEach((l, li) => {
                page.drawText(l, { x: x + 10, y: y + CARD_HEIGHT - 30 - li * 12, size: 10, font });
            });

            // Verso text
            page.drawText("VERSO", { x: x + 5, y: y + CARD_HEIGHT/2 - 12, size: 7, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
            const backLines = wrapText(card.back, font, 9, CARD_WIDTH - 20);
            backLines.slice(0, 5).forEach((l, li) => {
                page.drawText(l, { x: x + 10, y: y + CARD_HEIGHT/2 - 30 - li * 11, size: 9, font });
            });
        });
    }

    const pdfBytes = await doc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), generateFilename('Flashcards_Impression', capsule.title, 'pdf'));
};

export const downloadQuizPdf = async (capsule: CognitiveCapsule): Promise<void> => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const context = { doc, page: doc.addPage(), cursor: { y: 0 }, fontBold };
    context.cursor.y = context.page.getHeight() - MARGIN;
    drawBranding(context.page, fontBold);

    await drawText(context, `Quiz : ${capsule.title}`, { font: fontBold, fontSize: FONT_SIZES.h2, spaceAfter: 20 });
    capsule.quiz.forEach((q, i) => {
        drawText(context, `${i+1}. ${q.question}`, { font: fontBold, fontSize: 11, spaceAfter: 5 });
        q.options.forEach(opt => drawText(context, `[ ] ${opt}`, { font, fontSize: 10, spaceAfter: 2, indent: 15 }));
        context.cursor.y -= 10;
    });

    const pdfBytes = await doc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), generateFilename('Quiz', capsule.title, 'pdf'));
};
