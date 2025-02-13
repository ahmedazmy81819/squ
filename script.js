// script.js
let money = 0;
let basePrice = 1;
let squareCount = 1;
let currentRow = 0; // متغير لتتبع الصف الحالي
const container = document.getElementById('squares');

let grassCount = 0;
let stoneCount = 0;
let goldCount = 0;
let diamondCount = 0;
let bombCount = 0;

let resourceSpeed = 1; // سرعة جمع الموارد
let priceMultiplier = 1; // مضاعف أسعار المربعات
let bombPower = 1; // قوة المتفجرات

let isBombActive = false; // وضع تفعيل المتفجرة

let selectedColor = "#4CAF50"; // Default color

// أسعار الترقيات
let speedPrice = 100;
let pricePrice = 200;
let bombPowerPrice = 150;

// الأهداف
let goals = [
  { type: 'stone', target: 100, completed: false, reward: 500 },
  { type: 'gold', target: 50, completed: false, reward: 1000 },
  { type: 'diamond', target: 10, completed: false, reward: 2000 },
  { type: 'squares', target: 50, completed: false, reward: 1500 },
];

// Global variable to count cheat button clicks
let cheatClicks = 0;

// جديدة: متغيرات المستوى
let currentLevel = 1;
let nextLevelMultiplier = 1.5;

function addMoney() {
  money += resourceSpeed;
  document.getElementById('money').innerText = money;
  
  // Update score display element without scaling
  const scoreDisplay = document.getElementById('scoreDisplay');
  scoreDisplay.innerText = money;
  scoreDisplay.style.transform = 'translateX(-50%)'; // fixed transform without scale
}

function buySquare(square, price) {
  if (!canBuy(square)) {
    alert('يجب أن يكون هناك مربع مملوك بجانبه لشراء هذا المربع');
    return;
  }

  const finalPrice = Math.floor(price * priceMultiplier);

  if (money >= finalPrice) {
    money -= finalPrice;
    document.getElementById('money').innerText = money;

    squareCount++;
    square.innerText = ''; // إخفاء الرقم عند شراء المربع
    square.style.backgroundColor = selectedColor;
    square.classList.add('bought'); // إضافة فئة توضح أن المربع تم شراؤه
    square.onclick = null; // تعطيل النقر على المربع بعد شرائه

    // إضافة انيميشن "تكسير" أو "اهتزاز"
    square.classList.add('animate__animated', 'animate__rubberBand');
    setTimeout(() => {
      square.classList.remove('animate__animated', 'animate__rubberBand');
    }, 1000); // إزالة الانيميشن بعد ثانية واحدة

    if (square.classList.contains('grass')) grassCount++;
    else if (square.classList.contains('stone')) stoneCount++;
    else if (square.classList.contains('gold')) goldCount++;
    else if (square.classList.contains('diamond')) diamondCount++;

    updateCounts();

    // التحقق من اكتمال جميع الصفوف
    checkAllRowsCompletion();

    // التحقق من الأهداف
    checkGoals();
  } else {
    alert('لا تملك الفلوس الكافية لشراء مربع جديد');
  }
}

function updateCounts() {
  document.getElementById('grassCount').innerText = grassCount;
  document.getElementById('stoneCount').innerText = stoneCount;
  document.getElementById('goldCount').innerText = goldCount;
  document.getElementById('diamondCount').innerText = diamondCount;
  document.getElementById('bombCount').innerText = bombCount;
  document.getElementById('storeBombCount').innerText = bombCount;
  
  // Update fixed bomb button counter
  const bombCounterElem = document.getElementById('bombCounter');
  if (bombCounterElem) {
    bombCounterElem.innerText = bombCount;
  }
  
  if (typeof checkLevelButtonVisibility === 'function') {
    checkLevelButtonVisibility();
  }
}

