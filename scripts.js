let clips = [];

fetch("data.json")
  .then(response => response.json())
  .then(data => {
    const players = data.players;
    const minorInfo = data.minorInfo;
    clips = data.clips;

    initTable(players);
    initMinorInfo(minorInfo);
    getRandomClip();
  });

  const nextBtn = document.querySelector(".next-button");
  nextBtn.addEventListener("click", () => {
    getRandomClip();
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

  function initTable(players){
    const table = players.map(player => ({
        name: player.name,
        image: player.image,
        score: ((player.points / player.races).toFixed(2)) * 100,
        color: player.color,
        text: player.text
    })).sort((a, b) => b.score - a.score);

    renderTable(table);
  }

  function renderTable(players){
    const tableBody = document.querySelector(".leaderboard tbody");
    tableBody.innerHTML = "";

    players.forEach((player, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td class="position">${index + 1}</td>
            <td class="driver" style="--driver-color: ${player.color}; --driver-text-color: ${player.text}">
                <img src="${player.image}" alt="img">
                <span>${player.name}</span>
            </td>
            <td class="score">${player.score}</td>
        `;

        tableBody.appendChild(row);
    });
  }

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

  function getRandomClip(){
    const video = clips[Math.floor(Math.random() * clips.length)];
    const clip = document.getElementById("clip").src = video.file;
    clip.play();
  }
