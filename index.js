const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Проверяем наличие токена
if (!process.env.TELEGRAM_TOKEN) {
  console.log('❌ ОШИБКА: TELEGRAM_TOKEN не установлен в переменных окружения!');
  console.log('📝 Добавьте TELEGRAM_TOKEN в Environment Variables в Render');
  process.exit(1);
}

console.log('✅ TELEGRAM_TOKEN найден, запускаем бота...');

// Создаем экземпляр бота
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
  polling: true
});

// Middleware
app.use(express.json());

// Базовый маршрут для проверки работы
app.get('/', (req, res) => {
  res.json({
    status: '🚀 Бот работает!',
    timestamp: new Date().toISOString(),
    games: ['blackjack', 'poker', 'roulette', 'quiz', 'slots']
  });
});

// ==================== ИГРЫ ====================

// Блекджек
function startBlackjack(chatId) {
  const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const playerHand = [getRandomCard(cards), getRandomCard(cards)];
  const dealerHand = [getRandomCard(cards)];
  
  let message = `🎰 Блекджек!\n\n`;
  message += `👤 Ваши карты: ${playerHand.join(', ')}\n`;
  message += `💼 Дилер: ${dealerHand[0]}, ?\n\n`;
  message += `Выберите действие:`;
  
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Еще карту", callback_data: "bj_hit" }],
        [{ text: "⏹️ Хватит", callback_data: "bj_stand" }],
        [{ text: "🔙 Назад", callback_data: "menu" }]
      ]
    }
  });
}

// Покер
function startPoker(chatId) {
  const message = `🃏 Покер!\n\nИгра в разработке... Скоро будет доступна!`;
  
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔙 Назад", callback_data: "menu" }]
      ]
    }
  });
}

// Рулетка
function startRoulette(chatId) {
  const message = `🎯 Рулетка!\n\nСтавьте на:\n• 🔴 Красное\n• ⚫ Черное\n• 🟢 Зеро`;
  
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔴 Красное", callback_data: "roulette_red" }],
        [{ text: "⚫ Черное", callback_data: "roulette_black" }],
        [{ text: "🟢 Зеро", callback_data: "roulette_zero" }],
        [{ text: "🔙 Назад", callback_data: "menu" }]
      ]
    }
  });
}

// Викторина
function startQuiz(chatId) {
  const questions = [
    {
      question: "Столица Франции?",
      options: ["Лондон", "Берлин", "Париж", "Мадрид"],
      correct: 2
    },
    {
      question: "2 + 2 × 2 = ?",
      options: ["6", "8", "4", "10"],
      correct: 0
    }
  ];
  
  const currentQuestion = questions[0];
  let message = `🎪 Викторина!\n\n`;
  message += `❓ ${currentQuestion.question}\n\n`;
  
  currentQuestion.options.forEach((option, index) => {
    message += `${index + 1}. ${option}\n`;
  });
  
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "1", callback_data: "quiz_0" }, { text: "2", callback_data: "quiz_1" }],
        [{ text: "3", callback_data: "quiz_2" }, { text: "4", callback_data: "quiz_3" }],
        [{ text: "🔙 Назад", callback_data: "menu" }]
      ]
    }
  });
}

// Слоты
function startSlots(chatId) {
  const symbols = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '7️⃣'];
  const reel1 = getRandomSymbol(symbols);
  const reel2 = getRandomSymbol(symbols);
  const reel3 = getRandomSymbol(symbols);
  
  let message = `🎰 Игровые автоматы!\n\n`;
  message += `[ ${reel1} | ${reel2} | ${reel3} ]\n\n`;
  
  if (reel1 === reel2 && reel2 === reel3) {
    message += `🎉 ДЖЕКПОТ! Все символы совпали!`;
  } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
    message += `👍 Хорошо! Два символа совпали!`;
  } else {
    message += `😢 Попробуйте еще раз!`;
  }
  
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎰 Крутить снова", callback_data: "slots" }],
        [{ text: "🔙 Назад", callback_data: "menu" }]
      ]
    }
  });
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function getRandomCard(cards) {
  return cards[Math.floor(Math.random() * cards.length)];
}

function getRandomSymbol(symbols) {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function showMainMenu(chatId) {
  const message = `🎮 Добро пожаловать в игровой бот!\n\nВыберите игру:`;
  
  bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎲 Блекджек", callback_data: "blackjack" }],
        [{ text: "🃏 Покер", callback_data: "poker" }],
        [{ text: "🎯 Рулетка", callback_data: "roulette" }],
        [{ text: "🎪 Викторина", callback_data: "quiz" }],
        [{ text: "🎰 Слоты", callback_data: "slots" }]
      ]
    }
  });
}

// ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('🎮 Получена команда /start от', chatId);
  showMainMenu(chatId);
});

// Обработчик callback_query (кнопки)
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  console.log('🎯 Нажата кнопка:', data);
  
  try {
    switch(data) {
      case 'menu':
        showMainMenu(chatId);
        break;
      case 'blackjack':
        startBlackjack(chatId);
        break;
      case 'poker':
        startPoker(chatId);
        break;
      case 'roulette':
        startRoulette(chatId);
        break;
      case 'quiz':
        startQuiz(chatId);
        break;
      case 'slots':
        startSlots(chatId);
        break;
      case 'bj_hit':
        bot.sendMessage(chatId, "🎲 Вы взяли еще карту! (функционал в разработке)");
        break;
      case 'bj_stand':
        bot.sendMessage(chatId, "⏹️ Вы остановились! (функционал в разработке)");
        break;
      case 'roulette_red':
        bot.sendMessage(chatId, "🔴 Ставка на красное! Крутим рулетку...");
        setTimeout(() => {
          bot.sendMessage(chatId, Math.random() > 0.5 ? "🎉 Вы выиграли!" : "😢 Вы проиграли!");
        }, 1000);
        break;
      case 'quiz_0':
      case 'quiz_1':
      case 'quiz_2':
      case 'quiz_3':
        const answerIndex = parseInt(data.split('_')[1]);
        bot.sendMessage(chatId, answerIndex === 0 ? "✅ Правильно! 2 + 2 × 2 = 6" : "❌ Неправильно!");
        break;
      default:
        bot.sendMessage(chatId, "⚡ Действие выполнено!");
    }
    
    // Подтверждаем нажатие кнопки
    bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.log('❌ Ошибка обработки callback:', error);
    bot.sendMessage(chatId, "❌ Произошла ошибка, попробуйте снова");
  }
});

// Обработчик обычных сообщений
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, "🎮 Используйте /start для выбора игры");
  }
});

// Обработчики ошибок
bot.on('error', (error) => {
  console.log('❌ Ошибка бота:', error);
});

bot.on('polling_error', (error) => {
  console.log('❌ Ошибка polling:', error);
});

// ==================== ЗАПУСК СЕРВЕРА ====================

app.listen(PORT, () => {
  console.log('🚀 Сервер запущен на порту', PORT);
  console.log('✅ Бот готов к работе!');
  console.log('📱 Отправьте /start вашему боту в Telegram');
});

console.log('🔧 Инициализация завершена, ожидаем сообщения...');
