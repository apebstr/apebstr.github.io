/**
 * 우주선 게임
 * 
 * 게임 설명:
 * - 좌우 방향키로 우주선을 조종
 * - 스페이스바로 총알 발사
 * - 적 우주선을 피하고 총알로 제거
 * - 적이 바닥에 닿으면 게임 오버
 */

// 모바일 기기 감지
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 게임 상수 정의
let GAME_WIDTH = isMobile ? window.innerWidth : (window.innerWidth > 500 ? 400 : window.innerWidth - 40);
let GAME_HEIGHT = isMobile ? window.innerHeight : (window.innerHeight > 800 ? 700 : window.innerHeight - 100);
const SPACESHIP_WIDTH = 64;  // 우주선 너비
const SPACESHIP_HEIGHT = 64; // 우주선 높이
const ENEMY_WIDTH = 40;      // 적 우주선 너비
const ENEMY_HEIGHT = 40;     // 적 우주선 높이
const BULLET_WIDTH = 25;     // 총알 너비
const BULLET_HEIGHT = 25;    // 총알 높이
const BULLET_SPEED = 7;      // 총알 속도
const BASE_ENEMY_SPEED = 3;  // 기본 적 우주선 속도
const SPACESHIP_SPEED = 5;   // 우주선 속도

// 레벨 관련 상수
const LEVEL_SCORE_THRESHOLD = 15; // 레벨업에 필요한 점수 증가
const MAX_ENEMY_SPEED = 8;        // 최대 적 속도
const MIN_ENEMY_SPAWN_INTERVAL = 500; // 최소 적 생성 간격 (ms)
const BASE_ENEMY_SPAWN_INTERVAL = 1500; // 기본 적 생성 간격 (ms)

// 게임 상태 관리 객체
let gameState = {
    gameOver: false,         // 게임 오버 여부
    gameStarted: false,      // 게임 시작 여부
    paused: false,           // 일시정지 여부
    score: 0,                // 현재 점수
    highScore: 0,            // 최고 점수
    level: 1,                // 현재 레벨
    levelScore: 0,           // 현재 레벨에서 획득한 점수
    enemySpeed: BASE_ENEMY_SPEED, // 현재 적 속도
    enemySpawnInterval: 1000,    // 적 생성 간격 (ms)
    keysDown: {},            // 눌린 키 상태
    lastBulletTime: 0,       // 마지막 총알 발사 시간
    bulletCooldown: 300,     // 총알 발사 쿨다운 (ms)
    spaceship: {             // 우주선 위치
        x: GAME_WIDTH / 2 - SPACESHIP_WIDTH / 2,
        y: GAME_HEIGHT - SPACESHIP_HEIGHT
    },
    bullets: [],             // 총알 배열
    enemies: [],             // 적 우주선 배열
    explosions: []           // 폭발 효과 배열
};

// 게임 이미지 리소스
const gameAssets = {
    background: new Image(), // 배경 이미지
    spaceship: new Image(),  // 우주선 이미지
    bullet: new Image(),     // 총알 이미지
    enemy: new Image(),      // 적 우주선 이미지
    gameOver: new Image()    // 게임 오버 이미지
};

// 캔버스 초기화
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
document.body.appendChild(canvas);

// 스타일 적용
canvas.style.border = "none";
canvas.style.borderRadius = isMobile ? "0" : "12px";
canvas.style.boxShadow = isMobile ? "none" : "0 4px 6px rgba(0, 0, 0, 0.1)";
canvas.style.display = "block";
canvas.style.backgroundColor = "#000";

if (isMobile) {
    // 모바일 스타일
    canvas.style.margin = "0";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.transform = "none";
    canvas.style.borderRadius = "0";
} else {
    // 웹 스타일
    canvas.style.margin = "0 auto";
    canvas.style.position = "fixed";
    canvas.style.top = "50%";
    canvas.style.left = "50%";
    canvas.style.transform = "translate(-50%, -50%)";
    canvas.style.borderRadius = "12px";
}

