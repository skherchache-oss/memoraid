
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
    const sanitizedTitle = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, '')
        .split(/\s+/)[0] || 'capsule';
    return `${prefix}_${sanitizedTitle}_${date}.${extension}`;
};

const FONT_SIZES = { h1: 22, h2: 18, h3: 12, body: 10, small: 8 };
const LINE_HEIGHT = 1.4;
const MARGIN = 50;
const TOP_CONTENT_LIMIT = 50; 

const sanitizeText = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/œ/g, "oe")
        .replace(/Œ/g, "OE")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2014]/g, '-')
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
    page.drawRectangle({
        x: 0, y: height - 3, width, height: 3,
        color: rgb(0.06, 0.73, 0.5)
    });
    page.drawText('MEMORAID', {
        x: width - 90,
        y: height - 20,
        size: 9,
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
        if (context.cursor.y < MARGIN + 40) {
            context.page = context.doc.addPage();
            drawBranding(context.page, context.fontBold);
            context.cursor.y = context.page.getHeight() - TOP_CONTENT_LIMIT;
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
    let page = doc.addPage();
    const context = { doc, page, cursor: { y: 0 }, fontBold };
    
    context.cursor.y = context.page.getHeight() - 40;
    drawBranding(context.page, fontBold);

    // Titre de la capsule
    await drawText(context, capsule.title, { font: fontBold, fontSize: FONT_SIZES.h1, spaceAfter: 15 });
    // Résumé
    await drawText(context, capsule.summary, { font: fontItalic, fontSize: FONT_SIZES.body, spaceAfter: 20 });
    
    // Section Concepts
    await drawText(context, 'CONCEPTS CLÉS', { font: fontBold, fontSize: 14, spaceAfter: 15, color: rgb(0.06, 0.73, 0.5) });
    
    for (const c of capsule.keyConcepts) {
        const maxWidth = context.page.getWidth() - 2 * MARGIN;
        const conceptLines = wrapText(c.concept, fontBold, FONT_SIZES.h3, maxWidth - 20);
        const explanationLines = wrapText(c.explanation, font, FONT_SIZES.body, maxWidth - 20);
        const deepDiveLines = c.deepDive ? wrapText(`Approfondissement : ${c.deepDive}`, fontItalic, FONT_SIZES.small, maxWidth - 20) : [];
        
        const blockHeight = (conceptLines.length + explanationLines.length) * (FONT_SIZES.body * LINE_HEIGHT) + (deepDiveLines.length * (FONT_SIZES.small * LINE_HEIGHT)) + 30;

        if (context.cursor.y - blockHeight < MARGIN + 40) {
            context.page = context.doc.addPage();
            drawBranding(context.page, context.fontBold);
            context.cursor.y = context.page.getHeight() - TOP_CONTENT_LIMIT;
        }

        context.page.drawRectangle({
            x: MARGIN, y: context.cursor.y - blockHeight, width: maxWidth, height: blockHeight,
            color: rgb(0.97, 0.97, 0.98), borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 0.5
        });

        context.cursor.y -= 15;
        conceptLines.forEach(line => {
            context.page.drawText(line, { x: MARGIN + 10, y: context.cursor.y - FONT_SIZES.h3, font: fontBold, size: FONT_SIZES.h3 });
            context.cursor.y -= FONT_SIZES.h3 * LINE_HEIGHT;
        });
        explanationLines.forEach(line => {
            context.page.drawText(line, { x: MARGIN + 10, y: context.cursor.y - FONT_SIZES.body, font: font, size: FONT_SIZES.body });
            context.cursor.y -= FONT_SIZES.body * LINE_HEIGHT;
        });
        deepDiveLines.forEach(line => {
            context.page.drawText(line, { x: MARGIN + 10, y: context.cursor.y - FONT_SIZES.small, font: fontItalic, size: FONT_SIZES.small, color: rgb(0.3, 0.3, 0.3) });
            context.cursor.y -= FONT_SIZES.small * LINE_HEIGHT;
        });
        context.cursor.y -= 10;
    }

    if (capsule.examples && capsule.examples.length > 0) {
        context.cursor.y -= 10;
        await drawText(context, 'EXEMPLES PRATIQUES', { font: fontBold, fontSize: 14, spaceAfter: 10, color: rgb(0.06, 0.73, 0.5) });
        for (const e of capsule.examples) {
            await drawText(context, `• ${e}`, { font, fontSize: FONT_SIZES.body, spaceAfter: 6 });
        }
    }

    if (capsule.mnemonic) {
        context.cursor.y -= 20;
        await drawText(context, "Secret de Mémorisation :", { font: fontBold, fontSize: 9, color: rgb(0.8, 0.4, 0) });
        await drawText(context, `"${capsule.mnemonic}"`, { font: fontItalic, fontSize: 11, spaceAfter: 20 });
    }

    // --- PAGE DÉDIÉE AU CROQUIS AIDE-MÉMOIRE (À LA FIN) ---
    if (capsule.memoryAidImage && capsule.memoryAidImage.length > 50) {
        try {
            const sketchPage = doc.addPage();
            drawBranding(sketchPage, fontBold);
            
            const pageWidth = sketchPage.getWidth();
            const pageHeight = sketchPage.getHeight();
            let currentY = pageHeight - 60;

            sketchPage.drawText('SYNTHÈSE VISUELLE', {
                x: MARGIN,
                y: currentY,
                size: 14,
                font: fontBold,
                color: rgb(0.06, 0.73, 0.5)
            });
            currentY -= 30;

            const base64Data = capsule.memoryAidImage.includes('base64,') 
                ? capsule.memoryAidImage.split('base64,')[1] 
                : capsule.memoryAidImage;
            
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            
            const image = await doc.embedPng(bytes);
            const dims = image.scaleToFit(pageWidth - 2 * MARGIN, pageHeight - 200);
            
            sketchPage.drawImage(image, {
                x: (pageWidth - dims.width) / 2,
                y: currentY - dims.height,
                width: dims.width,
                height: dims.height,
            });

            if (capsule.memoryAidDescription) {
                const descLines = wrapText(capsule.memoryAidDescription, fontBold, 10, pageWidth - 2 * MARGIN);
                let descY = currentY - dims.height - 30;
                descLines.forEach(line => {
                    sketchPage.drawText(line, {
                        x: (pageWidth - fontBold.widthOfTextAtSize(line, 10)) / 2,
                        y: descY,
                        size: 10,
                        font: fontBold,
                        color: rgb(0.4, 0.4, 0.4)
                    });
                    descY -= 14;
                });
            }
        } catch (e) {
            console.error("Erreur insertion page croquis PDF", e);
        }
    }

    const pdfBytes = await doc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), generateFilename('Fiche', capsule.title, 'pdf'));
};

