import { RAG } from '../serverConfig.js';
import { chatOnce } from './llm.js';

export async function makeHyDE(userQuery) {
    if (!RAG.useHyDE) return null;
    try {
        const sys = 'Write a short hypothetical answer that could guide retrieval. No citations. Keep under 120 words.';
        const msg = `Question: ${userQuery} \nHypothetical answer:`;
        const hypo = await chatOnce({
            model: RAG.chatModel,
            messages: [
                { role: 'system', content: sys },
                { role: 'user', content: msg }
            ],
            max_tokens: 160,
            temperature: 0.4,
        });
        return (hypo || '').trim() || null;
    } catch (error) {
        console.log("Error in makeHyDE: ", error);
        throw error;
    }
}