import express from "express";
import { Server } from 'socket.io';
import { createServer } from 'http';
import { error } from "console";

const PORT = 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

app.post('/indexData', (req, res) => {
    try {
        const { filePath, fileType } = req.body;
        if (!filePath || !fileType) {
            return res.status(400).json({
                success: false,
                error: "Both filePath and fileType are required",
            });
        }
        const response = indexData(filePath, fileType);
        console.log(response);
        return res.status(200).json({
            success: true,
            message: 'Successfully indexed the data'
        });
    } catch (error) {
        console.log('Error in indexing the data', error);
        if (error.message || error.status) {
            return res.status(error.status || 500).json({
                success: false,
                error: error.message || 'Internal Server Error',
            });
        }
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
});

io.on('connection', (socket) => {
    console.log(socket.id);
    socket.on('MessageFromClient', async (data) => {
        try {
            console.log(data);
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
        console.log(`Server is runing on http://localhost:${PORT}`);
    } catch (error) {
        console.log(`Error in connection ${error}`);
    }
});