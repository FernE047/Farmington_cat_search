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

const user = {
    name: "",
    id: "",
    runs: 0,
    games: new Set(),
    categories: new Set(),
    ils: 0,
    full_game: 0,
    levels: new Set(),
    platforms: new Set(),
    co_op_runs: 0,
};

const API_OFFSET = 100;
const BIOME_CHANGE_THRESHOLD = 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let isSearching = false;
let currentBiomeIndex = 0;

const biomes = [
    "https://www.shutterstock.com/image-photo/mixed-forest-behind-green-grass-260nw-2455179617.jpg",
    "https://www.shutterstock.com/image-vector/arctic-landscape-vector-illustration-snowy-260nw-2535203055.jpg",
    "https://static.vecteezy.com/system/resources/thumbnails/001/786/598/large/far-west-desert-seamless-landscape-animation-loop-video.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4b/Rio_de_Janeiro_Panoramic_from_P%C3%A3o_de_A%C3%A7%C3%BAcar_crop.jpg",
    "https://i.pinimg.com/originals/2c/5e/b4/2c5eb476123b15552bef158f90a86fd6.gif",
    "https://t3.ftcdn.net/jpg/03/48/33/20/360_F_348332074_9KJZhOZI7PzTLLp6HQTtVj9DkgHfGcLF.jpg",
    "https://www.shutterstock.com/shutterstock/videos/12663872/thumb/1.jpg",
    "https://monkeybuzz.com.br/wp-content/uploads/2013/03/screenhunter_64-mar-01-1911.jpg",
    "https://static.vecteezy.com/system/resources/thumbnails/039/191/667/small_2x/an-underwater-view-of-a-coral-reef-with-fish-video.jpg",
    "https://upload.wikimedia.org/wikipedia/pt/2/27/Bliss_%28Windows_XP%29.png",
];

const introScreen = document.getElementById("intro-screen");
const gameScreen = document.getElementById("game-screen");
const resultsScreen = document.getElementById("results-screen");

const playerInput = document.getElementById("player-input");
const moaiTrigger = document.getElementById("moai-trigger");

const displayPlayerName = document.getElementById("display-player-name");
const counterSpans = {
    runs: document.getElementById("runs-counter"),
    games: document.getElementById("games-counter"),
    categories: document.getElementById("categories-counter"),
    ils: document.getElementById("ils-counter"),
    full_game: document.getElementById("full_game-counter"),
    levels: document.getElementById("levels-counter"),
    platforms: document.getElementById("platforms-counter"),
    co_op_runs: document.getElementById("co_op_runs-counter"),
};
const bgFront = document.getElementById("bg-front");
const bgBack = document.getElementById("bg-back");
const tableBody = document.getElementById("table-body");

const API_BASE = "https://www.speedrun.com/api/v1";
const MAX_RUNS_PER_PAGE = 200;

setupInitialBiomes();

playerInput.addEventListener("focus", () => {
    if (soundMoai.paused) soundMoai.play();
});

moaiTrigger.addEventListener("click", validateAndStart);
playerInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") validateAndStart();
});

async function validateAndStart() {
    if (isSearching) return;
    user.name = "";
    user.id = "";
    user.runs = 0;
    user.games = new Set();
    user.categories = new Set();
    user.ils = 0;
    user.full_game = 0;
    user.levels = new Set();
    user.platforms = new Set();
    user.co_op_runs = 0;
    const name = playerInput.value.trim();
    user.name = name;
    if (!name) {
        alert("Por favor, digite o nome do player!");
        playerInput.focus();
        return;
    }
    deactivate_moai();

    try {
        const userUrl = `${API_BASE}/users/${encodeURIComponent(user.name)}`;
        const userResponse = await fetch(userUrl);
        await sleep(1000);

        if (userResponse.status === 404) {
            alert(`Error: Player "${user.name}" could not be found.`);
            playerInput.focus();
            return;
        }

        if (!userResponse.ok) {
            throw new Error(
                `API User Check failed with status: ${userResponse.status}`
            );
        }

        const userData = await userResponse.json();
        user.id = userData.data.id;
    } catch (error) {
        console.error("Error fetching player runs:", error);
        alert(`Error: Player "${user.name}" could not be found.`);
        return;
    }
    soundMoai.pause();
    soundMoai.currentTime = 0;
    startGame();
}

function startGame() {
    introScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    displayPlayerName.innerText = user.name;

    soundRun.play().catch((e) => console.log("Audio bloqueado:", e));
    fetchAndAnimateRuns();
}

function setupInitialBiomes() {
    bgFront.style.backgroundImage = `url('${biomes[0]}')`;
    bgBack.style.backgroundImage = `url('${biomes[1]}')`;
}

