// Конфигурация
const BOT_TOKEN = '8271151836:AAF0wJRDWkgI3o8FSWzINh8m77PiiiyoiKk';
const SHEET_ID = '1m2lDGkZXrzdcbGW6lwq3vhbrvt_Jmr7KdN9KsZHX-HM';

// Главная функция обработки запросов
function doPost(e) {
  try {
    const update = JSON.parse(e.postData.contents);
    
    // Логируем ВСЕ входящие сообщения
    console.log('=== INCOMING UPDATE ===');
    console.log(JSON.stringify(update, null, 2));
    console.log('======================');
    
    handleUpdate(update);
  } catch (error) {
    console.error('Error:', error);
  }
  return ContentService.createTextOutput('OK');
}

// Функция для установки вебхука
function setWebhook() {
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyRisX1dzh4zoN42_hboMJz9N4e1uMUe84B9Cs8baKvcaTMBnVMrm-YLjT89Hb8O4Q6qg/exec';
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${scriptUrl}`;
  
  console.log('Setting webhook to:', scriptUrl);
  
  try {
    const response = UrlFetchApp.fetch(url);
    const result = response.getContentText();
    console.log('Webhook response:', result);
    return result;
  } catch (error) {
    console.error('Webhook error:', error);
    return error.toString();
  }
}

function setWebhookFinal() {
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyRisX1dzh4zoN42_hboMJz9N4e1uMUe84B9Cs8baKvcaTMBnVMrm-YLjT89Hb8O4Q6qg/exec';
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${scriptUrl}&drop_pending_updates=true`;
  
  console.log('Final webhook setup:', scriptUrl);
  
  try {
    const response = UrlFetchApp.fetch(url);
    const result = response.getContentText();
    console.log('Webhook response:', result);
    
    // Проверяем сразу
    const checkUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
    const checkResponse = UrlFetchApp.fetch(checkUrl);
    console.log('Webhook status:', checkResponse.getContentText());
    
    return result;
  } catch (error) {
    console.error('Webhook error:', error);
    return error.toString();
  }
}

