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
          target.x = value;
          return true;
        }
        if (prop === '1') {
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
          this.mousePos.y
      
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
  resize(){
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
}

class Sprite {
  constructor(hitbox) {
    this.hitbox = hitbox;
    this.position = new Vec2(0, 0);

    this.floatAnimation = 0

    Game.instance.addSprite(this);
    Game.instance.queueRender();
  } 

  draw(ctx) {
    if (this.position.flippy()) Game.instance.queueRender()
  }


  setPostion(x,y){
    if (this.position[1] == x && this.position[0] == y) return;
    this.position[0] = x;
    this.position[1] = y;
    Game.instance.queueRender()
  }

  update() {}

  mouseMoved(pos) {}

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
  }

  addCharacter(character) {
    this.characters.push(character)

  }

  update() {
    super.update();

    // this.floatAnimation++;

    // let animation = (x) => {
    //   return Math.floor(Math.sin(((2 * Math.PI) / 240) * x) * 5);
    // };
    // if (this.floatAnimation == 240) {
    //   this.floatAnimation = 0;
    // }

    // let relativeMouseX = event;

    // let delta = animation(this.floatAnimation)

    this.setPostion((Game.instance.canvas.width- this.hitbox[0]) / 2,(Game.instance.canvas.height - this.hitbox[1]) / 2);
  
    
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
    
    if (this.mouseIn) this.mouseMoved(Game.instance.mousePos)
  }

  mouseMoved(pos) {
    //console.log("move")
    
    this.mouseIn = false
    if (pos.x > this.position.x && pos.x < this.position.x + this.hitbox[0]) {
      if (pos.y > this.position.y && pos.y < this.position.y + this.hitbox[1]) {
        this.mouseIn = true
        window.addEventListener("click" , () => this.clickBoard(mx,my))
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
  
  clickBoard(x, y){
    this.characters.forEach(entity => {
      if(entity instanceof Player){
        entity.position[0] = x
        entity.position[1] = y
      }
    });
    Game.instance.queueRender()
  }
}

class Player extends Sprite {
  constructor(){
    super([32, 32])

  
  } 
  update(){
    super.update();
    if(Game.instance.keys["ArrowRight"]){
      this.position[0]++
    }

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
dude.drawHitbox = true
room1.addCharacter(dude)



window.addEventListener("keydown", (e) => game.keys[e.code] = true);
window.addEventListener("keyup", (e) => delete Game.instance.keys[e.code]);