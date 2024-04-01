const TelegramBot = require("node-telegram-bot-api");
const botToken = "7195978100:AAExnMN-6wLit4UpVlh_3pqBR2GLAZ401nQ";
const bot = new TelegramBot(botToken, { polling: true });
const adminPassword = "1";
const Data = require("./db").Data;
const sendOptions = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Повар", callback_data: "chef" },
        { text: "Администратор", callback_data: "admin" },
      ],
    ],
  },
};
const backOptions = {
  reply_markup: {
    keyboard: [["Назад"]],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
};
const chefOptions = {
  reply_markup: {
    keyboard: [
      ["Продажа"],
      ["Пополнение"],
      ["Создать заявку"],
      ["Просмотр склада"],
      ["Списание"],
      ["Сдать смену"],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
};
const adminOptions = {
  reply_markup: {
    keyboard: [["Склад"], ["Меню"]],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
};
const menuOptions = {
  reply_markup: {
    keyboard: [
      ["Все позиции"],
      ["Просмотр рецептуры"],
      ["Просмотр себестоимости"],
      ["Вернуться на главную"],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
};
const storageOptions = {
  reply_markup: {
    keyboard: [
      ["Все ингредиенты"],
      ["Изменение стоимости"],
      ["Списание"],
      ["Вернуться в меню"],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  },
};

let costId, numberId;
let sold = {
  totalPrice: 0,
};
async function start() {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    let user = await initializeUser(chatId);
    if (text === "/start" || user.status === "default") {
      await bot.sendMessage(
        chatId,
        "Здравствуйте, я тест бот для приложения учета склада"
      );
      return await bot.sendMessage(chatId, "Выберите, кто вы:", sendOptions);
    }
    switch (user.status) {
      case "chef":
        return await chef(text, chatId);
      case "adminAuth":
        return await checkAdminPassword(text, chatId);
      case "admin":
        return await admin(text, chatId);
      case "menu":
        return await menu(text, chatId);
      case "showRecipe":
        return await showRecipe(chatId, text);
      case "changeCostId":
        return await changeCostId(text, chatId);
      case "changeCost":
        return await changeCost(text, chatId);
      case "createOrder":
        return await createOrder(text, chatId);
      case "storage":
        return await storage(text, chatId);
      case "changeNumberId":
        return await changeNumberId(text, chatId);
      case "changeNumber":
        return await changeNumber(text, chatId);
      case "changeNumberIdChef":
        return await changeNumberIdChef(text, chatId);
      case "changeNumberChef":
        return await changeNumberChef(text, chatId);
      case "addNumberId":
        return await addNumberId(text, chatId);
      case "addNumber":
        return await addNumber(text, chatId);
      case "purchase":
        return await purchase(text, chatId);
      case "sellNumber":
        return await sellNumber(text, chatId);
      case "showOwnPrice":
        return await showOwnPrice(chatId, text);
    }
  });
  bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    if (data === "chef") {
      Data.changeStatus("chef", chatId);
      return await bot.sendMessage(
        chatId,
        'Вы выбрали роль "Повар"',
        chefOptions
      );
    } else if (data === "admin") {
      Data.changeStatus("adminAuth", chatId);
      return await bot.sendMessage(
        chatId,
        "Введите пароль для авторизации администратора:"
      );
    }
    return await bot.deleteMessage(chatId, messageId);
  });
}

start();

async function admin(menuPoint, chatId) {
  //функции меню админа
  switch (menuPoint) {
    case "Меню":
      Data.changeStatus("menu", chatId);
      return await bot.sendMessage(
        chatId,
        'Вы перешли в раздел "Меню"',
        menuOptions
      );
    case "Склад":
      Data.changeStatus("storage", chatId);
      return await bot.sendMessage(
        chatId,
        'Вы перешли в раздел "Склад"',
        storageOptions
      );
    default:
      return await bot.sendMessage(chatId, "Дефолт админа выполнился");
  }
}

async function chef(menuPoint, chatId) {
  //функции меню повара
  switch (menuPoint) {
    case "Пополнение":
      Data.changeStatus("addNumberId", chatId);
      return await bot.sendMessage(
        chatId,
        "Введите номер ингредиента для пополнения.",
        backOptions
      );
    case "Создать заявку":
      await bot.sendMessage(chatId, "Введите заявку на продукты");
      return Data.changeStatus("createOrder", chatId);
    case "Просмотр склада":
      return await showIngredient(chatId);
    case "Списание":
      Data.changeStatus("changeNumberIdChef", chatId);
      return await bot.sendMessage(
        chatId,
        "Введите номер ингредиента для списания.",
        backOptions
      );
    case "Продажа":
      Data.changeStatus("purchase", chatId);
      await showPositions(chatId);
      return await bot.sendMessage(
        chatId,
        "Введите номер позиции для продажи."
      );
    case "Сдать смену":
      let str = "";
      for (let key in sold) {
        if (key == "totalPrice") {
          str += "Всего продано: " + sold[key] + "\n";
        } else {
          str += key + " " + sold[key] + "\n";
        }
      }
      sold = {
        totalPrice: 0,
      };
      return await bot.sendMessage(chatId, str.replaceAll("_", " "));
    default:
      return await bot.sendMessage(chatId, "Дефолт повара выполнился");
  }
}

async function menu(menuPoint, chatId) {
  //основное меню
  switch (menuPoint) {
    case "Все позиции":
      return await showPositions(chatId);
    case "Просмотр рецептуры":
      Data.changeStatus("showRecipe", chatId);
      await showPositions(chatId);
      return await bot.sendMessage(chatId, "Введите номер позиции");
    case "Вернуться на главную":
      Data.changeStatus("admin", chatId);
      return await bot.sendMessage(
        chatId,
        'Вы вернулись в "Главное меню"',
        adminOptions
      );
    case "Просмотр себестоимости":
      Data.changeStatus("showOwnPrice", chatId);
      await showPositions(chatId);
      return await bot.sendMessage(chatId, "Введите номер позиции");
    default:
      return await bot.sendMessage(chatId, "Дефолт меню выполнился");
  }
}

async function storage(menuPoint, chatId) {
  // меню ингридиентов
  switch (menuPoint) {
    case "Все ингредиенты":
      return await showIngredient(chatId);
    case "Изменение стоимости":
      Data.changeStatus("changeCostId", chatId);
      await showIngredient(chatId);
      return await bot.sendMessage(
        chatId,
        "Введите номер ингредиента для изменения цены.",
        backOptions
      );
    case "Списание":
      Data.changeStatus("changeNumberId", chatId);
      return await bot.sendMessage(
        chatId,
        "Введите номер ингредиента для списания.",
        backOptions
      );
    case "Вернуться в меню":
      Data.changeStatus("menu", chatId);
      return await bot.sendMessage(
        chatId,
        'Вы вернулись в раздел "Меню"',
        menuOptions
      );
    default:
      return await bot.sendMessage(chatId, "Дефолт хранилища выполнился");
  }
}

async function showRecipe(chatId, id) {
  // Просмотр рецептуры
  Data.changeStatus("menu", chatId);
  if (!isNaN(Number(id))) {
    let positions;
    let str = "";
    await new Promise((resolve, reject) => {
      Data.showRecipe(id, (err, data) => {
        if (err) {
          reject(err);
        } else {
          positions = data;
          resolve();
        }
      });
    });
    if (positions.length === 0) {
      str = "Номер не найден";
    } else {
      let isFirstLine = true; // флаг для первой строки
      for (let key in positions) {
        if (positions[key]) {
          if (isFirstLine) {
            // обработка первой строки без добавления "г"
            str += `${key} ${positions[key]}`;
            isFirstLine = false; // сброс флага после первой строки
          } else {
            str += `\n${key} ${positions[key]}г`; // добавление "г" ко всем остальным строкам
          }
        }
      }
    }
    return await bot.sendMessage(chatId, str.replaceAll("_", " "));
  } else {
    return await bot.sendMessage(chatId, "Неверный формат номера");
  }
}

function isFloat(number) {
  //проверка на число с плавающей точкой
  return /^\d+(\.\d+)?$/.test(number);
}

async function checkAdminPassword(password, chatId) {
  //проверка пароля админа
  if (password === adminPassword) {
    Data.changeStatus("admin", chatId);
    return await bot.sendMessage(
      chatId,
      "Вы успешно авторизованы как администратор!",
      adminOptions
    );
  }
}

async function createOrder(text, chatId) {
  // создание заявки
  Data.changeStatus("chef", chatId);
  await bot.sendMessage(5365708389, "Поступила новая заявка.");
  await bot.sendMessage(5365708389, text);
  return await bot.sendMessage(chatId, "Заявка успешно отправлена.");
}

async function initializeUser(chatId) {
  let user;
  await new Promise((resolve, reject) => {
    Data.findUser(chatId, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  }).then((data) => (user = data));
  if (!user) {
    Data.createUser(chatId);
    await new Promise((resolve, reject) => {
      Data.findUser(chatId, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).then((data) => (user = data));
  }
  return user;
}

async function changeNumberId(text, chatId) {
  //получение rowid для списания
  if (text == "Назад") {
    Data.changeStatus("storage", chatId);
    return await bot.sendMessage(
      chatId,
      'Вы вернулись в раздел "Склад"',
      storageOptions
    );
  }
  numberId = text;
  if (parseInt(Number(numberId)) && parseInt(Number(numberId)) == parseFloat(Number(numberId))) {
    await new Promise((resolve, reject) => {
      Data.findIngredient(text, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).then(async (data) => {
      if (data) {
        Data.changeStatus("changeNumber", chatId);
        return await bot.sendMessage(
          chatId,
          "Введите кол-во для списания.",
          backOptions
        );
      } else {
        return await bot.sendMessage(
          chatId,
          "Ингредиент не найден. Повторите ввод номера для списания.",
          backOptions
        );
      }
    });
  } else {
    return await bot.sendMessage(
      chatId,
      "Неверный формат записи. Повторите ввод номера для списания.",
      backOptions
    );
  }
}

async function changeNumber(number, chatId) {
  // получение цены для списания
  if (number == "Назад") {
    Data.changeStatus("storage", chatId);
    return await bot.sendMessage(
      chatId,
      'Вы вернулись в раздел "Склад"',
      storageOptions
    );
  }
  if (parseInt(Number(number)) && parseInt(Number(number)) == parseFloat(Number(number))) {
    let currentNumber;
    let currentIngredient;
    await new Promise((resolve, reject) => {
      Data.getIngredientNumber(numberId, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).then(async (data) => {
      currentNumber = data.number;
      currentIngredient = data.ingredient;
    });
    if (currentNumber < number)
      await bot.sendMessage(
        chatId,
        "Вы не можете списать больше, чем осталось. Повторите ввод кол-ва для списания.",
        backOptions
      );
    else {
      Data.changeIngredientNumber(currentNumber - number, numberId);
      Data.changeStatus("storage", chatId);
      await bot.sendMessage(5365708389, "Произошло списание.");
      await bot.sendMessage(
        5365708389,
        `Списали ${number}гр ингредиента ${currentIngredient}`
      );
      await bot.sendMessage(chatId, "Успешно списано.", storageOptions);
    }
  } else {
    await bot.sendMessage(
      chatId,
      "Неверный формат записи. Повторите ввод кол-ва для списания.",
      backOptions
    );
  }
}

async function changeCostId(text, chatId) {
  //получение rowid для изменения цены
  if (text == "Назад") {
    Data.changeStatus("storage", chatId);
    return await bot.sendMessage(
      chatId,
      'Вы вернулись в раздел "Склад"',
      storageOptions
    );
  }
  costId = text;
  if (parseInt(Number(costId)) && parseInt(Number(costId)) == parseFloat(Number(costId))) {
    await new Promise((resolve, reject) => {
      Data.findIngredient(text, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).then(async (data) => {
      if (data) {
        Data.changeStatus("changeCost", chatId);
        return await bot.sendMessage(chatId, "Введите новую цену", backOptions);
      } else {
        return await bot.sendMessage(
          chatId,
          "Ингредиент не найден. Повторите ввод номера для изменения цены.",
          backOptions
        );
      }
    });
  } else {
    return await bot.sendMessage(
      chatId,
      "Неверный формат записи. Повторите ввод номера для изменения цены.",
      backOptions
    );
  }
}

async function changeCost(price, chatId) {
  // получение цены для изменения
  if (price == "Назад") {
    Data.changeStatus("storage", chatId);
    return await bot.sendMessage(
      chatId,
      'Вы вернулись в раздел "Склад"',
      storageOptions
    );
  }
  if (isFloat(price)) {
    Data.changeIngredientCost(price, costId);
    Data.changeStatus("storage", chatId);
    return await bot.sendMessage(chatId, "Цена изменена", storageOptions);
  } else {
    return await bot.sendMessage(
      chatId,
      "Неверный формат записи. Повторите ввод цены для изменения.",
      backOptions
    );
  }
}

async function changeNumberIdChef(text, chatId) {
  //получение rowid для списания повара
  if (text == "Назад") {
    Data.changeStatus("chef", chatId);
    return await bot.sendMessage(
      chatId,
      'Вы вернулись в раздел "Повар"',
      chefOptions
    );
  }
  numberId = text;
  if (parseInt(Number(numberId)) && parseInt(Number(numberId)) == parseFloat(Number(numberId))) {
    await new Promise((resolve, reject) => {
      Data.findIngredient(text, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).then(async (data) => {
      if (data) {
        Data.changeStatus("changeNumberChef", chatId);
        return await bot.sendMessage(
          chatId,
          "Введите кол-во для списания.",
          backOptions
        );
      } else {
        return await bot.sendMessage(
          chatId,
          "Ингредиент не найден. Повторите ввод номера для списания.",
          backOptions
        );
      }
    });
  } else {
    return await bot.sendMessage(
      chatId,
      "Неверный формат записи. Повторите ввод номера для списания.",
      backOptions
    );
  }
}

async function changeNumberChef(number, chatId) {
  // получение цены для списания повара
  if (number == "Назад") {
    Data.changeStatus("chef", chatId);
    return await bot.sendMessage(
      chatId,
      'Вы вернулись в раздел "Повар"',
      chefOptions
    );
  }
  if (parseInt(Number(number)) && parseInt(Number(number)) == parseFloat(Number(number))) {
    let currentNumber;
    let currentIngredient;
    await new Promise((resolve, reject) => {
      Data.getIngredientNumber(numberId, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).then(async (data) => {
      currentNumber = data.number;
      currentIngredient = data.ingredient;
    });
    if (currentNumber < number)
      await bot.sendMessage(
        chatId,
        "Вы не можете списать больше, чем осталось. Повторите ввод кол-ва для списания.",
        backOptions
      );
    else {
      Data.changeIngredientNumber(currentNumber - number, numberId);
      Data.changeStatus("chef", chatId);
      await bot.sendMessage(5365708389, "Произошло списание.");
      await bot.sendMessage(
        5365708389,
        `Списали ${number}гр ингредиента ${currentIngredient}`
      );
      await bot.sendMessage(chatId, "Успешно списано.", chefOptions);
    }
  } else {
    await bot.sendMessage(
      chatId,
      "Неверный формат записи. Повторите ввод кол-ва для списания.",
      backOptions
    );
  }
}

async function addNumberId(text, chatId) {
  //получение rowid для пополнения
  if (text == "Назад") {
    Data.changeStatus("chef", chatId);
    return await bot.sendMessage(
      chatId,
      'Вы вернулись в раздел "Повар"',
      chefOptions
    );
  }
  numberId = text;
  if (parseInt(Number(numberId)) && parseInt(Number(numberId)) == parseFloat(Number(numberId))) {
    await new Promise((resolve, reject) => {
      Data.findIngredient(text, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).then(async (data) => {
      if (data) {
        Data.changeStatus("addNumber", chatId);
        return await bot.sendMessage(
          chatId,
          "Введите кол-во для пополнения.",
          backOptions
        );
      } else {
        return await bot.sendMessage(
          chatId,
          "Ингредиент не найден. Повторите ввод номера для пополнения.",
          backOptions
        );
      }
    });
  } else {
    return await bot.sendMessage(
      chatId,
      "Неверный формат записи. Повторите ввод номера для пополнения.",
      backOptions
    );
  }
}

async function addNumber(number, chatId) {
  // получение кол-ва для пополнения
  if (number == "Назад") {
    Data.changeStatus("chef", chatId);
    return await bot.sendMessage(
      chatId,
      'Вы вернулись в раздел "Повар"',
      chefOptions
    );
  }
  if (parseInt(Number(number)) && parseInt(Number(number)) == parseFloat(Number(number))) {
    let currentNumber;
    let currentIngredient;
    await new Promise((resolve, reject) => {
      Data.getIngredientNumber(numberId, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).then(async (data) => {
      currentNumber = data.number;
      currentIngredient = data.ingredient;
    });
    Data.changeIngredientNumber(
      Number(currentNumber) + Number(number),
      numberId
    );
    Data.changeStatus("chef", chatId);
    await bot.sendMessage(5365708389, "Произошло пополнение.");
    await bot.sendMessage(
      5365708389,
      `Пополнили ${number}гр ингредиента ${currentIngredient}`
    );
    await bot.sendMessage(chatId, "Успешно пополнено.", chefOptions);
  } else {
    await bot.sendMessage(
      chatId,
      "Неверный формат записи. Повторите ввод кол-ва для пополнения.",
      backOptions
    );
  }
}

async function showIngredient(chatId) {
  let ingredients;
  await new Promise((resolve, reject) => {
    Data.showIngredient((err, data) => {
      if (err) {
        reject(err);
      } else {
        ingredients = data;
        resolve();
      }
    });
  });
  let str = "";
  if (ingredients.length !== 0) {
    ingredients.forEach((element) => {
      str +=
        element.rowid +
        ". " +
        element.ingredient +
        " - " +
        element.cost +
        "р. "
        +
        " Остаток на складе: " +
        element.number +
        "\n";
      ("\n");
    });
  } else {
    str = "Список ингредиентов пуст";
  }
  return await bot.sendMessage(chatId, str);
}

async function showPositions(chatId) {
  let positions;
  await new Promise((resolve, reject) => {
    Data.allPositions((err, data) => {
      if (err) {
        reject(err);
      } else {
        positions = data;
        resolve();
      }
    });
  });
  let str = "";
  if (positions.length !== 0) {
    positions.forEach((element) => {
      str += element.rowid + ". " + element.Название + "\n";
    });
  } else {
    str = "Список позиций пуст";
  }
  return await bot.sendMessage(chatId, str.replaceAll("_", " "));
}

async function purchase(text, chatId) {
  // получение номера для продажи
  if (text == "Назад") {
    Data.changeStatus("chef", chatId);
    return await bot.sendMessage(
      chatId,
      'Вы вернулись в раздел "Повар"',
      chefOptions
    );
  }
  numberId = text;
  if (parseInt(Number(numberId)) && parseInt(Number(numberId)) == parseFloat(Number(numberId))) {
    await new Promise((resolve, reject) => {
      Data.findPosition(text, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).then(async (data) => {
      if (data) {
        Data.changeStatus("sellNumber", chatId);
        return await bot.sendMessage(
          chatId,
          "Введите кол-во для продажи.",
          backOptions
        );
      } else {
        return await bot.sendMessage(
          chatId,
          "Позиция не найдена. Повторите ввод номера для продажи.",
          backOptions
        );
      }
    });
  } else {
    return await bot.sendMessage(
      chatId,
      "Неверный формат записи. Повторите ввод номера для продажи.",
      backOptions
    );
  }
}

async function sellNumber(text, chatId) {
  // получение кол-ва для продажи
  if (text == "Назад") {
    Data.changeStatus("chef", chatId);
    return await bot.sendMessage(
      chatId,
      'Вы вернулись в раздел "Повар"',
      chefOptions
    );
  }
  if (parseInt(Number(numberId)) && parseInt(Number(numberId)) == parseFloat(Number(numberId))) {
    let currentNumber;
    let currentPrice;
    let positions;
    await new Promise((resolve, reject) => {
      Data.showRecipe(numberId, (err, data) => {
        if (err) {
          reject(err);
        } else {
          positions = data;
          resolve();
        }
      });
    });
    console.log(positions);
    if (sold.hasOwnProperty(positions.Название))
      sold[positions.Название] += Number(text);
    else sold[positions.Название] = Number(text);
    for (let key in positions) {
      if (positions[key] && key != "Название") {
        await new Promise((resolve, reject) => {
          Data.findIngredientByName(key, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        }).then(async (data) => {
          currentNumber = Number(data.number);
          currentPrice = Number(data.cost);
        });
        Data.changeIngredientNumberByName(
          currentNumber - Number(positions[key]) * Number(text),
          key
        );
        sold.totalPrice +=
          (currentPrice * Number(text) * Number(positions[key])) / 1000;
      }
    }
    console.log(sold);
    Data.changeStatus("chef", chatId);
    await bot.sendMessage(chatId, "Успешно продано.", chefOptions);
  } else {
    await bot.sendMessage(
      chatId,
      "Неверный формат записи. Повторите ввод кол-ва для продажи.",
      backOptions
    );
  }
}

async function showOwnPrice(chatId, id) {
  // получение себестоимости
  Data.changeStatus("menu", chatId);
  if (parseInt(Number(id)) && parseInt(Number(id)) == parseFloat(Number(id))) {
    let price = 0;
    let currentPrice;
    let positions;
    await new Promise((resolve, reject) => {
      Data.showRecipe(id, (err, data) => {
        if (err) {
          reject(err);
        } else {
          positions = data;
          resolve();
        }
      });
    });
    console.log(positions);
    for (let key in positions) {
      if (positions[key] && key != "Название") {
        await new Promise((resolve, reject) => {
          Data.findIngredientByName(key, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        }).then(async (data) => {
          currentPrice = Number(data.cost);
        });
        price += (currentPrice * Number(positions[key])) / 1000;
      }
    }
    return await bot.sendMessage(
      chatId,
      `Себестоимость: ${Math.ceil(price * 100) / 100}`
    );
  } else {
    return await bot.sendMessage(chatId, "Неверный формат номера");
  }
}

// async function addNumberIdAdmin(text, chatId) {
//   //получение rowid для пополнения
//   if (text == "Назад") {
//     Data.changeStatus("chef", chatId);
//     return await bot.sendMessage(
//       chatId,
//       'Вы вернулись в раздел ""',
//       chefOptions
//     );
//   }
//   numberId = text;
//   if (parseInt(Number(numberId)) && parseInt(Number(numberId)) == parseFloat(Number(numberId))) {
//     await new Promise((resolve, reject) => {
//       Data.findIngredient(text, (err, data) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(data);
//         }
//       });
//     }).then(async (data) => {
//       if (data) {
//         Data.changeStatus("addNumber", chatId);
//         return await bot.sendMessage(
//           chatId,
//           "Введите кол-во для пополнения.",
//           backOptions
//         );
//       } else {
//         return await bot.sendMessage(
//           chatId,
//           "Ингредиент не найден. Повторите ввод номера для пополнения.",
//           backOptions
//         );
//       }
//     });
//   } else {
//     return await bot.sendMessage(
//       chatId,
//       "Неверный формат записи. Повторите ввод номера для пополнения.",
//       backOptions
//     );
//   }
// }