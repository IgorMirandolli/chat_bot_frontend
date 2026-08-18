import { requestRecommendations } from "./api.js";

const form = document.querySelector("#preferences-form");
const conversation = document.querySelector("#conversation");
const resultsSection = document.querySelector("#results");
const recommendationList = document.querySelector("#recommendation-list");
const submitButton = form.querySelector("button[type='submit']");

const typeLabels = {
  movie: "um filme",
  series: "uma serie",
};

function formatLabel(value) {
  return value.replaceAll("-", " ");
}

function appendMessage(text, sender) {
  const message = document.createElement("div");
  const paragraph = document.createElement("p");

  message.className = `message message-${sender}`;
  paragraph.textContent = text;
  message.append(paragraph);
  conversation.append(message);
  message.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function createRecommendationCard(recommendation, position) {
  const card = document.createElement("article");
  const rank = document.createElement("span");
  const heading = document.createElement("h3");
  const metadata = document.createElement("p");
  const match = document.createElement("strong");
  const scoreTrack = document.createElement("div");
  const scoreBar = document.createElement("span");
  const synopsis = document.createElement("p");
  const reasons = document.createElement("ul");

  card.className = "recommendation-card";
  rank.className = "rank";
  rank.textContent = String(position).padStart(2, "0");
  heading.textContent = recommendation.title;
  metadata.className = "metadata";
  metadata.textContent = `${recommendation.releaseYear} | ${recommendation.durationMinutes} min`;
  match.className = "match";
  match.textContent = `${recommendation.match}% de compatibilidade`;
  scoreTrack.className = "score-track";
  scoreBar.style.width = `${recommendation.match}%`;
  scoreTrack.append(scoreBar);
  synopsis.className = "synopsis";
  synopsis.textContent = recommendation.synopsis;

  recommendation.reasons.forEach((reason) => {
    const item = document.createElement("li");
    item.textContent = reason;
    reasons.append(item);
  });

  card.append(rank, heading, metadata, match, scoreTrack, synopsis, reasons);
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const preferences = {
    type: formData.get("type"),
    genre: formData.get("genre"),
    mood: formData.get("mood"),
    maxDuration: Number(formData.get("maxDuration")),
  };

  appendMessage(
    `Quero ${typeLabels[preferences.type]} de ${formatLabel(preferences.genre)}, com clima ${preferences.mood}, de ate ${preferences.maxDuration} minutos.`,
    "user",
  );

  submitButton.disabled = true;
  submitButton.textContent = "Analisando o catalogo...";

  try {
    const recommendations = await requestRecommendations(preferences);
    appendMessage(
      "Encontrei estas combinacoes. A porcentagem mostra o quanto cada titulo atende as suas escolhas.",
      "bot",
    );
    renderRecommendations(recommendations);
  } catch (error) {
    appendMessage(error.message, "bot");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Encontrar meu proximo play";
  }
});

