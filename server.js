const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// const webSocketsServerPort = 8000;
// const webSocketServer = require('websocket').server;
// const http = require('http');

// const server = http.createServer();
// server.listen(webSocketsServerPort);
//console.log('Listening on port 8000');

app.use(cors({origin: ['https://www.fdytte.com', 'http://localhost:5000']}));
app.use(express.json());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {
    useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true
});

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB database connection established successfully');
})

const evaluatorRouter = require('./routes/evaluator');

const objectRouter = require('./routes/fdObject');

const commentRouter = require('./routes/comment');

const postRouter = require('./routes/post');
const segredinhoRouter = require('./routes/segredinho');
const queimaRouter = require('./routes/queima');
const belleRouter = require('./routes/belle');

const notificationRouter = require('./routes/notification');

const test = require('./test');

app.use('', test);

app.use('', evaluatorRouter);

app.use('', objectRouter);

app.use('', commentRouter);

app.use('', postRouter);
app.use('', segredinhoRouter);
app.use('', queimaRouter);
app.use('', belleRouter);

app.use('', notificationRouter);

// app.use(express.urlencoded({ extended: true }));
// app.use(
//   "/files",
//   express.static(path.resolve(__dirname, "tmp", "uploads"))
// );

// const wsServer = new webSocketServer({
//     httpServer: server,
// })

// const requestFunction = require('./webSocketServer/webSocketServer');

// wsServer.on('request', requestFunction);

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});


