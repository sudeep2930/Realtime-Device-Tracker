const express = require('express');
const app = express();
const path = require("path");

const http = require('http');

const socketio = require('socket.io');
const server = http.createServer(app);
const io = socketio(server);


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Store all connected users' locations
const connectedUsers = {};

io.on("connection", function(socket) {
    console.log("User connected:", socket.id);

    // Send all existing users' locations to the new connection
    socket.emit("existing-users", Object.keys(connectedUsers).map(id => ({
        id: id,
        latitude: connectedUsers[id].latitude,
        longitude: connectedUsers[id].longitude
    })));

    // Handle location updates from client
    socket.on("send-location", (data) => {
        // Store user's location
        connectedUsers[socket.id] = {
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: Date.now()
        };

        // Broadcast location to all other clients (including sender for consistency)
        io.emit("receive-location", {
            id: socket.id,
            latitude: data.latitude,
            longitude: data.longitude
        });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        // Remove user from storage
        delete connectedUsers[socket.id];
        // Notify all clients that this user disconnected
        io.emit("user-disconnected", socket.id);
    });
});

app.get('/', (req, res) => {
    res.render('index');
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
