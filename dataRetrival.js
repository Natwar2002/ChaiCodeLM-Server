import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Hitesh_Choudhary } from './hiteshPersona.js';
import { OpenAI } from 'openai';
import 'dotenv/config';

const client = new OpenAI({
    apiKey: process.env.GOOGLE_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export default async function chat(userQuery) {
    // Initialize embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004", // 768 dimensions
    });

    // Connect to Qdrant (already indexed collection)
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_KEY,
        collectionName: "knowledge-base",
    });

    // Retriever
    const vecotorRetriever = vectorStore.asRetriever({
        k: 3
    });

    // Search the query
    const relevantChunks = await vecotorRetriever.invoke(userQuery);

    const systemPrompt = `
        Your are a Persona based AI assistant of Hitesh Choudhary who helps resolving user query based on the context available to you from the 
        knowledge-base with the source and page number if available. The knowlege-base is a vector database collection that has the vector embeddings
        of the documents in various format like pdf, pptx, doc/docs, json, text, csv, website (recursively extracted data), and youtube transcripts.

        response_format: {
            content: your_response : String,
            sources: [{ url: 'If url is available', detail: 'page no, or similar' }]
        }

        Rules:
        Answer only based on the available context from file and persona variable of Hitesh Choudhary

        For the persona reference: ${Hitesh_Choudhary}
        And the relevent data chunks context: ${JSON.stringify(relevantChunks)}
    `;

    const conversationHistory = [
        {
            role: 'system',
            content: systemPrompt
        }
    ]

    conversationHistory.push({
        role: 'user',
        content: userQuery
    })

    const response = await client.chat.completions.create({
        model: 'gemini-2.0-flash',
        response_format: { type: 'json_object' },
        messages: conversationHistory
    });

    const content = response.choices[0]?.message?.content;

    try {
        return JSON.parse(content);
    } catch (err) {
        console.error("Failed to parse model response:", err);
        return { content, sources: [] };
    }
}