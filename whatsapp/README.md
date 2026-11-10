# AUVRIUN WhatsApp Hub

Centraliza a **Z-API Omni / WhatsApp Oficial** em um Cloudflare Worker. As aplicações (ANFEER, PSTEC, SINTERCAN, COLUMBIA, BRASTORNO etc.) passam a chamar uma única API, cada uma com sua própria chave e eventos autorizados. O painel web é `https://auvriun.com/whatsapp/`.

## O que está pronto no repositório

- `worker.js`: API autenticada, envio Z-API Omni, gerenciamento de aplicações, destinatários e eventos, histórico no KV e webhook assinado de entregas.
- `index.html`: painel responsivo com cadastro, ativação/desativação, geração/rotação de chaves, teste para um contato e consulta de histórico.
- `wrangler.jsonc`: configuração mínima Cloudflare, usando KV com provisionamento automático.
- Não há nenhum token real no repositório. A página pública não sabe a chave administrativa.

**IMPORTANTE:** o commit GitHub publica os arquivos do site, mas NÃO instala o Worker, não cria segredos e não configura domínio, webhook ou templates. A API só envia mensagens depois de ativar a infraestrutura abaixo.

## Ativar no Cloudflare da AUVRIUN (uma vez)

### Opção A: pelo Wrangler (recomendada)

1. Com Node.js instalado e autenticado na conta Cloudflare AUVRIUN (`npx wrangler login`), abra a pasta `whatsapp` do repositório.
2. Execute `npx wrangler deploy`. Se necessário, selecione a conta correta. O binding `AUVRIUN_KV` sem ID usa provisionamento automático na primeira implantação (ver documentação Cloudflare).
3. No Cloudflare > Workers & Pages > `auvriun-whatsapp` > Settings > Variables and Secrets, cadastre **como Secrets**:
   - `OMNI_SECRET_KEY`: chave da API Omni que já funciona na ANFEER, **não o segredo de assinatura de webhook**.
   - `OMNI_CHANNEL_ID`: ID do canal da Omni que já funciona na ANFEER.
   - `AUVRIUN_ADMIN_KEY`: crie uma chave aleatória com no mínimo 32 caracteres, apenas para o painel.
   - `OMNI_WEBHOOK_SIGNING_SECRET`: segredo de assinatura recebido ao criar webhook novo na Omni.
4. Configure em Settings > Domains & Routes um **Custom Domain** `api.auvriun.com` SE a zona `auvriun.com` estiver ATIVA na Cloudflare e não houver DNS conflitante. Não altere DNS do domínio principal sem conferir a configuração atual. O Worker também funciona no próprio endereço `*.workers.dev`; no painel você pode editar a URL da API.
5. Teste: `https://api.auvriun.com/whatsapp/health` (ou `https://auvriun-whatsapp.<SEU-SUBDOMINIO>.workers.dev/whatsapp/health`). A resposta deve exibir `ok:true`, `kv:true`, `providerConfigured:true`.
6. Acesse `https://auvriun.com/whatsapp/`, informe a URL da API e `AUVRIUN_ADMIN_KEY`, clique em **Conectar**.

### Opção B: pelo painel Cloudflare, sem terminal

1. Crie um Worker `auvriun-whatsapp`, cole o conteúdo integral de `worker.js` no editor e clique em Deploy.
2. Crie um KV namespace e vincule em Settings > Bindings com o nome **`AUVRIUN_KV`**.
3. Cadastre os quatro Secrets acima.
4. Configure o Custom Domain quando a zona estiver ativa, ou use o `workers.dev` informado no painel.
5. Abra `/whatsapp/health` no endereço do Worker e configure o painel.

## Configurar o webhook da Omni (uma vez por canal)

Na Z-API Omni, associe os eventos de status/entrega do canal ao endereço:
`https://api.auvriun.com/whatsapp/webhook/omni`
(ou o endereço `workers.dev` enquanto não houver domínio próprio).

- Assinatura: habilitada.
- Eventos: `MESSAGE_DELIVERY` e `MESSAGE_STATUS`.
- Configure na Cloudflare o Secret `OMNI_WEBHOOK_SIGNING_SECRET` emitido para esse novo webhook.
- Webhook anterior ANFEER pode permanecer enquanto a migração não terminar, se a Omni permitir múltiplos webhooks. **Não remova o atual antes de testar o novo.**
- HTTP 200 no envio significa **aceite pela Omni**, não entregue no celular. Os estados recebidos via webhook são salvos no KV por até 60 dias.

