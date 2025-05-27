

class Game {

  constructor() {
    this.sprites = []
    this.frameUpdate = true;
    this.rq = 0
    this.f = 0
    this.hz = 0
    this.keys = new Set();

    const canvas = document.getElementById('canvas');
    this.ctx = canvas.getContext('2d');
    this.ctx.scale(2, 2)
    
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
      console.log("rq: " + this.rq + " f: " + this.f, " " + this.hz + "Hz\nkeys: " + Array.from(this.keys).join(", "))
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

  }

  draw(ctx) {
    console.log("rendering: " + this)
  }

}

game = new Game()
Game.instance = game
Game.instance.animate()
Game.instance.startShowingFps()
Game.instance.startTicking()

sprite = new MomentumObject([8, 15]);
sprite.drawHitbox = true

window.addEventListener('keydown', (e) => Game.instance.keys.add(e.key));
window.addEventListener('keyup', (e) => Game.instance.keys.delete(e.key));

