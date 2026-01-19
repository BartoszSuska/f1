let players = [];
let events = [];
let clips = [];
let currentEventIndex;

fetch("data.json")
  .then(response => response.json())
  .then(data => {
    players = data.players;
    events = data.events;
    const minorInfo = data.minorInfo;
    clips = data.clips;

    currentEventIndex = data.events.length - 1;
    const startingTable = initTable(players, events, currentEventIndex);
    renderTable(startingTable);
    refreshTable();
    initMinorInfo(minorInfo);
    saveNextRandomClip();
    playFirstClip();
  });

  const audio = document.getElementById("bg-music");
  const muteBtn = document.getElementById("muteBtn");
  const icon = muteBtn.querySelector("i");
  
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    if (audio.muted) {
      icon.classList.remove("fa-volume-up");
      icon.classList.add("fa-volume-xmark");
    } else {
      icon.classList.remove("fa-volume-xmark");
      icon.classList.add("fa-volume-up");
    }
  });

  document.addEventListener("click", function unlockAudio() {
    audio.muted = false;
    audio.volume = 0.5;
    audio.play();
    document.removeEventListener("click", unlockAudio);
  });


  function calculateOverallStats(players, events, eventIndex) {
    const stats = {};

    // inicjalizacja po playerId
    players.forEach(player => {
      stats[player.playerId] = {
        points: 0,
        races: 0
      };
    });

    // sumowanie eventów
    for (let i = 0; i <= eventIndex; i++) {
      events[i].results.forEach(result => {
        stats[result.playerId].points += result.points;
        stats[result.playerId].races += result.races;
      });
    }

    return stats;
  }

  //tworzenie tabeli
  function initTable(players, events, eventIndex) {
    const stats = calculateOverallStats(players, events, eventIndex);

    const table = players
      .filter(player => stats[player.playerId].races > 0)
      .map(player => {
        const s = stats[player.playerId];
        const avg = s.points / s.races;

        return {
          playerId: player.playerId,
          name: player.name,
          image: player.image,
          score: Math.trunc(Number(avg.toFixed(2)) * 100),
          color: player.color,
          text: player.text
        };
      })
      .sort((a, b) => b.score - a.score);

    updateEventLabel(events, eventIndex);
    return table;
  }

  // aktualizacja etykiety wydarzenia
  function updateEventLabel(events, eventIndex) {
    const label = document.getElementById("eventLabel");
    label.textContent = events[eventIndex].name;
  }

  function getRowPositions() {
    const rows = document.querySelectorAll(".leaderboard tbody tr");
    const positions = {};

    rows.forEach(row => {
      positions[row.dataset.playerId] = row.getBoundingClientRect().top;
    });

    return positions;
  }

  // renderowanie tabeli
  function renderTable(players) {
    const container = document.querySelector(".leaderboard");
    container.innerHTML = "";

    players.forEach(player => {
      const row = document.createElement("div");
      row.className = "leaderboard-row";
      row.dataset.playerId = player.playerId;

      row.innerHTML = `
        <div class="leaderboard-cell position"></div>
        <div class="leaderboard-cell driver"
            style="--driver-color:${player.color}; --driver-text-color:${player.text}">
          <img src="${player.image}">
          <span class="name">${player.name}</span>
        </div>
        <div class="leaderboard-cell score"></div>
      `;

      container.appendChild(row);
    });
  }

  // aktualizacja tabeli z animacją
  function updateTable(calculated) {
    const container = document.querySelector(".leaderboard");
    const rows = [...container.children];

    const oldPositions = {};
    rows.forEach(row => {
      oldPositions[row.dataset.playerId] = row.getBoundingClientRect().top;
    });

    // 1️⃣ ustaw nową kolejność w DOM
    calculated.forEach((item, index) => {
      const row = rows.find(r => r.dataset.playerId == item.playerId);
      row.querySelector(".position").textContent = index + 1;
      row.querySelector(".score").textContent = item.score;
      container.appendChild(row);
    });

    // 2️⃣ animacja FLIP
    rows.forEach(row => {
      const oldTop = oldPositions[row.dataset.playerId];
      const newTop = row.getBoundingClientRect().top;
      const delta = oldTop - newTop;

      if (delta) {
        row.style.transform = `translateY(${delta}px)`;
        row.offsetHeight;
        row.style.transform = "";
      }
    });
  }

  function refreshTable() {
    const newTable = initTable(players, events, currentEventIndex);
    updateTable(newTable);
    updateEventLabel(events, currentEventIndex);
  }

  document.getElementById("prevEvent").addEventListener("click", () => {
    if (currentEventIndex > 0) {
      currentEventIndex--;
      refreshTable();
    }
  });

  document.getElementById("nextEvent").addEventListener("click", () => {
    if (currentEventIndex < events.length - 1) {
      currentEventIndex++;
      refreshTable();
    }
  });

  // tworzenie paska wiadomości
  function initMinorInfo(minorInfo){
    const track = document.querySelector(".minor-info-panel");

    const shuffled = shuffle(minorInfo);

    const content = shuffled.map(text => `
      <span class="minor-item">
        ${text}
      </span>
    `).join("");

    track.innerHTML = content + content;
  }

  function shuffle(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
  }

  // całość klipów
  const clipElement = document.querySelector(".clip");
  const nextClipElement = document.querySelector(".nextClip");
  const autoplayButton = document.querySelector(".autoplay-toggle");
  let autoplayEnabled = false;

  const nextBtn = document.querySelector(".next-button");
  nextBtn.addEventListener("click", () => {
    playRandomClip();
  });

  autoplayButton.addEventListener("click", () => {
    autoplayEnabled = !autoplayEnabled;
    autoplayButton.classList.toggle("active", autoplayEnabled);
  });

  clipElement.addEventListener("ended", () => {
    if (autoplayEnabled) {
        playRandomClip();
    }
  });

  let nextClip = null;

  function saveNextRandomClip(){
    nextClip = clips[Math.floor(Math.random() * clips.length)];
    nextClipElement.src = nextClip.file;
    nextClipElement.load();
  }

  function playFirstClip() {
    // ustaw pierwszy klip normalnie, bez animacji
    clipElement.src = nextClip.file;
    clipElement.play();

    // przygotuj kolejny klip
    saveNextRandomClip();
  }

  function playRandomClip(){
    // clipElement.src = nextClip.file;
    // clipElement.play();
    animateRandomClip();
  }

