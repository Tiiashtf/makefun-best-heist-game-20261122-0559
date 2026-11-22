// input.js — keyboard and mouse, with latched presses.
// One job: remember what is held and what was just pressed. A quick tap must
// not be lost when the browser runs the game slowly (SwiftShader renders at a
// few frames a second, and a press that lands between frames still counts).

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // latched: consumed once by the game
    this.mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (!e.repeat) this.pressed.add(e.key.toLowerCase());
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.clickX = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.clickY = (e.clientY - r.top) * (canvas.height / r.height);
      this.mouse.clicked = true;
    });
    // Losing focus must not leave a key stuck down.
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  held(...names) {
    return names.some((n) => this.keys.has(n));
  }

  // True once per physical press, then cleared.
  consume(...names) {
    for (const n of names) {
      if (this.pressed.has(n)) {
        this.pressed.delete(n);
        return true;
      }
    }
    return false;
  }

  consumeClick() {
    if (!this.mouse.clicked) return null;
    this.mouse.clicked = false;
    return { x: this.mouse.clickX, y: this.mouse.clickY };
  }

  moveVector() {
    let x = 0, y = 0;
    if (this.held('a', 'arrowleft')) x -= 1;
    if (this.held('d', 'arrowright')) x += 1;
    if (this.held('w', 'arrowup')) y -= 1;
    if (this.held('s', 'arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv; y *= inv;
    }
    return { x, y };
  }

  endFrame() {
    // A press that no screen consumed this frame stays latched for the next
    // one; only the game's own screens clear them. Nothing to do here.
  }
}
