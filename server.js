const WebSocket = require("ws");
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

let players = {};

wss.on("connection",(ws)=>{

  let id = Date.now();

  players[id] = {
    x:100,
    y:100,
    hp:100,
    name:"玩家"+id.toString().slice(-3)
  };

  ws.on("message",(msg)=>{
    let data = JSON.parse(msg);

    if(data.type==="move"){
      players[id].x = data.x;
      players[id].y = data.y;
    }

    if(data.type==="attack"){
      for(let pid in players){
        if(pid != id){
          let dx = players[pid].x - players[id].x;
          let dy = players[pid].y - players[id].y;
          let dist = Math.sqrt(dx*dx + dy*dy);

          if(dist < 50){
            players[pid].hp -= 10;
          }
        }
      }
    }
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
