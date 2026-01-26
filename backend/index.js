require("dotenv").config();
const express = require("express");
const { getSummonerByName, getLastMatchId, getMatchDetails } = require("./services/riotApi");

const app = express();
const port = process.env.PORT || 3000;

// Serve frontend files
app.use(express.static("public"));

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
    const lastMatchId = await getLastMatchId(summoner.puuid);
    const match = await getMatchDetails(lastMatchId);

    // Find the player in match participants
    const player = match.info.participants.find(p => p.puuid === summoner.puuid);

    // Calculate time since game in hours/days
    const gameTime = new Date(match.info.gameEndTimestamp); // timestamp in ms
    const now = new Date();
    const diffMs = now - gameTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    res.json({
      champion: player.championName,
      win: player.win,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      timeAgo: diffDays > 0 ? `${diffDays} day(s) ago` : `${diffHours} hour(s) ago`,
    });

  } catch (err) {
    console.error("Error fetching last game:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch last game" });
  }
});



app.listen(port, () => {
  console.log("Server running on http://localhost:" + port);
});


