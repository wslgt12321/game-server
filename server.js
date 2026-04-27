const WebSocket = require("ws");
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

let players = {};
let monsters = {};
let skills = []; // 技能对象
let texts = [];  // 飘字

wss.on("connection",(ws)=>{
  let id = "p"+Date.now();

  players[id] = {
    x:100,
    y:100,
    hp:100,
    name:"玩家"+id.slice(-3)
  };

  ws.on("message",(msg)=>{
    let data = JSON.parse(msg);

    if(data.type==="move"){
      players[id].x = data.x;
      players[id].y = data.y;
    }

    // 🔥 释放技能（火球）
    if(data.type==="skill"){
      skills.push({
        x: players[id].x,
        y: players[id].y,
        dx: data.dx,
        dy: data.dy,
        owner: id
      });
    }
  });

  ws.on("close",()=> delete players[id]);
});

// 🔥 技能移动 + 碰撞
setInterval(()=>{
  for(let i=skills.length-1;i>=0;i--){
    let s = skills[i];

    s.x += s.dx * 5;
    s.y += s.dy * 5;

    // 命中玩家
    for(let pid in players){
      if(pid!==s.owner){
        let p = players[pid];
        let dx = p.x - s.x;
        let dy = p.y - s.y;
        if(Math.sqrt(dx*dx+dy*dy)<20){
          p.hp -= 20;

          texts.push({
            x:p.x,
            y:p.y,
            value:"-20",
            life:30
          });

          skills.splice(i,1);
          break;
        }
      }
    }

    // 超出范围删除
    if(s.x<0||s.x>500||s.y<0||s.y>400){
      skills.splice(i,1);
    }
  }
},50);

// 飘字更新
setInterval(()=>{
  for(let t of texts){
    t.y -= 1;
    t.life--;
  }
  texts = texts.filter(t=>t.life>0);
},50);

// 广播
setInterval(()=>{
  let data = JSON.stringify({players,skills,texts});
  wss.clients.forEach(c=>c.send(data));
},50);

console.log("server running");

console.log("server running");
