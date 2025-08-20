import express from "express";
import { Server } from 'socket.io';
import { createServer } from 'http';
import indexData from './indexing.js';
import chat from "./dataRetrival.js";
import multer from "multer";
import cors from 'cors';
import fs from "fs";
import path from "path";

const upload = multer({ storage: multer.memoryStorage() });
const PORT = 3000;

const app = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

app.use(cors({
    origin: "*"
}));

app.post('/indexData', upload.single("file"), async (req, res) => {
    try {
        console.log('called');

        let { type } = req.body;
        let file;

        if (req.file) {
            // Save buffer to temp file
            const tempDir = path.join(process.cwd(), "tmp_uploads");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            file = path.join(tempDir, req.file.originalname);
            fs.writeFileSync(file, req.file.buffer);
        } else if (req.body.file) {
            // For URLs or raw text
            file = req.body.file;
        }

        if (!file || !type) {
            return res.status(400).json({
                success: false,
                error: "Both file and type are required",
            });
        }

        console.log("Indexing:", file, type);

        const response = await indexData(file, type);

        // cleanup if it was a real uploaded file
        if (req.file) {
            fs.unlinkSync(file);
        }

        console.log(response);

        return res.status(200).json({
            success: true,
            message: 'Successfully indexed the data'
        });
    } catch (error) {
        console.log('Error in indexing the data', error);
        return res.status(500).json({
            success: false,
            error: error.message || "Internal Server Error",
        });
    }
});

io.on('connection', (socket) => {
    console.log(socket.id);
    socket.on('MessageFromClient', async (data) => {
        try {
            console.log(data);
            const response = await chat(data.content);
            const res = JSON.parse(response);

            socket.emit('MessageFromServer', {
                content: res?.response
            });
        } catch (error) {
            console.log("Socket Error: ", error);
            socket.emit('MessageFromServer', {
                expert: data?.expert,
                content: "Something went wrong..."
            });
        }
    })
});

server.listen(PORT, async () => {
    try {
        console.log(`Server is running on http://localhost:${PORT}`);
    } catch (error) {
        console.log(`Error in connection ${error}`);
    }
});