// 1. Canvas 세팅
let canvas;
let ctx;

canvas = document.createElement("canvas");
ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 700;
document.body.appendChild(canvas);

// 2. image 가져오기
let backgroundImage, mainImage, bulletImage, enemyImage, gameOverImage;

let gameOver = false; // false는 게임진행중, true는 게임이 끝남 (우주선이 바닥에 닿으면 끝)
let score = 0;

//주인공 좌표
let spaceshipX = canvas.width / 2 - 32;
let spaceshipY = canvas.height - 64;

let bulletList = [];
function Bullet() {
  this.x = 0;
  this.y = 0;
  this.init = function () {
    this.x = spaceshipX + 20;
    this.y = spaceshipY;
    this.alive = true; // 적군과 닿이면 false

    bulletList.push(this);
  };

  this.update = function () {
    this.y -= 7;
  };

  //총알이 적군과 닿으면 처리할 내용
  this.checkHit = function () {
    for (let i = 0; i < enemyList.length; i++) {
      if (
        this.y <= enemyList[i].y &&
        this.x >= enemyList[i].x &&
        this.x <= enemyList[i].x + 40
      ) {
        //점수추가
        score++;
        // 적군과 닿으면 false로 바꿔줌
        this.alive = false;
        // 우주선 없애기
        enemyList.splice(i, 1);
      }
    }
  };
}

function generateRandomValue(min, max) {
  let randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNum;
}

let enemyList = [];
function Enemy() {
  this.x = 0;
  this.y = 0;
  this.init = function () {
    this.x = generateRandomValue(0, canvas.width - 48); //랜덤으로 시작
    this.y = 0; //최상단에서 시작

    enemyList.push(this);
  };
  //적군의 y좌표 변경
  this.update = function () {
    this.y += 3;

    if (this.y >= canvas.height - 40) {
      gameOver = true;
      //console.log("Game Over");
    }
  };
}

function loadImage() {
  backgroundImage = new Image();
  backgroundImage.src = "images/background.jpg";

  mainImage = new Image();
  mainImage.src = "images/main.png";

  bulletImage = new Image();
  bulletImage.src = "images/bullet.png";

  enemyImage = new Image();
  enemyImage.src = "images/enemy.png";

  gameOverImage = new Image();
  gameOverImage.src = "images/gameover.jpg";
}

//방향키 누르면
let keysDown = {};
function setupKeyboardListener() {
  document.addEventListener("keydown", function (event) {
    //console.log("무슨 키가 눌렸어?", event.keyCode);

    keysDown[event.keyCode] = true;
    //console.log("KeysDown =", keysDown);
  });

  document.addEventListener("keyup", function (event) {
    delete keysDown[event.keyCode];
    //console.log("버튼 클릭 후 = ", keysDown);

    if (event.keyCode == 32) {
      //32 : spacebar
      createBullet(); //총알 생성
    }
  });
}

function createBullet() {
  //console.log("총알 생성");
  let b = new Bullet(); // 총알 1개 생성
  b.init();
  console.log("총알 리스트 : ", bulletList);
}

function createEnemy() {
  const interval = setInterval(function () {
    let e = new Enemy();
    e.init();
  }, 1000);
}

// 우주선의 xy좌표가 바뀌고
function update() {
  if (39 in keysDown) {
    spaceshipX += 5;
  } // right

  if (37 in keysDown) {
    spaceshipX -= 5;
  } //left

  if (spaceshipX <= 0) {
    spaceshipX = 0;
  }
  if (spaceshipX >= canvas.width - 64) {
    spaceshipX = canvas.width - 64;
  }

  // 총알의 y좌표 업데이트 하는 함수
  for (let i = 0; i < bulletList.length; i++) {
    if (bulletList[i].alive) {
      bulletList[i].update();
      bulletList[i].checkHit();
    }
  }

  // 적군의 y좌표 업데이트 하는 함수
  for (let i = 0; i < enemyList.length; i++) {
    enemyList[i].update();
  }
}

function render() {
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(mainImage, spaceshipX, spaceshipY, 64, 64);
  ctx.fillText(`Score:${score}`, 20, 20);
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";

  //bulletLIst[i].alive가 true일때만 총알이미지 보여주기
  for (let i = 0; i < bulletList.length; i++) {
    if (bulletList[i].alive) {
      ctx.drawImage(bulletImage, bulletList[i].x, bulletList[i].y, 25, 25);
    }
  }
  for (let i = 0; i < enemyList.length; i++) {
    ctx.drawImage(enemyImage, enemyList[i].x, enemyList[i].y, 40, 40);
  }
}

function main() {
  if (!gameOver) {
    update(); // 좌표값 업데이트
    render(); //그려주기
    requestAnimationFrame(main);
    //console.log("anmiation calls");
  } else {
    ctx.drawImage(gameOverImage, 10, 100, 380, 380);
  }
}

loadImage();
setupKeyboardListener();
createEnemy();
main();
