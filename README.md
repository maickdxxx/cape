# CAPE Serviços e Consultoria

Template exclusivo para a **CAPE Serviços e Consultoria**, preparado para o Coruja Host.

## Estrutura

- React + Vite
- Contrato Coruja Host v2
- Editor de textos, imagens, logo, cores, SEO, contato, serviços, regiões, clientes, marcas e demais coleções
- Blog conectado ao conteúdo do Coruja Host
- Formulário de orçamento com envio para WhatsApp
- Mapa gerado a partir do endereço cadastrado
- Rotas: `/`, `/servicos`, `/projetos`, `/sobre`, `/contato`, `/blog` e `/blog/:slug`
- Preview compatível com `__CORUJA_PREVIEW_BASE_PATH__`

## Exclusividade

O `coruja.template.json` usa `visibility: private_client`, pois este modelo foi criado para um cliente específico e não deve entrar no catálogo público.

## Build

```bash
npm install
npm run build
```

Saída: `dist/`.

> O repositório não inclui fallback SPA específico da Cloudflare. O Coruja Host controla o fluxo de publicação e o fallback no checkout temporário de deploy quando necessário.
