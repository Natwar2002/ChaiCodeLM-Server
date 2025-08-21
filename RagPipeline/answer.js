import { RAG } from '../serverConfig.js';
import { chatOnce } from './llm.js';

export async function generateAnswer(userQuery, context) {
    const sys = `Answer using ONLY the provided context below. 
        If the context is insufficient, say: "I don't have enough information in the provided documents." 
        Cite sources by filename/URL when relevant.`;

    const content = await chatOnce({
        model: RAG.chatModel,
        messages: [
            { role: 'system', content: sys },
            { role: 'user', content: `Question:\n${userQuery}\n\nContext:\n${context}\n\nAnswer:` }
        ],
        max_tokens: 700,
        temperature: 0.3,
    });

    return content.trim();
}