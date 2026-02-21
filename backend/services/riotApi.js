const axios = require("axios");

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const REGION = "europe"; // for match-v5

// Basic validation and masked logging to help debugging (won't print full key)
if (!RIOT_API_KEY) {
  console.error("RIOT_API_KEY is not set. Check your .env and that dotenv is loaded before requiring this module.");
} else {
  const masked = RIOT_API_KEY.length > 8 ? RIOT_API_KEY.slice(0, 6) + '...' : '*****';
  console.log(`RIOT_API_KEY present (masked): ${masked}`);
}

// Use platform/global host for account endpoints and regional host for match-v5 endpoints
const ACCOUNT_HOST = "https://api.riotgames.com"; // platform/global host for account API
const REGION_HOST = `${REGION}.api.riotgames.com`; // regional host for match-v5

async function getSummonerByName(gameName, tagLine) {
  const path = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const url = `${ACCOUNT_HOST}${path}`;

  try {
    const res = await axios.get(url, {
      headers: {
        "X-Riot-Token": RIOT_API_KEY,
      },
    });

    return res.data;
  } catch (err) {
    // If DNS resolution fails for api.riotgames.com, retry using regional host as a fallback
    const code = err.code || (err.response && err.response.status);
    console.warn(`getSummonerByName initial request failed (code=${code}). url=${url} message=${err.message}`);

    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
      // try the regional host as a fallback
      const fallbackUrl = `https://${REGION_HOST}${path}`;
      console.log(`Retrying getSummonerByName with fallback host: ${fallbackUrl}`);
      try {
        const res2 = await axios.get(fallbackUrl, {
          headers: {
            "X-Riot-Token": RIOT_API_KEY,
          },
        });
        return res2.data;
      } catch (err2) {
        err2.message = `getSummonerByName fallback failed for url=${fallbackUrl} -> ${err2.message}`;
        throw err2;
      }
    }

    // Attach URL for easier debugging
    err.message = `getSummonerByName failed for url=${url} -> ${err.message}`;
    throw err;
  }
}

async function getLastMatchId(puuid) {
  const url = `https://${REGION_HOST}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=1`;

  try {
    const res = await axios.get(url, {
      headers: {
        "X-Riot-Token": RIOT_API_KEY,
      },
    });

    return res.data[0]; // most recent match ID
  } catch (err) {
    err.message = `getLastMatchId failed for url=${url} -> ${err.message}`;
    throw err;
  }
}

async function getMatchDetails(matchId) {
  const url = `https://${REGION_HOST}/lol/match/v5/matches/${encodeURIComponent(matchId)}`;

  try {
    const res = await axios.get(url, {
      headers: {
        "X-Riot-Token": RIOT_API_KEY,
      },
    });

    return res.data;
  } catch (err) {
    err.message = `getMatchDetails failed for url=${url} -> ${err.message}`;
    throw err;
  }
}

module.exports = {
  getSummonerByName,
  getLastMatchId,
  getMatchDetails,
};
