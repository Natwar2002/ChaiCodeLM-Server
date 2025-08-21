import { RAG } from '../serverConfig.js';
import { chatOnce } from './llm.js';

export async function rewriteQuery(userQuery) {
    try {
        if (!RAG.useQueryRewrite) return userQuery;

        const sys = 'Rewrite the user query to be clear, well written, unambiguous, and search-friendly. Fix typos, according to the context and dont loose the context. Output ONLY the rewritten query.';
        const msg = `Original: ${userQuery} \nRewritten: `;
        const rewritten = await chatOnce({
            model: RAG.chatModel,
            messages: [
                { role: 'system', content: sys },
                { role: 'user', content: msg },
            ],
            max_tokens: 120,
            temperature: 0.2
        });

        return (rewritten || userQuery).trim();
    } catch (error) {
        console.log('Error in rewriteQuery', error);
        throw error;
    }
}