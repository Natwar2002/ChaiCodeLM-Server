import { RAG } from '../serverConfig.js';
import { chatOnce } from './llm.js';

export async function makeSubqueries(userQuery) {
    if (!RAG.useSubQueries) return [];
    const sys = `Break the user's query into 2-3 concise sub-queries to fetch prerequisite or related info. Output JSON array of strings only.`;
    const msg = `User query: ${userQuery}\nSub-queries (JSON array of strings):`;
    const raw = await chatOnce({
        messages: [
            { role: 'system', content: sys },
            { role: 'user', content: msg },
        ],
        max_tokens: 180,
        temperature: 0.3
    });

    try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.slice[0, 3] : [];
    } catch (error) {
        return raw.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 3);
    }
} 