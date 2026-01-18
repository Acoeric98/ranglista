const participants = [];
let latestDraw = null;

const participantInput = document.getElementById("participantName");
const addButton = document.getElementById("addParticipant");
const clearButton = document.getElementById("clearParticipants");
const generateButton = document.getElementById("generateDraw");
const downloadButton = document.getElementById("downloadJson");
const participantsList = document.getElementById("participantsList");
const drawTableBody = document.querySelector("#drawTable tbody");
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
  drawTableBody.innerHTML = "";
  latestDraw = null;
  renderParticipants();
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
  drawTableBody.innerHTML = "";
  if (participants.length === 0) {
    latestDraw = null;
    updateJsonOutput();
    return;
  }

  const shuffled = shuffle(participants);
  if (shuffled.length % 2 !== 0) {
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

  matches.forEach(match => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${match.table}</td>
      <td>${match.playerA}</td>
      <td>${match.playerB}</td>
    `;
    drawTableBody.appendChild(row);
  });

  latestDraw = {
    generatedAt: new Date().toISOString(),
    participants: participants.map(name => ({ name })),
    matches
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