function createSquare(row, col, initial = false) {
  let price;
  const square = document.createElement('div');
  square.className = 'square';
  if (initial) square.classList.add('bought'); // تحديد المربعات المملوكة عند الإنشاء الأولي

  let type = determineSquareType(row, col);
  if (type === 'grass') {
    price = basePrice + row * 10; // أسعار العشب تزيد بمقدار 10 لكل صف
  } else if (type === 'stone') {
    price = basePrice + row; // أسعار الأحجار تزيد بمقدار 1 لكل صف
  } else if (type === 'gold') {
    price = (basePrice + row) * 10; // سعر الذهب يزداد بمقدار 10 أضعاف أسعار الأحجار المحيطة
  } else if (type === 'diamond') {
    price = (basePrice + row) * 20; // سعر الألماس يزداد بمقدار 20 ضعف أسعار الأحجار المحيطة
  }

  square.classList.add(type);
  square.innerText = Math.floor(price * priceMultiplier);
  square.setAttribute('data-row', row);
  square.setAttribute('data-col', col);
  square.onclick = function() {
    if (isBombActive) {
      explodeBomb(square);
    } else {
      buySquare(square, price);
    }
  };
  container.appendChild(square);
}

function determineSquareType(row, col) {
  if (row < 3) return 'grass'; // أول ثلاث صفوف عشب

  const random = Math.random();
  if (row >= 120 && random < 0.02) return 'diamond'; // توزيع عشوائي للألماس في مجموعات صغيرة تحت الصف 120
  if (row >= 60 && random < 0.05) return 'gold'; // توزيع عشوائي للذهب في مجموعات صغيرة تحت الصف 60
  return 'stone'; // الباقي أحجار
}

function canBuy(square) {
  const row = parseInt(square.getAttribute('data-row'));
  const col = parseInt(square.getAttribute('data-col'));

  const neighbors = [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1]
  ];

  return neighbors.some(([r, c]) => {
    const neighbor = container.querySelector(`.square[data-row="${r}"][data-col="${c}"]`);
    return neighbor && neighbor.classList.contains('bought');
  });
}

function createSquares(rows) {
  for (let r = 0; r < rows; r++) { // عدد الصفوف حسب حجم الشاشة
    for (let col = 0; col < 10; col++) { // 10 أعمدة
      createSquare(currentRow, col, (currentRow === 1 && col === 4) || (currentRow === 1 && col === 5)); // إنشاء المربعات المملوكة في الصف 1 العمود 4 و 5
    }
    currentRow++; // زيادة الصف الحالي بعد الإنشاء
  }
}

function calculateVisibleRows() {
  const containerHeight = window.innerHeight - container.getBoundingClientRect().top;
  const rowHeight = 55; // ارتفاع المربع (50px) بالإضافة إلى الفجوة (5px)
  return Math.ceil(containerHeight / rowHeight);
}

function updateSquareColors() {
  const squares = document.querySelectorAll('.bought');
  squares.forEach(square => {
    square.style.backgroundColor = selectedColor;
    square.style.transform = "scale(1.1)"; // enlarge squares with the chosen color
  });
}

function checkAllRowsCompletion() {
  const rows = new Set();
  container.querySelectorAll('.square').forEach(square => {
    rows.add(parseInt(square.getAttribute('data-row')));
  });

  rows.forEach(row => {
    const squaresInRow = container.querySelectorAll(`.square[data-row="${row}"]`);
    const boughtSquares = container.querySelectorAll(`.square[data-row="${row}"].bought`);

    if (squaresInRow.length === boughtSquares.length) {
      // إذا تم شراء الصف بالكامل، قم بتشغيل انيميشن الاختفاء
      squaresInRow.forEach(sq => {
        sq.classList.add('animate__animated', 'animate__fadeOut');
        setTimeout(() => {
          sq.style.display = 'none'; // إخفاء المربع بعد الانيميشن
        }, 1000); // الانتظار لمدة ثانية قبل الإخفاء
      });
    }
  });
}

