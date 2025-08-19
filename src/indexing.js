import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import "dotenv/config";

/**
 * Unified Indexing Pipeline
 * @param {string} source - Path to file OR URL
 * @param {string} type - One of: pdf, csv, txt, json, pptx, docx, doc, website, youtube
 */
export default async function indexData(source, type) {
    let loader;

    switch (type.toLowerCase()) {
        case "pdf":
            loader = new PDFLoader(source);
            break;
        case "csv":
            loader = new CSVLoader(source);
            break;
        case "txt":
            loader = new TextLoader(source);
            break;
        case "json":
            loader = new JSONLoader(source);
            break;
        case "pptx":
            loader = new PPTXLoader(source);
            break;
        case "docx":
            loader = new DocxLoader(source);
            break;
        case "doc":
            loader = new DocxLoader(source, { type: "doc" });
            break;
        case "website":
            loader = new RecursiveUrlLoader(source, {
                extractor: (html) =>
                    html
                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ""),
                maxDepth: 3,
                timeout: 10000,
            });
            break;
        case "youtube":
            loader = YoutubeLoader.createFromUrl(source, {
                language: "en",
                addVideoInfo: true,
            });
            break;
        default:
            throw new Error(`Unsupported source type: ${type}`);
    }

    // 1. Load docs
    const docs = await loader.load();

    // 2. Attach metadata
    const docsWithMeta = docs.map((doc) => ({
        ...doc,
        metadata: { ...doc.metadata, source, type },
    }));

    // 3. Split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const chunkedDocs = await splitter.splitDocuments(docsWithMeta);

    // 4. Create embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
    });

    // 5. Push into ONE single collection
    const vectorStore = await QdrantVectorStore.fromDocuments(
        chunkedDocs,
        embeddings,
        {
            url: "http://localhost:6333",
            collectionName: "knowledge-base", // single collection for everything
        }
    );

    console.log(`Indexing completed for ${type}`);
}