// Game state
let gameData = [];
let currentCardIndex = 0;
let gameState = "playing"; // playing, gameover, victory

// DOM elements
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const errorMessageEl = document.getElementById("error-message");
const cardEl = document.getElementById("card");
const cardTitleEl = document.getElementById("card-title");
const cardTextEl = document.getElementById("card-text");
const gameoverGifEl = document.getElementById("gameover-gif");
const choicesContainerEl = document.getElementById("choices-container");
const choicesEl = document.getElementById("choices");
const endScreenEl = document.getElementById("end-screen");
const endTitleEl = document.getElementById("end-title");
const endMessageEl = document.getElementById("end-message");
const restartFooterEl = document.getElementById("restart-footer");
const progressBarEl = document.getElementById("progress-bar");
const progressBarFillEl = document.getElementById("progress-bar-fill");
const progressBarTextEl = document.getElementById("progress-bar-text");

// Initialize game on page load
window.addEventListener("DOMContentLoaded", initializeGame);

/**
 * Initialize the game by loading data and setting up the first card
 */
async function initializeGame() {
  showLoading();

  try {
    // Load game data from cards.json
    const response = await fetch("cards.json");

    if (!response.ok) {
      throw new Error("Failed to load cards.json: " + response.statusText);
    }

    gameData = await response.json();

    if (!gameData || gameData.length === 0) {
      throw new Error("No game data found in cards.json");
    }

    // Reset game state
    gameState = "playing";
    currentCardIndex = 0;

    // Render initial state
    hideLoading();
    hideError();
    hideEndScreen();
    updateProgressBar();
    renderCard(gameData[currentCardIndex]);
    showRestartFooter();
  } catch (error) {
    hideLoading();
    showError("Failed to load game data: " + error.message);
  }
}

/**
 * Render a story card to the screen
 */
function renderCard(card) {
  if (!card) {
    showError("Card not found");
    return;
  }

  cardTitleEl.textContent = card.title;
  cardTextEl.textContent = card.text;

  // Show GIF if card has gif_url (for game over cards)
  if (card.gif_url) {
    gameoverGifEl.src = card.gif_url;
    gameoverGifEl.classList.remove("hidden");
  } else {
    gameoverGifEl.classList.add("hidden");
  }

  // Clear previous choices
  choicesEl.innerHTML = "";

  // If no answers (like the gameover card), hide choices
  if (!card.answers || card.answers.length === 0) {
    choicesContainerEl.style.display = "none";

    // This is the end game card, show end screen
    if (card.id === "gameover") {
      setTimeout(() => {
        showEndScreen("gameover", "💀 Game Over", card.text);
      }, 2000);
    }
    return;
  } else {
    choicesContainerEl.style.display = "block";
  }

  // Add a small delay before rendering new choices to prevent touch bleed-through
  setTimeout(() => {
    renderChoices(card.answers);
  }, 150);

  // Show card
  showCard();
}

/**
 * Render answer choices
 */
function renderChoices(answers) {
  answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.onclick = () => handleChoice(answer);
    button.textContent = answer.text;
    choicesEl.appendChild(button);
  });
}

/**
 * Handle player choice selection
 */
function handleChoice(answer) {
  // Handle outcome
  if (answer.outcome && answer.outcome.startsWith("gameover")) {
    // Find the correct gameover card by ID
    const gameOverCard = gameData.find((card) => card.id === answer.outcome);
    if (gameOverCard) {
      currentCardIndex = gameData.indexOf(gameOverCard);
      renderCard(gameOverCard);
    } else {
      // Fallback if no gameover card exists
      gameState = "gameover";
      showEndScreen(
        "gameover",
        "❌ Game Over",
        "Et coviden a abandonar la sala de parts perquè deixis de liar-la."
      );
    }
  } else if (answer.outcome === "continue") {
    // Move to next card in sequence
    currentCardIndex++;

    // Check if we've reached the end
    const nonGameoverCards = gameData.filter(
      (card) => !card.id.startsWith("gameover")
    );
    if (currentCardIndex >= nonGameoverCards.length) {
      // Player has completed all cards successfully!
      gameState = "victory";
      showEndScreen(
        "victory",
        "🎉 Victòria! 👼🏼",
        "Felicitats no només has aconseguit estar present al naixement sinó que a sobre has sigut un punt de suport clau perquè la teva parella passés una experiència de part el mínim problemàtica possible. Ole tu, cal estar ben informat per fer-ho el millor possible."
      );
    } else {
      // Render next card
      updateProgressBar();
      renderCard(gameData[currentCardIndex]);
    }
  }
}

/**
 * Display end screen (game over or victory)
 */