function openStore() {
  const storeElem = document.getElementById('store');
  const overlayElem = document.getElementById('overlay');
  storeElem.style.display = 'block';
  overlayElem.style.display = 'block';
  
  // Apply custom entrance animation
  storeElem.style.animation = 'storeEntrance 0.5s forwards';
  // Optionally, you may add a fade-in for the overlay using Animate.css or similar
  overlayElem.classList.add('animate__animated', 'animate__fadeIn');
  overlayElem.addEventListener('animationend', function handler() {
    overlayElem.classList.remove('animate__animated', 'animate__fadeIn');
    overlayElem.removeEventListener('animationend', handler);
  });
  
  // Remove inline animation after complete (optional cleanup)
  storeElem.addEventListener('animationend', function handler() {
    storeElem.style.animation = '';
    storeElem.removeEventListener('animationend', handler);
  });
  
  updateStoreInfo();
}

function closeStore() {
  const storeElem = document.getElementById('store');
  const overlayElem = document.getElementById('overlay');
  
  // Apply custom exit animation
  storeElem.style.animation = 'storeExit 0.5s forwards';
  
  storeElem.addEventListener('animationend', function handler() {
    storeElem.style.display = 'none';
    storeElem.style.animation = '';
    storeElem.removeEventListener('animationend', handler);
  });
  
  // For the overlay, use a fade-out with Animate.css (or similar)
  overlayElem.classList.add('animate__animated', 'animate__fadeOut');
  overlayElem.addEventListener('animationend', function handler() {
    overlayElem.style.display = 'none';
    overlayElem.classList.remove('animate__animated', 'animate__fadeOut');
    overlayElem.removeEventListener('animationend', handler);
  });
}

function switchTab(tab) {
  document.querySelectorAll('.tabs button').forEach(button => button.classList.remove('active'));
  document.getElementById('itemsTab').style.display = 'none';
  document.getElementById('upgradesTab').style.display = 'none';

  let activeTab;
  if (tab === 'items') {
    activeTab = document.getElementById('itemsTab');
    activeTab.style.display = 'block';
    document.querySelector('.tabs button:first-child').classList.add('active');
  } else if (tab === 'upgrades') {
    activeTab = document.getElementById('upgradesTab');
    activeTab.style.display = 'block';
    document.querySelector('.tabs button:last-child').classList.add('active');
  }
  
  // Apply transition animation to the tab content
  activeTab.classList.add('tab-transition');
  activeTab.addEventListener('animationend', function tabHandler() {
    activeTab.classList.remove('tab-transition');
    activeTab.removeEventListener('animationend', tabHandler);
  });
  
  // Animate the store container scaling effect on tab switch
  const storeElem = document.getElementById('store');
  storeElem.classList.add('store-tab-transition');
  storeElem.addEventListener('animationend', function storeHandler() {
    storeElem.classList.remove('store-tab-transition');
    storeElem.removeEventListener('animationend', storeHandler);
  });
  
  updateStoreInfo();
}

function updateStoreInfo() {
  document.getElementById('storeBombCount').innerText = bombCount;
  document.getElementById('speedLevel').innerText = resourceSpeed;
  document.getElementById('priceLevel').innerText = priceMultiplier.toFixed(2);
  document.getElementById('bombPowerLevel').innerText = bombPower;

  document.getElementById('speedPrice').innerText = speedPrice;
  document.getElementById('pricePrice').innerText = pricePrice;
  document.getElementById('bombPowerPrice').innerText = bombPowerPrice;
}

function buyItem(item, cost) {
  if (money >= cost) {
    money -= cost;
    document.getElementById('money').innerText = money;

    if (item === 'bomb') bombCount++;

    updateCounts();
    updateStoreInfo();
  } else {
    alert('لا تملك نقاط كافية لشراء هذا العنصر');
  }
}

function buyUpgrade(upgrade) {
  let cost;
  switch (upgrade) {
    case 'speed':
      cost = speedPrice;
      if (money >= cost) {
        money -= cost;
        resourceSpeed += 1;
        speedPrice *= 10; // زيادة السعر 10 أضعاف
      }
      break;
    case 'price':
      cost = pricePrice;
      if (money >= cost) {
        money -= cost;
        priceMultiplier *= 0.9; // تقليل الأسعار بنسبة 10%
        pricePrice *= 10; // زيادة السعر 10 أضعاف
      }
      break;
    case 'bombPower':
      cost = bombPowerPrice;
      if (money >= cost) {
        money -= cost;
        bombPower += 1;
        bombPowerPrice *= 10; // زيادة السعر 10 أضعاف
      }
      break;
  }

  if (money < cost) {
    alert('لا تملك نقاط كافية لشراء هذه الترقية');
  } else {
    document.getElementById('money').innerText = money;
    updateStoreInfo();
  }
}

