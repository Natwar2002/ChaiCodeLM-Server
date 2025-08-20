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

app.get('/ping', (req, res) => {
    res.status(200).json({
        message: 'Pong'
    })
});

app.post('/indexData', upload.single("file"), async (req, res) => {
    try {
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

        console.log(file, type);

        if (!file || !type) {
            return res.status(400).json({
                success: false,
                error: "Both file and type are required",
            });
        }

        console.log("Indexing:", file, type);

        const response = await indexData(file, type);

        // cleanup 
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

let dataProcessingStatus;

export function emitData(param) {
    if (dataProcessingStatus) {
        dataProcessingStatus.emit('LoadingDoc', param);
    } else {
        console.log("Socket not initialized");
    }
}

io.on('connection', (socket) => {
    if (socket.id) {
        dataProcessingStatus = socket;
    }
    socket.on('MessageFromClient', async (data) => {
        try {
            const response = await chat(data.content);
            let res;
            if (typeof response === "string") {
                res = JSON.parse(response);
            } else {
                res = response;
            }

            socket.emit("MessageFromServer", {
                content: res?.content || "No response generated.",
                sources: res?.sources || [],
            });
        } catch (error) {
            console.log("Socket Error: ", error);
            socket.emit('MessageFromServer', {
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