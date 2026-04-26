const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

let players = {};

wss.on("connection",(ws)=>{

  let id = Date.now();

  players[id] = { x:100, y:100 };

  ws.on("message",(msg)=>{
    let data = JSON.parse(msg);
    players[id].x = data.x;
    players[id].y = data.y;
  });

  ws.on("close",()=>{
    delete players[id];
  });

});

setInterval(()=>{
  let data = JSON.stringify(players);
  wss.clients.forEach(c=>c.send(data));
}, 50);

console.log("server running");
