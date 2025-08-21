import 'dotenv/config';

export const RAG = {
    collectionName: 'knowledge-base',
    qdrantUrl: process.env.QDRANT_URL,
    qdrantKey: process.env.QDRANT_KEY,

    // Models
    embedModel: 'text-embedding-004',
    chatModel: 'gemini-2.0-flash',
    evalModel: 'gemini-2.0-flash',

    // Retrieval knobs
    topK: 8,          // raw retrieval
    rerankK: 5,       // after CRAG evaluator
    maxContextChars: 9000,

    // Pipeline toggles
    useQueryRewrite: true,
    useHyDE: true,
    useSubQueries: true,
    useCRAG: true,

    // Keyword overlap weight (hybrid-ish)
    keywordWeight: 0.4,

    // Cache
    cacheSize: 300,
    cacheTTLms: 5 * 60 * 1000, // 5 min
}