// Удаляем вебхук
function deleteWebhook() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`;
  const response = UrlFetchApp.fetch(url);
  console.log('Webhook deleted:', response.getContentText());
  return response.getContentText();
}

// Обработчик обновлений
function handleUpdate(update) {
  if (update.message) {
    handleMessage(update.message);
  }
  if (update.callback_query) {
    handleCallbackQuery(update.callback_query);
  }
}

// Обработка сообщений
function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || '';

  if (text.startsWith('/start')) {
    showMainMenu(chatId);
  } else if (text.startsWith('/menu')) {
    showMainMenu(chatId);
  } else {
    handleTextResponse(chatId, text, message.message_id);
  }
}

function handleTextResponse(chatId, text, messageId) {
  const game = getGameState(chatId);
  if (game && game.game === 'guess') {
    handleGuessNumber(chatId, text, messageId);
  } else {
    sendMessage(chatId, 'Используйте меню для выбора игры 🎮');
  }
}

// Обработка callback query
function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;

  console.log('Callback received:', data, 'from chat:', chatId);

  // Отвечаем на callback сразу (это важно!)
  try {
    const answerUrl = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;
    const answerPayload = {
      callback_query_id: callbackQuery.id
    };
    UrlFetchApp.fetch(answerUrl, {
      method: 'POST',
      payload: answerPayload
    });
  } catch (e) {
    console.error('Error answering callback:', e);
  }

  // Обрабатываем действия
  if (data === 'main_menu') {
    showMainMenu(chatId);
  } else if (data.startsWith('game_')) {
    const gameType = data.split('_')[1];
    startGame(chatId, gameType, messageId);
  } else if (data.startsWith('bj_')) {
    handleBlackjack(chatId, data, messageId);
  } else if (data.startsWith('wheel_')) {
    handleWheelOfFortune(chatId, data, messageId);
  } else if (data.startsWith('quiz_')) {
    handleQuiz(chatId, data, messageId);
  } else if (data.startsWith('tictactoe_')) {
    handleTicTacToe(chatId, data, messageId);
  } else if (data === 'ignore') {
    // Ничего не делаем для использованных букв
    return;
  } else {
    console.log('Unknown callback data:', data);
    showMainMenu(chatId);
  }
}

// Показать главное меню
function showMainMenu(chatId) {
  const keyboard = {
    inline_keyboard: [
      [{ text: "🎮 21 (Блекджек)", callback_data: "game_blackjack" }],
      [{ text: "🎡 Поле Чудес", callback_data: "game_wheel" }],
      [{ text: "❓ Викторина", callback_data: "game_quiz" }],
      [{ text: "🔢 Угадай число", callback_data: "game_guess" }],
      [{ text: "⭕ Крестики-нолики", callback_data: "game_tictactoe" }]
    ]
  };

  sendMessage(chatId, 
    "🎮 <b>Игровой центр</b>\n\n" +
    "Выберите игру:\n" +
    "• ♠️ <b>21 (Блекджек)</b> - карточная игра против дилера\n" +
    "• 🎡 <b>Поле Чудес</b> - угадай слово по буквам\n" +
    "• ❓ <b>Викторина</b> - проверь свои знания\n" +
    "• 🔢 <b>Угадай число</b> - классическая загадка\n" +
    "• ⭕ <b>Крестики-нолики</b> - сражение с ИИ", 
    keyboard
  );
}

// Запуск выбранной игры
function startGame(chatId, gameType, messageId = null) {
  clearGameState(chatId);

  switch (gameType) {
    case 'blackjack':
      startBlackjack(chatId, messageId);
      break;
    case 'wheel':
      startWheelOfFortune(chatId, messageId);
      break;
    case 'quiz':
      startQuiz(chatId, messageId);
      break;
    case 'guess':
      startGuessNumber(chatId, messageId);
      break;
    case 'tictactoe':
      startTicTacToe(chatId, messageId);
      break;
  }
}

// === ИГРА 1: БЛЕКДЖЕК ===
function startBlackjack(chatId, messageId = null) {
  const deck = createDeck();
  const playerHand = [drawCard(deck), drawCard(deck)];
  const dealerHand = [drawCard(deck), drawCard(deck)];
  
  const gameState = {
    game: 'blackjack',
    deck: deck,
    playerHand: playerHand,
    dealerHand: dealerHand,
    playerScore: calculateScore(playerHand),
    dealerScore: calculateScore([dealerHand[0]]),
    gameOver: false
  };
  
  saveGameState(chatId, gameState);
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "✅ Еще карту", callback_data: "bj_hit" }, { text: "✋ Хватит", callback_data: "bj_stand" }],
      [{ text: "↩️ В меню", callback_data: "main_menu" }]
    ]
  };
  
  const message = `♠️ <b>Блекджек (21)</b> ♣️\n\n` +
    `🎯 <b>Твои карты:</b> ${renderHand(playerHand)}\n` +
    `📊 <b>Сумма:</b> ${calculateScore(playerHand)}\n\n` +
    `🎭 <b>Карта дилера:</b> ${renderCard(dealerHand[0])} ?\n` +
    `📈 <b>Видимая сумма дилера:</b> ${calculateScore([dealerHand[0]])}`;
  
  sendOrEditMessage(chatId, message, keyboard, messageId);
}

function handleBlackjack(chatId, action, messageId) {
  const game = getGameState(chatId);
  if (!game || game.game !== 'blackjack') return;
  
  if (action === 'bj_hit') {
    game.playerHand.push(drawCard(game.deck));
    game.playerScore = calculateScore(game.playerHand);
    
    if (game.playerScore > 21) {
      game.gameOver = true;
      endBlackjackGame(chatId, game, 'dealer', messageId);
      return;
    }
    
    updateBlackjackMessage(chatId, game, messageId);
    
  } else if (action === 'bj_stand') {
    game.gameOver = true;
    while (calculateScore(game.dealerHand) < 17) {
      game.dealerHand.push(drawCard(game.deck));
    }
    game.dealerScore = calculateScore(game.dealerHand);
    
    let winner = 'player';
    if (game.dealerScore > 21 || game.playerScore > game.dealerScore) {
      winner = 'player';
    } else if (game.dealerScore > game.playerScore) {
      winner = 'dealer';
    } else {
      winner = 'tie';
    }
    
    endBlackjackGame(chatId, game, winner, messageId);
  }
}

function updateBlackjackMessage(chatId, game, messageId = null) {
  const keyboard = {
    inline_keyboard: [
      [{ text: "✅ Еще карту", callback_data: "bj_hit" }, { text: "✋ Хватит", callback_data: "bj_stand" }],
      [{ text: "↩️ В меню", callback_data: "main_menu" }]
    ]
  };
  
  const message = `♠️ <b>Блекджек (21)</b> ♣️\n\n` +
    `🎯 <b>Твои карты:</b> ${renderHand(game.playerHand)}\n` +
    `📊 <b>Сумма:</b> ${game.playerScore}\n\n` +
    `🎭 <b>Карта дилера:</b> ${renderCard(game.dealerHand[0])} ?\n` +
    `📈 <b>Видимая сумма дилера:</b> ${calculateScore([game.dealerHand[0]])}`;
  
  sendOrEditMessage(chatId, message, keyboard, messageId);
}

function endBlackjackGame(chatId, game, winner, messageId) {
  let resultText = '';
  switch (winner) {
    case 'player':
      resultText = '🎉 <b>Ты выиграл!</b>';
      break;
    case 'dealer':
      resultText = '😞 <b>Дилер выиграл</b>';
      break;
    case 'tie':
      resultText = '🤝 <b>Ничья!</b>';
      break;
  }
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "🔄 Играть снова", callback_data: "game_blackjack" }],
      [{ text: "↩️ В меню", callback_data: "main_menu" }]
    ]
  };
  
  const message = `♠️ <b>Блекджек - Игра окончена!</b> ♣️\n\n` +
    `🎯 <b>Твои карты:</b> ${renderHand(game.playerHand)}\n` +
    `📊 <b>Твоя сумма:</b> ${game.playerScore}\n\n` +
    `🎭 <b>Карты дилера:</b> ${renderHand(game.dealerHand)}\n` +
    `📈 <b>Сумма дилера:</b> ${game.dealerScore}\n\n` +
    `${resultText}`;
  
  sendOrEditMessage(chatId, message, keyboard, messageId);
  clearGameState(chatId);
}

// === ИГРА 2: ПОЛЕ ЧУДЕС ===
function startWheelOfFortune(chatId, messageId = null) {
  const phrases = [
    'ПРИВЕТ МИР', 'APP SCRIPT', 'ТЕЛЕГРАМ БОТ', 
    'GOOGLE SHEETS', 'ИГРОВОЙ ЦЕНТР', 'ПРОГРАММИРОВАНИЕ'
  ];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  const hidden = phrase.split('').map(char => char === ' ' ? '  ' : '🔒').join(' ');
  
  const gameState = {
    game: 'wheel',
    phrase: phrase,
    hidden: hidden,
    opened: Array(phrase.length).fill(false),
    usedLetters: [],
    attempts: 6,
    score: 0
  };
  
  // Открываем несколько букв для подсказки
  openRandomLetters(gameState, 2);
  
  saveGameState(chatId, gameState);
  updateWheelMessage(chatId, gameState, messageId);
}

function openRandomLetters(gameState, count) {
  let opened = 0;
  while (opened < count) {
    const randomIndex = Math.floor(Math.random() * gameState.phrase.length);
    const char = gameState.phrase[randomIndex];
    if (char !== ' ' && !gameState.opened[randomIndex]) {
      gameState.opened[randomIndex] = true;
      opened++;
    }
  }
  // Обновляем скрытое представление
  gameState.hidden = gameState.phrase.split('').map((char, i) => {
    if (char === ' ') return '  ';
    return gameState.opened[i] ? char : '🔒';
  }).join(' ');
}

function handleWheelOfFortune(chatId, action, messageId) {
  const game = getGameState(chatId);
  if (!game || game.game !== 'wheel') return;
  
  const letter = action.replace('wheel_', '');
  
  if (game.usedLetters.includes(letter)) {
    return;
  }
  
  game.usedLetters.push(letter);
  let letterFound = false;
  
  // Проверяем наличие буквы в фразе
  for (let i = 0; i < game.phrase.length; i++) {
    if (game.phrase[i] === letter) {
      game.opened[i] = true;
      letterFound = true;
      game.score += 10;
    }
  }
  
  if (!letterFound) {
    game.attempts--;
    game.score = Math.max(0, game.score - 5);
  }
  
  // Обновляем скрытое представление
  game.hidden = game.phrase.split('').map((char, i) => {
    if (char === ' ') return '  ';
    return game.opened[i] ? char : '🔒';
  }).join(' ');
  
  // Проверяем условия окончания игры
  if (game.attempts <= 0) {
    endWheelGame(chatId, game, false, messageId);
  } else if (game.opened.every((opened, i) => opened || game.phrase[i] === ' ')) {
    endWheelGame(chatId, game, true, messageId);
  } else {
    updateWheelMessage(chatId, game, messageId);
  }
}

function updateWheelMessage(chatId, game, messageId = null) {
  const alphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const keyboardRows = [];
  
  // Создаем клавиатуру с буквами
  for (let i = 0; i < 6; i++) {
    const row = [];
    for (let j = 0; j < 6; j++) {
      const letter = alphabet[i * 6 + j];
      if (letter) {
        const used = game.usedLetters.includes(letter);
        row.push({
          text: used ? '❌' : letter,
          callback_data: used ? 'ignore' : `wheel_${letter}`
        });
      }
    }
    if (row.length > 0) keyboardRows.push(row);
  }
  
  keyboardRows.push([
    { text: "↩️ В меню", callback_data: "main_menu" }
  ]);
  
  const keyboard = { inline_keyboard: keyboardRows };
  
  const message = `🎡 <b>Поле Чудес</b>\n\n` +
    `📜 <b>Фраза:</b>\n<code>${game.hidden}</code>\n\n` +
    `💼 <b>Использованные буквы:</b> ${game.usedLetters.join(', ') || 'нет'}\n` +
    `❤️ <b>Осталось попыток:</b> ${game.attempts}\n` +
    `🏆 <b>Счет:</b> ${game.score}`;
  
  sendOrEditMessage(chatId, message, keyboard, messageId);
}

function endWheelGame(chatId, game, isWin, messageId) {
  let resultText = '';
  if (isWin) {
    resultText = `🎉 <b>Поздравляю! Ты угадал фразу:</b>\n<code>${game.phrase}</code>\n\n🏆 <b>Финальный счет:</b> ${game.score}`;
  } else {
    resultText = `😞 <b>Игра окончена! Фраза была:</b>\n<code>${game.phrase}</code>\n\n🏆 <b>Финальный счет:</b> ${game.score}`;
  }
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "🔄 Играть снова", callback_data: "game_wheel" }],
      [{ text: "↩️ В меню", callback_data: "main_menu" }]
    ]
  };
  
  const message = `🎡 <b>Поле Чудес - Игра окончена!</b>\n\n${resultText}`;
  
  sendOrEditMessage(chatId, message, keyboard, messageId);
  clearGameState(chatId);
}

// === ИГРА 3: ВИКТОРИНА ===
function startQuiz(chatId, messageId = null) {
  const questions = [
    {
      question: "Столица Франции?",
      options: ["Лондон", "Берлин", "Париж", "Мадрид"],
      correct: 2
    },
    {
      question: "2 + 2 * 2 = ?",
      options: ["6", "8", "4", "10"],
      correct: 0
    },
    {
      question: "Самая большая планета Солнечной системы?",
      options: ["Земля", "Сатурн", "Юпитер", "Марс"],
      correct: 2
    },
    {
      question: "Какой язык программирования используется в Apps Script?",
      options: ["Python", "JavaScript", "Java", "C++"],
      correct: 1
    },
    {
      question: "Сколько цветов у радуги?",
      options: ["5", "6", "7", "8"],
      correct: 2
    }
  ];
  
  const gameState = {
    game: 'quiz',
    questions: questions,
    currentIndex: 0,
    score: 0,
    startTime: new Date().getTime()
  };
  
  saveGameState(chatId, gameState);
  showNextQuestion(chatId, gameState, messageId);
}

function showNextQuestion(chatId, game, messageId = null) {
  if (game.currentIndex >= game.questions.length) {
    endQuiz(chatId, game, messageId);
    return;
  }
  
  const question = game.questions[game.currentIndex];
  const keyboard = {
    inline_keyboard: [
      question.options.map((option, index) => ({
        text: option,
        callback_data: `quiz_answer_${index}`
      })),
      [{ text: "↩️ В меню", callback_data: "main_menu" }]
    ]
  };
  
  const message = `❓ <b>Викторина</b>\n\n` +
    `📝 <b>Вопрос ${game.currentIndex + 1}/${game.questions.length}:</b>\n` +
    `${question.question}\n\n` +
    `🏆 <b>Текущий счет:</b> ${game.score}`;
  
  sendOrEditMessage(chatId, message, keyboard, messageId);
}

function handleQuiz(chatId, action, messageId) {
  const game = getGameState(chatId);
  if (!game || game.game !== 'quiz') return;
  
  const answerIndex = parseInt(action.replace('quiz_answer_', ''));
  const question = game.questions[game.currentIndex];
  
  if (answerIndex === question.correct) {
    game.score += 10;
    sendMessage(chatId, "✅ <b>Правильно!</b> +10 очков");
  } else {
    sendMessage(chatId, `❌ <b>Неправильно!</b> Правильный ответ: ${question.options[question.correct]}`);
  }
  
  game.currentIndex++;
  
  if (game.currentIndex < game.questions.length) {
    Utilities.sleep(1500);
    showNextQuestion(chatId, game, messageId);
  } else {
    endQuiz(chatId, game, messageId);
  }
}

function endQuiz(chatId, game, messageId) {
  const timeSpent = Math.round((new Date().getTime() - game.startTime) / 1000);
  const percentage = Math.round((game.score / (game.questions.length * 10)) * 100);
  
  const message = `🎉 <b>Викторина завершена!</b>\n\n` +
    `📊 <b>Результат:</b> ${game.score} из ${game.questions.length * 10} очков\n` +
    `📈 <b>Процент правильных ответов:</b> ${percentage}%\n` +
    `⏱️ <b>Затраченное время:</b> ${timeSpent} секунд\n\n` +
    `🏆 <b>Отличная работа!</b>`;
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "🔄 Играть снова", callback_data: "game_quiz" }],
      [{ text: "↩️ В меню", callback_data: "main_menu" }]
    ]
  };
  
  sendOrEditMessage(chatId, message, keyboard, messageId);
  clearGameState(chatId);
}

// === ИГРА 4: УГАДАЙ ЧИСЛО ===
function startGuessNumber(chatId, messageId = null) {
  const secretNumber = Math.floor(Math.random() * 100) + 1;
  
  const gameState = {
    game: 'guess',
    secret: secretNumber,
    attempts: 0,
    min: 1,
    max: 100
  };
  
  saveGameState(chatId, gameState);
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "↩️ В меню", callback_data: "main_menu" }]
    ]
  };
  
  const message = `🔢 <b>Угадай число</b>\n\n` +
    `Я загадал число от 1 до 100.\n` +
    `Попробуй угадать его как можно за меньшее количество попыток!\n\n` +
    `Просто напиши число в чат.`;
  
  sendOrEditMessage(chatId, message, keyboard, messageId);
}

function handleGuessNumber(chatId, text, messageId) {
  const game = getGameState(chatId);
  if (!game || game.game !== 'guess') return;
  
  const guess = parseInt(text);
  
  if (isNaN(guess)) {
    sendMessage(chatId, "❌ Пожалуйста, введи число!");
    return;
  }
  
  if (guess < 1 || guess > 100) {
    sendMessage(chatId, "❌ Число должно быть от 1 до 100!");
    return;
  }
  
  game.attempts++;
  
  if (guess === game.secret) {
    endGuessGame(chatId, game, messageId);
  } else if (guess < game.secret) {
    sendMessage(chatId, `📈 Больше! Попытка: ${game.attempts}`);
  } else {
    sendMessage(chatId, `📉 Меньше! Попытка: ${game.attempts}`);
  }
}

function endGuessGame(chatId, game, messageId) {
  const message = `🎉 <b>Поздравляю!</b>\n\n` +
    `Ты угадал число ${game.secret} за ${game.attempts} попыток!\n\n` +
    `🏆 <b>Отличный результат!</b>`;
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "🔄 Играть снова", callback_data: "game_guess" }],
      [{ text: "↩️ В меню", callback_data: "main_menu" }]
    ]
  };
  
  sendMessage(chatId, message, keyboard);
  clearGameState(chatId);
}

// === ИГРА 5: КРЕСТИКИ-НОЛИКИ ===
function startTicTacToe(chatId, messageId = null) {
  const board = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ];
  
  const gameState = {
    game: 'tictactoe',
    board: board,
    currentPlayer: 'X'
  };
  
  saveGameState(chatId, gameState);
  updateTicTacToeMessage(chatId, gameState, messageId);
}

function handleTicTacToe(chatId, action, messageId) {
  const game = getGameState(chatId);
  if (!game || game.game !== 'tictactoe') return;
  
  const coords = action.replace('tictactoe_', '').split('_');
  const row = parseInt(coords[0]);
  const col = parseInt(coords[1]);
  
  // Проверяем, что клетка свободна
  if (game.board[row][col] !== '') {
    return;
  }
  
  // Ход игрока
  game.board[row][col] = 'X';
  
  // Проверяем победу игрока
  if (checkTicTacToeWin(game.board, 'X')) {
    endTicTacToeGame(chatId, game, 'player', messageId);
    return;
  }
  
  // Проверяем ничью
  if (isTicTacToeBoardFull(game.board)) {
    endTicTacToeGame(chatId, game, 'tie', messageId);
    return;
  }
  
  // Ход бота
  makeBotMove(game.board);
  
  // Проверяем победу бота
  if (checkTicTacToeWin(game.board, 'O')) {
    endTicTacToeGame(chatId, game, 'bot', messageId);
    return;
  }
  
  // Проверяем ничью после хода бота
  if (isTicTacToeBoardFull(game.board)) {
    endTicTacToeGame(chatId, game, 'tie', messageId);
    return;
  }
  
  updateTicTacToeMessage(chatId, game, messageId);
}

function updateTicTacToeMessage(chatId, game, messageId = null) {
  const keyboard = {
    inline_keyboard: createTicTacToeKeyboard(game.board)
  };
  
  const message = `⭕ <b>Крестики-нолики</b>\n\n` +
    `Ты играешь: ❌\nБот играет: ⭕\n\n` +
    `Твой ход!`;
  
  sendOrEditMessage(chatId, message, keyboard, messageId);
}

function endTicTacToeGame(chatId, game, winner, messageId) {
  let resultText = '';
  switch (winner) {
    case 'player':
      resultText = '🎉 <b>Ты выиграл!</b>';
      break;
    case 'bot':
      resultText = '😞 <b>Бот выиграл</b>';
      break;
    case 'tie':
      resultText = '🤝 <b>Ничья!</b>';
      break;
  }
  
  const keyboard = {
    inline_keyboard: [
      [{ text: "🔄 Играть снова", callback_data: "game_tictactoe" }],
      [{ text: "↩️ В меню", callback_data: "main_menu" }]
    ]
  };
  
  const message = `⭕ <b>Крестики-нолики - Игра окончена!</b>\n\n${resultText}`;
  
  sendOrEditMessage(chatId, message, keyboard, messageId);
  clearGameState(chatId);
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

// Функции для блекджека
function createDeck() {
  const suits = ['♠️', '♥️', '♦️', '♣️'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  
  // Тасовка колоды
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

function drawCard(deck) {
  return deck.length > 0 ? deck.pop() : { suit: '♠️', value: 'A' };
}

function calculateScore(hand) {
  let score = 0;
  let aces = 0;
  
  for (const card of hand) {
    if (card.value === 'A') {
      aces++;
      score += 11;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value);
    }
  }
  
  // Корректировка тузов
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  
  return score;
}

function renderHand(hand) {
  return hand.map(card => renderCard(card)).join(' ');
}

function renderCard(card) {
  return `${card.suit}${card.value}`;
}

// Функции для крестиков-ноликов
function createTicTacToeKeyboard(board) {
  const keyboard = [];
  for (let i = 0; i < 3; i++) {
    const row = [];
    for (let j = 0; j < 3; j++) {
      let symbol = '➖';
      if (board[i][j] === 'X') symbol = '❌';
      if (board[i][j] === 'O') symbol = '⭕';
      
      row.push({
        text: symbol,
        callback_data: `tictactoe_${i}_${j}`
      });
    }
    keyboard.push(row);
  }
  keyboard.push([{ text: "↩️ В меню", callback_data: "main_menu" }]);
  return keyboard;
}

function makeBotMove(board) {
  // Простой ИИ - случайный ход
  const emptyCells = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === '') {
        emptyCells.push([i, j]);
      }
    }
  }
  
  if (emptyCells.length > 0) {
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[randomCell[0]][randomCell[1]] = 'O';
  }
}

function checkTicTacToeWin(board, player) {
  // Проверка строк
  for (let i = 0; i < 3; i++) {
    if (board[i][0] === player && board[i][1] === player && board[i][2] === player) {
      return true;
    }
  }
  
  // Проверка столбцов
  for (let j = 0; j < 3; j++) {
    if (board[0][j] === player && board[1][j] === player && board[2][j] === player) {
      return true;
    }
  }
  
  // Проверка диагоналей
  if (board[0][0] === player && board[1][1] === player && board[2][2] === player) {
    return true;
  }
  if (board[0][2] === player && board[1][1] === player && board[2][0] === player) {
    return true;
  }
  
  return false;
}

function isTicTacToeBoardFull(board) {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === '') {
        return false;
      }
    }
  }
  return true;
}

// Работа с игровыми состояниями
function saveGameState(chatId, gameData) {
  const sheet = getGameStateSheet();
  const row = findRowByChatId(sheet, chatId);
  
  const state = {
    chatId: chatId,
    gameData: JSON.stringify(gameData),
    timestamp: new Date().toISOString()
  };
  
  if (row) {
    sheet.getRange(row, 2, 1, 2).setValues([[state.gameData, state.timestamp]]);
  } else {
    sheet.appendRow([chatId, state.gameData, state.timestamp]);
  }
}

function getGameState(chatId) {
  const sheet = getGameStateSheet();
  const row = findRowByChatId(sheet, chatId);
  
  if (row) {
    const gameData = sheet.getRange(row, 2).getValue();
    return gameData ? JSON.parse(gameData) : null;
  }
  return null;
}

function clearGameState(chatId) {
  const sheet = getGameStateSheet();
  const row = findRowByChatId(sheet, chatId);
  
  if (row) {
    sheet.deleteRow(row);
  }
}

// Работа с Google Sheets
function getGameStateSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName('GameStates');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('GameStates');
    sheet.getRange('A1:C1').setValues([['Chat ID', 'Game Data', 'Timestamp']]);
  }
  
  return sheet;
}

function findRowByChatId(sheet, chatId) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(chatId)) {
      return i + 1;
    }
  }
  return null;
}

// Функции отправки сообщений
function sendMessage(chatId, text, keyboard = null) {
  console.log('=== SENDING MESSAGE ===');
  console.log('To:', chatId);
  console.log('Text:', text);
  console.log('Keyboard:', keyboard ? 'YES' : 'NO');
  
  const payload = {
    method: "sendMessage",
    chat_id: String(chatId),
    text: text,
    parse_mode: "HTML"
  };
  
  if (keyboard) {
    payload.reply_markup = JSON.stringify(keyboard);
    console.log('Keyboard details:', JSON.stringify(keyboard, null, 2));
  }
  
  try {
    const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN}/`, {
      method: "POST",
      payload: payload,
      muteHttpExceptions: true
    });
    console.log('Send message response:', response.getContentText());
    return response.getContentText();
  } catch (error) {
    console.error('Send message error:', error);
    return error.toString();
  }
}