function showEndScreen(type, title, message) {
  hideCard();
  endTitleEl.textContent = title;
  endMessageEl.textContent = message;

  // Add "More Info" button for victory screen
  if (type === "victory") {
    // Remove any existing button first
    const existingButton = endScreenEl.querySelector(".more-info-button");
    if (existingButton) {
      existingButton.remove();
    }

    // Create button
    const moreInfoButton = document.createElement("button");
    moreInfoButton.textContent = "📚 Més Informació";
    moreInfoButton.className = "more-info-button";
    moreInfoButton.style.cssText = `
      margin-top: 20px;
      margin-bottom: 20px;
      padding: 12px 24px;
      background: #39db34ff;
      color: white;
      border: none;
      
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s ease;
    `;
    moreInfoButton.onmouseover = () =>
      (moreInfoButton.style.background = "#2980b9");
    moreInfoButton.onmouseout = () =>
      (moreInfoButton.style.background = "#3498db");
    moreInfoButton.onclick = showLinksModal;

    // Insert button after the message
    endMessageEl.parentNode.insertBefore(
      moreInfoButton,
      endMessageEl.nextSibling
    );
  }

  endScreenEl.classList.add("visible");
}

/**
 * Update progress bar
 */
function updateProgressBar() {
  // Count total non-gameover cards
  const totalCards = gameData.filter(
    (card) => !card.id.startsWith("gameover")
  ).length;
  const currentProgress = currentCardIndex + 1;
  const percentage = Math.round((currentProgress / totalCards) * 100);

  if (currentProgress <= totalCards) {
    progressBarFillEl.style.width = percentage + "%";
    progressBarTextEl.textContent = percentage + "%";
    progressBarEl.classList.remove("hidden");
  }
}

/**
 * Restart the game
 */
function restartGame() {
  initializeGame();
}

/**
 * Show modal with useful links
 */
function showLinksModal() {
  // Create modal overlay
  const modalOverlay = document.createElement("div");
  modalOverlay.id = "links-modal-overlay";
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  `;

  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.4s ease;
  `;

  // Modal title
  const modalTitle = document.createElement("h2");
  modalTitle.textContent = "📚 Recursos Útils";
  modalTitle.style.cssText = `
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 24px;
    text-align: center;
  `;

  // Links list
  const linksList = document.createElement("ul");
  linksList.style.cssText = `
    list-style: none;
    padding: 0;
    margin: 0 0 20px 0;
  `;

  // Define your links here
  const links = [
    {
      text: "Canal Salut sobre l'embaràs, el part i el post part",
      url: "https://canalsalut.gencat.cat/ca/salut-a-z/e/embaras-part-i-postpart/part/",
    },
    {
      text: "Grup de pares de preparació al part. Projecte Canviem-ho",
      url: "https://ajuntament.barcelona.cat/dretssocials/ca/banc-de-bones-practiques/grup-de-pares-de-preparacio-al-naixement-del-projecte-canviem-ho",
    },
    {
      text: "Llibre Ser bebé",
      url: "https://www.abacus.coop/es/ser-bebe/1513334.21.html",
    },
    {
      text: "Podcast La vida secreta de las madres",
      url: "https://podimo.com/es/shows/la-vida-secreta-de-las-madres",
    },
    {
      text: "Què Portar a l'Hospital. Donar a llum a Sant Joan de Déu",
      url: "https://www.sjdhospitalbarcelona.org/ca/ajuda/cites/donar-llum-sant-joan-deu",
    },
  ];

  // Create link items
  links.forEach((link) => {
    const li = document.createElement("li");
    li.style.cssText = "margin-bottom: 12px;";

    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link.text;
    a.style.cssText = `
      display: block;
      padding: 12px 16px;
      background: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.3s ease;
      text-align: center;
      font-weight: 500;
    `;
    a.onmouseover = () => (a.style.background = "#2980b9");
    a.onmouseout = () => (a.style.background = "#3498db");

    li.appendChild(a);
    linksList.appendChild(li);
  });

  // Close button
  const closeButton = document.createElement("button");
  closeButton.textContent = "Tancar";
  closeButton.style.cssText = `
    width: 100%;
    padding: 12px;
    background: #95a5a6;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.3s ease;
  `;
  closeButton.onmouseover = () => (closeButton.style.background = "#7f8c8d");
  closeButton.onmouseout = () => (closeButton.style.background = "#95a5a6");
  closeButton.onclick = () => closeLinksModal(modalOverlay);

  // Assemble modal
  modalContent.appendChild(modalTitle);
  modalContent.appendChild(linksList);
  modalContent.appendChild(closeButton);
  modalOverlay.appendChild(modalContent);

  // Add to page
  document.body.appendChild(modalOverlay);

  // Close on overlay click
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      closeLinksModal(modalOverlay);
    }
  };
}

/**
 * Close and remove the links modal
 */
function closeLinksModal(modalOverlay) {
  modalOverlay.style.animation = "fadeOut 0.3s ease";
  setTimeout(() => {
    modalOverlay.remove();
  }, 300);
}

// UI Helper Functions
function showLoading() {
  loadingEl.classList.remove("hidden");
}

function hideLoading() {
  loadingEl.classList.add("hidden");
}

function showError(message) {
  errorMessageEl.textContent = message;
  errorEl.classList.remove("hidden");
}

function hideError() {
  errorEl.classList.add("hidden");
}

function showCard() {
  cardEl.classList.add("visible");
}

function hideCard() {
  cardEl.classList.remove("visible");
}

function hideEndScreen() {
  endScreenEl.classList.remove("visible");
}

function showRestartFooter() {
  restartFooterEl.classList.remove("hidden");
}
