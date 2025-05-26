const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');


    // Rectangle properties
    const rect = {
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      speed: 10
    };

    // Draw function
    function draw() {
      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw rectangle
      ctx.fillStyle = 'white';
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }

    // Handle keyboard input
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
          rect.y -= rect.speed;
          break;
        case 'ArrowDown':
          rect.y += rect.speed;
          break;
        case 'ArrowLeft':
          rect.x -= rect.speed;
          break;
        case 'ArrowRight':
          rect.x += rect.speed;
          break;
      }
      draw(); // Redraw after moving
    });

    // Initial draw
    draw();