const { poolPromise, sql } = require("./index");

async function storeLastMatch(puuid, matchId, gameEndTimestamp) {
  const pool = await poolPromise;

  await pool.request()
    .input("puuid", sql.VarChar, puuid)
    .input("matchId", sql.VarChar, matchId)
    .input("gameEndTimestamp", sql.BigInt, gameEndTimestamp)
    .query(`
      INSERT INTO Matches (puuid, matchId, gameEndTimestamp)
      VALUES (@puuid, @matchId, @gameEndTimestamp)
    `);
}

module.exports = { storeLastMatch };
