const STYLES = {
  tileDark: "#001324",
  tileLight: "#032645"
}


class CubicBezier {
  constructor(x1, y1, x2, y2) {
    this.cx = 3 * x1;
    this.bx = 3 * (x2 - x1) - this.cx;
    this.ax = 1 - this.cx - this.bx;

    this.cy = 3 * y1;
    this.by = 3 * (y2 - y1) - this.cy;
    this.ay = 1 - this.cy - this.by;
  }

  bezierCoord(a, b, c, t) {
    return ((a * t + b) * t + c) * t;
  }

  bezierCoordDerivative(a, b, c, t) {
    return (3 * a * t + 2 * b) * t + c;
  }

  solveT(x, epsilon = 1e-6) {
    let t = x;
    for (let i = 0; i < 10; i++) {
      const xEstimate = this.bezierCoord(this.ax, this.bx, this.cx, t);
      const dx = xEstimate - x;
      if (Math.abs(dx) < epsilon) return t;
      const dEstimate = this.bezierCoordDerivative(this.ax, this.bx, this.cx, t);
      if (Math.abs(dEstimate) < epsilon) break;
      t -= dx / dEstimate;
    }
    return t;
  }

  get(x) {
    const t = this.solveT(x);
    return this.bezierCoord(this.ay, this.by, this.cy, t);
  }
}





class Vec2 {

  flippy() {
    if (!this.changed) return false;
    return true;
  }

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.changed = false
    return new Proxy(this, {
      get(target, prop) {
        if (prop === '0') return target.x;
        if (prop === '1') return target.y;
        return target[prop];
      },
      set(target, prop, value) {

        target.changed = true

        if (prop === '0') {
        
          //if (target.x != value) target.changed = true
          target.x = value;
          return true;
        }
        if (prop === '1') {
          //if (target.y != value) target.changed = true
          target.y = value;
          return true;
        }

        

        target[prop] = value;
        return true;
        
      },
      has(target, prop) {
        return ['0', '1', 'x', 'y'].includes(prop) || prop in target;
      },
      ownKeys(target) {
        return ['0', '1', 'x', 'y', ...Object.getOwnPropertyNames(target)];
      },
      getOwnPropertyDescriptor(target, prop) {
        if (prop === '0' || prop === '1') {
          return {
            enumerable: true,
            configurable: true,
          };
        }
        return Object.getOwnPropertyDescriptor(target, prop);
      }
    });
  }
}



class Game {
  constructor() {
    document.addEventListener('contextmenu', event => event.preventDefault());
    this.sprites = [];
    this.mousePos = new Vec2();
    this.frameUpdate = true;
    this.rq = 0;
    this.f = 0;
    this.hz = 0;
    this.keys = new Set();
    this._things = null
    this._frameFlip = false

    const canvas = document.getElementById("canvas");
    this.canvas = canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.ctx = canvas.getContext("2d");
    this.ctx.globalAlpha = 1
    window.addEventListener("resize", this.resize)
    this.capture();
  }

  capture() {
    document.onmousemove = (event) => {
      var eventDoc, doc, body;

      event = event || window.event; // IE-ism

      if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX =
          event.clientX +
          ((doc && doc.scrollLeft) || (body && body.scrollLeft) || 0) -
          ((doc && doc.clientLeft) || (body && body.clientLeft) || 0);
        event.pageY =
          event.clientY +
          ((doc && doc.scrollTop) || (body && body.scrollTop) || 0) -
          ((doc && doc.clientTop) || (body && body.clientTop) || 0);
      }

      this.mousePos.x = event.pageX;
      this.mousePos.y = event.pageY;
    }
  }

  update() {

    let start = window.performance.now()
    
    this.hz += 1;

    for (let sprites of this.sprites) {
      sprites.update();
      sprites.position.changed = false
    }

    if (this.mousePos.flippy()) {
      this.mousePos.changed = false
      for (let sprites of this.sprites) {
        sprites.mouseMoved(this.mousePos)
        
      }
    }

    let end = window.performance.now()

    this.deltaTime = end- start
  }


  queueRender() {
    this.frameUpdate = true;
  }

  addSprite(sprite) {
    this.sprites.push(sprite);
  }

  animate() {
    this.rq += 1;
    this.draw();

    requestAnimationFrame(() => {this.animate();});
  }

  draw() {

    if (!this.frameUpdate) return;
    this.f += 1;
    this.frameUpdate = false;

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    // CUSOTM RENDERING AFTER THIS

    if (this._frameFlip) {
      this._things += " *"
      
    }

    this._frameFlip = !this._frameFlip

    if (this._things != null) {
      this.ctx.font = "12px Courier"
      this.ctx.fillStyle = "#FFFFFF"
      this.ctx.fillText(this._things, 20, 20)
    }
    

    for (let sprites of this.sprites) {
      sprites.draw(this.ctx);
      if (sprites.drawHitbox) {
        sprites._drawHitbox(this.ctx);
      }
    }
  }

  startShowingFps() {
    setInterval(() => {
      this._things = 
        "rq: " + this.rq + " f: " + this.f +
        " " +
          this.hz +
          "Hz\nkeys: " +
          Array.from(this.keys).join(", ") +
          " mp: " +
          this.mousePos.x +
          " " +
          this.mousePos.y + "\n"
      
      this.f = 0;
      this.rq = 0;
      this.hz = 0;

      Game.instance.queueRender()
    }, 1000);
  }

  startTicking() {
    setInterval(() => {
      this.update();
    }, 20); // 50 tps
  }

  clear() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  onclick() {
    for (let sprite of this.sprites) {
      if (Game.instance.mousePos.x >= sprite.position.x && Game.instance.mousePos.x <= sprite.position.x + sprite.hitbox.x) {
        if (Game.instance.mousePos.y >= sprite.position.y && Game.instance.mousePos.y <= sprite.position.y + sprite.hitbox.y) {
          sprite.onclick()
        }
      }
      
    }
  }

  resize(){
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
}

