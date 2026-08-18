const API_URL = "http://localhost:3000/api";

export async function requestRecommendations(preferences) {
  const response = await fetch(`${API_URL}/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferences),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Nao foi possivel buscar recomendacoes.");
  }

  return data.recommendations;
}
