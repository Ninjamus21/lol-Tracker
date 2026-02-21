const fetchBtn = document.getElementById("fetchBtn");
const resultDiv = document.getElementById("result");

fetchBtn.addEventListener("click", async () => {
  const gameName = document.getElementById("gameName").value.trim();
  const tagLine = document.getElementById("tagLine").value.trim();

  if (!gameName || !tagLine) {
    alert("Please enter both Summoner Name and TagLine!");
    return;
  }

  // Only update the stats area so we don't remove the token placeholder
  const statsWrap = document.getElementById('statsWrap') || resultDiv;
  statsWrap.innerHTML = "<p>Fetching...</p>";

  try {
    const res = await fetch(`/last-game/details?name=${encodeURIComponent(gameName)}&tag=${encodeURIComponent(tagLine)}`);
    if (!res.ok) throw new Error("Failed to fetch data");

    const data = await res.json();

    // If backend indicates there is no recent match (champion === null)
    if (data.champion === null) {
      // Render a friendly message but still show the coin token (daysSince will be >= 365 in that case)
      statsWrap.innerHTML = `
        <h2>${gameName}#${tagLine}</h2>
        <p class="timer">${data.timeAgo}</p>
        <p><span>Notice:</span> No recent matches found for this account. It may be hidden or older than Riot's match history.</p>
      `;

      // continue to token logic below (data.daysSince will be set by backend)
    } else {
      // build the stats HTML into #statsWrap so we don't remove the token element
      statsWrap.innerHTML = `
        <h2>${gameName}#${tagLine}</h2>
        <p class="timer">${data.timeAgo}</p>
        <p><span>Champion:</span> ${data.champion}</p>
        <p><span>Win:</span> ${data.win ? "Yes" : "No"}</p>
        <p><span>Kills:</span> ${data.kills}</p>
        <p><span>Deaths:</span> ${data.deaths}</p>
        <p><span>Assists:</span> ${data.assists}</p>
        <p><span>VisionScore:</span> ${data.visionScore}</p>
      `;
    }

    // Token logic: if daysSince >= 365 -> filled golden coin; otherwise unfilled outline
    const tokenWrap = document.getElementById('tokenWrap');
    if (tokenWrap) tokenWrap.innerHTML = '';

    const coin = document.createElement('div');
    coin.classList.add('coin-token');

    const label = document.createElement('div');
    label.classList.add('coin-label');

    const days = typeof data.daysSince === 'number' ? data.daysSince : null;

    if (days !== null && days >= 365) {
      coin.classList.add('filled');
      // give it a quick animate class to make it lively
      coin.classList.add('animate');
      coin.innerHTML = '<div class="shine"></div>';
      label.textContent = `Been away ${days} day(s) — golden coin unlocked!`;
      coin.setAttribute('title', `Been away ${days} day(s). Congrats — golden coin!`);
    } else if (days !== null) {
      coin.classList.add('unfilled');
      coin.innerHTML = '';
      label.textContent = `Been away ${days} day(s) — keep playing to earn a golden coin: (${days - 365} days back )`;
      coin.setAttribute('title', `Been away ${days} day(s). Reach 365 to unlock a golden coin.`);
    } else {
      coin.classList.add('unfilled');
      label.textContent = `No data`;
    }

    // If tokenWrap missing (older markup), append token to resultDiv
    if (tokenWrap) {
      tokenWrap.appendChild(coin);
      tokenWrap.appendChild(label);
    } else {
      resultDiv.appendChild(coin);
      resultDiv.appendChild(label);
    }

    // Remove animation after a short while so it's not constantly spinning
    setTimeout(() => coin.classList.remove('animate'), 3000);
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = "<p>Error fetching last game.</p>";
  }
});
