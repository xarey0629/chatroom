import express from 'express';
import http from 'http';
import wsConnect from './wsConnect';
import mongo from './mongo';
import WebSocket from 'ws';
import mongoose from 'mongoose';


mongo.connect();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({server}); // WebSocket Server
const db = mongoose.connection; // database 的變數名稱

db.once('open', () => {
  //
  console.log("MongoDB connected!");
  // Define ws format for client side 
  wss.on('connection', (ws) => {
    ws.box = '';
    ws.onmessage = wsConnect.onMessage(wss, ws);
    // ws.onmessage = (data) => {console.log(data)};
    // ws.onopen = () => {console.log("WebSocket is connected.")};
    // ws.onclose = () => {console.log("WebSocket close connection.")};
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
});