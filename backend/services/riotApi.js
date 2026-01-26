const axios = require("axios");

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const REGION = "europe"; // for match-v5

async function getSummonerByName(gameName, tagLine) {
  const url = `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;

  const res = await axios.get(url, {
    headers: {
      "X-Riot-Token": RIOT_API_KEY,
    },
  });

  return res.data;
}

async function getLastMatchId(puuid) {
  const url = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=1`;

  const res = await axios.get(url, {
    headers: {
      "X-Riot-Token": RIOT_API_KEY,
    },
  });

  return res.data[0]; // most recent match ID
}

async function getMatchDetails(matchId) {
  const url = `https://${REGION}.api.riotgames.com/lol/match/v5/matches/${matchId}`;

  const res = await axios.get(url, {
    headers: {
      "X-Riot-Token": RIOT_API_KEY,
    },
  });

  return res.data;
}

module.exports = {
  getSummonerByName,
  getLastMatchId,
  getMatchDetails,
};
