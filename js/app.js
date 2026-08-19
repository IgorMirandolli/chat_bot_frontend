import { sendChatMessage } from "./api.js";

const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-button");
const chatMessages = document.querySelector("#chat-messages");
const quickReplies = document.querySelector("#quick-replies");
const preferenceSummary = document.querySelector("#preference-summary");
const newChatButton = document.querySelector("#new-chat-button");
const chatHint = document.querySelector("#chat-hint");
const examplePrompts = [...document.querySelectorAll(".example-prompt")];

const preferenceLabels = {
  type: {
    title: "Formato",
    values: { movie: "Filme", series: "S\u00e9rie" },
  },
  genres: {
    title: "G\u00eaneros",
    values: {
      acao: "A\u00e7\u00e3o",
      "ficcao-cientifica": "Fic\u00e7\u00e3o cient\u00edfica",
      aventura: "Aventura",
      animacao: "Anima\u00e7\u00e3o",
      comedia: "Com\u00e9dia",
      drama: "Drama",
      fantasia: "Fantasia",
      misterio: "Mist\u00e9rio",
      suspense: "Suspense",
    },
  },
  moods: {
    title: "Climas",
    values: {
      divertido: "Divertido",
      emocionante: "Emocionante",
      reflexivo: "Reflexivo",
      relaxante: "Relaxante",
      tenso: "Tenso",
    },
  },
  maxDuration: {
    title: "Tempo",
    values: {},
  },
};

const inputPlaceholders = {
  type: "Ex.: quero assistir a um filme",
  genres: "Ex.: quero acao e aventura",
  moods: "Ex.: quero algo divertido e relaxante",
  maxDuration: "Ex.: tenho ate duas horas",
};

const multiSelectorSettings = {
  genres: {
    title: "Escolha seus g\u00eaneros",
    description: "Marque uma ou mais op\u00e7\u00f5es.",
    confirmLabel: "Confirmar g\u00eaneros",
    messagePrefix: "Continuar com os generos",
  },
  moods: {
    title: "Escolha os climas",
    description: "Combine como voc\u00ea quer se sentir.",
    confirmLabel: "Confirmar climas",
    messagePrefix: "Continuar com os climas",
  },
};

let conversationContext = { preferences: {} };
let isWaitingForResponse = false;
let lastRequest = null;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function scrollToLatestMessage() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: reduceMotion ? "auto" : "smooth",
  });
}

function createAssistantAvatar() {
  const avatar = document.createElement("span");
  avatar.className = "message-avatar";
  avatar.textContent = "C";
  avatar.setAttribute("aria-hidden", "true");
  return avatar;
}

function addTextMessage(role, text, extraClass = "") {
  const row = document.createElement("div");
  const bubble = document.createElement("div");

  row.className = `message-row message-row-${role}`;
  if (extraClass) row.classList.add(extraClass);

  bubble.className = "message-bubble";
  bubble.textContent = text;

  if (role === "assistant") {
    row.append(createAssistantAvatar(), bubble);
  } else {
    row.append(bubble);
  }

  chatMessages.append(row);
  scrollToLatestMessage();
  return row;
}

function addSessionMarker() {
  const marker = document.createElement("p");
  marker.className = "session-marker";
  marker.textContent = "Conversa iniciada agora";
  chatMessages.append(marker);
}

function addTypingIndicator() {
  const row = document.createElement("div");
  const bubble = document.createElement("div");

  row.className = "message-row message-row-assistant typing-row";
  bubble.className = "message-bubble typing-bubble";
  bubble.setAttribute("aria-label", "Cine esta digitando");

  for (let index = 0; index < 3; index += 1) {
    bubble.append(document.createElement("span"));
  }

  row.append(createAssistantAvatar(), bubble);
  chatMessages.append(row);
  scrollToLatestMessage();
  return row;
}

