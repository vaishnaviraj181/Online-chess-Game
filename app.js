const express = require("express");
const { Server } = require("socket.io"); // Updated syntax
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server); // Modern way to use socket.io
const chess = new Chess();

let players = { white: null, black: null };

app.use(express.static("public"));
app.set("view engine", "ejs");

// Route
app.get("/", (req, res) => {
    res.render("index", { title: "Vaishnavi's Chess Game" });
});

// Socket.io logic
io.on("connection", (uniquesocket) => {
    console.log("Player connected:", uniquesocket.id);

    // Assign player roles
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    // Send initial board state to the newly connected user
    uniquesocket.emit("boardState", chess.fen());

    // Handle moves
    uniquesocket.on("move", (move) => {
        if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
        if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

        const result = chess.move(move);
        if (result) {
            io.emit("move", move);
            io.emit("boardState", chess.fen());
        } else {
            uniquesocket.emit("invalidMove", move);
        }
    });

    // Handle disconnect
    uniquesocket.on("disconnect", () => {
        console.log("Player disconnected:", uniquesocket.id);
        if (uniquesocket.id === players.white) players.white = null;
        if (uniquesocket.id === players.black) players.black = null;

        // Optional: Reset game if both players left
        if (!players.white && !players.black) {
            chess.reset();
            io.emit("boardState", chess.fen());
        }
    });
});

// Fixed port log message
server.listen(2002, () => {
    console.log("Server running on http://localhost:4600");
});
