
import { PDFDocument, rgb, PDFFont, StandardFonts, PDFPage } from 'pdf-lib';
import type { CognitiveCapsule } from '../types';

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
const FOOTER_BOX_HEIGHT = 80; 

const sanitizeText = (text: string): string => {
    if (!text) return '';
    return text
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
        if (context.cursor.y < MARGIN + 40) {
            context.page = context.doc.addPage();
            drawBranding(context.page, context.fontBold);
            context.cursor.y = context.page.getHeight() - MARGIN;
        }
        context.page.drawText(line, { x: MARGIN + indent, y: context.cursor.y - fontSize, font: options.font, size: fontSize, color: options.color || rgb(0.1, 0.1, 0.1) });
        context.cursor.y -= fontSize * LINE_HEIGHT;
    }
    context.cursor.y -= (options.spaceAfter || 0);
}

function decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64.split(',')[1] || base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export const downloadCapsulePdf = async (capsule: CognitiveCapsule): Promise<void> => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
    
    let page = doc.addPage();
    const context = { doc, page, cursor: { y: 0 }, fontBold };
    context.cursor.y = context.page.getHeight() - MARGIN;
    drawBranding(context.page, fontBold);

    // Titre
    await drawText(context, capsule.title, { font: fontBold, fontSize: FONT_SIZES.h1, spaceAfter: 10 });
    // Résumé
    await drawText(context, capsule.summary, { font: fontItalic, fontSize: FONT_SIZES.body, spaceAfter: 20 });

    // Concepts Clés
    await drawText(context, 'CONCEPTS CLÉS', { font: fontBold, fontSize: 14, spaceAfter: 15, color: rgb(0.06, 0.73, 0.5) });
    
    for (const c of capsule.keyConcepts) {
        const maxWidth = context.page.getSize().width - 2 * MARGIN;
        const conceptLines = wrapText(c.concept, fontBold, FONT_SIZES.h3, maxWidth - 20);
        const explanationLines = wrapText(c.explanation, font, FONT_SIZES.body, maxWidth - 20);
        const blockHeight = (conceptLines.length + explanationLines.length) * (FONT_SIZES.body * LINE_HEIGHT) + 20;

        if (context.cursor.y - blockHeight < MARGIN + 40) {
            context.page = context.doc.addPage();
            drawBranding(context.page, context.fontBold);
            context.cursor.y = context.page.getHeight() - MARGIN;
        }

        context.page.drawRectangle({
            x: MARGIN, y: context.cursor.y - blockHeight,
            width: maxWidth, height: blockHeight,
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
        context.cursor.y -= 10;
    }

    // Exemples
    if (capsule.examples && capsule.examples.length > 0) {
        context.cursor.y -= 10;
        await drawText(context, 'EXEMPLES PRATIQUES', { font: fontBold, fontSize: 14, spaceAfter: 10, color: rgb(0.06, 0.73, 0.5) });
        for (const e of capsule.examples) {
            await drawText(context, `• ${e}`, { font, fontSize: FONT_SIZES.body, spaceAfter: 6 });
        }
    }

    // MNÉMOTECHNIQUE : Restauration et Positionnement
    if (capsule.mnemonic) {
        const maxWidth = context.page.getSize().width - 2 * MARGIN;
        const mLines = wrapText(`"${capsule.mnemonic}"`, fontItalic, 11, maxWidth - 30);
        const blockHeight = Math.max(60, mLines.length * 15 + 30);

        if (context.cursor.y - blockHeight < MARGIN + 20) {
            context.page = context.doc.addPage();
            drawBranding(context.page, context.fontBold);
            context.cursor.y = context.page.getHeight() - MARGIN;
        }

        context.cursor.y -= 20;
        const boxY = context.cursor.y - blockHeight;

        context.page.drawRectangle({
            x: MARGIN, y: boxY, width: maxWidth, height: blockHeight,
            color: rgb(1, 0.99, 0.95), borderColor: rgb(0.96, 0.5, 0.15), borderWidth: 1
        });

        context.page.drawText("Secret de Mémorisation :", {
            x: MARGIN + 15, y: boxY + blockHeight - 20,
            size: 9, font: fontBold, color: rgb(0.8, 0.4, 0)
        });

        mLines.forEach((line, i) => {
            context.page.drawText(line, {
                x: MARGIN + 15, y: boxY + blockHeight - 40 - (i * 13),
                size: 11, font: fontItalic, color: rgb(0.2, 0.2, 0.2)
            });
        });
        context.cursor.y = boxY - 20;
    }

    // PAGE SUIVANTE : CROQUIS AIDE-MÉMOIRE
    if (capsule.memoryAidImage) {
        try {
            const sketchPage = doc.addPage();
            const { width, height } = sketchPage.getSize();
            drawBranding(sketchPage, fontBold);

            sketchPage.drawText("CROQUIS AIDE-MÉMOIRE", {
                x: MARGIN, y: height - 80,
                size: 18, font: fontBold, color: rgb(0.06, 0.73, 0.5)
            });

            const rawData = capsule.memoryAidImage;
            const imageBytes = decodeBase64(rawData);
            
            // Gestion intelligente du format (PNG vs JPG)
            let pdfImage;
            if (rawData.includes('image/png') || rawData.includes('iVBORw0KG')) {
                pdfImage = await doc.embedPng(imageBytes);
            } else {
                pdfImage = await doc.embedJpg(imageBytes);
            }
            
            const dims = pdfImage.scale(0.8);
            const imgWidth = width - (2 * MARGIN);
            const imgHeight = (dims.height * imgWidth) / dims.width;
            
            // On s'assure que l'image ne dépasse pas la hauteur de la page
            const maxAllowedHeight = height - 200;
            let finalWidth = imgWidth;
            let finalHeight = imgHeight;
            if (imgHeight > maxAllowedHeight) {
                finalHeight = maxAllowedHeight;
                finalWidth = (dims.width * finalHeight) / dims.height;
            }

            sketchPage.drawImage(pdfImage, {
                x: (width - finalWidth) / 2, 
                y: height - 120 - finalHeight,
                width: finalWidth, 
                height: finalHeight,
            });

            if (capsule.memoryAidDescription) {
                const descLines = wrapText(capsule.memoryAidDescription, fontItalic, 10, width - (2 * MARGIN));
                let descY = height - 140 - finalHeight;
                descLines.forEach(line => {
                    if (descY > MARGIN) {
                        sketchPage.drawText(line, { x: MARGIN, y: descY, size: 10, font: fontItalic, color: rgb(0.4, 0.4, 0.4) });
                        descY -= 12;
                    }
                });
            }
        } catch (imgError) {
            console.warn("Could not embed image in PDF:", imgError);
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

            page.drawRectangle({
                x, y, width: CARD_WIDTH, height: CARD_HEIGHT,
                borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1
            });
            page.drawLine({
                start: { x, y: y + CARD_HEIGHT / 2 }, end: { x: x + CARD_WIDTH, y: y + CARD_HEIGHT / 2 },
                thickness: 0.5, color: rgb(0.5, 0.5, 0.5), dashArray: [3, 3]
            });

            page.drawText("RECTO", { x: x + 10, y: y + CARD_HEIGHT - 15, size: 7, font: fontBold, color: rgb(0.06, 0.73, 0.5) });
            wrapText(card.front, font, 11, CARD_WIDTH - 20).slice(0, 5).forEach((line, li) => {
                page.drawText(line, { x: x + 10, y: y + CARD_HEIGHT - 35 - (li * 13), size: 11, font });
            });

            page.drawText("VERSO", { x: x + 10, y: y + (CARD_HEIGHT / 2) - 15, size: 7, font: fontBold, color: rgb(0.96, 0.5, 0.15) });
            wrapText(card.back, font, 10, CARD_WIDTH - 20).slice(0, 6).forEach((line, li) => {
                page.drawText(line, { x: x + 10, y: y + (CARD_HEIGHT / 2) - 35 - (li * 12), size: 10, font });
            });
        });
    }
    const pdfBytes = await doc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), generateFilename('Cartes', capsule.title, 'pdf'));
};

export const downloadQuizPdf = async (capsule: CognitiveCapsule): Promise<void> => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const context = { doc, page: doc.addPage(), cursor: { y: 0 }, fontBold };
    context.cursor.y = context.page.getHeight() - MARGIN;
    drawBranding(context.page, fontBold);
    await drawText(context, `Quiz d'évaluation : ${capsule.title}`, { font: fontBold, fontSize: FONT_SIZES.h2, spaceAfter: 20 });
    capsule.quiz.forEach((q, i) => {
        drawText(context, `${i+1}. ${q.question}`, { font: fontBold, fontSize: 11, spaceAfter: 8 });
        q.options.forEach((opt, oi) => {
            drawText(context, `[  ] ${String.fromCharCode(65 + oi)}. ${opt}`, { font, fontSize: 10, spaceAfter: 4, indent: 20 });
        });
        context.cursor.y -= 10;
    });
    const pdfBytes = await doc.save();
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), generateFilename('Quiz', capsule.title, 'pdf'));
};