// 전체 화면 스타일
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.backgroundColor = isMobile ? "#000" : "#f5f5f5";
document.body.style.height = "100vh";
document.body.style.width = "100vw";
document.body.style.overflow = "hidden";
if (!isMobile) {
    document.body.style.display = "flex";
    document.body.style.justifyContent = "center";
    document.body.style.alignItems = "center";
}
document.body.style.fontFamily = "system-ui, -apple-system, sans-serif";

/**
 * 화면 크기에 따라 게임 크기 조정
 */
function resizeGame() {
    // 화면 크기 계산
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (isMobile) {
        // 모바일: 화면 전체 크기 사용
        GAME_WIDTH = windowWidth;
        GAME_HEIGHT = windowHeight;
    } else {
        // 데스크톱: 기본 크기 유지
        GAME_WIDTH = 400;
        GAME_HEIGHT = 700;
    }
    
    // 캔버스 크기 조정
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // 캔버스 스타일 조정
    canvas.style.width = `${GAME_WIDTH}px`;
    canvas.style.height = `${GAME_HEIGHT}px`;
    
    // 게임 상태 초기화
    gameState.spaceship.x = GAME_WIDTH / 2 - SPACESHIP_WIDTH / 2;
    gameState.spaceship.y = GAME_HEIGHT - SPACESHIP_HEIGHT;
}

/**
 * 터치 이벤트 처리
 */
function setupTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    let isMoving = false;
    let pauseButton = null;
    
    if (isMobile) {
        // 일시정지 버튼 생성
        pauseButton = document.createElement('button');
        pauseButton.innerHTML = '⏸️';
        pauseButton.style.position = 'fixed';
        pauseButton.style.top = '20px';
        pauseButton.style.right = '20px';
        pauseButton.style.zIndex = '9999';
        pauseButton.style.padding = '15px';
        pauseButton.style.fontSize = '28px';
        pauseButton.style.border = 'none';
        pauseButton.style.borderRadius = '50%';
        pauseButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        pauseButton.style.color = 'white';
        pauseButton.style.cursor = 'pointer';
        pauseButton.style.width = '60px';
        pauseButton.style.height = '60px';
        pauseButton.style.display = 'none'; // 초기에는 숨김
        pauseButton.style.alignItems = 'center';
        pauseButton.style.justifyContent = 'center';
        pauseButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
        document.body.appendChild(pauseButton);
        
        pauseButton.addEventListener('click', () => {
            gameState.paused = !gameState.paused;
        });
    }
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isMoving = false;

        // 게임 시작 처리
        if (!gameState.gameStarted) {
            gameState.gameStarted = true;
            if (pauseButton) pauseButton.style.display = 'flex'; // 게임 시작 시 버튼 표시
        } else if (gameState.gameOver) {
            gameState.highScore = Math.max(gameState.highScore, gameState.score);
            gameState.gameOver = false;
            gameState.score = 0;
            gameState.level = 1;
            gameState.levelScore = 0;
            gameState.bullets = [];
            gameState.enemies = [];
            gameState.explosions = [];
            gameState.lastBulletTime = 0;
            if (pauseButton) pauseButton.style.display = 'flex'; // 게임 재시작 시 버튼 표시
        }
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - touchStartX;
        
        // 우주선 이동
        gameState.spaceship.x += deltaX * 0.5;
        
        // 화면 경계 체크
        gameState.spaceship.x = Math.max(0, Math.min(GAME_WIDTH - SPACESHIP_WIDTH, gameState.spaceship.x));
        
        touchStartX = touchX;
        isMoving = true;
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (!isMoving && gameState.gameStarted && !gameState.gameOver && !gameState.paused) {
            // 터치 후 이동이 없었다면 총알 발사
            createBullet();
        }
    });
}

/**
 * 게임 이미지 로드
 * @returns {Promise} 모든 이미지가 로드되면 resolve
 */
function loadImages() {
    return new Promise((resolve) => {
        const images = [
            { image: gameAssets.background, src: "images/background.jpg" },
            { image: gameAssets.spaceship, src: "images/main.png" },
            { image: gameAssets.bullet, src: "images/bullet.png" },
            { image: gameAssets.enemy, src: "images/enemy.png" },
            { image: gameAssets.gameOver, src: "images/gameover.jpg" }
        ];

        let loadedImages = 0;
        images.forEach(({ image, src }) => {
            image.onload = () => {
                loadedImages++;
                if (loadedImages === images.length) resolve();
            };
            image.src = src;
        });
    });
}

