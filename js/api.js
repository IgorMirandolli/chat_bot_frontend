const API_URL = "http://localhost:3000/api";

export async function sendChatMessage(message, context) {
  let response;

  try {
    response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, context }),
    });
  } catch {
    throw new Error(
      "Nao consegui conectar com a API. Confirme se o backend esta executando na porta 3000.",
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Nao foi possivel conversar com o Cine agora.");
  }

  return data;
}
