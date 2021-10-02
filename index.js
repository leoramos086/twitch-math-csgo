const puppeteer = require("puppeteer");
const { twitchConnect } = require("./twitch");
const _ = require("lodash");
require("dotenv").config();

const PAGE_URL = process.env.HLTV_PAGE_MATH;
const IIME_INTERVAL = process.env.REFRESH_TIMEOUT;
const CHANNEL = process.env.TWITCH_CHANNEL;
const MESSAGE = process.env.TWITCH_MESSAGE;

let INFO = {
  map: "",
  team1: {
    position: "",
    name: "",
    point: "",
  },
  team2: {
    position: "",
    name: "",
    point: "",
  },
};

const twitch = twitchConnect();

(async () => {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  await page.goto(PAGE_URL);

  let interval = async () => {
    const bodyHandle = await page.$("body");

    const loadPage = await page.evaluate((body) => {
      const mapsPlayed = body.querySelectorAll(
        ".mapholder .played .map-name-holder"
      );
      const map = mapsPlayed[mapsPlayed.length - 1];
      const mapName = map.innerText;

      const teamsPlayed = body.querySelectorAll(".mapholder .results.played");
      const teams = teamsPlayed[teamsPlayed.length - 1];

      const team1Name = teams.querySelector(
        ".results-left .results-teamname"
      ).innerText;

      const team2Name = teams.querySelector(
        ".results-right .results-teamname"
      ).innerText;

      const ct = body.querySelector(".ctTeamHeaderBg");
      const ctName = ct.querySelector(".teamName").innerText.trim();
      const ctPoint = parseInt(body.querySelector(".ctScore").innerText.trim());

      const tr = body.querySelector(".tTeamHeaderBg");
      //   const trName = tr.querySelector(".teamName").innerText.trim();
      const trPoint = parseInt(body.querySelector(".tScore").innerText.trim());

      const team1 = {
        name: team1Name,
      };
      const team2 = {
        name: team2Name,
      };
      if (team1Name === ctName) {
        team1.position = "CT";
        team1.point = ctPoint;
        team2.position = "TR";
        team2.point = trPoint;
      } else {
        team2.position = "CT";
        team2.point = ctPoint;
        team1.position = "TR";
        team1.point = trPoint;
      }

      return {
        map: mapName,
        team1: team1,
        team2: team2,
      };
    }, bodyHandle);

    await bodyHandle.dispose();
    // console.log(loadPage);
    if (loadPage) {
      if (
        !_.isEqual(INFO, loadPage) &&
        (loadPage.team1.point != 0 || loadPage.team2.point != 0)
      ) {
        INFO = loadPage;

        const payload = MESSAGE.replace("{Team1Position}", INFO.team1.position)
          .replace("{Team1Name}", INFO.team1.name)
          .replace("{Team1Point}", INFO.team1.point)
          .replace("{Team2Position}", INFO.team2.position)
          .replace("{Team2Name}", INFO.team2.name)
          .replace("{Team2Point}", INFO.team2.point)
          .replace("{Map}", INFO.map);

        console.log(payload);

        twitch.say(CHANNEL, payload);
      }

      setTimeout(interval, IIME_INTERVAL);
    } else {
      await browser.close();
      twitch.disconnect();
    }
  };

  setTimeout(interval, IIME_INTERVAL);
})();
