const canvas = document.querySelector('#canvas1');
const ctx = canvas.getContext('2d');

canvas.width = 900;
canvas.height = 600;

////////////GLOBAL VARIABLES
const cellSize = 100;
const cellGap = 3;
const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resources = [];
const winningScore = 10;
let enemiesInterval = 600;
let numberOfResources = 300;
let frame = 0;
let gameOver = false;
let score = 0;
let choosenDefender = 1;
//mouse
const mouse = {
  x: 5,
  y: 5,
  width: 0.1,
  height: 0.1,
  clicked: false,
};
canvas.addEventListener('mousedown', () => {
  mouse.clicked = true;
});
canvas.addEventListener('mouseup', () => {
  mouse.clicked = false;
});

let canvasPosition = canvas.getBoundingClientRect();

canvas.addEventListener('mousemove', (e) => {
  mouse.x = e.x - canvasPosition.left;
  mouse.y = e.y - canvasPosition.top;
});
canvas.addEventListener('mouseleave', () => {
  mouse.x = undefined;
  mouse.y = undefined;
});
////////////GAME BOARD
const controlsBar = {
  width: canvas.width,
  height: cellSize,
};

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
  }

  draw() {
    if (mouse.x && mouse.y && collision(this, mouse)) {
      ctx.strokeStyle = 'black';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
}

function createGrid() {
  for (let y = cellSize; y < canvas.height; y += cellSize) {
    for (let x = 0; x < canvas.width; x += cellSize) {
      gameGrid.push(new Cell(x, y));
    }
  }
}
//we need to call it here in order to push the grids into the arr
createGrid();

function handleGameGrid() {
  gameGrid.forEach((grid) => {
    grid.draw();
  });
}
////////////PROJECTILES
class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 10;
    this.power = 20;
    this.speed = 5;
  }

  update() {
    this.x += this.speed;
  }

  draw() {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    ctx.fill();
  }
}

function handleProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    projectiles[i].update();
    projectiles[i].draw();

    for (let j = 0; j < enemies.length; j++) {
      if (
        enemies[j] &&
        projectiles[i] &&
        collision(projectiles[i], enemies[j])
      ) {
        enemies[j].health -= projectiles[i].power;
        projectiles.splice(i, 1);
        i--;
      }
    }
    if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
      projectiles.splice(i, 1);
      i--;
    }
  }
}

////////////DEFENDERS
const defender1 = new Image();
defender1.src = 'heroboy.png';
const defender2 = new Image();
defender2.src = 'herogirl.png';

