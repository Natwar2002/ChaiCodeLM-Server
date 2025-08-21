import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RAG } from '../serverConfig.js';

export function makeEmbeddings() {
    return new GoogleGenerativeAIEmbeddings({
        model: RAG.embedModel,
        apiKey: process.env.GOOGLE_API_KEY,
    });
}