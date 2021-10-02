const tmi = require("tmi.js");
require("dotenv").config();

const TWITCH_LOGIN = process.env.TWITCH_LOGIN;
const TWITCH_TOKEN = process.env.TWITCH_TOKEN;

const opts = {
  identity: {
    username: TWITCH_LOGIN,
    password: TWITCH_TOKEN,
  },
};

function twitchConnect() {
  const client = new tmi.Client(opts);
  client.connect().catch(console.error);
  client.on("connected", () => {
    console.log("Connected in Twitch");
  });

  return client;
}

module.exports = { twitchConnect };
