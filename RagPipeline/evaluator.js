import { RAG } from '../serverConfig.js';
import { chatOnce } from './llm.js';

export async function evaluateChunks(userQuery, chunks, want = RAG.rerankK) {
    if (!RAG.useCRAG) {
        return chunks.slice(0, want);
    }

    const instruction = `You are a strict evaluator. Keep only chunks that directly help answer the query. Rank from most to least useful.
        Output JSON array: [{"id": "...","keep": true/false,"rank": 1..N,"reason": "..."}]. Keep at most ${want}.`;

    const preview = chunks.map((c, i) => `#${i + 1}[id: ${c?.id} ${c.text.slice(0, 500)}]`).join('\n---\n');

    const raw = await chatOnce({
        model: RAG.evalModel,
        messages: [
            { role: 'system', content: instruction },
            { role: 'user', content: `Query:\n${userQuery}\n\nChunks:\n${preview}\n\nReturn JSON:` }
        ],
        max_tokens: 600,
        temperature: 0.1,
    });

    try {
        const decisions = JSON.parse(raw);
        const keepIds = decisions.filter(d => d.keep).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999)).map(d => d.id);
        const filtered = chunks.filter(c => keepIds.includes(c.id));
        if (filtered.length === 0) {
            return chunks.slice(0, want);
        }
        return filtered.slice(0, want);
    } catch (error) {
        return chunks.slice(0, want);
    }
}