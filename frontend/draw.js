const participants = [];
let latestDraw = null;

const participantInput = document.getElementById("participantName");
const addButton = document.getElementById("addParticipant");
const clearButton = document.getElementById("clearParticipants");
const generateButton = document.getElementById("generateDraw");
const downloadButton = document.getElementById("downloadJson");
const participantsList = document.getElementById("participantsList");
const drawBracket = document.getElementById("drawBracket");
const jsonOutput = document.getElementById("jsonOutput");

function renderParticipants() {
  participantsList.innerHTML = "";

  participants.forEach((name, index) => {
    const li = document.createElement("li");
    li.className = "participant-item";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = name;

    const removeButton = document.createElement("button");
    removeButton.textContent = "Eltávolítás";
    removeButton.className = "button-secondary";
    removeButton.addEventListener("click", () => removeParticipant(index));

    li.appendChild(nameSpan);
    li.appendChild(removeButton);
    participantsList.appendChild(li);
  });

  updateJsonOutput();
}

function addParticipant() {
  const name = participantInput.value.trim();
  if (!name) return;
  if (participants.includes(name)) {
    participantInput.value = "";
    participantInput.focus();
    return;
  }

  participants.push(name);
  participantInput.value = "";
  participantInput.focus();
  renderParticipants();
}

function removeParticipant(index) {
  participants.splice(index, 1);
  renderParticipants();
}

function clearParticipants() {
  participants.splice(0, participants.length);
  drawBracket.innerHTML = "";
  latestDraw = null;
  renderParticipants();
}

function nextPowerOfTwo(value) {
  if (value <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(value));
}

function createPlayerRow(label, value) {
  const row = document.createElement("div");
  row.className = "player-row";

  const nameSpan = document.createElement("span");
  nameSpan.textContent = value;
  nameSpan.className = "player-name";
  if (value === "BYE" || value === "TBD") {
    nameSpan.classList.add("player-placeholder");
  }

  const labelSpan = document.createElement("span");
  labelSpan.textContent = label;
  labelSpan.className = "player-label";

  row.appendChild(labelSpan);
  row.appendChild(nameSpan);
  return row;
}

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateDraw() {
  drawBracket.innerHTML = "";
  if (participants.length === 0) {
    latestDraw = null;
    updateJsonOutput();
    return;
  }

  const shuffled = shuffle(participants);
  const bracketSize = nextPowerOfTwo(shuffled.length);
  while (shuffled.length < bracketSize) {
    shuffled.push("BYE");
  }

  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matches.push({
      table: matches.length + 1,
      playerA: shuffled[i],
      playerB: shuffled[i + 1]
    });
  }

  const rounds = [matches];
  let roundMatches = matches.length;
  while (roundMatches > 1) {
    const nextRound = [];
    for (let i = 0; i < roundMatches; i += 2) {
      nextRound.push({
        table: nextRound.length + 1,
        playerA: "TBD",
        playerB: "TBD"
      });
    }
    rounds.push(nextRound);
    roundMatches = nextRound.length;
  }

  rounds.forEach((round, roundIndex) => {
    const roundColumn = document.createElement("div");
    roundColumn.className = "bracket-round";

    const roundTitle = document.createElement("div");
    roundTitle.className = "round-title";
    roundTitle.textContent = `${roundIndex + 1}. forduló`;
    roundColumn.appendChild(roundTitle);

    round.forEach(match => {
      const matchCard = document.createElement("div");
      matchCard.className = "bracket-match";

      const matchLabel = document.createElement("div");
      matchLabel.className = "match-label";
      matchLabel.textContent = `Meccs ${match.table}`;
      matchCard.appendChild(matchLabel);

      matchCard.appendChild(createPlayerRow("A", match.playerA));
      matchCard.appendChild(createPlayerRow("B", match.playerB));

      roundColumn.appendChild(matchCard);
    });

    drawBracket.appendChild(roundColumn);
  });

  latestDraw = {
    generatedAt: new Date().toISOString(),
    participants: participants.map(name => ({ name })),
    matches,
    rounds
  };

  updateJsonOutput();
}

function updateJsonOutput() {
  const data = latestDraw || {
    generatedAt: null,
    participants: participants.map(name => ({ name })),
    matches: []
  };

  jsonOutput.value = JSON.stringify(data, null, 2);
}

function downloadJson() {
  const data = jsonOutput.value || "{}";
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sorsolas.json";
  link.click();
  URL.revokeObjectURL(url);
}

addButton.addEventListener("click", addParticipant);
clearButton.addEventListener("click", clearParticipants);
generateButton.addEventListener("click", generateDraw);
downloadButton.addEventListener("click", downloadJson);
participantInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    addParticipant();
  }
});

renderParticipants();
