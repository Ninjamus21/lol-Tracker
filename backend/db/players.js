const { poolPromise, sql } = require("./index");

async function upsertPlayer(puuid, gameName, tagLine) {
  const pool = await poolPromise;

  await pool.request()
    .input("puuid", sql.VarChar, puuid)
    .input("gameName", sql.VarChar, gameName)
    .input("tagLine", sql.VarChar, tagLine)
    .query(`
      MERGE Players AS target
      USING (SELECT @puuid AS puuid) AS source
      ON target.puuid = source.puuid
      WHEN MATCHED THEN
        UPDATE SET gameName = @gameName, tagLine = @tagLine
      WHEN NOT MATCHED THEN
        INSERT (puuid, gameName, tagLine)
        VALUES (@puuid, @gameName, @tagLine);
    `);
}

module.exports = { upsertPlayer };
