# CineMatch Frontend

Interface do chatbot CineMatch, que coleta as preferencias do usuario e exibe filmes ou series recomendados pela API.

## Tecnologias

- HTML5
- CSS3
- JavaScript com ES Modules
- Node.js para o servidor local

O servidor usa apenas modulos nativos do Node.js. O backend deve estar executando em `http://localhost:3000`.

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