function formatDuration(minutes) {
  if (minutes >= 240) return "Sem limite";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h${remainingMinutes}` : `${hours}h`;
}

function updatePreferenceSummary() {
  const preferences = conversationContext.preferences || {};
  const entries = Object.entries(preferences);

  preferenceSummary.replaceChildren();
  preferenceSummary.hidden = entries.length === 0;

  entries.forEach(([field, value]) => {
    const item = document.createElement("span");
    const title = document.createElement("small");
    const label = document.createElement("strong");
    const definition = preferenceLabels[field];

    if (!definition) return;

    title.textContent = definition.title;
    if (field === "maxDuration") {
      label.textContent = formatDuration(value);
    } else if (field === "genres" || field === "moods") {
      label.textContent = value
        .map((item) => definition.values[item] || item)
        .join(" + ");
    } else {
      label.textContent = definition.values[value] || value;
    }

    item.append(title, label);
    preferenceSummary.append(item);
  });
}

function createScore(score) {
  const element = document.createElement("span");
  element.className = "recommendation-score";
  element.textContent = `${score}% match`;
  return element;
}

function createRecommendationCard(recommendation, index) {
  const card = document.createElement("article");
  const top = document.createElement("div");
  const ranking = document.createElement("span");
  const title = document.createElement("h3");
  const metadata = document.createElement("p");
  const genres = document.createElement("div");
  const synopsis = document.createElement("p");
  const reason = document.createElement("p");

  card.className = "chat-recommendation";
  if (index === 0) card.classList.add("best-recommendation");

  top.className = "recommendation-top";
  ranking.className = "recommendation-ranking";
  ranking.textContent = index === 0 ? "Melhor escolha" : `Op\u00e7\u00e3o 0${index + 1}`;
  top.append(ranking, createScore(recommendation.match));

  recommendation.genres.forEach((genre) => {
    const genreLabel = document.createElement("span");
    genreLabel.textContent = preferenceLabels.genres.values[genre] || genre;
    genres.append(genreLabel);
  });
  genres.className = "recommendation-genres";

  title.textContent = recommendation.title;
  metadata.className = "recommendation-metadata";
  metadata.textContent = `${recommendation.releaseYear}  /  ${formatDuration(recommendation.durationMinutes)}`;
  synopsis.className = "recommendation-synopsis";
  synopsis.textContent = recommendation.synopsis;
  reason.className = "recommendation-reason";
  reason.textContent = recommendation.reasons[0] || "Uma op\u00e7\u00e3o para explorar algo diferente";

  card.append(top, genres, title, metadata, synopsis, reason);
  return card;
}

function addRecommendations(recommendations) {
  if (!recommendations.length) return;

  const row = document.createElement("div");
  const list = document.createElement("div");

  row.className = "recommendation-row";
  list.className = "chat-recommendations";
  list.setAttribute("aria-label", "Recomendacoes do Cine");

  recommendations.forEach((recommendation, index) => {
    list.append(createRecommendationCard(recommendation, index));
  });

  row.append(list);
  chatMessages.append(row);
  scrollToLatestMessage();
}

function clearQuickReplies() {
  quickReplies.replaceChildren();
  quickReplies.classList.remove("multi-selector");
  quickReplies.hidden = true;
}

function updatePendingSelection(field, selectedValues) {
  const preferences = { ...(conversationContext.preferences || {}) };

  if (selectedValues.size > 0) {
    preferences[field] = [...selectedValues];
  } else {
    delete preferences[field];
  }

  conversationContext = {
    ...conversationContext,
    preferences,
    [`${field}Confirmed`]: false,
  };
  updatePreferenceSummary();
}

function renderMultiSelector(field) {
  const settings = multiSelectorSettings[field];
  const labelsByValue = preferenceLabels[field].values;
  const selectedValues = new Set(
    conversationContext.preferences?.[field] || [],
  );
  const heading = document.createElement("div");
  const headingCopy = document.createElement("div");
  const title = document.createElement("strong");
  const description = document.createElement("span");
  const counter = document.createElement("span");
  const options = document.createElement("div");
  const actions = document.createElement("div");
  const confirmButton = document.createElement("button");

  quickReplies.classList.add("multi-selector");
  heading.className = "multi-selector-heading";
  headingCopy.className = "multi-selector-copy";
  title.textContent = settings.title;
  description.textContent = settings.description;
  counter.className = "multi-counter";
  options.className = "multi-options";
  actions.className = "multi-selector-actions";
  confirmButton.className = "multi-confirm-button";
  confirmButton.type = "button";
  confirmButton.textContent = settings.confirmLabel;

  function refreshSelection() {
    const count = selectedValues.size;
    counter.textContent = count === 1 ? "1 selecionado" : `${count} selecionados`;
    confirmButton.disabled = count === 0;
    updatePendingSelection(field, selectedValues);
  }

  Object.entries(labelsByValue).forEach(([value, label]) => {
    const button = document.createElement("button");
    button.className = "multi-option";
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-pressed", String(selectedValues.has(value)));

    button.addEventListener("click", () => {
      if (selectedValues.has(value)) {
        selectedValues.delete(value);
      } else {
        selectedValues.add(value);
      }

      button.setAttribute("aria-pressed", String(selectedValues.has(value)));
      refreshSelection();
    });

    options.append(button);
  });

  confirmButton.addEventListener("click", () => {
    const values = [...selectedValues];
    if (values.length === 0) return;

    const labels = values.map((value) => labelsByValue[value] || value);
    submitMessage(
      `${settings.messagePrefix} ${labels.join(" e ")}`,
      labels.join(" + "),
    );
  });

  headingCopy.append(title, description);
  heading.append(headingCopy, counter);
  actions.append(confirmButton);
  quickReplies.append(heading, options, actions);
  quickReplies.hidden = false;
  refreshSelection();
}

function renderQuickReplies(replies, options = {}) {
  clearQuickReplies();

  if (!replies?.length) return;

  if (multiSelectorSettings[conversationContext.awaiting] && !options.silent) {
    renderMultiSelector(conversationContext.awaiting);
    return;
  }

  replies.forEach((reply) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = reply.label;
    button.addEventListener("click", () => {
      submitMessage(reply.message, options.silent ? "" : reply.label);
    });
    quickReplies.append(button);
  });

  quickReplies.hidden = false;
}

function updateComposerState() {
  const awaiting = conversationContext.awaiting;
  chatInput.placeholder = inputPlaceholders[awaiting] || "Pe\u00e7a uma mudan\u00e7a ou fa\u00e7a uma nova busca...";
  chatHint.textContent = awaiting
    ? "Responda com suas palavras ou use uma sugest\u00e3o."
    : "Voc\u00ea pode pedir para mudar qualquer prefer\u00eancia.";
}

function setWaitingState(waiting) {
  isWaitingForResponse = waiting;
  chatInput.disabled = waiting;
  sendButton.disabled = waiting;
  newChatButton.disabled = waiting;
  examplePrompts.forEach((button) => {
    button.disabled = waiting;
  });
}

async function submitMessage(message, displayText = message) {
  const cleanMessage = message.trim();
  if (isWaitingForResponse || (cleanMessage === "" && displayText !== "")) return;

  lastRequest = cleanMessage;
  setWaitingState(true);
  clearQuickReplies();

  if (displayText) {
    addTextMessage("user", displayText);
  }

  const typingIndicator = addTypingIndicator();

  try {
    const [response] = await Promise.all([
      sendChatMessage(cleanMessage, conversationContext),
      wait(520),
    ]);

    typingIndicator.remove();
    conversationContext = response.context;
    addTextMessage("assistant", response.reply);
    addRecommendations(response.recommendations || []);
    updatePreferenceSummary();
    updateComposerState();
    renderQuickReplies(response.quickReplies);
  } catch (error) {
    typingIndicator.remove();
    addTextMessage("assistant", error.message, "message-row-error");
    renderQuickReplies(
      [{ label: "Tentar novamente", message: lastRequest }],
      { silent: true },
    );
  } finally {
    setWaitingState(false);
    chatInput.focus({ preventScroll: true });
  }
}

function startConversation() {
  if (isWaitingForResponse) return;

  conversationContext = { preferences: {} };
  lastRequest = null;
  chatMessages.replaceChildren();
  clearQuickReplies();
  updatePreferenceSummary();
  addSessionMarker();
  submitMessage("", "");
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();

  if (!message) return;

  chatInput.value = "";
  submitMessage(message);
});

newChatButton.addEventListener("click", startConversation);

examplePrompts.forEach((button) => {
  button.addEventListener("click", () => {
    const prompt = button.dataset.prompt;
    if (prompt) submitMessage(prompt, button.textContent.trim());
  });
});

startConversation();
