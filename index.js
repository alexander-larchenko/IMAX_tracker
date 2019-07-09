const axios = require('axios');
const parse = require('xml-parser');
const pcName = require('os').hostname();
const inspect = require('util').inspect;
const TelegramBot = require('node-telegram-bot-api');
const token = '476038060:AAHJ6iO3Q1i-qR_Wxbc6Lv-X5CUIRv0Uda0';
const bot = new TelegramBot(token, {polling: true});
const botChatId = 404323406;
let isSearchFound = false;
const minuteMS = 60000;

//=== SETTINGS
const notifyFailures = false;
const oneTimeNotification = false;
const searchDate = '2019-07-12'; // '2018-05-24'
const searchFilm = '00000000000000000000000000001772'; // movieId from https://planetakino.ua/showtimes/xml/
let updateInterval = 5;
let interval = null;
let lastMessage = '<empty>';
let initialCheck = true;

function searchFilmFunc () {
    axios.get('https://planetakino.ua/showtimes/xml/')
        .then(response => {
            const responseXML = parse(response.data);
            const showtimes = responseXML.root.children.find((entity) => entity.name === 'showtimes');
            const neededDay = showtimes.children.find((day) => day.attributes.date === searchDate);
            const currentTime = new Date().toLocaleString();
            if (neededDay) {
                const neededMovie = neededDay.children.find((show) => {
                    return show.attributes['movie-id'] === searchFilm;
                });

                if (neededMovie) {
                    lastMessage = currentTime + ' IMAX Schedule ' + searchDate + ' READY!!!';
                    bot.sendMessage(botChatId, lastMessage);
                    console.info(lastMessage);
                } else {
                    lastMessage = currentTime + ' IMAX Schedule for search date: ' + searchDate + ' is released, but your movie NOT FOUND';
                    if (notifyFailures || initialCheck) bot.sendMessage(botChatId, lastMessage);
                    console.error(lastMessage);
                }
                isSearchFound = !!neededMovie;
                if (oneTimeNotification && isSearchFound) {
                    stopTracker();
                }
            } else {
                lastMessage = currentTime + ' IMAX Schedule for search date: ' + searchDate + ' NOT FOUND';
                if (notifyFailures || initialCheck) bot.sendMessage(botChatId, lastMessage);
                console.error(lastMessage);
            }
            initialCheck = false;
        })
        .catch(error => {
            lastMessage = 'Error on search :(';
            bot.sendMessage(botChatId, lastMessage);
            console.log(error);
            initialCheck  = false;
        });
}

function stopTracker(withExit) {
    clearInterval(interval);
    bot.sendMessage(botChatId, pcName + ' Tracker Stopped.');
    if (withExit) {
        setTimeout(process.exit, 2500);
    }
}

function init() {
    initialCheck = true;
    searchFilmFunc();
    interval = setInterval(searchFilmFunc, updateInterval * minuteMS);
    bot.sendMessage(botChatId, pcName + ' New Tracker started. Checking every ' + updateInterval + ' minutes');
}

bot.onText(/^t$/, () => {
    bot.sendMessage(botChatId, pcName + ' Tracker Here. Checking every ' + updateInterval + ' minutes');
    bot.sendMessage(botChatId, 'Last Message: ' + lastMessage);
});

bot.onText(/^stop$/, () => {
    stopTracker();
});

bot.onText(/^start$/, () => {
    init();
});

bot.onText(/^pause \d+$/, (msg, text) => {
    const minutes = +text[0].match(/\d+/)[0];
    bot.sendMessage(botChatId, pcName + ' Pausing for ' + minutes + ' minutes');
    stopTracker();
    setTimeout(init, minutes * minuteMS);
});

bot.onText(/^interval \d+$/, (msg, text) => {
    const minutes = +text[0].match(/\d+/)[0];
    bot.sendMessage(botChatId, pcName + ' Changing interval to ' + minutes + ' minutes');
    stopTracker();
    updateInterval = minutes;
    init();
});


// Init
bot.sendMessage(botChatId, pcName + ' joined.');
//init();
