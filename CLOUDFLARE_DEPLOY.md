# Cloudflare Pages

Configure o projeto sem framework, deixe o comando de build vazio e use `public` como diretório de saída.

```powershell
npx wrangler pages dev public
npx wrangler pages deploy public --project-name lp-tv-sim
```

Rotas publicadas:

- `/`
- `/lp/help`

## Pendências de conteúdo existentes

- O formulário está com `data-endpoint=""`; enquanto não houver uma URL configurada, ele mostra sucesso sem transmitir os dados.
- O link de WhatsApp ainda usa `55XXXXXXXXXXX`.
