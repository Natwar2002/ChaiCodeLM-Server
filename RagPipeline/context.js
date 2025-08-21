import { RAG } from '../serverConfig.js';

export function buildContext(chunks) {
    let buf = '';
    const used = [];

    for (const c of chunks) {
        const block = `Source: ${c.source}\nText: ${c.text}\n---\n`;
        if ((buf.length + block.length) > RAG.maxContextChars) break;
        buf += block;
        used.push({ id: c.id, source: c.source, snippet: c.text.slice(0, 200) })
    }
    return { context: buf, used };
}