class Sprite {
  constructor(hitbox) {
    this.hitbox = new Vec2(hitbox[0], hitbox[1]);
    this.position = new Vec2(0, 0);

    this.floatAnimation = 0


    Game.instance.addSprite(this);
    Game.instance.queueRender();
  } 

  draw(ctx) {
    if (this.position.flippy()) Game.instance.queueRender()
  }


  setPostion(x,y){
    if (this.position[0] == x && this.position[1] == y) return;
    this.position[0] = x;
    this.position[1] = y;
    Game.instance.queueRender()
  }

  update() {}

  mouseMoved(pos) {}

  onclick() {}

  _drawHitbox(ctx) {
    //console.log(1);
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.position[0],
      this.position[1],
      this.hitbox[0],
      this.hitbox[1]
    );
  }
}

class Room extends Sprite {
  constructor(gridSize) {
    super([gridSize[0] * 32, gridSize[1] * 32]);
    this.gridSize = gridSize;

    this.characters = []

    this.mouseIn = false

    let propogate = []
    for (let i = 0; i < gridSize[1]; i ++) {
      propogate.push(null)
    }

    for (let i = 0; i < gridSize[0]; i ++) {
      this.characters.push(propogate.slice())
    }


    this.selection = new Vec2(0, 0)
    this.selectionMode = "pickingCharacter"
  }

  addCharacter(character) {
    this.characters[0][0] = character

  }

  update() {
    super.update();

    this.floatAnimation++;

    let animation = (x) => {
      return Math.floor(Math.sin(((2 * Math.PI) / 240) * x) * 5);
    };
    if (this.floatAnimation == 240) {
      this.floatAnimation = 0;
    }

    let relativeMouseX = event;

    let delta = animation(this.floatAnimation)

    

    this.setPostion((Game.instance.canvas.width- this.hitbox[0]) / 2,(Game.instance.canvas.height - this.hitbox[1]) / 2 + delta);

    //this.position.y = this.position.y + delta
    //console.log(this.position.y)
  
    
    if (this.position.changed) {
      this.mouseMoved(Game.instance.mousePos)
    }

    for (let x = 0; x < this.gridSize[0]; x ++) {
      for (let y = 0; y < this.gridSize[1]; y ++) {
        
        let character = this.characters[x][y];
        if (character == null) continue;

        character.position.x = this.position.x + x * 32;
        character.position.y = this.position.y + y * 32;
      }
    }
  }