/**
 * 폭발 효과 생성
 * @param {number} x - 폭발 x 좌표
 * @param {number} y - 폭발 y 좌표
 */
function createExplosion(x, y) {
    gameState.explosions.push({
        x,
        y,
        radius: 5,
        alpha: 1,
        color: `rgba(255, ${Math.random() * 100 + 155}, 0, 1)`
    });
}

/**
 * 폭발 효과 업데이트
 */
function updateExplosions() {
    gameState.explosions = gameState.explosions.filter(explosion => {
        explosion.radius += 2;
        explosion.alpha -= 0.05;
        return explosion.alpha > 0;
    });
}

/**
 * 충돌 감지
 * @param {Object} obj1 - 첫 번째 객체
 * @param {Object} obj2 - 두 번째 객체
 * @returns {boolean} 충돌 여부
 */
function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

/**
 * 총알 생성
 * 우주선의 현재 위치에서 총알을 생성
 */
function createBullet() {
    if (!gameState.gameOver && !gameState.paused) {
        const currentTime = Date.now();
        // 쿨다운 시간이 지났는지 확인
        if (currentTime - gameState.lastBulletTime >= gameState.bulletCooldown) {
            gameState.bullets.push({
                x: gameState.spaceship.x + SPACESHIP_WIDTH / 2 - BULLET_WIDTH / 2,
                y: gameState.spaceship.y,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
                alive: true,
                used: false
            });
            gameState.lastBulletTime = currentTime;  // 마지막 발사 시간 업데이트
        }
    }
}

/**
 * 적 우주선 생성
 * 화면 상단에 랜덤한 위치에 적 우주선 생성
 */
function createEnemy() {
    if (!gameState.gameOver && !gameState.paused) {
        gameState.enemies.push({
            x: Math.random() * (GAME_WIDTH - ENEMY_WIDTH),
            y: 0,
            width: ENEMY_WIDTH,
            height: ENEMY_HEIGHT
        });
    }
}

/**
 * 우주선 위치 업데이트
 * 키보드 입력에 따라 우주선 위치 변경
 */
function updateSpaceship() {
    if (gameState.paused) return;

    if (gameState.keysDown[39]) gameState.spaceship.x += SPACESHIP_SPEED; // 오른쪽
    if (gameState.keysDown[37]) gameState.spaceship.x -= SPACESHIP_SPEED; // 왼쪽

    // 화면 경계 체크
    gameState.spaceship.x = Math.max(0, Math.min(GAME_WIDTH - SPACESHIP_WIDTH, gameState.spaceship.x));
}

/**
 * 총알 위치 업데이트
 * 총알을 위로 이동시키고 화면을 벗어난 총알 제거
 */
function updateBullets() {
    gameState.bullets = gameState.bullets.filter(bullet => {
        if (bullet.used) return false;  // 사용된 총알은 제거
        
        bullet.y -= BULLET_SPEED;
        return bullet.y > 0;  // 화면을 벗어난 총알도 제거
    });
}

/**
 * 레벨 업데이트
 * 점수가 일정 수준에 도달하면 레벨업
 */
function updateLevel() {
    if (gameState.levelScore >= LEVEL_SCORE_THRESHOLD) {
        gameState.level++;
        gameState.levelScore = 0;
        
        // 적 속도 증가 (최대 속도 제한)
        // 레벨 1-3: 천천히 증가, 레벨 4-6: 중간 속도, 레벨 7+: 빠르게 증가
        let speedIncrease = 0;
        if (gameState.level <= 3) {
            speedIncrease = 0.3;
        } else if (gameState.level <= 6) {
            speedIncrease = 0.5;
        } else {
            speedIncrease = 0.7;
        }
        
        gameState.enemySpeed = Math.min(
            BASE_ENEMY_SPEED + (gameState.level - 1) * speedIncrease,
            MAX_ENEMY_SPEED
        );
        
        // 적 생성 간격 감소 (최소 간격 제한)
        // 레벨 1-3: 천천히 감소, 레벨 4-6: 중간 속도, 레벨 7+: 빠르게 감소
        let intervalDecrease = 0;
        if (gameState.level <= 3) {
            intervalDecrease = 50;
        } else if (gameState.level <= 6) {
            intervalDecrease = 100;
        } else {
            intervalDecrease = 150;
        }
        
        gameState.enemySpawnInterval = Math.max(
            BASE_ENEMY_SPAWN_INTERVAL - (gameState.level - 1) * intervalDecrease,
            MIN_ENEMY_SPAWN_INTERVAL
        );
        
        // 적 생성 간격 업데이트
        clearInterval(enemySpawnInterval);
        enemySpawnInterval = setInterval(createEnemy, gameState.enemySpawnInterval);
    }
}

