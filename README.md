# 📒 ChaiCode-LM Backend

This is the backend for **Notebook-LM like app**, built with **Node.js + Express + LangChain.js**, designed to handle **data ingestion, embedding storage, and retrieval**.  
It provides APIs to **index data** from multiple sources, chunk them, store embeddings in **Qdrant Vector Database**, and retrieve relevant knowledge using embeddings search.  
It also includes a **real-time communication pipeline** via **Socket.IO**.

---

## ✨ Features

- 📂 **Multi-format Data Indexing**
  - Index and embed data from:
    - PDF, DOC/DOCX, PPTX, JSON, Text files
    - Website URLs (recursive crawling supported)
    - YouTube video transcripts
  - Automatic **chunking** for better retrieval.
  
- 🧠 **Vector Storage with Qdrant**
  - Stores embeddings in **Qdrant DB**.
  - Supports efficient similarity search.

- 🔍 **Knowledge Retrieval**
  - Retrieves **top 3 most relevant data chunks** for a given query.
  - Uses embeddings search to provide context-aware answers.

- ⚡ **Real-time Communication**
  - Integrated **Socket.IO** for two-way communication.
  - Enables live query-answer interaction.

---

## 🛠️ Tech Stack

- **Backend Framework:** Node.js + Express
- **AI/Embeddings:** LangChain.js + Google Generative AI Embeddings
- **Database:** Qdrant (Vector Store)
- **Communication:** Socket.IO
- **Other:** dotenv, file parsers for multiple formats

---

## 📦 Setup Guide

```bash
git clone https://github.com/Natwar2002/ChaiCodeLM-Server.git
cd ChaiCodeLM-Server
npm install