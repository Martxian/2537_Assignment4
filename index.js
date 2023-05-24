let difficulty = ""; // Global variable to store the selected difficulty
let countdown; // Declare the countdown variable in the global scope
let timer; // Declare the timer variable in the global scope
let gameStarted = false; // Global variable to track if the game has started
let powerUpUsed = false; // Global variable to track if the power-up button has been used

const generateCardGrid = (totalPairs) => {
  const gameGrid = $("#game_grid");
  gameGrid.empty(); // Clear the existing cards if any

  for (let i = 0; i < totalPairs * 2; i++) {
    const cardContainer = $("<div>").addClass("pokecard");
    const frontFace = $("<img>").addClass("front_face");
    const backFace = $("<img>").addClass("back_face").attr("src", "back.webp");

    cardContainer.append(frontFace);
    cardContainer.append(backFace);
    gameGrid.append(cardContainer);
  }

  // Set the grid size based on the selected difficulty
  if (difficulty === "Easy") {
    gameGrid.css("width", "600px");
    gameGrid.css("height", "400px");
  } else if (difficulty === "Normal") {
    gameGrid.css("width", "800px");
    gameGrid.css("height", "600px");
  }
  else if (difficulty === "Hard") {
    gameGrid.css("width", "1200px");
    gameGrid.css("height", "800px");
  }
};

const setup = async (selectedDifficulty) => {
  difficulty = selectedDifficulty;
  let firstCard = undefined;
  let secondCard = undefined;
  let clickCount = 0;
  let pairsMatched = 0;

  const totalPairs = getCardCount(selectedDifficulty) / 2;

  updateHeader(clickCount, totalPairs, pairsMatched, difficulty);

  const fetchRandomPokemon = async () => {
    try {
      const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1000');
      const pokemons = response.data.results;
      const totalPairs = getCardCount(difficulty) / 2;
      const cardFronts = $('.pokecard .front_face');
      const selectedIndexes = [];

      for (let i = 0; i < totalPairs; i++) {
        let randomIndex;

        do {
          randomIndex = Math.floor(Math.random() * pokemons.length);
        } while (selectedIndexes.includes(randomIndex));

        selectedIndexes.push(randomIndex);
        const pokemonName = pokemons[randomIndex].name;

        const pairIndex = i * 2;
        cardFronts.eq(pairIndex).attr('src', `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomIndex}.png`);
        cardFronts.eq(pairIndex + 1).attr('src', `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomIndex}.png`);
        cardFronts.eq(pairIndex).attr('alt', pokemonName);
        cardFronts.eq(pairIndex + 1).attr('alt', pokemonName);
      }

    } catch (error) {
      console.log('Error fetching Pokémon data', error);
    }
  };

  generateCardGrid(totalPairs);

  if (!gameStarted) {
    gameStarted = true;
    timer = getTimerDuration(selectedDifficulty); // Initial timer value in seconds

    countdown = setInterval(() => {
      timer--;
      updateTimer(timer);

      if (timer === 0) {
        clearInterval(countdown);
        handleGameOver();
      }
    }, 1000);
  }

  // Call fetchRandomPokemon function to load random Pokémon on cards
  await fetchRandomPokemon();

  $(".pokecard").on("click", function () {
    // Check if the clicked card is already flipped or two cards are already selected
    if ($(this).hasClass("flip") || firstCard && secondCard) {
      return; // Do nothing if the card is already flipped or two cards are already selected
    }

    $(this).toggleClass("flip");
    clickCount++;

    if (!firstCard) {
      firstCard = $(this).find(".front_face");
    } else {
      secondCard = $(this).find(".front_face");

      if (firstCard.attr("src") === secondCard.attr("src")) {
        firstCard = undefined; // Reset firstCard
        secondCard = undefined; // Reset secondCard
        $(this).off("click");
        pairsMatched++;

        // Check if all pairs are matched
        if (pairsMatched === totalPairs) {
          handleGameWin();
        }
      } else {
        setTimeout(() => {
          firstCard.parent().toggleClass("flip");
          secondCard.parent().toggleClass("flip");
          firstCard = undefined; // Reset firstCard
          secondCard = undefined; // Reset secondCard
        }, 800);
      }
    }

    updateHeader(clickCount, totalPairs, pairsMatched, difficulty);
  });

  $("#startButton").hide();
};

const getCardCount = (difficulty) => {
  if (difficulty === "Easy") {
    return 6;
  } else if (difficulty === "Normal") {
    return 12;
  } else if (difficulty === "Hard") {
    return 24;
  }
};

const getTimerDuration = (difficulty) => {
  if (difficulty === "Easy") {
    return 100;
  } else if (difficulty === "Normal") {
    return 200;
  } else if (difficulty === "Hard") {
    return 300;
  }
};

const getPowerUpDuration = (difficulty) => {
  if (difficulty === "Easy") {
    return 1;
  } else if (difficulty === "Normal") {
    return 2;
  } else if (difficulty === "Hard") {
    return 3;
  }
};

const updateHeader = (clickCount, totalPairs, pairsMatched, difficulty) => {
  const header = document.getElementById("header");
  header.innerHTML = ""; // Clear the existing content

  if (!powerUpUsed) {
    const powerUpButton = $("<button>").attr("id", "powerUpButton").text("Power-Up").addClass("btn btn-primary");
    powerUpButton.on("click", () => {
      const powerUpDuration = getPowerUpDuration(difficulty);
      flipAllCards(powerUpDuration * 1000);
      powerUpUsed = true;
      powerUpButton.prop("disabled", true);
    });
    header.appendChild(powerUpButton[0]);
  }

  const headerContent = document.createElement("div");
  headerContent.innerHTML = `Clicks: ${clickCount} <br>
    Pairs Left: ${totalPairs - pairsMatched} <br>
    Pairs Matched: ${pairsMatched} <br>
    Total Pairs: ${totalPairs} <br>
    Difficulty: ${difficulty}`;

  header.appendChild(headerContent);
};

const updateTimer = (timer) => {
  const timerElement = document.getElementById("timer");
  timerElement.innerHTML = `Timer: ${timer} seconds`;
};

const flipAllCards = (duration) => {
  $(".pokecard:not(.flip)").each(function () {
    const card = $(this);
    card.addClass("flip");
    setTimeout(function () {
      card.removeClass("flip");
    }, duration);
  });
};

const handleGameWin = () => {
  clearInterval(countdown); // Stop the timer
  alert("Congratulations! You've matched all the cards.");
};

const handleGameOver = () => {
  clearInterval(countdown); // Stop the timer
  gameStarted = false; // Reset gameStarted flag
  $(".pokecard").off("click"); // Remove click event listeners from cards
  alert("Game over! Time's up.");
};

$(document).ready(() => {
  $("#startButton").on("click", () => {
    const selectedDifficulty = $("input[name='difficulty']:checked").val();
    if (selectedDifficulty) {
      setup(selectedDifficulty);
      $("#game").show();
    } else {
      alert("Please select a difficulty level.");
    }
  });

  $("#themeButton").on("click", () => {
    $("body").toggleClass("dark-theme");
  });
});
