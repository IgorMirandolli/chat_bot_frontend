# CineMatch Frontend

Interface conversacional do CineMatch. O usuario pode escrever frases naturais,
usar respostas sugeridas e receber recomendacoes dentro do historico do chat.

## Tecnologias

- HTML5
- CSS3
- JavaScript com ES Modules
- Node.js para o servidor local

O servidor usa apenas modulos nativos do Node.js. O backend deve estar executando em `http://localhost:3000`.
Quando o token do TMDB esta configurado no backend, o chat tambem recebe
recomendacoes do catalogo externo. A interface inclui o aviso de atribuicao
exigido pelo TMDB.

## Como executar

No repositorio do backend:

```bash
npm start
```

No repositorio do frontend:

```bash
npm install
npm start
```

Acesse `http://localhost:5500`.

Se a porta `5500` estiver ocupada, o servidor tenta automaticamente a proxima
porta disponivel e mostra o endereco correto no terminal.

Durante o desenvolvimento, o servidor pode reiniciar automaticamente:

```bash
npm run dev
```

O endereco da API fica configurado no arquivo `js/api.js`.

## Como conversar

O assistente aceita respostas curtas ou varias preferencias em uma frase:

```text
Quero um filme de acao e aventura, emocionante e de ate duas horas.
```

Os generos e os climas podem ser marcados em seletores multiplos e enviados
juntos pelos botoes `Confirmar generos` e `Confirmar climas`. Tambem podem ser
informados diretamente na mesma mensagem. Depois do resultado, e possivel
escrever `mudar os generos`, `mudar os climas`, `mudar o tempo` ou iniciar uma
nova conversa.

## Estrutura

```text
.
|-- css/
|   `-- styles.css
|-- js/
|   |-- api.js
|   `-- app.js
|-- index.html
|-- package.json
`-- server.js
```
