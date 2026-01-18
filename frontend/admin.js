// admin.js

const USERS = {
  "athelas88": "bangladesi_kiskecske",
  "acoeric": "szabolcs98"
};

const players = [
  "Vakpali1#2432", "KeWIN#21919", "FrozenStorm#21143", "AcoericHUN#2263", "SuperGoat#21554",
  "DavidColt22#2364", "tomi2000#2473", "MrJanimester#2376", "LordAthelas#21525",
  "TökösNővér#2301", "Kelakizar#2116", "Erdath#21390", "FriendShadow#2862", "Atum#2819"
];

const backendURL = '/api';

function checkLogin() {
  const u = document.getElementById('username').value.toLowerCase();
  const p = document.getElementById('password').value;
  if (USERS[u] === p) {
    document.getElementById('loginBox').style.display = "none";
    document.getElementById('adminContent').style.display = "block";
    initAdmin();
    loadCurrentPairings();
  } else {
    alert("Hibás név vagy jelszó.");
  }
}

function initAdmin() {
  const aSelect = document.getElementById("playerA");
  const bSelect = document.getElementById("playerB");
  players.forEach(p => {
    aSelect.innerHTML += `<option>${p}</option>`;
    bSelect.innerHTML += `<option>${p}</option>`;
  });

  const roundDiv = document.getElementById("roundInputs");
  roundDiv.innerHTML = "";
  for (let i = 1; i <= 4; i++) {
    roundDiv.innerHTML += `
      <label>${i}. kör:
        <select id="round${i}">
          <option value="1">A nyer</option>
          <option value="0">B nyer</option>
        </select>
      </label>
    `;
  }
}

async function submitMatch() {
  const a = document.getElementById('playerA').value;
  const b = document.getElementById('playerB').value;
  if (a === b) return alert("Nem lehet ugyanaz a két játékos!");

  const rounds = [];
  for (let i = 1; i <= 4; i++) {
    const val = parseInt(document.getElementById(`round${i}`).value, 10);
    rounds.push(val);
  }

  const matchData = { a, b, rounds };

  await fetch(`${backendURL}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(matchData)
  });

  alert("Meccs mentve!");
}

async function generatePairings() {
  await fetch(`${backendURL}/generate-pairings`)
    .then(res => res.json())
    .then(pairs => {
      alert("Új heti párosítás elmentve a szerveren!");
      renderPairings(pairs);
    })
    .catch(err => {
      alert("Hiba történt a párosítás generálásakor: " + err.message);
    });
}

async function loadCurrentPairings() {
  const res = await fetch(`${backendURL}/pairings`);
  const pairs = await res.json();
  renderPairings(pairs);
}

function renderPairings(pairs) {
  const list = document.getElementById("pairingsList");
  list.innerHTML = "";
  pairs.forEach(([A, B]) => {
    const li = document.createElement("li");
    li.textContent = `${A} vs ${B}`;
    list.appendChild(li);
  });
}