class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.shoot = false;
    this.shootNow = false;
    this.health = 100;
    this.projectiles = [];
    this.timer = 0;
    this.frameX = 0;
    this.frameY = 0;
    this.spriteWidth = 194;
    this.spriteHeight = 194;
    this.minFrame = 0;
    this.maxFrame = 16;
    this.choosenDefender = choosenDefender;
  }
  draw() {
    // ctx.fillStyle = 'blue';
    // ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '30px VT323';
    ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 25);
    if (this.choosenDefender === 1) {
      ctx.drawImage(
        defender1,
        this.frameX * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    } else if (this.choosenDefender === 2) {
      ctx.drawImage(
        defender2,
        this.frameX * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  update() {
    if (frame % 8 === 0) {
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }

      if (this.frameX === 15) {
        this.shootNow = true;
      }

      if (choosenDefender === 1) {
        if (this.shootNow) {
          this.minFrame = 0;
          this.maxFrame = 16;
        } else {
          this.minFrame = 17;
          this.maxFrame = 24;
        }
      } else if (choosenDefender === 2) {
        if (this.shootNow) {
          this.minFrame = 14;
          this.maxFrame = 29;
        } else {
          this.minFrame = 0;
          this.maxFrame = 12;
        }
      }
    }

    if (this.shoot && this.shootNow) {
      projectiles.push(new Projectile(this.x + 50, this.y + 50));
      this.shootNow = false;
    }
  }
}

function handleDefenders() {
  defenders.forEach((defender, i) => {
    defender.draw();
    defender.update();

    if (enemyPositions.indexOf(defender.y) !== -1) {
      defender.shoot = true;
    } else {
      defender.shoot = false;
    }
    enemies.forEach((enemy) => {
      if (collision(defender, enemy)) {
        enemy.movement = 0;
        defender.health -= 0.2;
        if (defender.health <= 0) {
          defenders.splice(i, 1);
          i--;
          enemy.movement = enemy.speed;
        }
      }
    });
  });
}

const card1 = {
  x: 10,
  y: 10,
  width: 70,
  height: 89,
};
const card2 = {
  x: 90,
  y: 10,
  width: 70,
  height: 89,
};

function chooseDefender() {
  let card1Stoke = 'black';
  let card2Stoke = 'black';

  if (collision(mouse, card1) && mouse.clicked) {
    choosenDefender = 1;
  } else if (collision(mouse, card2) && mouse.clicked) {
    choosenDefender = 2;
  }

  if (choosenDefender === 1) {
    card1Stoke = 'gold';
    card2Stoke = 'black';
  } else if (choosenDefender === 2) {
    card1Stoke = 'black';
    card2Stoke = 'gold';
  } else {
    card1Stoke = 'black';
    card2Stoke = 'black';
  }

  ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(card1.x, card1.y, card1.width, card1.height);
  ctx.strokeStyle = card1Stoke;
  ctx.strokeRect(card1.x, card1.y, card1.width, card1.height);
  ctx.drawImage(defender1, 0, 0, 240, 240, 0, 5, 194 / 1.5, 194 / 1.5);

  ctx.fillRect(card2.x, card2.y, card2.width, card2.height);
  ctx.strokeStyle = card2Stoke;
  ctx.drawImage(defender2, 0, 0, 240, 240, 80, 5, 194 / 1.5, 194 / 1.5);
  ctx.strokeRect(card2.x, card2.y, card2.width, card2.height);
}

////////////FLOATING MESSAGES
const floatingMessages = [];

class FloatingMessage {
  constructor(value, x, y, size, color) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.size = size;
    this.lifeSpan = 0;
    this.color = color;
    this.opacity = 1;
  }

  update() {
    this.y -= 0.3;
    this.lifeSpan++;
    if (this.opacity > 0.01) this.opacity -= 0.01;
  }

  draw() {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.font = `${this.size}px VT323 `;
    ctx.fillText(this.value, this.x, this.y);
    ctx.globalAlpha = 1;
    console.log(floatingMessages.lifeSpan);
  }
}

function handleFloatingMsg() {
  floatingMessages.forEach((msg, i) => {
    msg.update();
    msg.draw();

    if (msg.lifeSpan >= 50) {
      floatingMessages.splice(i, 1);
      i--;
    }
  });
}
////////////ENEMIES
const enemyTypes = [];
const enemy1 = new Image();
enemy1.src = 'spritesheet1.png';
enemyTypes.push(enemy1);

const enemy2 = new Image();
enemy2.src = 'spritesheet2.png';
enemyTypes.push(enemy2);

class Enemy {
  constructor(verticalPosition) {
    this.x = canvas.width;
    this.y = verticalPosition;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.speed = Math.random() * 0.2 + 0.4;
    this.movement = this.speed;
    this.health = 100;
    this.maxHealth = this.health;
    this.enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    this.maxFrame = 4;
    this.spriteWidth = 256;
    this.spriteHeight = 256;
  }