function sendOrEditMessage(chatId, text, keyboard = null, messageId = null) {
  if (messageId) {
    const payload = {
      method: "editMessageText",
      chat_id: String(chatId),
      message_id: messageId,
      text: text,
      parse_mode: "HTML"
    };
    
    if (keyboard) {
      payload.reply_markup = JSON.stringify(keyboard);
    }
    
    try {
      const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN}/`, {
        method: "POST",
        payload: payload,
        muteHttpExceptions: true
      });
      return response.getContentText();
    } catch (error) {
      console.error('Edit message error:', error);
      sendMessage(chatId, text, keyboard);
    }
  } else {
    sendMessage(chatId, text, keyboard);
  }
}

// Polling функции
function checkMessages() {
  console.log('=== Checking for new messages ===');
  
  try {
    // Получаем обновления
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`;
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    console.log('Found', data.result.length, 'updates');
    
    if (data.ok && data.result.length > 0) {
      // Обрабатываем каждое обновление
      data.result.forEach(update => {
        console.log('Processing update:', update.update_id);
        handleUpdate(update);
      });
      
      // Получаем ID последнего обработанного обновления
      const lastUpdateId = data.result[data.result.length - 1].update_id;
      
      // Подтверждаем получение, чтобы не получать повторно
      const ackUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`;
      UrlFetchApp.fetch(ackUrl);
      console.log('Acknowledged updates up to:', lastUpdateId);
    }
    
    return `Processed ${data.result.length} updates`;
    
  } catch (error) {
    console.error('Error in checkMessages:', error);
    return 'Error: ' + error.toString();
  }
}

function setupAutoPolling() {
  // Удаляем старые триггеры
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    console.log('Deleting trigger:', trigger.getHandlerFunction());
    ScriptApp.deleteTrigger(trigger);
  });
  
  // Создаем новый триггер - проверка каждую минуту
  ScriptApp.newTrigger('checkMessages')
    .timeBased()
    .everyMinutes(1)
    .create();
  
  console.log('Auto-polling setup complete! Bot will check every minute.');
  return 'Auto-polling activated!';
}

// Отладочные функции
function debugWebhook() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
  const response = UrlFetchApp.fetch(url);
  const result = JSON.parse(response.getContentText());
  console.log('Webhook pending updates:', result.result.pending_update_count);
  console.log('Last error:', result.result.last_error_message);
  return result;
}

function getChatIdTemporary() {
  // Временно удаляем вебхук
  const deleteUrl = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`;
  UrlFetchApp.fetch(deleteUrl);
  console.log('Webhook temporarily disabled');
  
  // Ждем
  Utilities.sleep(2000);
  
  // Получаем обновления
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`;
  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());
  
  console.log('Recent messages:', JSON.stringify(data, null, 2));
  
  // Восстанавливаем вебхук
  const scriptUrl = 'https://script.google.com/macros/s/AKfycbyRisX1dzh4zoN42_hboMJz9N4e1uMUe84B9Cs8baKvcaTMBnVMrm-YLjT89Hb8O4Q6qg/exec';
  const setUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${scriptUrl}`;
  UrlFetchApp.fetch(setUrl);
  console.log('Webhook restored');
  
  return data;
}

function forceStartMenu() {
  const chatId = 1065954385;
  console.log('Force sending menu to:', chatId);
  showMainMenu(chatId);
  return 'Menu sent!';
}

function testBot() {
  const testChatId = 1065954385; // Ваш chat_id
  console.log('Testing bot for chat:', testChatId);
  
  // Тестируем отправку сообщения
  sendMessage(testChatId, '🤖 <b>Бот работает в режиме polling!</b>\n\nНапишите /start для начала');
  
  // Проверяем сообщения
  checkMessages();
  
  return 'Test completed!';
}

function testSimpleMenu() {
  const chatId = 1065954385;
  
  const simpleKeyboard = {
    inline_keyboard: [
      [{ text: "TEST Блекджек", callback_data: "game_blackjack" }],
      [{ text: "TEST Викторина", callback_data: "game_quiz" }]
    ]
  };
  
  sendMessage(chatId, "🔧 <b>ТЕСТОВОЕ МЕНЮ</b>\n\nНажмите кнопку:", simpleKeyboard);
  return 'Test menu sent!';
}

function debugCallback() {
  console.log('=== DEBUG: Checking for callback queries ===');
  checkMessages();
}

function switchToPollingPermanently() {
  // Удаляем вебхук навсегда
  const deleteUrl = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`;
  UrlFetchApp.fetch(deleteUrl);
  console.log('Webhook permanently deleted');
  
  // Очищаем все старые обновления
  const clearUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=1000000000`;
  UrlFetchApp.fetch(clearUrl);
  console.log('All old updates cleared');
  
  // Создаем триггер для автоматической проверки каждые 30 секунд
  ScriptApp.newTrigger('checkMessages')
    .timeBased()
    .everyMinutes(1)  // Проверка каждую минуту
    .create();
  
  console.log('Permanently switched to polling mode');
  
  // Тестируем сразу
  checkMessages();
  
  return 'Now using reliable polling! Bot will check messages every minute.';
}

function getBotStatus() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getMe`;
  const response = UrlFetchApp.fetch(url);
  console.log('Bot status:', response.getContentText());
  return response.getContentText();
}

function clearPending() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=1000000`;
  const response = UrlFetchApp.fetch(url);
  console.log('Cleared pending updates:', response.getContentText());
  return response.getContentText();
}