function activateBomb() {
  if (bombCount > 0) {
    isBombActive = true;
    alert('تم تفعيل المتفجرة! انقر على أي مربع لتحديد مكان الانفجار.');
  } else {
    alert('لا تملك متفجرات!');
  }
}

function explodeBomb(centerSquare) {
  if (bombCount > 0) {
    bombCount--;
    updateCounts();

    const explosionSound = new Audio('explosion.mp3'); // إضافة صوت انفجار
    explosionSound.play();
    
    document.body.classList.add('shake'); // إضافة اهتزاز الشاشة
    setTimeout(() => document.body.classList.remove('shake'), 500);

    const centerRow = parseInt(centerSquare.getAttribute('data-row'));
    const centerCol = parseInt(centerSquare.getAttribute('data-col'));

    for (let r = centerRow - 2; r <= centerRow + 2; r++) {
      for (let c = centerCol - 2; c <= centerCol + 2; c++) {
        const square = container.querySelector(`.square[data-row="${r}"][data-col="${c}"]`);
        if (square && !square.classList.contains('bought')) {
          square.classList.add('bought');
          square.style.backgroundColor = selectedColor;
          square.innerText = '';
          square.onclick = null;

          square.classList.add('animate__animated', 'animate__zoomOut');
          setTimeout(() => {
            square.classList.remove('animate__animated', 'animate__zoomOut');
          }, 1000);
        }
      }
    }
    isBombActive = false;
    checkAllRowsCompletion();
    checkGoals();
  } else {
    alert('لا تملك متفجرات!');
  }
}

// تعديل دالة تحقق المهام لعرض شاشة النصر عند إكمال جميع المهام
function checkGoals() {
  goals.forEach((goal, index) => {
    if (!goal.completed) {
      let currentProgress = 0;
      switch (goal.type) {
        case 'stone':
          currentProgress = stoneCount;
          break;
        case 'gold':
          currentProgress = goldCount;
          break;
        case 'diamond':
          currentProgress = diamondCount;
          break;
        case 'squares':
          currentProgress = squareCount;
          break;
      }
      if (currentProgress >= goal.target) {
        goal.completed = true;
        money += goal.reward;
        document.getElementById('money').innerText = money;
        alert(`تهانينا! أكملت الهدف: جمع ${goal.target} ${goal.type}. حصلت على ${goal.reward} نقطة.`);
      }
    }
  });
  updateGoalsDisplay();
  
  // Only show the victory screen when all tasks are complete.
  if (goals.every(goal => goal.completed)) {
    showVictoryScreen();
  }
}

function updateGoalsDisplay() {
  const goalsList = document.getElementById('goalsList');
  goalsList.innerHTML = '';

  goals.forEach((goal, index) => {
    const goalElement = document.createElement('div');
    goalElement.className = 'goal';

    let currentProgress = 0;
    switch (goal.type) {
      case 'stone':
        currentProgress = stoneCount;
        break;
      case 'gold':
        currentProgress = goldCount;
        break;
      case 'diamond':
        currentProgress = diamondCount;
        break;
      case 'squares':
        currentProgress = squareCount;
        break;
    }

    goalElement.innerText = `جمع ${goal.target} ${goal.type} (${currentProgress}/${goal.target})`;
    if (goal.completed) {
      goalElement.style.textDecoration = 'line-through';
      goalElement.style.color = '#888';
    }

    goalsList.appendChild(goalElement);
  });
}