export const downloadFlashcardsPdf = async (capsule: CognitiveCapsule): Promise<void> => {
    if (!capsule.flashcards || capsule.flashcards.length === 0) return;
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const CARDS_PER_PAGE = 4; 
    const { width, height } = { width: 595, height: 842 };
    const CARD_WIDTH = (width - (2 * MARGIN) - 20) / 2;
    const CARD_HEIGHT = (height - (2 * MARGIN) - 40) / 2;

    for (let i = 0; i < capsule.flashcards.length; i += CARDS_PER_PAGE) {
        const page = doc.addPage([width, height]);
        const chunk = capsule.flashcards.slice(i, i + CARDS_PER_PAGE);
        drawBranding(page, fontBold);
        chunk.forEach((card, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const x = MARGIN + col * (CARD_WIDTH + 20);
            const y = height - MARGIN - (row + 1) * (CARD_HEIGHT + 20);
            page.drawRectangle({ x, y, width: CARD_WIDTH, height: CARD_HEIGHT, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 });
            page.drawLine({ start: { x, y: y + CARD_HEIGHT / 2 }, end: { x: x + CARD_WIDTH, y: y + CARD_HEIGHT / 2 }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5), dashArray: [3, 3] });
            page.drawText("RECTO", { x: x + 10, y: y + CARD_HEIGHT - 15, size: 7, font: fontBold, color: rgb(0.06, 0.73, 0.5) });
            wrapText(card.front, font, 11, CARD_WIDTH - 20).slice(0, 5).forEach((line, li) => { page.drawText(line, { x: x + 10, y: y + CARD_HEIGHT - 35 - (li * 13), size: 11, font }); });
            page.drawText("VERSO", { x: x + 10, y: y + (CARD_HEIGHT / 2) - 15, size: 7, font: fontBold, color: rgb(0.96, 0.5, 0.15) });
            wrapText(card.back, font, 10, CARD_WIDTH - 20).slice(0, 6).forEach((line, li) => { page.drawText(line, { x: x + 10, y: y + (CARD_HEIGHT / 2) - 35 - (li * 12), size: 10, font }); });
        });
    }
    const pdfBytes = await doc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), generateFilename('Cartes', capsule.title, 'pdf'));
};

export const downloadQuizPdf = async (capsule: CognitiveCapsule): Promise<void> => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    
    const pageQ = doc.addPage();
    drawBranding(pageQ, fontBold);
    const ctxQ = { doc, page: pageQ, cursor: { y: pageQ.getHeight() - TOP_CONTENT_LIMIT }, fontBold };
    await drawText(ctxQ, `Quiz d'évaluation : ${capsule.title}`, { font: fontBold, fontSize: 18, spaceAfter: 15, color: rgb(0.06, 0.73, 0.5) });
    await drawText(ctxQ, "QUESTIONS", { font: fontBold, fontSize: 14, spaceAfter: 20 });
    capsule.quiz.forEach((q, i) => {
        drawText(ctxQ, `${i + 1}. ${q.question}`, { font: fontBold, fontSize: 11, spaceAfter: 8 });
        q.options.forEach((opt, oi) => {
            drawText(ctxQ, `[  ] ${String.fromCharCode(65 + oi)}. ${opt}`, { font, fontSize: 10, spaceAfter: 4, indent: 20 });
        });
        ctxQ.cursor.y -= 10;
    });

    const pageA = doc.addPage();
    drawBranding(pageA, fontBold);
    const ctxA = { doc, page: pageA, cursor: { y: pageA.getHeight() - TOP_CONTENT_LIMIT }, fontBold };
    await drawText(ctxA, "CORRECTION DÉTAILLÉE", { font: fontBold, fontSize: 18, spaceAfter: 20, color: rgb(0.06, 0.73, 0.5) });
    capsule.quiz.forEach((q, i) => {
        drawText(ctxA, `${i + 1}. ${q.question}`, { font: fontBold, fontSize: 11, spaceAfter: 5 });
        drawText(ctxA, `RÉPONSE : ${q.correctAnswer}`, { font: fontBold, fontSize: 10, color: rgb(0.06, 0.73, 0.5), spaceAfter: 5, indent: 15 });
        drawText(ctxA, q.explanation, { font, fontSize: 9, spaceAfter: 15, indent: 15, color: rgb(0.3, 0.3, 0.3) });
    });

    const pdfBytes = await doc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), generateFilename('Quiz', capsule.title, 'pdf'));
};
