const playerSelect = document.getElementById("playerSelect");
const statsDiv = document.getElementById("playerStats");

async function loadStats() {
  const res = await fetch("/backend/stats.json");
  const data = await res.json();

  const players = Object.keys(data.players).sort();
  playerSelect.innerHTML = players.map(p => `<option value="${p}">${p}</option>`).join("");

  playerSelect.addEventListener("change", () => displayStats(data.players[playerSelect.value]));
  displayStats(data.players[players[0]]);
}

function displayStats(player) {
  let html = `
    <h2>${playerSelect.value}</h2>
    <p>Lejátszott párbajok: <strong>${player.matches}</strong></p>
    <p>Győzelem: ${player.wins} • Döntetlen: ${player.draws} • Vereség: ${player.losses}</p>
    <p>Pont: ${player.points} • Winrate: ${player.winrate}%</p>
    <h3>Ellenfelek:</h3>
    <ul>${player.opponents.map(o => `<li>${o.name}: ${o.score} (${o.result})</li>`).join("")}</ul>
  `;
  statsDiv.innerHTML = html;
}

loadStats();

