

class Game {

  constructor() {
    this.sprites = []
    this.mousePos = {x: 0, y: 0}
    this.frameUpdate = true;
    this.rq = 0
    this.f = 0
    this.hz = 0
    this.keys = new Set();

    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    this.canvas = canvas
    this.ctx = canvas.getContext('2d');


    
    
  }

  update() {
    this.hz += 1

    for (let sprites of this.sprites) {
      sprites.update()
    }
  }

  queueRender() {
    this.frameUpdate = true
  }

  addSprite(sprite) {
    
    this.sprites.push(sprite)
  }

  animate() {
    this.rq += 1
    this.draw()

    

    requestAnimationFrame(() => {this.animate()})
  }

  draw() {

    if (!this.frameUpdate) return;
    this.f += 1
    this.frameUpdate = false

    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let sprites of this.sprites) {
      sprites.draw(this.ctx)
      if (sprites.drawHitbox) {
        sprites._drawHitbox(this.ctx)
      }
    }
  }

  startShowingFps() {
    setInterval(() => {
      console.log("rq: " + this.rq + " f: " + this.f, " " + this.hz + "Hz\nkeys: " + Array.from(this.keys).join(", ") + " mp: " + this.mousePos.x + " " + this.mousePos.y)
      this.f = 0
      this.rq = 0
      this.hz = 0
    }, 1000)
  }

  startTicking() {
    setInterval(() => {
      this.update()
    }, 20) // 50 tps
  }

  clear() {
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

}




class Sprite {

  constructor(hitbox) {
    this.hitbox = hitbox
    this.showHitbox = false;
    this.position = [0, 0]

    Game.instance.addSprite(this)
    Game.instance.queueRender()
  }

  draw(ctx) {
    
  }

  getX() {
    return this.position[0]
  }

  getY() {
    return this.position[1]
  }

  getSizeX() {
    return this.hitbox[0]
  }

  getSizeY() {
    return this.hitbox[1]
  }

  setX(value) {
    this.position[0] = value
  }

  setY(value) {
    this.position[1] = value
  }

  update() {

  }

  _drawHitbox(ctx) {
    console.log(1)
    ctx.strokeStyle = "#00FF00"
    ctx.lineWidth = 1
    ctx.strokeRect(this.position[0], this.position[1], this.position[0] + this.hitbox[0], this.position[1] + this.hitbox[1])
  }

}

class MomentumObject extends Sprite {

  constructor(hitbox) {
    super(hitbox)

    this.force = [0, 0]
    this.velocity = [0, 0]
    this.acceleration = [0, 0]
    this.mass = 1
  }

  update() {
    super.update()
  }

  draw(ctx) {
    console.log("rendering: " + this)
  }

}

class Room extends Sprite {

  constructor(gridSize) {
    super([gridSize[0] * 32, gridSize[1] * 32])
    this.gridSize = gridSize

    this.floatAnimation = -1 // set to -1 to disable
  }

  update() {
    super.update()

    

    this.floatAnimation ++;

    let animation = (x) => {return Math.floor(Math.sin(  ((2 * Math.PI) / 240) * x) * 5)}
    if (this.floatAnimation == 240) {
      this.floatAnimation = 0
    }

    

    let relativeMouseX = event

    this.setX((Game.instance.canvas.width - this.getSizeX())/2)
    this.setY((Game.instance.canvas.height - this.getSizeY())/2 + animation(this.floatAnimation))

    //console.log(this, this.position)
    Game.instance.queueRender()
  }

  draw(ctx) {
    super.draw()

    let orgPos = this.position

    this.setX(this.getX() + 10*Math.random())
    this.setY(this.getY() + 10*Math.random())

    ctx.strokeStyle = "#999999"
    ctx.lineWidth = 12
    ctx.strokeRect(this.getX(), this.getY(), this.getSizeX(), this.getSizeY())

    let color = false;
    let color2 = false;

    

    

    for(let i = 0; i < this.gridSize[0]; i ++) {

      color = false;
      if (color2) {
        color = true;
      }

      for (let j = 0; j < this.gridSize[1]; j ++) {
        
        let a = this.getX() + i * 32;
        let b = this.getY() + j * 32
        
        color = !color

        if (color) {
          ctx.fillStyle = "#001324";
        } else {
          ctx.fillStyle = "#032645"
        }
        
        ctx.fillRect(a, b, 32, 32)
        
        
      }

      color2 = !color2;
    }

    this.setX(orgPos[0])
    this.setY(orgPos[1])
    
  }

  

}

game = new Game()
Game.instance = game
Game.instance.animate()
Game.instance.startShowingFps()
Game.instance.startTicking()

function capture() {
        document.onmousemove = handleMouseMove;
        function handleMouseMove(event) {
            var eventDoc, doc, body;

            event = event || window.event; // IE-ism

            // If pageX/Y aren't available and clientX/Y are,
            // calculate pageX/Y - logic taken from jQuery.
            // (This is to support old IE)
            if (event.pageX == null && event.clientX != null) {
                eventDoc = (event.target && event.target.ownerDocument) || document;
                doc = eventDoc.documentElement;
                body = eventDoc.body;

                event.pageX = event.clientX +
                  (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                  (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY +
                  (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
                  (doc && doc.clientTop  || body && body.clientTop  || 0 );
            }

            Game.instance.mousePos.x = event.pageX
            Game.instance.mousePos.y = event.pageY
        }
    }

capture()

sprite = new MomentumObject([8, 15]);

room1 = new Room([8, 8]);

window.addEventListener('keydown', (e) => Game.instance.keys.add(e.key));
window.addEventListener('keyup', (e) => Game.instance.keys.delete(e.key));