async function fetchAndAnimateRuns() {
    let offset = 0;
    let keepFetching = true;
    let direction = "asc";
    let runsId = [];

    while (keepFetching) {
        const runsUrl = `${API_BASE}/runs?status=verified&user=${user.id}&max=${MAX_RUNS_PER_PAGE}&offset=${offset}&orderby=date&direction=${direction}`;

        try {
            const runsResponse = await fetch(runsUrl);

            await new Promise((resolve) => setTimeout(resolve, 500));

            if (!runsResponse.ok) {
                throw new Error(
                    `API Fetch failed with status: ${runsResponse.status}`
                );
            }

            const runsData = await runsResponse.json();
            const runs = runsData.data.filter(
                (run) => !runsId.includes(run.id)
            );

            user.runs += runs.length;
            user.ils += runs.filter((run) => run.level !== null).length;
            user.full_game += runs.filter((run) => run.level === null).length;
            user.co_op_runs += runs.filter(
                (run) => run.players.length > 1
            ).length;

            runs.forEach((run) => {
                user.games.add(run.game);
                user.categories.add(run.category);
                user.levels.add(run.level);
                const platform = run.system.platform;
                if (platform !== null) user.platforms.add(platform);
            });

            checkBiomeTransition();
            updateUI();

            if (runs.length < MAX_RUNS_PER_PAGE) keepFetching = false;
            else offset += MAX_RUNS_PER_PAGE;
            if (offset == 10000) {
                if (direction == "asc") {
                    direction = "desc";
                    offset = 0;
                    runsId = runs.map((run) => run.id);
                } else {
                    console.log(
                        `https://www.speedrun.com/api/v2/GetUserLeaderboard?userId=${user.id}`
                    );
                    const runsResponse = await fetch(
                        `https://www.speedrun.com/api/v2/GetUserLeaderboard?userId=${user.id}`
                    );

                    await new Promise((resolve) => setTimeout(resolve, 500));

                    if (!runsResponse.ok) {
                        throw new Error(
                            `API Fetch failed with status: ${runsResponse.status}`
                        );
                    }

                    const searchData = await runsResponse.json();
                    user.runs = searchData.runs.length;
                    user.categories = { size: searchData.categories.length };
                    user.games = { size: searchData.games.length };
                    user.levels = { size: searchData.levels.length };
                    user.platforms = { size: searchData.platforms.length };
                    user.ils = 0;
                    user.full_game = 0;
                    user.co_op_runs = 0;
                    updateUI();
                    searchData.runs.forEach((run) => {
                        if (run.levelId !== null) user.ils += 1;
                        else user.full_game += 1;
                        if (run.playerIds.length > 1) user.co_op_runs += 1;
                        updateUI();
                    });
                    keepFetching = false;
                }
            }
        } catch (error) {
            console.error("Erro durante a busca de runs:", error);
            keepFetching = false;
        }
    }

    setTimeout(() => {
        showResults();
    }, 1000);
}

function updateUI() {
    counterSpans.runs.innerText = user.runs;
    counterSpans.games.innerText = user.games.size;
    counterSpans.categories.innerText = user.categories.size;
    counterSpans.ils.innerText = user.ils;
    counterSpans.full_game.innerText = user.full_game;
    counterSpans.levels.innerText = user.levels.size;
    counterSpans.platforms.innerText = user.platforms.size;
    counterSpans.co_op_runs.innerText = user.co_op_runs;
}

function checkBiomeTransition() {
    if (user.runs > 0 && user.runs % BIOME_CHANGE_THRESHOLD === 0) {
        triggerBiomeFade();
    }
}

function triggerBiomeFade() {
    const nextBiomeIndex = (currentBiomeIndex + 1) % biomes.length;
    const nextBiome = biomes[nextBiomeIndex];

    bgFront.classList.add("fade-out");

    setTimeout(() => {
        bgFront.style.backgroundImage = `url('${nextBiome}')`;
        bgFront.classList.remove("fade-out");

        currentBiomeIndex = nextBiomeIndex;

        const futureBiomeIndex = (currentBiomeIndex + 1) % biomes.length;
        bgBack.style.backgroundImage = `url('${biomes[futureBiomeIndex]}')`;
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
    const userData = [
        { cat: "Name", val: user.name },
        { cat: "Runs", val: user.runs },
        { cat: "Games", val: user.games.size },
        { cat: "Categories", val: user.categories.size },
        { cat: "ils-Runs", val: user.ils },
        { cat: "Full-Game Runs", val: user.full_game },
        { cat: "Levels", val: user.levels.size },
        { cat: "Platforms", val: user.platforms.size },
        { cat: "Co-op Runs", val: user.co_op_runs },
    ];

    tableBody.innerHTML = "";
    userData.forEach((item) => {
        let row = `<tr><td>${item.cat}</td><td><strong>${item.val}</strong></td></tr>`;
        tableBody.innerHTML += row;
    });
    activate_moai();
}

function deactivate_moai() {
    isSearching = true;
    moaiTrigger.classList.add("disabled-moai");
}

function activate_moai() {
    isSearching = false;
    moaiTrigger.classList.remove("disabled-moai");
}