  update() {
    //makes them walk to the left
    this.x -= this.movement;

    if (frame % 10 === 0) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = 0;
    }
  }

  draw() {
    // ctx.fillStyle = 'red';
    // ctx.fillRect(this.x, this.y, this.width, this.width);
    ctx.fillStyle = 'black';
    ctx.font = '30px VT323';
    ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 25);
    ctx.drawImage(
      this.enemyType,
      this.frameX * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

function handleEnemies() {
  enemies.forEach((enemy, i) => {
    enemy.update();
    enemy.draw();
    if (enemy.x < 0) gameOver = true;
    if (enemy.health <= 0) {
      let gainedResources = enemy.maxHealth / 10;
      floatingMessages.push(
        new FloatingMessage('+' + gainedResources, 280, 70, 35, 'gold')
      );
      floatingMessages.push(
        new FloatingMessage(
          '+' + gainedResources,
          enemy.x,
          enemy.y,
          35,
          'black'
        )
      );
      numberOfResources += gainedResources;
      score = +gainedResources;
      const findIndexOf = enemyPositions.indexOf(enemy.y);
      enemyPositions.splice(findIndexOf, 1);
      enemies.splice(i, 1);
      i--;
      console.log(enemyPositions);
    }
  });

  if (frame % enemiesInterval === 0 && score < winningScore) {
    //randomy sets y of enemy to btw 100-500, which corresponds with rows
    let verticalPosition =
      Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
    enemies.push(new Enemy(verticalPosition));
    enemyPositions.push(verticalPosition);

    if (enemiesInterval > 120) enemiesInterval -= 40;
  }
}
////////////RESOURCES
const amounts = [20, 30, 40];
class Resource {
  constructor() {
    this.x = Math.random() * (canvas.width - cellSize);
    this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
    this.width = cellSize * 0.6;
    this.height = cellSize * 0.6;
    this.amount = amounts[Math.floor(Math.random() * amounts.length)];
  }

  draw() {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = 'black';
    ctx.font = '20px VT323';
    ctx.fillText(this.amount, this.x + 15, this.y + 25);
  }
}

function handleResources() {
  if (frame % 500 === 0 && score < winningScore) {
    resources.push(new Resource());
  }

  resources.forEach((resource, i) => {
    resource.draw();
    if ((resource && mouse.x, mouse.y && collision(resource, mouse))) {
      numberOfResources += resource.amount;
      floatingMessages.push(
        new FloatingMessage(
          '+' + resource.amount,
          resource.x,
          resource.y,
          35,
          'black'
        )
      );
      floatingMessages.push(
        new FloatingMessage('+' + resource.amount, 320, 70, 35, 'gold')
      );
      resources.splice(i, 1);
      i--;
    }
  });
}
////////////UTILITIES
function handleGameStatus() {
  ctx.fillStyle = 'gold';
  ctx.font = '30px VT323';
  ctx.fillText(`Resources: ${numberOfResources}`, 180, 40);
  ctx.fillText(`Score: ${score}`, 180, 80);

  if (gameOver == true) {
    ctx.fillStyle = 'black';
    ctx.font = '100px VT323';
    ctx.fillText('GAME OVER', canvas.width / 3.5, 250);
  }

  if (score >= winningScore && enemies.length === 0) {
    console.log('YOU WON');
    ctx.fillStyle = 'black';
    ctx.font = '80px VT323';
    ctx.fillText('LEVEL COMPLETE', 230, 300);
    ctx.font = '50px VT323';
    ctx.fillText(`YOU WIN! SCORE: ${score}`, 234, 340);
  }
}
canvas.addEventListener('click', () => {
  const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
  const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;

  if (gridPositionY < cellSize) return;

  for (let i = 0; i < defenders.length; i++) {
    //makes sure that defenders don't get placed ontop of each other
    if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
      return;
  }

  let defenderCost = 100;

  if (numberOfResources >= defenderCost) {
    defenders.push(new Defender(gridPositionX, gridPositionY));
    numberOfResources -= defenderCost;
  } else {
    floatingMessages.push(
      new FloatingMessage(
        'Insufficient resources',
        mouse.x,
        mouse.y,
        30,
        'grey'
      )
    );
  }
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
  handleProjectiles();
  handleGameGrid();
  handleDefenders();
  handleEnemies();
  chooseDefender();
  handleResources();
  handleFloatingMsg();
  frame++;
  handleGameStatus();
  if (!gameOver) {
    requestAnimationFrame(animate);
  }
}
animate();

//collision between 2 rectangles
function collision(first, second) {
  //if any of these 4 statements are true it means there is no collision because rectangles are not overlapping. However, if all 4 statements return false, it means there is collision and ! will turn that false into true, meaning: true collision
  if (
    !(
      first.x > second.x + second.width ||
      first.x + first.width < second.x ||
      first.y > second.y + second.height ||
      first.y + first.height < second.y
    )
  ) {
    return true;
  }
}

window.addEventListener('resize', () => {
  canvasPosition = canvas.getBoundingClientRect();
});