function animateRandomClip() {
  console.log(nextClipElement.src);
  const activeClipSrc = nextClip.file;
  //nextClipElement.play();

  clipElement.classList.add("clip-animated");
  nextClipElement.classList.add("clip-animated");
  clipElement.classList.add("slide-out-right");
  nextClipElement.classList.add("slide-in-right");

    setTimeout(() => {
      clipElement.src = activeClipSrc;
      clipElement.load();

      clipElement.onloadeddata = () => {
        clipElement.classList.remove("clip-animated");
        nextClipElement.classList.remove("clip-animated");
        clipElement.classList.remove("slide-out-right");
        nextClipElement.classList.remove("slide-in-right");
        saveNextRandomClip();

      };


    }, 250);

}


function animateRandomClip2() {
  // przygotuj nextClipElement
  nextClipElement.src = nextClip.file;
  nextClipElement.style.display = "block";
  nextClipElement.style.transform = "translateX(100%)";
  nextClipElement.style.opacity = "1";
  //nextClipElement.play();

  // wymuś repaint, aby przeglądarka zauważyła transform
  nextClipElement.getBoundingClientRect();

  // animacja: obecny klip w lewo
  clipElement.classList.add("slide-out-left");

  // animacja: nowy klip wjeżdża
  nextClipElement.classList.add("slide-in-right");

  // po zakończeniu animacji
  setTimeout(() => {
    // clipElement przejmuje źródło nowego klipu
    clipElement.src = nextClipElement.src;
    clipElement.style.transform = "translateX(0)";
    clipElement.style.opacity = "1";
    clipElement.play();

    // reset nextClipElement
    nextClipElement.style.display = "none";
    nextClipElement.classList.remove("slide-in-right");

    // reset clipElement
    clipElement.classList.remove("slide-out-left");

    saveNextRandomClip();
  }, 260); // trochę więcej niż czas transition
}

