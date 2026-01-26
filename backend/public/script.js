const fetchBtn = document.getElementById("fetchBtn");
const resultDiv = document.getElementById("result");

fetchBtn.addEventListener("click", async () => {
  const gameName = document.getElementById("gameName").value.trim();
  const tagLine = document.getElementById("tagLine").value.trim();

  if (!gameName || !tagLine) {
    alert("Please enter both Summoner Name and TagLine!");
    return;
  }

  resultDiv.innerHTML = "<p>Fetching...</p>";

  try {
    const res = await fetch(`/last-game/details?name=${encodeURIComponent(gameName)}&tag=${encodeURIComponent(tagLine)}`);
    if (!res.ok) throw new Error("Failed to fetch data");

    const data = await res.json();

    resultDiv.innerHTML = `
      <h2>${gameName}#${tagLine}</h2>
      <p class="timer">${data.timeAgo}</p>
      <p><span>Champion:</span> ${data.champion}</p>
      <p><span>Win:</span> ${data.win ? "Yes" : "No"}</p>
      <p><span>Kills:</span> ${data.kills}</p>
      <p><span>Deaths:</span> ${data.deaths}</p>
      <p><span>Assists:</span> ${data.assists}</p>
    `;
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = "<p>Error fetching last game.</p>";
  }
});