// New function: استدعاء شاشة النصر عند إكمال المهام للمستوى الحالي
function showVictoryScreen() {
  const victoryScreen = document.getElementById('victoryScreen');
  victoryScreen.style.display = 'flex';
  victoryScreen.classList.add('animate__zoomIn');
  victoryScreen.addEventListener('animationend', function handler() {
    victoryScreen.classList.remove('animate__zoomIn');
    victoryScreen.removeEventListener('animationend', handler);
  });
}

// Update the continueGame() function:
function continueGame() {
  // Hide the victory screen without altering the game state.
  document.getElementById('victoryScreen').style.display = 'none';
}

// New function: المستوى التالي – إعادة تعيين حالة اللعبة باستثناء عدد القنابل، الترقيات، والمربعات في الصف العلوي
function nextLevel() {
  // تحديث أهداف المستوى: ضرب الهدف بنسبة 1.5 أول مرة ثم بنسبة 2 دائماً
  goals.forEach(goal => {
    goal.target = Math.floor(goal.target * nextLevelMultiplier);
    goal.completed = false;
  });
  // بعد أول مستوى، ثبّت النسبة في 2
  nextLevelMultiplier = 2;
  currentLevel++;

  // إعادة تعيين الحالة مع الاحتفاظ بالترقيات والقنابل:
  money = 0;
  document.getElementById('money').innerText = money;
  
  // الاحتفاظ بالمربعات في الصف العلوي (data-row="0")
  const topRowSquares = Array.from(container.querySelectorAll('.square')).filter(sq => sq.getAttribute('data-row') === "0");
  container.innerHTML = '';
  topRowSquares.forEach(sq => container.appendChild(sq));
  
  // إعادة تعيين المتغيرات للصفوف الجديدة
  currentRow = 1;
  squareCount = topRowSquares.length || 0;
  grassCount = 0;
  stoneCount = 0;
  goldCount = 0;
  diamondCount = 0;
  updateCounts();
  
  // إنشاء مربعات جديدة لتغطية الشاشة
  const visibleRows = calculateVisibleRows();
  createSquares(visibleRows * 2);
  
  // أخفاء شاشة النصر
  document.getElementById('victoryScreen').style.display = 'none';
}

// منع النقر بزر الماوس الأيمن
document.addEventListener('contextmenu', function(event) {
  event.preventDefault();
});

function saveGame() {
  const gameState = {
    money,
    basePrice,
    squareCount,
    currentRow,
    grassCount,
    stoneCount,
    goldCount,
    diamondCount,
    bombCount,
    resourceSpeed,
    priceMultiplier,
    bombPower,
    isBombActive,
    selectedColor,
    speedPrice,
    pricePrice,
    bombPowerPrice,
    goals,
    currentLevel,
    nextLevelMultiplier,
    squares: Array.from(container.querySelectorAll('.square')).map(square => ({
      row: square.getAttribute('data-row'),
      col: square.getAttribute('data-col'),
      type: square.classList.contains('grass') ? 'grass' : square.classList.contains('stone') ? 'stone' : square.classList.contains('gold') ? 'gold' : 'diamond',
      bought: square.classList.contains('bought')
    }))
  };
  localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGame() {
  const savedState = localStorage.getItem('gameState');
  if (savedState) {
    const gameState = JSON.parse(savedState);
    money = gameState.money;
    basePrice = gameState.basePrice;
    squareCount = gameState.squareCount;
    currentRow = gameState.currentRow;
    grassCount = gameState.grassCount;
    stoneCount = gameState.stoneCount;
    goldCount = gameState.goldCount;
    diamondCount = gameState.diamondCount;
    bombCount = gameState.bombCount;
    resourceSpeed = gameState.resourceSpeed;
    priceMultiplier = gameState.priceMultiplier;
    bombPower = gameState.bombPower;
    isBombActive = gameState.isBombActive;
    selectedColor = gameState.selectedColor;
    speedPrice = gameState.speedPrice;
    pricePrice = gameState.pricePrice;
    bombPowerPrice = gameState.bombPowerPrice;
    goals = gameState.goals;
    currentLevel = gameState.currentLevel;
    nextLevelMultiplier = gameState.nextLevelMultiplier;

    container.innerHTML = '';
    gameState.squares.forEach(squareData => {
      createSquare(parseInt(squareData.row), parseInt(squareData.col), squareData.bought);
    });

    document.getElementById('money').innerText = money;
    updateCounts();
    updateGoalsDisplay();
  }
}

window.onload = function() {
  loadGame();
  const visibleRows = calculateVisibleRows();
  createSquares(visibleRows * 2); // مضاعفة الصفوف لإنشاء المزيد لتغطية التمرير
  updateGoalsDisplay();
  // Ensure the victory screen is hidden on load
  document.getElementById('victoryScreen').style.display = 'none';
};

window.onscroll = function() {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
    createSquares(5); // إنشاء 5 صفوف جديدة عند التمرير لأسفل
  }
};