  draw(ctx) {
    super.draw();

    let orgPos = this.position;

    ctx.fillStyle = "#00FF00"
    ctx.font = "16px Courier"
    ctx.textAlign = "center"
    
    if (this.selectionMode == "pickingCharacter") {
      ctx.fillText("Pick a character to move!", this.position.x + this.hitbox.x / 2, this.position.y - 16)
    } else if (this.selectionMode == "pickedCharacter") {
      ctx.fillStyle = "rgb(255, 238, 0)"  
      ctx.fillText("Moving this dude?", this.position.x + this.hitbox.x / 2, this.position.y - 16)
    }

    if (this.selectionMode == "pickedCharacter") {
      this._slideButtonAnimation += 0.01
      this._slideButtonAnimation = Math.min(1, this._slideButtonAnimation)
      if (this._slideButtonAnimation != 1) Game.instance.queueRender()
      let buttondelta = new CubicBezier(0.42, 0, 0.58, 1).get(this._slideButtonAnimation) * 80
      
      let ifndef = (j, k) => {
        if (Game.instance.mousePos.x >= j) {
          if (Game.instance.mousePos.x <= j + 64) {
            if (Game.instance.mousePos.y >= k) {
              if (Game.instance.mousePos.y <= k + 32) {
                return STYLES.tileLight;
              }
            }
          }
        }
        return "#001324";
      }

      ctx.fillStyle = ifndef(this.position.x + (this.hitbox.x) / 2 - 32 - 50, this.position.y + this.hitbox.y - 50 + buttondelta)
      ctx.strokeStyle = "#999"
      ctx.lineWidth = 2
      ctx.fillRect(this.position.x + (this.hitbox.x) / 2 - 32 - 50, this.position.y + this.hitbox.y - 50 + buttondelta, 64, 32)
      ctx.strokeRect(this.position.x + (this.hitbox.x) / 2 - 32 - 50, this.position.y + this.hitbox.y - 50 + buttondelta, 64, 32)

      ctx.fillStyle = "#00FF00"
      ctx.textBaseline = "middle"
      ctx.fillText("Sure", this.position.x + (this.hitbox.x) / 2 - 50, this.position.y + this.hitbox.y - 50 + 16 + buttondelta)
      ctx.fillStyle = ifndef(this.position.x + (this.hitbox.x) / 2 - 32 + 50, this.position.y + this.hitbox.y - 50 + buttondelta)

      

      ctx.fillRect(this.position.x + (this.hitbox.x) / 2 - 32 + 50, this.position.y + this.hitbox.y - 50 + buttondelta, 64, 32)
      ctx.strokeRect(this.position.x + (this.hitbox.x) / 2 - 32 + 50, this.position.y + this.hitbox.y - 50 + buttondelta, 64, 32)

      ctx.fillStyle = "#FF0000"
      ctx.textBaseline = "middle"
      ctx.fillText("Nah", this.position.x + (this.hitbox.x) / 2 + 50, this.position.y + this.hitbox.y - 50 + 16 + buttondelta)
      //ctx.fillStyle = ifndef()
      ctx.textBaseline = "alphabetic"
    }

    ctx.textAlign = "left"

    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 12;
    ctx.strokeRect(this.position[0], this.position[1], this.hitbox[0], this.hitbox[1]);

    let color = false;
    let color2 = false;

    for (let i = 0; i < this.gridSize[0]; i++) {
      color = false;
      if (color2) {
        color = true;
      }

      for (let j = 0; j < this.gridSize[1]; j++) {
        let a = this.position[0] + i * 32;
        let b = this.position[1] + j * 32;

        color = !color;

        if (color) {
          ctx.fillStyle = "#001324";
        } else {
          ctx.fillStyle = "#032645";
        }

        ctx.fillRect(a, b, 32, 32);
      }

      color2 = !color2;
    }

    this.setPostion(orgPos[0],orgPos[1])

    if (this.selectionMode == "pickedCharacter") {
      ctx.fillStyle = "rgba(255, 251, 0, 0.5)"
    } else {
      ctx.fillStyle = "rgba(0, 255, 0, 0.5)"
    }
    ctx.fillRect(this.selection.x * 32 + this.position.x, this.selection.y * 32 + this.position.y, 32, 32)

    
    if (this.mouseIn) this.mouseMoved(Game.instance.mousePos)
  }



  mouseMoved(pos) {
    //console.log("move")
    
    this.mouseIn = false
    if (pos.x > this.position.x && pos.x < this.position.x + this.hitbox[0]) {
      if (pos.y > this.position.y && pos.y < this.position.y + this.hitbox[1]) {
        this.mouseIn = true
        
      }
      
    }

    Game.instance.queueRender()

    let dx = Game.instance.mousePos.x - this.position.x
    let dy = Game.instance.mousePos.y - this.position.y

    let gridx = Math.floor(dx / 32)
    let gridy = Math.floor(dy / 32)
    
    let mx = this.position.x + 32 * gridx;
    let my = this.position.y + 32 * gridy;

    Game.instance.ctx.fillStyle = "rgba(255,255,255,0.3)"
    Game.instance.ctx.fillRect(mx, my, 32, 32)
    
    
  }

  onclick() {
    this.clickBoard(Game.instance.mousePos.x, Game.instance.mousePos.y)
  }
  
  clickBoard(x, y){

    x = Math.floor((x - this.position.x) / 32)
    y = Math.floor((y - this.position.y) / 32)

    if (this.selectionMode == "pickingCharacter") {
      this.selection.x = x
      this.selection.y = y
      Game.instance.queueRender()

      if (this.characters[x][y] instanceof Player) {
        this.selectionMode = "pickedCharacter"
        
        this._slideButtonAnimation = 0
      }
    }

    

    


    Game.instance.queueRender()
  }
}

class Player extends Sprite {
  constructor(){
    super([32, 32])

  
  } 
  update(){
    super.update();
  }
  draw(ctx){
    super.draw();
    let image = document.createElement("img")
    image.src = "/public/player.png"
    ctx.drawImage(image,this.position[0],this.position[1],32,32)

  }
}
game = new Game();
Game.instance = game; 
game.animate();
game.startShowingFps();
game.startTicking();

room1 = new Room([16, 16]);

dude = new Player();
dude.drawHitbox = false
room1.addCharacter(dude)



window.addEventListener("keydown", (e) => game.keys[e.code] = true);
window.addEventListener("keyup", (e) => delete Game.instance.keys[e.code]);
window.addEventListener("click" , () => Game.instance.onclick())