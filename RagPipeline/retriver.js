import { QdrantVectorStore } from '@langchain/qdrant';
import { RAG } from '../serverConfig.js';

export function keywordOverlapScore(query, text) {
    const qs = new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
    const ts = new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
    let overlap = 0;
    for (const w of qs) {
        if (ts.has(w)) overlap++;
    }
    return overlap / Math.max(qs.size, 1);
}

export async function connectVectorStore(embeddings) {
    return QdrantVectorStore.fromExistingCollection(embeddings, {
        url: RAG.qdrantUrl,
        apiKey: RAG.qdrantKey,
        collectionName: RAG.collectionName
    });
}

export async function hybridRetrieve(vectorStore, embeddings, queries, topK) {
    const all = [];
    for (const q of queries) {
        // Embed query
        const vec = await embeddings.embedQuery(q);
        const matches = await vectorStore.similaritySearchVectorWithScore(vec, topK, {});

        for (const [doc, score] of matches) {
            const id = (doc.metaData?.id ?? doc.id ?? doc.pageContent.slice(0, 24)) + '';
            const text = doc.pageContent || '';
            const source = doc.metaData?.source || doc.metaData?.url || 'unknown';

            const kw = keywordOverlapScore(q, text);
            const combinedScore = score + (RAG.keywordWeight * kw);

            all.push({ id, text, source, score, combinedScore, _q: q });
        }
    }

    const best = new Map();
    for (const r of all) {
        const prev = best.get(r.id);
        if (!prev || r.combinedScore > prev.combinedScore0) {
            best.set(r.id, r);
        }
    }

    return Array.from(best.values()).sort((a, b) => b.combinedScore - a.combinedScore).slice(0, topK);
}