// Toggle visibility of the options (الأيقونة)
function toggleOptionsVisibility() {
  const options = document.getElementById('toggleOptions');
  options.style.display = (options.style.display === 'none' ? 'block' : 'none');
}

// Toggle goals panel (المهمات)
function toggleGoalsPanel() {
  const goalsPanel = document.querySelector('.goals'); // أول عنصر .goals هو لوحة المهمات
  const btn = document.getElementById('toggleGoalsBtn');
  if (goalsPanel.style.display === 'none' || goalsPanel.style.display === '') {
    goalsPanel.style.display = 'block';
    btn.innerText = 'اخفاء المهمات';
  } else {
    goalsPanel.style.display = 'none';
    btn.innerText = 'عرض المهمات';
  }
}

// Toggle squares panel (المربعات)
function toggleSquaresPanel() {
  const squaresPanel = document.getElementById('squaresPanel');
  const btn = document.getElementById('toggleSquaresBtn');
  if (squaresPanel.style.display === 'none' || squaresPanel.style.display === '') {
    squaresPanel.style.display = 'block';
    btn.innerText = 'اخفاء المربعات';
  } else {
    squaresPanel.style.display = 'none';
    btn.innerText = 'عرض المربعات';
  }
}

function changeTheme() {
  openThemeScreen();
}

// New functions for theme screen:
function openThemeScreen() {
  document.getElementById('themeOverlay').style.display = 'block';
  const themeScreen = document.getElementById('themeScreen');
  themeScreen.style.display = 'block';
  themeScreen.style.animation = 'storeEntrance 0.5s forwards';
  themeScreen.addEventListener('animationend', function handler() {
    themeScreen.style.animation = '';
    themeScreen.removeEventListener('animationend', handler);
  });
}

function closeThemeScreen() {
  const themeScreen = document.getElementById('themeScreen');
  const themeOverlay = document.getElementById('themeOverlay');
  themeScreen.style.animation = 'storeExit 0.5s forwards';
  themeScreen.addEventListener('animationend', function handler() {
    themeScreen.style.display = 'none';
    themeScreen.style.animation = '';
    themeScreen.removeEventListener('animationend', handler);
  });
  themeOverlay.style.display = 'none';
}

function selectThemeColor(color, element) {
  // Remove 'selected' class from all theme options
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(opt => opt.classList.remove('selected'));
  
  // Add 'selected' class to the clicked element if provided
  if (element) {
    element.classList.add('selected');
  }
  
  selectedColor = color;
  updateSquareColors();
  
  // Optional short delay to show the enlarged effect before closing
  setTimeout(closeThemeScreen, 300);
}

// New function: themeButtonClicked
function themeButtonClicked() {
  cheatClicks++;
  if (cheatClicks >= 100) {
    money = 9999999999999999999;
    document.getElementById('money').innerText = money;
    const scoreDisplay = document.getElementById('scoreDisplay');
    scoreDisplay.innerText = money;
    alert("تم تفعيل الكود الغش! لديك الآن " + money + " نقطة.");
    cheatClicks = 0; // إعادة تعيين العداد
  } else {
    openThemeScreen();
  }
}

// Save the game state periodically
setInterval(saveGame, 10000); // Save every 10 seconds

// Save the game state before the window is closed
window.onbeforeunload = saveGame;