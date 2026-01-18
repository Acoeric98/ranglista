// script.js

const players = [
  "Vakpali1#2432", "KeWIN#21919", "FrozenStorm#21143", "AcoericHUN#2263", "SuperGoat#21554",
  "DavidColt22#2364", "tomi2000#2473", "MrJanimester#2376", "LordAthelas#21525",
  "TökösNővér#2301", "Kelakizar#2116", "Erdath#21390", "FriendShadow#2862", "Atum#2819"
];

const backendURL = '/api';
let selectedPlayers = [];

async function refreshStandings() {
  const res = await fetch(`${backendURL}/matches`);
  const matches = await res.json();

  const stats = {};
  players.forEach(p => stats[p] = {
    gy: 0, d: 0, v: 0, diff: 0, wonRounds: 0, totalRounds: 0, streak: 0, maxStreak: 0, matches: 0
  });

  const history = {};
  players.forEach(p => history[p] = []);

  for (const m of matches) {
    const scoreA = m.rounds.filter(r => r === 1).length;
    const scoreB = 4 - scoreA;

    stats[m.a].matches++;
    stats[m.a].wonRounds += scoreA;
    stats[m.b].matches++;
    stats[m.b].wonRounds += scoreB;
    stats[m.a].totalRounds += 4;
    stats[m.b].totalRounds += 4;

    stats[m.a].diff += scoreA - scoreB;
    stats[m.b].diff += scoreB - scoreA;

    if (scoreA > scoreB) {
      stats[m.a].gy++;
      stats[m.b].v++;
      history[m.a].push("W");
      history[m.b].push("L");
    } else if (scoreB > scoreA) {
      stats[m.b].gy++;
      stats[m.a].v++;
      history[m.b].push("W");
      history[m.a].push("L");
    } else {
      stats[m.a].d++;
      stats[m.b].d++;
      history[m.a].push("D");
      history[m.b].push("D");
    }
  }

  for (const p of players) {
    let streak = 0, maxStreak = 0;
    for (const res of history[p]) {
      if (res === "W") {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else {
        streak = 0;
      }
    }
    stats[p].streak = streak;
    stats[p].maxStreak = maxStreak;
  }

  const sorted = Object.entries(stats).sort((a, b) => {
    const pa = a[1].gy * 3 + a[1].d;
    const pb = b[1].gy * 3 + b[1].d;
    if (pb !== pa) return pb - pa;
    return b[1].diff - a[1].diff;
  });

  const tbody = document.querySelector("#standingsTable tbody");
  tbody.innerHTML = "";

  sorted.forEach(([name, s], index) => {
    const points = s.gy * 3 + s.d;
    const winrate = s.totalRounds ? (s.wonRounds / s.totalRounds * 100).toFixed(1) : "-";

    let className = "";
    if (index === 0) className = "gold-border";
    else if (index === 1) className = "silver-border";
    else if (index === 2) className = "bronze-border";

    let winrateColor = "white";
    if (winrate >= 70) winrateColor = "lime";
    else if (winrate >= 50) winrateColor = "khaki";
    else if (winrate !== "-") winrateColor = "tomato";

    tbody.innerHTML += `
      <tr class="${className}">
        <td>${index + 1}</td>
        <td class="player-name" data-name="${name}">${name}</td>
        <td>${s.gy}</td>
        <td>${s.d}</td>
        <td>${s.v}</td>
        <td>${points}</td>
        <td>${s.diff}</td>
        <td>${s.matches}</td>
        <td style="color:${winrateColor}">${winrate}%</td>
      </tr>`;
  });

  document.querySelectorAll(".player-name").forEach(td => {
    td.addEventListener("click", () => handlePlayerClick(td.dataset.name));
  });

  showWinstreak(stats);
}

function showWinstreak(stats) {
  const sorted = Object.entries(stats).sort((a, b) => b[1].maxStreak - a[1].maxStreak);
  const top = sorted[0];
  if (top && top[1].maxStreak > 1) {
    const streakBox = document.createElement("div");
    streakBox.style.marginTop = "20px";
    streakBox.innerHTML = `<h2>Legnagyobb győzelmi sorozat: ${top[0]} (${top[1].maxStreak})</h2>`;
    document.body.appendChild(streakBox);
  }
}

function handlePlayerClick(name) {
  if (selectedPlayers.includes(name)) return;
  selectedPlayers.push(name);
  if (selectedPlayers.length === 2) {
    showHeadToHead(selectedPlayers[0], selectedPlayers[1]);
    selectedPlayers = [];
  }
}

async function showHeadToHead(a, b) {
  const res = await fetch(`${backendURL}/matches`);
  const matches = await res.json();

  const aMatches = matches.filter(m => m.a === a || m.b === a);
  const bMatches = matches.filter(m => m.a === b || m.b === b);

  const listA = aMatches.map(m => {
    const opponent = m.a === a ? m.b : m.a;
    const scoreA = m.a === a ? m.rounds.filter(r => r === 1).length : 4 - m.rounds.filter(r => r === 1).length;
    const scoreB = 4 - scoreA;
    return `${opponent} ${scoreA} - ${scoreB}`;
  });

  const listB = bMatches.map(m => {
    const opponent = m.a === b ? m.b : m.a;
    const scoreA = m.a === b ? m.rounds.filter(r => r === 1).length : 4 - m.rounds.filter(r => r === 1).length;
    const scoreB = 4 - scoreA;
    return `${opponent} ${scoreA} - ${scoreB}`;
  });

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "50%";
  container.style.left = "50%";
  container.style.transform = "translate(-50%, -50%)";
  container.style.zIndex = "999";
  container.style.padding = "15px";
  container.style.border = "2px solid #999";
  container.style.background = "#111";
  container.style.color = "#fff";
  container.style.maxWidth = "90vw";
  container.style.maxHeight = "90vh";
  container.style.overflowY = "auto";

  let html = `<h2>Head-to-Head: ${a} vs ${b}</h2><div style="display:flex; gap:50px;">`;
  html += `<div><h3>${a}</h3>${listA.map(x => `<div>${x}</div>`).join('')}</div>`;
  html += `<div><h3>${b}</h3>${listB.map(x => `<div>${x}</div>`).join('')}</div>`;
  html += `</div><button onclick="this.parentElement.remove()" style="margin-top:15px">Bezárás</button>`;

  container.innerHTML = html;
  document.body.appendChild(container);
}

async function loadPairings() {
  const res = await fetch(`${backendURL}/pairings`);
  const pairings = await res.json();

  const list = document.getElementById("pairingsList");
  list.innerHTML = "";
  pairings.forEach(([A, B]) => {
    const li = document.createElement("li");
    li.textContent = `${A} vs ${B}`;
    list.appendChild(li);
  });
}

refreshStandings();
loadPairings();
