
import pptxgen from 'pptxgenjs';
import JSZip from 'jszip';
import type { CognitiveCapsule } from '../types';
import { generateFilename, downloadBlob } from './pdfService';
import { MEMORAID_LOGO_BASE64 } from './logoAsset';

// Nettoyage agressif pour éviter la corruption XML dans PowerPoint
const sanitizeForPPTX = (text: string | undefined): string => {
    if (!text) return "";
    // 1. Convertir en string
    let str = String(text);
    // 2. Gérer les ligatures spécifiques (oe, OE)
    str = str.replace(/œ/g, "oe").replace(/Œ/g, "OE");
    // 3. Supprimer les caractères de contrôle XML invalides (sauf tab, CR, LF)
    // eslint-disable-next-line no-control-regex
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    // 4. Remplacer les caractères problématiques courants
    str = str.replace(/’/g, "'").replace(/“/g, '"').replace(/”/g, '"');
    return str.trim();
};

export const exportToPPTX = async (capsule: CognitiveCapsule) => {
    console.log("PPTX: Début du processus...");
    try {
        // --- 1. INITIALISATION ROBUSTE ---
        // Injection de JSZip dans window pour pptxgenjs
        let ZipClass: any = JSZip;
        if (ZipClass && typeof ZipClass !== 'function' && (ZipClass as any).default) {
            ZipClass = (ZipClass as any).default;
        }
        if (typeof window !== 'undefined') {
            (window as any).JSZip = ZipClass;
        }

        let PresClass: any;
        if (typeof pptxgen === 'function') {
            PresClass = pptxgen;
        } else if (pptxgen && (pptxgen as any).default) {
            PresClass = (pptxgen as any).default;
        } else if (typeof window !== 'undefined' && (window as any).PptxGenJS) {
            PresClass = (window as any).PptxGenJS;
        }

        if (!PresClass) throw new Error("Bibliothèque PowerPoint non chargée.");

        const pres = new PresClass();

        // --- 2. DESIGN SYSTEM ---
        const C = {
            EMERALD: '059669',    // Principal
            EMERALD_DARK: '064E3B',
            EMERALD_LIGHT: 'D1FAE5',
            ACCENT: 'F59E0B',     // Ambre/Orange
            TEXT_MAIN: '1E293B',  // Gris foncé
            TEXT_SEC: '475569',   // Gris moyen
            BG_LIGHT: 'F8FAFC',   // Gris très pâle
            WHITE: 'FFFFFF',
            BLUE_LIGHT: 'EFF6FF',
            BLUE_BORDER: 'BFDBFE'
        };

        pres.title = sanitizeForPPTX(capsule.title).substring(0, 100); 
        pres.author = 'Memoraid';

        // --- 3. MASQUE (MASTER SLIDE) ---
        pres.defineSlideMaster({
            title: 'MEMORAID_MASTER',
            background: { color: C.BG_LIGHT },
            objects: [
                // Bandeau vert en bas (y=95%, h=5%)
                { rect: { x: 0, y: '95%', w: '100%', h: '5%', fill: { color: C.EMERALD } } },
                // Texte "Memoraid" centré dans le bandeau
                { 
                    text: { 
                        text: 'Memoraid', 
                        options: { 
                            x: 0, 
                            y: '95%', 
                            w: '100%', 
                            h: '5%', 
                            fontSize: 10, 
                            color: C.EMERALD_LIGHT, 
                            align: 'center', 
                            valign: 'middle' 
                        } 
                    } 
                }
            ],
            slideNumber: { x: '92%', y: '95%', w: '5%', h: '5%', fontSize: 10, color: C.WHITE, align: 'right', valign: 'middle' }
        });

        // --- 4. SLIDE DE TITRE ---
        const slideTitle = pres.addSlide();
        slideTitle.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '30%', h: '100%', fill: { color: C.EMERALD } });
        slideTitle.addShape(pres.ShapeType.rect, { x: '25%', y: '10%', w: '10%', h: '20%', fill: { color: C.EMERALD_DARK, transparency: 50 } });

        if (MEMORAID_LOGO_BASE64 && MEMORAID_LOGO_BASE64.length > 100) {
            slideTitle.addImage({ 
                data: MEMORAID_LOGO_BASE64, 
                x: 0.8, y: 0.8, w: 1.5, h: 1.5,
                sizing: { type: 'contain', w: 1.5, h: 1.5 } 
            });
        }

        // REPOSITIONNEMENT : Titre remonté à y: '12%' pour éviter tout chevauchement
        slideTitle.addText(sanitizeForPPTX(capsule.title), {
            x: '35%', y: '12%', w: '60%', h: 1.8,
            fontSize: 32, fontFace: 'Arial', bold: true, color: C.TEXT_MAIN,
            align: 'left', valign: 'middle', shrinkText: true
        });

        // REPOSITIONNEMENT : Résumé à y: '45%' (plus d'espace)
        slideTitle.addText(sanitizeForPPTX(capsule.summary), {
            x: '35%', y: '45%', w: '60%', h: 2.2,
            fontSize: 14, color: C.TEXT_SEC, italic: true, align: 'left', valign: 'top', wrap: true
        });

        // --- 5. SLIDE IMAGE (SYNTHÈSE VISUELLE) ---
        if (capsule.memoryAidImage && capsule.memoryAidImage.length > 50) {
            const slideImg = pres.addSlide({ masterName: 'MEMORAID_MASTER' });
            slideImg.addText("Synthèse Visuelle", { 
                x: 0.5, y: 0.3, w: '90%', h: 0.6, 
                fontSize: 24, bold: true, color: C.EMERALD_DARK, align: 'center' 
            });
            
            // Extraction des données base64
            const base64Data = capsule.memoryAidImage.includes('base64,') 
                ? capsule.memoryAidImage.split('base64,')[1] 
                : capsule.memoryAidImage;

            // Centrage de l'image (Slide is 10x5.625 inches)
            // contain garantit le respect du ratio d'aspect original
            slideImg.addImage({ 
                data: `data:image/png;base64,${base64Data}`, 
                x: 1.5, y: 1.0, w: 7.0, h: 3.8, 
                sizing: { type: 'contain', w: 7.0, h: 3.8 } 
            });

            if (capsule.memoryAidDescription) {
                slideImg.addText(sanitizeForPPTX(capsule.memoryAidDescription), { 
                    x: 1, y: 4.9, w: 8, h: 0.5, 
                    fontSize: 11, color: C.TEXT_SEC, align: 'center', italic: true 
                });
            }
        }

        // --- 6. SLIDES CONCEPTS CLÉS ---
        capsule.keyConcepts.forEach((kc, i) => {
            const slide = pres.addSlide({ masterName: 'MEMORAID_MASTER' });
            slide.addText(`Concept ${i + 1}`, { x: 0.5, y: 0.4, fontSize: 12, color: C.ACCENT, bold: true });
            slide.addText(sanitizeForPPTX(kc.concept), { x: 0.5, y: 0.7, w: '90%', h: 0.8, fontSize: 28, bold: true, color: C.EMERALD_DARK, shrinkText: true });
            slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.6, w: 9, h: 3.5, fill: { color: C.WHITE }, line: { color: 'E2E8F0', width: 1 } });
            slide.addText(sanitizeForPPTX(kc.explanation), { x: 0.7, y: 1.8, w: 8.6, h: 3.1, fontSize: 16, color: C.TEXT_MAIN, align: 'left', valign: 'top', shrinkText: true });
        });

        // --- 7. SLIDES EXEMPLES ---
        if (capsule.examples && capsule.examples.length > 0) {
            const CHUNK_SIZE = 4;
            for (let i = 0; i < capsule.examples.length; i += CHUNK_SIZE) {
                const chunk = capsule.examples.slice(i, i + CHUNK_SIZE);
                const slide = pres.addSlide({ masterName: 'MEMORAID_MASTER' });
                slide.addText("Exemples Pratiques", { x: 0.5, y: 0.5, fontSize: 24, bold: true, color: C.EMERALD_DARK });
                if (capsule.examples.length > CHUNK_SIZE) slide.addText(`(Suite)`, { x: 4, y: 0.6, fontSize: 12, color: C.TEXT_SEC });
                chunk.forEach((ex, idx) => {
                    const yPos = 1.3 + (idx * 0.9);
                    slide.addShape(pres.ShapeType.roundRect, { x: 0.6, y: yPos + 0.1, w: 0.15, h: 0.15, fill: { color: C.ACCENT } });
                    slide.addText(sanitizeForPPTX(ex), { x: 0.9, y: yPos, w: 8.5, h: 0.8, fontSize: 14, color: C.TEXT_MAIN, valign: 'top', shrinkText: true });
                });
            }
        }

        // --- 8. SLIDES QUIZ (QUESTION / RÉPONSE SÉPARÉES) ---
        if (capsule.quiz && capsule.quiz.length > 0) {
            const slideInter = pres.addSlide();
            slideInter.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: C.EMERALD_DARK } });
            slideInter.addText("QUIZ FINAL", { x: 0, y: 2.5, w: '100%', align: 'center', fontSize: 40, color: C.WHITE, bold: true });
            slideInter.addText("À vous de jouer !", { x: 0, y: 3.5, w: '100%', align: 'center', fontSize: 18, color: C.EMERALD_LIGHT });

            capsule.quiz.forEach((q, i) => {
                const slideQ = pres.addSlide({ masterName: 'MEMORAID_MASTER' });
                slideQ.addShape(pres.ShapeType.roundRect, { x: 0.5, y: 0.3, w: 1.5, h: 0.4, fill: { color: C.ACCENT }, r: 5 });
                slideQ.addText(`QUESTION ${i + 1}`, { x: 0.5, y: 0.3, w: 1.5, h: 0.4, fontSize: 12, color: C.WHITE, bold: true, align: 'center' });
                slideQ.addText(sanitizeForPPTX(q.question), {
                    x: 0.5, y: 0.8, w: 9, h: 1.2,
                    fontSize: 22, bold: true, color: C.TEXT_MAIN,
                    valign: 'top', shrinkText: true
                });

                q.options.forEach((opt, idx) => {
                    const yOffset = 2.2 + (idx * 0.7); 
                    slideQ.addShape(pres.ShapeType.rect, {
                        x: 1, y: yOffset, w: 8, h: 0.6,
                        fill: { color: C.WHITE }, line: { color: 'CBD5E1', width: 1 }, rx: 5
                    });
                    slideQ.addText(String.fromCharCode(65 + idx), { 
                        x: 1.1, y: yOffset, w: 0.5, h: 0.6, 
                        fontSize: 14, color: C.ACCENT, bold: true, valign: 'middle' 
                    });
                    slideQ.addText(sanitizeForPPTX(opt), {
                        x: 1.6, y: yOffset, w: 7.2, h: 0.6,
                        fontSize: 14, color: C.TEXT_SEC, valign: 'middle',
                        shrinkText: true
                    });
                });

                const slideA = pres.addSlide({ masterName: 'MEMORAID_MASTER' });
                slideA.addText(`RÉPONSE ${i + 1}`, { x: 0.5, y: 0.4, fontSize: 12, color: C.EMERALD, bold: true });
                slideA.addText(sanitizeForPPTX(q.question), {
                    x: 0.5, y: 0.7, w: 9, h: 0.6,
                    fontSize: 14, color: C.TEXT_SEC, italic: true
                });
                slideA.addShape(pres.ShapeType.rect, {
                    x: 1, y: 1.4, w: 8, h: 1.0,
                    fill: { color: C.EMERALD_LIGHT }, line: { color: C.EMERALD, width: 2 }, rx: 10
                });
                slideA.addText(sanitizeForPPTX(q.correctAnswer), {
                    x: 1, y: 1.4, w: 8, h: 1.0,
                    fontSize: 20, bold: true, color: C.EMERALD_DARK,
                    align: 'center', valign: 'middle', shrinkText: true
                });
                slideA.addShape(pres.ShapeType.rect, {
                    x: 1, y: 2.6, w: 8, h: 2.4,
                    fill: { color: C.WHITE }, line: { color: 'E2E8F0' }
                });
                slideA.addText("Explication :", { x: 1.2, y: 2.7, fontSize: 12, bold: true, color: C.ACCENT });
                slideA.addText(sanitizeForPPTX(q.explanation), {
                    x: 1.2, y: 3.0, w: 7.6, h: 1.9,
                    fontSize: 14, color: C.TEXT_MAIN, valign: 'top', shrinkText: true
                });
            });
        }

        console.log("PPTX: Écriture du fichier...");
        const blob = await pres.write({ outputType: 'blob' });
        
        if (blob instanceof Blob) {
            const pptxBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
            const filename = generateFilename('Presentation', capsule.title, 'pptx');
            downloadBlob(pptxBlob, filename);
        } else {
            throw new Error("Erreur format blob.");
        }

    } catch (e: any) {
        console.error("PPTX Generation Error:", e);
        throw new Error(`Erreur PowerPoint: ${e.message || 'Inconnue'}`);
    }
};

