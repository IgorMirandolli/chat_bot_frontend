import { requestRecommendations } from "./api.js";

const form = document.querySelector("#preferences-form");
const steps = [...document.querySelectorAll(".quiz-step")];
const progressLabel = document.querySelector("#progress-label");
const progressBar = document.querySelector("#progress-bar");
const progressTrack = document.querySelector(".progress-track");
const stepCounter = document.querySelector("#step-counter");
const formError = document.querySelector("#form-error");
const backButton = document.querySelector("#back-button");
const nextButton = document.querySelector("#next-button");
const submitButton = document.querySelector("#submit-button");
const submitLabel = submitButton.querySelector(".button-label");
const resultsSection = document.querySelector("#results");
const recommendationList = document.querySelector("#recommendation-list");
const restartButton = document.querySelector("#restart-button");
const quizSection = document.querySelector("#recomendador");

let currentStep = 0;

function formatLabel(value) {
  return value.replaceAll("-", " ");
}

function getCurrentSelection() {
  return steps[currentStep].querySelector("input:checked");
}

function clearError() {
  formError.textContent = "";
}

function showStep(stepIndex, shouldFocus = true) {
  currentStep = stepIndex;

  steps.forEach((step, index) => {
    step.hidden = index !== currentStep;
  });

  const visibleStep = currentStep + 1;
  const progress = (visibleStep / steps.length) * 100;

  progressLabel.textContent = `Etapa ${visibleStep} de ${steps.length}`;
  stepCounter.textContent = `${visibleStep} de ${steps.length}`;
  progressBar.style.width = `${progress}%`;
  progressTrack.setAttribute("aria-valuenow", visibleStep);

  backButton.hidden = currentStep === 0;
  nextButton.hidden = currentStep === steps.length - 1;
  submitButton.hidden = currentStep !== steps.length - 1;
  clearError();

  if (shouldFocus) {
    const heading = steps[currentStep].querySelector("h2");
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}

function validateCurrentStep() {
  if (getCurrentSelection()) {
    clearError();
    return true;
  }

  formError.textContent = "Escolha uma opcao para continuar.";
  return false;
}

function createRecommendationCard(recommendation, position) {
  const card = document.createElement("article");
  const cardTop = document.createElement("div");
  const positionLabel = document.createElement("span");
  const scoreCircle = document.createElement("div");
  const scoreValue = document.createElement("strong");
  const genres = document.createElement("div");
  const heading = document.createElement("h3");
  const metadata = document.createElement("p");
  const synopsis = document.createElement("p");
  const reasonsTitle = document.createElement("p");
  const reasons = document.createElement("ul");

  card.className = "recommendation-card";
  if (position === 1) {
    card.classList.add("best-match");
  }

  cardTop.className = "card-top";
  positionLabel.className = position === 1 ? "best-badge" : "result-position";
  positionLabel.textContent =
    position === 1 ? "Melhor escolha" : `${position}a opcao`;

  scoreCircle.className = "score-circle";
  scoreCircle.style.setProperty("--score", `${recommendation.match * 3.6}deg`);
  scoreValue.textContent = `${recommendation.match}%`;
  scoreCircle.append(scoreValue);
  cardTop.append(positionLabel, scoreCircle);

  genres.className = "genre-list";
  recommendation.genres.forEach((genre) => {
    const genreLabel = document.createElement("span");
    genreLabel.textContent = formatLabel(genre);
    genres.append(genreLabel);
  });

  heading.textContent = recommendation.title;
  metadata.className = "metadata";
  metadata.textContent = `${recommendation.releaseYear} / ${recommendation.durationMinutes} minutos`;
  synopsis.className = "synopsis";
  synopsis.textContent = recommendation.synopsis;
  reasonsTitle.className = "reasons-title";
  reasonsTitle.textContent = "Por que combina com voce";

  recommendation.reasons.forEach((reason) => {
    const item = document.createElement("li");
    item.textContent = reason;
    reasons.append(item);
  });

  card.append(
    cardTop,
    genres,
    heading,
    metadata,
    synopsis,
    reasonsTitle,
    reasons,
  );

  return card;
}

function renderRecommendations(recommendations) {
  recommendationList.replaceChildren();

  recommendations.forEach((recommendation, index) => {
    recommendationList.append(
      createRecommendationCard(recommendation, index + 1),
    );
  });

  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

steps.forEach((step) => {
  step.addEventListener("change", clearError);
});

nextButton.addEventListener("click", () => {
  if (!validateCurrentStep()) {
    return;
  }

  showStep(currentStep + 1);
});

backButton.addEventListener("click", () => {
  showStep(currentStep - 1);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (currentStep < steps.length - 1) {
    if (validateCurrentStep()) {
      showStep(currentStep + 1);
    }
    return;
  }

  if (!validateCurrentStep()) {
    return;
  }

  const formData = new FormData(form);
  const preferences = {
    type: formData.get("type"),
    genre: formData.get("genre"),
    mood: formData.get("mood"),
    maxDuration: Number(formData.get("maxDuration")),
  };

  submitButton.disabled = true;
  submitLabel.textContent = "Buscando titulos...";

  try {
    const recommendations = await requestRecommendations(preferences);
    renderRecommendations(recommendations);
  } catch (error) {
    formError.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitLabel.textContent = "Ver recomendacoes";
  }
});

restartButton.addEventListener("click", () => {
  form.reset();
  resultsSection.hidden = true;
  recommendationList.replaceChildren();
  showStep(0, false);
  quizSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

showStep(0, false);
