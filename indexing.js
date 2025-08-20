import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import "dotenv/config";

/**
 * Unified Indexing Pipeline
 * @param {string} source - Path to file OR URL OR raw text/json data
 * @param {string} type - One of: pdf, csv, txt, json, pptx, docx, doc, website, youtube, text
 */
export default async function indexData(source, type) {
    try {
        let loader;
        let docs;
        console.log('Indexing started...');

        switch (type.toLowerCase()) {
            case "pdf":
                loader = new PDFLoader(source);
                docs = await loader.load();
                break;
            case "csv":
                loader = new CSVLoader(source);
                docs = await loader.load();
                break;
            case "txt":
                loader = new TextLoader(source);
                docs = await loader.load();
                break;
            case "json":
                loader = new JSONLoader(source);
                docs = await loader.load();
                break;
            case "pptx":
                loader = new PPTXLoader(source);
                docs = await loader.load();
                break;
            case "docx":
                loader = new DocxLoader(source);
                docs = await loader.load();
                break;
            case "doc":
                loader = new DocxLoader(source, { type: "doc" });
                docs = await loader.load();
                break;
            case "website":
                loader = new RecursiveUrlLoader(source, {
                    extractor: (html) =>
                        html
                            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                            .replace(/<[^>]+>/g, "") // remove ALL remaining HTML tags
                            .replace(/\s+/g, " ")    // collapse extra spaces
                            .trim(),
                    maxDepth: 1,
                    timeout: 5000,
                });
                docs = await loader.load();
                break;
            case "youtube":
                loader = YoutubeLoader.createFromUrl(source, {
                    language: "en",
                    addVideoInfo: true,
                });
                docs = await loader.load();
                break;
            case "text":
                // For raw text, create a document object
                docs = [{
                    pageContent: source,
                    metadata: { source: "raw_text" }
                }];
                break;
            default:
                throw new Error(`Unsupported source type: ${type}`);
        }

        console.log('Loading complete');

        // 2. Create embeddings
        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-004",
            apiKey: process.env.GOOGLE_API_KEY
        });

        console.log('Embedding complete, Starting to store vectors in the db');

        // 3. Push into ONE single collection
        const vectorStore = await QdrantVectorStore.fromDocuments(
            docs,
            embeddings,
            {
                url: 'https://9fc2947c-4b7f-4343-841f-813773fdc967.europe-west3-0.gcp.cloud.qdrant.io:6333',
                apiKey: process.env.QDRANT_KEY,
                collectionName: "knowledge-base", // single collection for everything
            }
        );

        console.log(`Indexing completed for ${type}`);
        return vectorStore;
    } catch (error) {
        console.log(`Error indexing ${type}:`, error);
        throw error;
    }
}