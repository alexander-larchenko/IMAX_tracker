const axios = require('axios');
const parse = require('xml-parser');
const inspect = require('util').inspect;
const TelegramBot = require('node-telegram-bot-api');
const token = '476038060:AAHJ6iO3Q1i-qR_Wxbc6Lv-X5CUIRv0Uda0';
const bot = new TelegramBot(token, {polling: true});
const botChatId = 404323406;
var isSearchFound = false;
const AVENGERS_INF_WAR = '2341';
const test_id = '3103';

//=== SETTINGS
const notifyFailures = false;
const oneTimeNotification = true;
const searchDate = '2018-05-11'; // '2018-05-24'
const searchFilm = AVENGERS_INF_WAR;
var interval = null;

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
                    bot.sendMessage(botChatId, currentTime + ' IMAX Schedule ' + searchDate + ' READY!!!');
                    console.info(currentTime +' IMAX Schedule ' + searchDate + ' READY!!!');
                } else {
                    if (notifyFailures) bot.sendMessage(botChatId, currentTime + ' IMAX Schedule for search date: ' + searchDate + ' is released, but your movie NOT FOUND');
                    console.error(currentTime +' IMAX Schedule for search date: ' + searchDate + ' is released, but your movie NOT FOUND');
                }
                isSearchFound = !!neededMovie;
                if (oneTimeNotification && isSearchFound) {
                    clearInterval(interval);
                    setTimeout(() => {
                        process.exit();
                    }, 5000);
                }
            } else {
                if (notifyFailures) bot.sendMessage(botChatId, currentTime + ' IMAX Schedule for search date: ' + searchDate + ' NOT FOUND');
                console.error(currentTime + ' IMAX Schedule for search date: ' + searchDate + ' NOT FOUND');
            }
        })
        .catch(error => {
            bot.sendMessage(botChatId, 'Error on search :(');
            console.log(error);
        });
}

searchFilmFunc();
interval = setInterval(searchFilmFunc, 5 * (60000 + Math.random() * 1000));


