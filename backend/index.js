const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require("express");
const { getSummonerByName, getLastMatchId, getMatchDetails } = require("./services/riotApi");

// Masked key log for quick debugging (safe)
if (process.env.RIOT_API_KEY) {
  const masked = process.env.RIOT_API_KEY.length > 8 ? process.env.RIOT_API_KEY.slice(0,6) + '...' : '*****';
  console.log(`RIOT_API_KEY loaded (masked): ${masked}`);
} else {
  console.warn('RIOT_API_KEY not found in environment after loading .env');
}

const app = express();
const port = process.env.PORT || 3000;

// Serve frontend files from the backend folder explicitly to avoid depending on process.cwd()
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: ensure root serves index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/test-riot", async (req, res) => {
  try {
    const data = await getSummonerByName("WoodyWonderBoy", "4124");
    res.json(data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json(err.response?.data || { error: err.message });
  }
});

app.get("/last-game", async (req, res) => {
  try {
    const summoner = await getSummonerByName("WoodyWonderBoy", "4124");
    const lastMatchId = await getLastMatchId(summoner.puuid);

    res.json({
      puuid: summoner.puuid,
      lastMatchId,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch last match" });
  }
});

app.get("/last-game/details", async (req, res) => {
  try {
    const { name, tag } = req.query;
    if (!name || !tag) return res.status(400).json({ error: "Missing name or tag" });

    const summoner = await getSummonerByName(name, tag);

    // try to get last match id; if none found (empty array / undefined) or 404, treat as hidden/old account
    let lastMatchId;
    try {
      // Dev helper: simulate no match found
      if (req.query && req.query.simulateNoMatch === 'true') {
        lastMatchId = null;
        console.log('simulateNoMatch enabled — simulating no last match for testing');
      } else {
        lastMatchId = await getLastMatchId(summoner.puuid);
      }
    } catch (err) {
      // If Riot returns 404 (no matches) treat as hidden/old account and give golden coin
      const status = err.response?.status || err.response?.data?.status?.status_code;
      console.warn(`getLastMatchId failed (status=${status}) for puuid=${summoner.puuid}. Interpreting as hidden/no-match.`);
      lastMatchId = null;
    }

    // If no last match found, treat as account hidden/old — return coin (daysSince >= 365) but only if summoner exists
    if (!lastMatchId) {
      const forcedDays = 366;
      return res.json({
        champion: null,
        win: null,
        kills: null,
        deaths: null,
        assists: null,
        visionScore: null,
        daysSince: forcedDays,
        timeAgo: 'No recent matches found (account hidden or older than Riot history).',
      });
    }

    const match = await getMatchDetails(lastMatchId);

    // Find the player in match participants
    const player = match.info.participants.find(p => p.puuid === summoner.puuid);

    if (!player) {
      return res.status(404).json({ error: "Player not found in the match" });
    }

    // Calculate time since game in hours/days
    const gameTime = new Date(match.info.gameEndTimestamp); // timestamp in ms
    const now = new Date();
    const diffMs = now - gameTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    let diffDays = Math.floor(diffHours / 24);

    // Dev helper: allow forcing the coin for testing via query param `forceCoin=true`
    // Example: /last-game/details?name=WoodyWonderBoy&tag=4124&forceCoin=true
    if (req.query && req.query.forceCoin === 'true') {
      diffDays = 366; // force > 365 so frontend will show the golden coin
      console.log('forceCoin enabled — returning diffDays=366 for testing');
    }

    res.json({
      champion: player.championName,
      win: player.win,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      visionScore: player.visionScore,
      // numeric days since the game ended; frontend uses this to toggle the coin token
      daysSince: diffDays,
      timeAgo: diffDays > 0 ? `${diffDays} day(s) ago` : `${diffHours} hour(s) ago`,
    });

    const poolPromise = require("./db");

    async function testDB() {
      try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT 1 AS test");
        console.log("DB connected!", result.recordset);
      } catch (err) {
        console.error("DB connection failed:", err);
      }
    }

    testDB();


  } catch (err) {
    console.error("Error fetching last game:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch last game" });
  }
});



app.listen(port, () => {
  console.log("Server running on http://localhost:" + port);
});
