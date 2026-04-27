const WebSocket = require("ws");
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

let players = {};
let monsters = {};
let coins = [];

function spawnMonster(){
  let id = "m"+Date.now();
  monsters[id] = {
    x: Math.random()*500,
    y: Math.random()*400,
    hp: 50
  };
}
setInterval(spawnMonster,3000);

wss.on("connection",(ws)=>{
  let id = "p"+Date.now();

  players[id] = {
    x:100,
    y:100,
    hp:100,
    gold:0,
    name:"玩家"+id.slice(-3)
  };

  ws.on("message",(msg)=>{
    let data = JSON.parse(msg);

    if(data.type==="move"){
      players[id].x = data.x;
      players[id].y = data.y;
    }

    if(data.type==="attack"){
      // 打玩家
      for(let pid in players){
        if(pid!==id){
          let dx = players[pid].x - players[id].x;
          let dy = players[pid].y - players[id].y;
          if(Math.sqrt(dx*dx+dy*dy)<50){
            players[pid].hp -= 10;
          }
        }
      }

      // 打怪
      for(let mid in monsters){
        let m = monsters[mid];
        let dx = m.x - players[id].x;
        let dy = m.y - players[id].y;
        if(Math.sqrt(dx*dx+dy*dy)<50){
          m.hp -= 20;
          if(m.hp<=0){
            coins.push({x:m.x,y:m.y});
            delete monsters[mid];
          }
        }
      }
    }

    // 捡金币
    for(let i=coins.length-1;i>=0;i--){
      let c = coins[i];
      let dx = c.x - players[id].x;
      let dy = c.y - players[id].y;
      if(Math.sqrt(dx*dx+dy*dy)<20){
        players[id].gold += 1;
        coins.splice(i,1);
      }
    }
  });

  ws.on("close",()=> delete players[id]);
});

// 怪物AI攻击玩家
setInterval(()=>{
  for(let mid in monsters){
    let m = monsters[mid];
    for(let pid in players){
      let p = players[pid];
      let dx = p.x - m.x;
      let dy = p.y - m.y;
      if(Math.sqrt(dx*dx+dy*dy)<40){
        p.hp -= 1;
      }
    }
  }
},100);

setInterval(()=>{
  let data = JSON.stringify({players,monsters,coins});
  wss.clients.forEach(c=>c.send(data));
},50);

console.log("server running");