/**
 * 적 우주선 위치 업데이트
 * 적 우주선을 아래로 이동시키고 충돌 체크
 */
function updateEnemies() {
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.y += gameState.enemySpeed;
        
        // 바닥에 닿았는지 체크
        if (enemy.y >= GAME_HEIGHT - enemy.height) {
            gameState.gameOver = true;
            return false;
        }

        // 총알과의 충돌 체크
        for (let i = 0; i < gameState.bullets.length; i++) {
            if (!gameState.bullets[i].used && isColliding(gameState.bullets[i], enemy)) {
                gameState.bullets[i].used = true;  // 총알 사용 표시
                gameState.score++;
                gameState.levelScore++;
                createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                return false;
            }
        }

        return true;
    });
}

/**
 * 게임 상태 업데이트
 * 모든 게임 객체의 상태를 업데이트
 */
function update() {
    if (gameState.gameOver || gameState.paused) return;

    updateSpaceship();
    updateBullets();
    updateEnemies();
    updateExplosions();
    updateLevel();
}

/**
 * 배경 그리기
 */
function drawBackground() {
    // 배경 이미지가 있는 경우 사용
    if (gameAssets.background.complete) {
        ctx.drawImage(gameAssets.background, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        // 우주 배경 그라데이션
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, "#000033");
        gradient.addColorStop(1, "#000066");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // 별 그리기
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * GAME_WIDTH;
            const y = Math.random() * GAME_HEIGHT;
            ctx.fillText("🌟", x, y);
        }
    }
}

/**
 * 폭발 효과 그리기
 */