## Cadastrar uma aplicação

No painel, clique em **+ Nova**. Exemplo:
- Código: `anfeer`
- Nome: `ANFEER`
- Destinatários: nomes, WhatsApp com DDI e situação ativa
- Evento: `inspecao_reprovada` no modo `TEXT` para testes ou `TEMPLATE` em uso proativo oficial
- Clique em **Salvar aplicação**
- Clique em **Gerar / trocar chave da aplicação** e copie o segredo exibido uma única vez

Se trocar a chave, a antiga para de funcionar: atualize o Secret da aplicação chamadora antes de realizar novos envios.

### Chamada para aplicações (sempre no backend, jamais em frontend público)

```http
POST https://api.auvriun.com/whatsapp/v1/send
Authorization: Bearer <CHAVE_DA_APLICACAO>
Content-Type: application/json

{
  "app": "anfeer",
  "event": "inspecao_reprovada",
  "message": "ANFEER | Inspeção reprovada: peça ...",
  "reference": "ID-UNICO-DA-INSPECAO"
}
```

Somente eventos e destinatários previamente cadastrados são permitidos para essa aplicação. O parâmetro opcional `only` aceita uma **lista de números completos já cadastrados e ativos** para direcionar a um subconjunto. O `variables` permite substituir `{{campo}}` em templates cadastrados no painel.

### Template oficial

Mensagens iniciadas pela empresa fora da janela de atendimento de 24 horas exigem template aprovado na Meta. Para um evento usar template, selecione **Template oficial** e informe o objeto completo `content` no formato de envio aceito pela versão da Z-API Omni, com `type: "TEMPLATE"` e `body` (consulte a documentação da conta Omni). O Worker reutiliza esse conteúdo em cada envio e substitui variáveis do tipo `{{campo}}`; o solicitante só envia `variables`. **Não assumir que envio de TEXTO garantirá entrega.**

A AUVRIUN centraliza a infraestrutura, mas a política de modelos e a quantidade de canais dependem das regras atuais da Meta e da configuração da conta Omni.

## Migração ANFEER sem interromper o envio

O repositório `richardfinardi/anfeer` recebeu suporte opcional para a central. Após o Worker AUVRIUN funcionar:
1. Cadastre a aplicação `anfeer` e evento `inspecao_reprovada` no painel, com os destinatários existentes.
2. Gere a chave da aplicação.
3. No Cloudflare, Worker `anfeer-inspecao-api` > Variables and Secrets:
   - `AUVRIUN_WHATSAPP_URL` = `https://api.auvriun.com/whatsapp` ou o endereço real `workers.dev/whatsapp`.
   - `AUVRIUN_WHATSAPP_APP_KEY` = a chave do aplicativo `anfeer` (**Secret**).
4. Publique a versão atualizada de `cloudflare/inspecao-worker.js` no Worker ANFEER.
5. Faça uma nova inspeção REPROVADA de teste e consulte o histórico da AUVRIUN; confira entrega no destinatário.
6. Enquanto as duas variáveis AUVRIUN não existirem, o Worker ANFEER mantém o envio direto pela Omni como antes. Ao habilitar a central, deixa de usar o envio direto para evitar duplicidade. Se precisar voltar, remova ambas as variáveis e faça novo deploy.

**Cuidado com o template:** a mensagem de inspeção atual é texto dinâmico. Para envio proativo fora da janela 24h, defina um template aprovado na central com variáveis suficientes e adapte o evento chamado conforme o template.

## Segurança e limites

- A página não salva a chave administrativa em `localStorage` ou cookie.
- `AUVRIUN_ADMIN_KEY` autoriza administração global; ideal proteger o Worker/painel também com Cloudflare Access e ativar rate limiting/WAF.
- Cada chave de aplicação fica armazenada no KV somente como SHA-256; a credencial inteira aparece apenas na geração.
- Nunca chamar a API diretamente de navegador público com a chave da aplicação.
- Somente números registrados pelo administrador podem receber envios.
- Históricos retêm eventos por até 60 dias; dados do KV têm **consistência eventual** e não são trilha de auditoria transacional.
- Para controle rigoroso de idempotência, quotas e ordem de eventos em alto volume, evoluir KV para Durable Objects/D1/Queues. A versão atual **não assegura deduplicação transacional**.
- API atual permite até 30 destinatários por aplicação. Disparos são paralelos, limitados pela infraestrutura/provedor.
- A lista de histórico mostra até 100 registros recentes dentro da janela consultada.
