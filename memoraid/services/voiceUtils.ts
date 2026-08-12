
import { Language } from '../i18n/translations';

/**
 * Nettoie le texte de tout artefact visuel pour le TTS.
 */
export const cleanTextForSpeech = (text: string): string => {
    if (!text) return "";
    return text
        .replace(/[*_#`~]/g, '')
        .replace(/\[\[.*?\]\]/g, '')
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/\s+/g, ' ')
        .replace(/([.!?])\1+/g, '$1')
        .trim();
};

/**
 * Segmente le texte en groupes de phrases pour équilibrer fluidité et limites d'API.
 */
export const segmentText = (text: string, maxSegments: number = 20): string[] => {
    const cleaned = cleanTextForSpeech(text);
    // On découpe par phrase
    const rawSentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
    
    // On regroupe les phrases courtes par 2 pour plus de fluidité
    const grouped: string[] = [];
    for (let i = 0; i < rawSentences.length; i += 2) {
        const chunk = rawSentences[i] + (rawSentences[i+1] ? " " + rawSentences[i+1] : "");
        grouped.push(chunk.trim());
    }
    
    return grouped.slice(0, maxSegments);
};

/**
 * Nettoyage spécifique pour la dictée vocale (STT).
 */
export const cleanDictationResult = (text: string, lang: Language): string => {
    let cleaned = text;
    if (lang === 'fr') {
        cleaned = cleaned.replace(/\b(euh+|hum+|ben|bah|bref|genre|fin|du coup)\b/gi, '');
        cleaned = cleaned.replace(/\s+([.,])/g, '$1');
        cleaned = cleaned.replace(/\s*([!?:;])/g, ' $1');
    } else {
        cleaned = cleaned.replace(/\b(um+|uh+|like|you know|so|basically|actually)\b/gi, '');
        cleaned = cleaned.replace(/\s+([.,!?;:])/g, '$1');
    }
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "";
};
