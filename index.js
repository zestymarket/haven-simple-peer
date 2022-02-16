const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const peers = {};

// idk how express resolves socket.io, but not simple-peer?
app.get('/simple-peer.js', function(req, res) {
  res.sendFile(__dirname + '/node_modules/simple-peer/simplepeer.min.js');
});

app.get('/', function(req, res) {
   res.sendFile(__dirname + '/index.html');
});


//Whenever someone connects this gets executed
io.on('connection', function(socket) {
  console.log('A user connected');

   // weird how we have to do sockets.sockets. Is this because of the ugly import?
  Array.from(io.sockets.sockets).filter(([id]) => id !== socket.id).forEach(([, connection]) => {
    // sending signal to all connected users
    connection.emit('peer', {
      id: socket.id,
      initiator: false,
    })
    
    // sending signal to newly connected user 
    socket.emit('peer', {
      id: connection.id,
      initiator: true,
    })
  });
   
  socket.on('signal', function(data) {
    var connection = io.sockets.sockets.get(data.id);
    if (!connection) return;

    connection.emit('signal', {
      signal: data.signal,
      id: socket.id,
      username: peers[socket.id].username
    })
  });

  // way to pass the username
  socket.once('join', (data) => {
    console.log('joined', data.username);
    peers[socket.id] = {
      id: socket.id,
      username: data.username
    }
  })

  // when a user disconnects
  socket.on('disconnect', function (data) {
    // for now to all connected users. this needs to be fixed
    io.emit('leave', {
      id: socket.id
    })

    delete peers[socket.id]

    console.log('A user disconnected');
  });
});

http.listen(3000, function() {
   console.log('listening on *:3000');
});