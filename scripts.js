let players = [];
let seasons = [];
let clips = [];
let currentEventIndex;
let currentSeasonIndex;

fetch("data.json")
  .then(response => response.json())
  .then(data => {
    players = data.players;
    seasons = data.seasons;
    const minorInfo = data.minorInfo;
    clips = data.clips;

    currentSeasonIndex = data.seasons.length - 1;
    currentEventIndex = seasons[currentSeasonIndex].events.length - 1;
    const startingTable = initTable(players, seasons[currentSeasonIndex], currentEventIndex);
    renderTable(startingTable);
    startRandomBlinking();
    refreshTable();
    initMinorInfo(minorInfo);
    saveNextRandomClip();
    playFirstClip();
    initVolume();
  });

  const audio = document.getElementById("bg-music");
  const muteBtn = document.getElementById("muteBtn");
  const icon = muteBtn.querySelector("i");
  const volumeSlider = document.getElementById("volumeSlider");

  function initVolume() {
    volumeSlider.value = audio.volume;
    updateSliderFill();
  }

  function updateSliderFill() {
    const value = volumeSlider.value * 100;
    volumeSlider.style.background = `
      linear-gradient(
        to right,
        #ff1e00 ${value}%,
        #5c5c5c80 ${value}%
      )
    `;
  }

  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
    updateSliderFill();
    updateIcon();
  });
 
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;

    if (audio.volume === 0) {
      audio.volume = 0.25;
      volumeSlider.value = 0.25;
      audio.muted = !audio.muted;
      updateSliderFill();
    }

    updateIcon();
  });

  function updateIcon() {
    if (audio.muted || audio.volume === 0) {
      icon.classList.remove("fa-volume-up");
      icon.classList.add("fa-volume-xmark");
    } else {
      icon.classList.remove("fa-volume-xmark");
      icon.classList.add("fa-volume-up");
    }
  }

  document.addEventListener("click", function unlockAudio() {
    audio.muted = false;
    audio.volume = 0.25;
    audio.play();
    document.removeEventListener("click", unlockAudio);
    initVolume();
  });


  function calculateOverallStats(players, season, eventIndex) {
    const stats = {};
    console.log(season.name + " - event index: " + eventIndex);

    // inicjalizacja po playerId
    players.forEach(player => {
      stats[player.playerId] = {
        points: 0,
        races: 0
      };
    });

    // sumowanie eventów
    for (let i = 0; i <= eventIndex; i++) {
      season.events[i].results.forEach(result => {
        stats[result.playerId].points += result.points;
        stats[result.playerId].races += result.races;
      });
    }

    return stats;
  }

  //tworzenie tabeli
  function initTable(players, season, eventIndex) {
    const stats = calculateOverallStats(players, season, eventIndex);
    const table = players
      .map(player => {
        const s = stats[player.playerId];
        const avg = s.races > 0 ? s.points / s.races : 0;

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

    const event = season.events[currentEventIndex];
    updateEventLabel(event.name);
    updateSeasonLabel(season.name);
    return table;
  }

  // aktualizacja etykiety wydarzenia
  function updateEventLabel(eventName) {
    const label = document.getElementById("eventLabel");
    label.textContent = eventName;
  }

  function updateSeasonLabel(seasonName) {
    const label = document.getElementById("seasonLabel");
    label.textContent = seasonName;
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
      const isPanther = player.playerId === 1;
      const isKrzychu = player.playerId === 2;

      row.innerHTML = `
        <div class="leaderboard-cell position"></div>
        <div class="leaderboard-cell driver ${isPanther ? "panther" : ""}"
            style="--driver-color:${player.color}; --driver-text-color:${player.text}">
          <img src="${player.image}" class="${isKrzychu ? "blinking" : ""}"/>
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

    // ustaw nową kolejność w DOM
    let lastScore = null;
    let lastPosition = 0;

    calculated.forEach((item, index) => {
      const row = rows.find(r => r.dataset.playerId == item.playerId);

      let position;
      if (item.score === lastScore) {
        position = lastPosition;
      } else {
        position = index + 1;
      }

      row.querySelector(".position").textContent = position;
      row.querySelector(".score").textContent = item.races === 0 ? "—" : item.score;

      lastScore = item.score;
      lastPosition = position;

      container.appendChild(row);
    });


  }

  function refreshTable() {
    const season = seasons[currentSeasonIndex];
    const event = season.events[currentEventIndex];

    const newTable = initTable(players, season, currentEventIndex);
    updateTable(newTable);
    updateEventLabel(event.name);
    updateSeasonLabel(season.name);
  }

  //zmiana eventów
  document.getElementById("prevEvent").addEventListener("click", () => {
    if (currentEventIndex > 0) {
      currentEventIndex--;
    }
    else if (currentSeasonIndex > 0){
      currentSeasonIndex--;
      currentEventIndex = seasons[currentSeasonIndex].events.length - 1;
    }

    refreshTable();
  });

  document.getElementById("nextEvent").addEventListener("click", () => {
    const season = seasons[currentSeasonIndex];
    if (currentEventIndex < season.events.length - 1) {
      currentEventIndex++;
    }
    else if(currentSeasonIndex < seasons.length -1){
      currentSeasonIndex++;
      currentEventIndex = 0;
    }
    
    refreshTable();
  });

  // znikanie Krzycha
  function startRandomBlinking() {
    const blinkingImages = document.querySelectorAll("img.blinking");

    blinkingImages.forEach(img => {
      const blink = () => {
        img.classList.add("blink-active");

        setTimeout(() => {
          img.classList.remove("blink-active");

          const nextBlink =
            Math.random() * (60000 - 10000) + 10000; // 10–60s

          setTimeout(blink, nextBlink);
        }, 7000); // czas trwania animacji
      };

      const firstBlink =
        Math.random() * (60000 - 10000) + 10000;

      setTimeout(blink, firstBlink);
    });
  }

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