function drawExplosions() {
    gameState.explosions.forEach(explosion => {
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fillStyle = explosion.color;
        ctx.globalAlpha = explosion.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

/**
 * 게임 화면 렌더링
 * 모든 게임 객체를 화면에 그리기
 */
function render() {
    drawBackground();
    
    if (!gameState.gameStarted) {
        // 시작 화면
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px 'Roboto', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🚀 Space Game", GAME_WIDTH/2, GAME_HEIGHT/2 - 80);
        
        ctx.font = "18px 'Roboto', sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillText("Press SPACE to Start", GAME_WIDTH/2, GAME_HEIGHT/2 - 20);
        ctx.fillText("Press P to Pause", GAME_WIDTH/2, GAME_HEIGHT/2 + 20);
        return;
    }

    if (gameState.gameOver) {
        // 게임 오버 화면
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px 'Roboto', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💥 GAME OVER 💥", GAME_WIDTH/2, GAME_HEIGHT/2 - 100);
        
        ctx.font = "24px 'Roboto', sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillText(`Score: ${gameState.score}`, GAME_WIDTH/2, GAME_HEIGHT/2 - 50);
        ctx.fillText(`Level: ${gameState.level}`, GAME_WIDTH/2, GAME_HEIGHT/2);
        ctx.fillText(`High Score: ${gameState.highScore}`, GAME_WIDTH/2, GAME_HEIGHT/2 + 50);
        
        ctx.font = "20px 'Roboto', sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillText("Press SPACE to Restart", GAME_WIDTH/2, GAME_HEIGHT/2 + 100);
        return;
    }

    // 우주선 그리기
    if (gameAssets.spaceship.complete) {
        ctx.drawImage(
            gameAssets.spaceship,
            gameState.spaceship.x,
            gameState.spaceship.y,
            SPACESHIP_WIDTH,
            SPACESHIP_HEIGHT
        );
    } else {
  ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("🚀", gameState.spaceship.x, gameState.spaceship.y + SPACESHIP_HEIGHT);
    }

    // 총알 그리기
    if (gameAssets.bullet.complete) {
        gameState.bullets.forEach(bullet => {
            ctx.drawImage(
                gameAssets.bullet,
                bullet.x,
                bullet.y,
                bullet.width,
                bullet.height
            );
        });
    } else {
        ctx.font = "20px Arial";
        gameState.bullets.forEach(bullet => {
            ctx.fillText("💫", bullet.x, bullet.y + BULLET_HEIGHT);
        });
    }

    // 적 우주선 그리기
    if (gameAssets.enemy.complete) {
        gameState.enemies.forEach(enemy => {
            ctx.drawImage(
                gameAssets.enemy,
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
            );
        });
    } else {
  ctx.font = "20px Arial";
        gameState.enemies.forEach(enemy => {
            ctx.fillText("👾", enemy.x, enemy.y + ENEMY_HEIGHT);
        });
    }

    // 폭발 효과 그리기
    drawExplosions();

    // 점수 표시
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "18px 'Roboto', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`High Score: ${gameState.highScore}`, 20, 30);
    ctx.fillText(`Score: ${gameState.score}`, 20, 60);
    ctx.fillText(`Level: ${gameState.level}`, 20, 90);
    ctx.fillText(`Next Level: ${LEVEL_SCORE_THRESHOLD - gameState.levelScore}`, 20, 120);

    // 데스크톱에서만 일시정지 방법 표시
    if (!isMobile) {
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fillText("Press P to Pause", GAME_WIDTH - 20, 30);
    }

    // 일시정지 표시
    if (gameState.paused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px 'Roboto', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⏸️ PAUSED", GAME_WIDTH/2, GAME_HEIGHT/2 - 30);
        
        ctx.font = "20px 'Roboto', sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        if (isMobile) {
            ctx.fillText("Tap ⏸️ to Resume", GAME_WIDTH/2, GAME_HEIGHT/2 + 30);
        } else {
            ctx.fillText("Press P to Resume", GAME_WIDTH/2, GAME_HEIGHT/2 + 30);
        }
    }
}

/**
 * 이벤트 리스너 설정
 * 키보드 입력 이벤트 처리
 */
function setupEventListeners() {
    // 기존 키보드 이벤트
    document.addEventListener("keydown", (e) => {
        if (e.keyCode === 32) { // 스페이스바
            e.preventDefault(); // 스크롤 방지
            if (!gameState.gameStarted) {
                gameState.gameStarted = true;
            } else if (gameState.gameOver) {
                gameState.highScore = Math.max(gameState.highScore, gameState.score);
                gameState.gameOver = false;
                gameState.score = 0;
                gameState.level = 1;
                gameState.levelScore = 0;
                gameState.bullets = [];
                gameState.enemies = [];
                gameState.explosions = [];
                gameState.lastBulletTime = 0;
            } else if (!gameState.paused) { // 일시정지 상태가 아닐 때만 총알 발사
                createBullet();
            }
        } else if (e.keyCode === 80) { // P 키
            e.preventDefault(); // 페이지 스크롤 방지
            gameState.paused = !gameState.paused;
  } else {
            gameState.keysDown[e.keyCode] = true;
        }
    });

    document.addEventListener("keyup", (e) => {
        delete gameState.keysDown[e.keyCode];
    });
    
    // 터치 이벤트 추가
    setupTouchControls();
    
    // 화면 크기 변경 이벤트
    window.addEventListener('resize', resizeGame);
}

/**
 * 게임 시작
 * 이미지 로드 후 게임 초기화 및 시작
 */
async function startGame() {
    await loadImages();
    resizeGame(); // 초기 화면 크기 설정
    setupEventListeners();
    gameState.enemySpawnInterval = BASE_ENEMY_SPAWN_INTERVAL;
    enemySpawnInterval = setInterval(createEnemy, gameState.enemySpawnInterval);
    gameLoop();
}

/**
 * 게임 루프
 * 게임 상태 업데이트 및 화면 렌더링
 */
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// 게임 시작
startGame();
