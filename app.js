const soundMoai = new Audio("https://www.myinstants.com/media/sounds/moai.mp3");

const soundRun = new Audio(
    "https://www.myinstants.com/media/sounds/oiia-oiia-sound.mp3"
);
soundRun.loop = true;
soundRun.volume = 0.5;

const soundWin = new Audio(
    "https://www.myinstants.com/media/sounds/yippee-tbh.mp3"
);
soundWin.volume = 0.8;

const TOTAL_RUNS_PLAYER = 19900;
const API_OFFSET = 100;
const BIOME_CHANGE_THRESHOLD = 2000;
const SIMULATION_SPEED_MS = 125;

let userId = "";
let currentRunsLoaded = 0;
let currentBiomeIndex = 0;
let simulationInterval;

const biomes = [
    {
        name: "Floresta",
        url: "https://www.shutterstock.com/image-photo/mixed-forest-behind-green-grass-260nw-2455179617.jpg",
    },
    {
        name: "Gelo",
        url: "https://www.shutterstock.com/image-vector/arctic-landscape-vector-illustration-snowy-260nw-2535203055.jpg",
    },
    {
        name: "Deserto",
        url: "https://static.vecteezy.com/system/resources/thumbnails/001/786/598/large/far-west-desert-seamless-landscape-animation-loop-video.jpg",
    },
    {
        name: "Rio De Janeiro",
        url: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Rio_de_Janeiro_Panoramic_from_P%C3%A3o_de_A%C3%A7%C3%BAcar_crop.jpg",
    },
    {
        name: "Time",
        url: "https://i.pinimg.com/originals/2c/5e/b4/2c5eb476123b15552bef158f90a86fd6.gif",
    },
    {
        name: "Spaghetti",
        url: "https://t3.ftcdn.net/jpg/03/48/33/20/360_F_348332074_9KJZhOZI7PzTLLp6HQTtVj9DkgHfGcLF.jpg",
    },
    {
        name: "Space",
        url: "https://www.shutterstock.com/shutterstock/videos/12663872/thumb/1.jpg",
    },
    {
        name: "Pink Floyd",
        url: "https://monkeybuzz.com.br/wp-content/uploads/2013/03/screenhunter_64-mar-01-1911.jpg",
    },
    {
        name: "Underwater",
        url: "https://static.vecteezy.com/system/resources/thumbnails/039/191/667/small_2x/an-underwater-view-of-a-coral-reef-with-fish-video.jpg",
    },
    {
        name: "Bliss",
        url: "https://upload.wikimedia.org/wikipedia/pt/2/27/Bliss_%28Windows_XP%29.png",
    },
];

const introScreen = document.getElementById("intro-screen");
const gameScreen = document.getElementById("game-screen");
const resultsScreen = document.getElementById("results-screen");

const playerInput = document.getElementById("player-input");
const moaiTrigger = document.getElementById("moai-trigger");

const displayPlayerName = document.getElementById("display-player-name");
const runsCounterSpan = document.getElementById("runs-counter");
const runsTotalSpan = document.getElementById("runs-total");
const biomeNameSpan = document.getElementById("current-biome-name");
const bgFront = document.getElementById("bg-front");
const bgBack = document.getElementById("bg-back");
const tableBody = document.getElementById("table-body");

const apiBase = "https://www.speedrun.com/api/v1";

runsTotalSpan.innerText = TOTAL_RUNS_PLAYER;
setupInitialBiomes();

playerInput.addEventListener("focus", () => {
    if (soundMoai.paused) soundMoai.play();
});

moaiTrigger.addEventListener("click", validateAndStart);
playerInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validateAndStart();
});

async function validateAndStart() {
    const name = playerInput.value.trim();
    if (!name) {
        alert("Por favor, digite o nome do player!");
        playerInput.focus();
        return;
    }

    try {
        const userUrl = `${apiBase}/users/${encodeURIComponent(playerInput)}`;
        const userResponse = await fetch(userUrl);
        await sleep(1000);

        if (userResponse.status === 404) {
            outputDiv.textContent = "User Not Found";
            alert(`Error: Player "${playerId}" could not be found.`);
            playerInput.focus();
            return;
        }

        if (!userResponse.ok) {
            throw new Error(
                `API User Check failed with status: ${userResponse.status}`
            );
        }

        const userData = await userResponse.json();
        const userId = userData.data.id;
    } catch (error) {
        console.error("Error fetching player runs:", error);
        outputDiv.textContent = "ERROR";
        alert("An unexpected error occurred. Check the console for details.");
        return;
    }
    soundMoai.pause();
    soundMoai.currentTime = 0;
    startGame();
}

function startGame() {
    introScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    displayPlayerName.innerText = playerName;

    soundRun.play().catch((e) => console.log("Audio bloqueado:", e));
    simulationInterval = setInterval(simulateApiFetch, SIMULATION_SPEED_MS);
}

function setupInitialBiomes() {
    bgFront.style.backgroundImage = `url('${biomes[0].url}')`;
    bgBack.style.backgroundImage = `url('${biomes[1].url}')`;
    biomeNameSpan.innerText = biomes[0].name;
}

function simulateApiFetch() {
    currentRunsLoaded += API_OFFSET;

    if (currentRunsLoaded >= TOTAL_RUNS_PLAYER) {
        currentRunsLoaded = TOTAL_RUNS_PLAYER;
        clearInterval(simulationInterval);
        updateUI();

        setTimeout(showResults, 1000);
    } else {
        checkBiomeTransition();
        updateUI();
    }
}

function updateUI() {
    runsCounterSpan.innerText = currentRunsLoaded;
}

function checkBiomeTransition() {
    if (
        currentRunsLoaded > 0 &&
        currentRunsLoaded % BIOME_CHANGE_THRESHOLD === 0
    ) {
        triggerBiomeFade();
    }
}

function triggerBiomeFade() {
    const nextBiomeIndex = (currentBiomeIndex + 1) % biomes.length;
    const nextBiome = biomes[nextBiomeIndex];

    bgFront.classList.add("fade-out");

    setTimeout(() => {
        bgFront.style.backgroundImage = `url('${nextBiome.url}')`;
        bgFront.classList.remove("fade-out");

        currentBiomeIndex = nextBiomeIndex;
        biomeNameSpan.innerText = nextBiome.name;

        const futureBiomeIndex = (currentBiomeIndex + 1) % biomes.length;
        bgBack.style.backgroundImage = `url('${biomes[futureBiomeIndex].url}')`;
    }, 200);
}

function showResults() {
    soundRun.pause();
    soundRun.currentTime = 0;
    soundWin.play().catch((e) => console.log("Audio bloqueado:", e));
    gameScreen.classList.add("hidden");
    resultsScreen.classList.remove("hidden");
    populateTable();
}

function populateTable() {
    const fakeData = [
        { cat: "Player", val: playerName },
        { cat: "Status", val: "Lenda Viva" },
        { cat: "Total Runs", val: TOTAL_RUNS_PLAYER.toLocaleString() },
        { cat: "WRs Confirmados", val: Math.floor(Math.random() * 20) + 1 },
        { cat: "Bioma Final", val: biomes[currentBiomeIndex].name },
        { cat: "Tempo Jogado", val: "320 Horas" },
        { cat: "Gato Preferido", val: "Maxwell" },
    ];

    tableBody.innerHTML = "";
    fakeData.forEach((item) => {
        let row = `<tr><td>${item.cat}</td><td><strong>${item.val}</strong></td></tr>`;
        tableBody.innerHTML += row;
    });
}

/*

*/