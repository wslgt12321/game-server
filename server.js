const WebSocket = require("ws");
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

let players = {};
let skills = [];
let texts = [];
let monsters = {};

// 🧟 初始化怪物
function spawnMonster(){
  let id = "m"+Date.now()+Math.random();
  monsters[id] = {
    x: Math.random()*2000,
    y: Math.random()*2000,
    hp: 50
  };
}
for(let i=0;i<10;i++) spawnMonster();

wss.on("connection",(ws)=>{
  let id = "p"+Date.now();

  players[id] = {
    x:500,
    y:500,
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

// 🧟 怪物AI（追最近玩家）
setInterval(()=>{
  for(let mid in monsters){
    let m = monsters[mid];

    let target=null;
    let minDist=99999;

    for(let pid in players){
      let p = players[pid];
      let dx = p.x - m.x;
      let dy = p.y - m.y;
      let dist = Math.sqrt(dx*dx+dy*dy);

      if(dist < minDist){
        minDist = dist;
        target = p;
      }
    }

    if(target){
      let dx = target.x - m.x;
      let dy = target.y - m.y;
      let len = Math.sqrt(dx*dx+dy*dy);

      if(len>0){
        m.x += dx/len * 1.5;
        m.y += dy/len * 1.5;
      }
    }
  }
},50);

// 技能逻辑
setInterval(()=>{
  for(let i=skills.length-1;i>=0;i--){
    let s = skills[i];
    s.x += s.dx * 6;
    s.y += s.dy * 6;

    // 打怪
    for(let mid in monsters){
      let m = monsters[mid];
      let dx = m.x - s.x;
      let dy = m.y - s.y;

      if(Math.sqrt(dx*dx+dy*dy)<20){
        m.hp -= 20;

        texts.push({
          x:m.x,
          y:m.y,
          value:"-20",
          life:30
        });

        if(m.hp<=0){
          delete monsters[mid];
          spawnMonster();

          // 奖励金币
          players[s.owner].gold += 5;
        }

        skills.splice(i,1);
        break;
      }
    }
  }
},50);

// 飘字
setInterval(()=>{
  texts.forEach(t=>{
    t.y -= 1;
    t.life--;
  });
  texts = texts.filter(t=>t.life>0);
},50);

// 广播
setInterval(()=>{
  let data = JSON.stringify({players,skills,texts,monsters});
  wss.clients.forEach(c=>c.send(data));
},50);

console.log("server running");
