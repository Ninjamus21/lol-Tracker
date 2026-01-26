const sql = require("mssql");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER,      // e.g., "SLEEPERBUILD\\SQLEXPRESS"
  database: process.env.DB_DATABASE,  // "LastLeagueGame"
  options: {
    trustServerCertificate: true,
  },
  authentication: {
    type: "ntlm",
    options: {
      domain: "",                     // usually empty for local
      userName: "",                   // your Windows user if needed
      password: "",                   // your Windows password if needed
    },
  },
};

const poolPromise = sql.connect(config);

module.exports = poolPromise;