export const exportToEPUB = async (capsule: CognitiveCapsule) => {
    try {
        let ZipClass: any = JSZip;
        if (ZipClass && typeof ZipClass !== 'function' && (ZipClass as any).default) {
            ZipClass = (ZipClass as any).default;
        }
        
        const zip = new ZipClass();
        
        zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

        zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
   <rootfiles>
      <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
   </rootfiles>
</container>`);

        const oebps = zip.folder("OEBPS");
        if (!oebps) throw new Error("Zip error");

        const conceptsHtml = capsule.keyConcepts.map(c => `
            <div class="concept">
                <h2>${c.concept}</h2>
                <p>${c.explanation}</p>
            </div>
        `).join('');

        const examplesHtml = capsule.examples.length > 0 ? `
            <div class="section">
                <h2>Exemples</h2>
                <ul>${capsule.examples.map(e => `<li>${e}</li>`).join('')}</ul>
            </div>
        ` : '';

        const quizHtml = capsule.quiz.length > 0 ? `
            <div class="section">
                <h2>Quiz</h2>
                ${capsule.quiz.map((q, i) => `
                    <div class="question">
                        <p><strong>Q${i + 1}:</strong> ${q.question}</p>
                        <p class="answer"><em>Réponse : ${q.correctAnswer}</em></p>
                        <p class="explanation">${q.explanation}</p>
                    </div>
                `).join('')}
            </div>
        ` : '';

        const xhtmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr">
<head>
    <title>${capsule.title}</title>
    <style>
        body { font-family: sans-serif; line-height: 1.5; }
        h1 { color: #2c3e50; text-align: center; }
        h2 { color: #3498db; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .summary { font-style: italic; background: #f9f9f9; padding: 15px; border-radius: 5px; }
        .concept { margin-bottom: 20px; }
        .question { margin-bottom: 15px; border-left: 3px solid #e67e22; padding-left: 10px; }
        .answer { color: #27ae60; }
    </style>
</head>
<body>
    <h1>${capsule.title}</h1>
    <div class="summary">
        <p>${capsule.summary}</p>
    </div>
    ${conceptsHtml}
    ${examplesHtml}
    ${quizHtml}
    <p style="text-align:center; font-size:0.8em; color:#999; margin-top:50px;">Généré par Memoraid</p>
</body>
</html>`;

        oebps.file("capsule.xhtml", xhtmlContent);

        const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://purl.org/dc/elements/1.1/">
        <dc:title>${capsule.title}</dc:title>
        <dc:creator opf:role="aut">Memoraid</dc:creator>
        <dc:language>fr</dc:language>
        <dc:identifier id="BookID" opf:scheme="UUID">urn:uuid:${capsule.id}</dc:identifier>
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="capsule" href="capsule.xhtml" media-type="application/xhtml+xml"/>
    </manifest>
    <spine toc="ncx">
        <itemref idref="capsule"/>
    </spine>
</package>`;
        oebps.file("content.opf", opfContent);

        const ncxContent = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="urn:uuid:${capsule.id}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle><text>${capsule.title}</text></docTitle>
    <navMap>
        <navPoint id="navPoint-1" playOrder="1">
            <navLabel><text>Capsule</text></navLabel>
            <content src="capsule.xhtml"/>
        </navPoint>
    </navMap>
</ncx>`;
        oebps.file("toc.ncx", ncxContent);

        const blob = await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
        const filename = generateFilename('Livre', capsule.title, 'epub');
        downloadBlob(blob, filename);

    } catch (e) {
        console.error("ePub Generation Error", e);
        throw new Error("Erreur lors de la génération ePub.");
    }
};
