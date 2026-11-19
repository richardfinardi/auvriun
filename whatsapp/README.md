# Preparação de alteração: fila W-API compartilhada (19/11/2026)

> **Esta alteração está somente em uma branch de revisão, NÃO em produção.**
> Não ativar automaticamente o Cron nem reprocessar mensagens antigas. A limitação do WhatsApp ainda pode ocorrer mesmo com fila.

**Problema identificado no código anterior:** `dispatch()` enviava vários destinatários em paralelo usando `Promise.all`. Além disso, três aplicações podiam chamar a Central simultaneamente. Um atraso apenas no `Promise.all` não solucionaria essa concorrência entre ANFEER, PSTEC e Columbia.

**Solução preparada nesta branch:**
- **Fila persistente por instância W-API**, com Durable Object e armazenamento SQLite. Todos os aplicativos que compartilham o mesmo `instanceId` passam pela **mesma** fila.
- Apenas **uma tentativa W-API por vez**, com **intervalo técnico mínimo de 8 segundos** entre tentativas (não é proteção garantida contra restrições).
- Máximo de 200 solicitações pendentes por instância; expiração de solicitações com mais de 15 minutos para não enviar notificações antigas.
- Deduplicação por aplicação/evento/destinatário/referência durante 24 horas. Solicitações de teste e de OTP têm tratamento separado.
- Nenhum reenvio automático se a resposta da W-API for indeterminada.
- Histórico diferencia `QUEUED` (na fila), `ACCEPTED` (aceito pelo provedor), `REJECTED`, `EXPIRED`, `UNKNOWN` e `DUPLICATE`.
- A fila funciona também para códigos de confirmação e relatórios da Columbia, além de mensagens enviadas pelo endpoint geral `/v1/send`.
- **Trava de segurança:** sem `WAPI_SEND_ENABLED=true`, a Central **não aceita novos envios W-API**, e a fila já existente **não é processada**. A W-API permanece pausada por padrão.

## Quando estiver no computador: checklist de implantação

1. **Não mesclar ou publicar no Worker diretamente ainda.** Primeiro revisar esta branch e os serviços ANFEER/PSTEC/Columbia que dependem de `accepted`.
2. Conferir no Cloudflare Worker `auvriun-whatsapp` as configurações existentes e fazer backup do código atual e dos Bindings. Não tocar nos Secrets existentes.
3. A nova classe precisa do Binding `WAPI_OUTBOX` e da migração SQLite `wapi_outbox_v1`, descritos em `whatsapp/wrangler.jsonc`. **Copiar apenas `worker.js` no editor do Cloudflare NÃO é suficiente.** Preferir deploy via Wrangler com a configuração validada.
4. Antes do deploy, validar a sintaxe (`node --check whatsapp/worker.js`) e a configuração (`npx wrangler deploy --dry-run --config whatsapp/wrangler.jsonc`, executado a partir da raiz do repositório; ajustar caminho de trabalho se necessário).
5. Em **Settings → Variables and Secrets** do Worker, confirmar que `WAPI_SEND_ENABLED` está ausente ou `false`. Só após confirmar o deploy e o estado da fila, definir `WAPI_SEND_ENABLED=true` para um teste controlado com **um destinatário autorizado**.
6. Conferir no painel `https://auvriun.com/whatsapp/` o Histórico: `QUEUED` deve evoluir para `ACCEPTED`, ou expor erro. Confirmar também o recebimento real no telefone, pois não há webhook W-API de entrega nesta versão.
7. Não reativar os triggers de ANFEER, PSTEC ou Columbia em massa. Fazer validação isolada de cada integração antes.

**Compatibilidade importante:** o retorno da API mantém o campo `accepted` para não quebrar aplicativos já integrados, mas na W-API ele **pode contabilizar mensagens apenas enfileiradas**; o campo novo `queued` explicita isso. O monitor ANFEER ainda pode registrar `NOTIFICADO` no D1 quando a Central apenas enfileira, portanto **não considerar esse status como prova de entrega**. Para refletir entrega de verdade, falta implementar/validar confirmação de entrega da W-API e reconciliar os sistemas de origem. Nenhuma mensagem antiga será reprocessada automaticamente pela fila nova.

**Limites:** um `ACCEPTED` é resposta de aceite da API W-API e não prova de entrega. A W-API não é oficial; intervalos não afastam o risco de novas restrições do WhatsApp. É necessário consentimento dos destinatários e acompanhamento de qualidade.

---

# AUVRIUN WhatsApp Hub

## Operação diária: tudo pelo painel (atualização 11/11/2026)

Após publicar uma única vez a versão nova de `whatsapp/worker.js` no Cloudflare, as configurações rotineiras são feitas **em `https://auvriun.com/whatsapp/`**:
- **+ Nova**: cadastra aplicação, seleciona provedor, marca e destinatários, cria eventos. Ao salvar a nova aplicação, a chave de integração é gerada automaticamente e exibida uma única vez.
- **Número remetente W-API**: por padrão, reutiliza a instância compartilhada já configurada no Cloudflare. Se quiser outro número por cliente, expanda **Usar outra instância W-API nesta aplicação**, digite ID e Token de Acesso, e salve. O token fica criptografado no KV via AES-GCM, derivado de `AUVRIUN_ADMIN_KEY`, e não retorna ao navegador.
- **Enviar mensagem agora**: escolha evento, escreva texto, marque destinatários ativos e envie sem alterar nenhuma aplicação.
- **Integrar outra aplicação**: copie o endereço de envio, evento e formato JSON. Esse endereço é compartilhado por todas as aplicações. Cada sistema de origem precisa enviar um POST ao ocorrer o gatilho, **uma vez por sistema**; não é possível detectar automaticamente eventos de aplicações isoladas sem essa integração.
- **Histórico**: lista os registros de aceite e, para Omni quando webhook configurado, evolução do status. Na W-API, ainda não existe webhook central de entrega; aceite não comprova recebimento.

Segurança:
- Não grave a chave de aplicação no JavaScript do navegador nem no GitHub. Guarde-a no backend de cada sistema que dispara notificações.
- `AUVRIUN_ADMIN_KEY` é o segredo que também cifra os tokens W-API individuais. Se for alterado, é preciso **reconfigurar os tokens individuais** depois, pois eles não serão descriptografados com a nova chave. A instância global via Secrets permanece disponível.
- Preserve as credenciais globais W-API existentes até testar qualquer instância exclusiva. Mudar o provedor de uma aplicação não muda o das demais.
- A UI GitHub Pages atualiza automaticamente após publicar o repositório, mas o Worker continua exigindo deploy manual quando o **código da central** é alterado, não quando você cadastra clientes/eventos/telefones.


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


## W-API: segundo número, sem templates oficiais

O painel oferece agora **Provedor de envio**: `Z-API Omni` (padrão, mantém produção atual) ou `W-API` (número dedicado). A troca é por aplicação: seleção não afeta as outras.

1. Em https://painel.w-api.app/app/instances, crie uma instância e conecte o novo número pelo QR Code. Consulte o status até a instância aparecer como conectada.
2. No Cloudflare > Worker `auvriun-whatsapp` > Settings > Variables and Secrets, configure **Secrets**:
   - `WAPI_TOKEN`: token de API da instância W-API.
   - `WAPI_INSTANCE_ID`: identificador da instância W-API.
3. Publique `worker.js` atualizado no Worker Cloudflare; atualize o painel `/whatsapp/` e, na aplicação ANFEER, selecione `W-API (número dedicado)` e salve.
4. Use **Teste: todos os ativos** para validar o envio e o histórico. Para produção, faça teste com destinatários que consentiram com o recebimento. O status ACCEPTED não é confirmação de entrega.

Endpoint oficial documentado pelo fornecedor W-API: `POST https://api.w-api.app/v1/message/send-text?instanceId=ID`, header `Authorization: Bearer TOKEN`, JSON `{ "phone": "55...", "message": "..." }`.

A W-API declara expressamente que **não é API oficial da Meta**; pode existir risco de bloqueio do número, indisponibilidade e desconexão. Não use o número principal da empresa para testar. Não há necessidade de templates oficiais nessa integração, mas não há garantia de entrega. A versão atual não implementa webhook de confirmação da W-API, apenas o registro da resposta de envio.


## Columbia: autoinscrição do próprio WhatsApp (17/11/2026)

O fluxo de assinatura **não usa** `app.recipients` nem obriga o administrador a cadastrar o telefone no painel AUVRIUN. O próprio usuário autenticado da Columbia, com `CSENHA.U_HORAS=1`, acessa `https://consultoriarf.net/columbia/horas/assinatura.html`, escolhe temas (metas/resumo), filtros (segmentos/máquinas/funcionários), periodicidade (diário/semanal/mensal), informa o número e confirma por código enviado ao WhatsApp.

**Configuração inicial (uma vez):**

1. Atualizar o Worker Cloudflare `auvriun-whatsapp` com `whatsapp/worker.js`. Publicar apenas o GitHub Pages **não** faz deploy do Worker.
2. Em `auvriun.com/whatsapp`, criar a aplicação de ID exatamente `columbia`, provedor **W-API**, ativa. A instância W-API global pode ser reutilizada. Criar evento ativo de texto **`fechamento_horas`**. A lista fixa de destinatários pode ficar vazia.
3. A tela da Columbia chama `/whatsapp/v1/columbia/subscription` diretamente com o JWT `columbia_analista_token`. O Worker verifica esse JWT em `https://columbia.consultoriarf.net/producao/portal/me`, exige `u_horas=1` e usa o nome do usuário autenticado como identidade. Não recebe a chave AUVRIUN em JavaScript.
4. Endpoints de assinatura da Columbia: `GET /v1/columbia/subscription`, `POST /v1/columbia/subscription/start` (envia código), `POST /v1/columbia/subscription/confirm`, `PUT /v1/columbia/subscription` (altera preferências com número já confirmado), `DELETE /v1/columbia/subscription`. Todos prefixados por `/whatsapp`.

**Etapa seguinte para automatizar horários:**
- `GET /whatsapp/v1/subscriptions?app=columbia` com Authorization Bearer **chave da aplicação**, somente do backend, retorna assinaturas verificadas, ativas e suas preferências. Nunca chamar diretamente do navegador.
- `POST /whatsapp/v1/subscription/send`, também com a chave e JSON `{ "app":"columbia", "user":"USUARIO_COLUMBIA", "type":"metas", "event":"fechamento_horas", "reference":"2026-11-metas-mensal", "message":"..." }`. A Central envia **somente** para o telefone verificado daquela pessoa, sem a lista fixa. Há deduplicação por referência e tipo por 35 dias (KV; não transacional).
- O **agendador de coleta e formatação dos dados** ainda precisa ser instalado no servidor Columbia. A confirmação da assinatura por código funciona independentemente dele, mas a entrega periódica de indicadores só começa depois da instalação. Nunca afirmar que cron já foi ativado pelo commit.
- Planejamento: diário seg-sex após expediente (dados do dia), semanal segunda-feira (semana anterior), mensal dia 1 (mês anterior). Horário exato a definir; usar America/Sao_Paulo. Enviar apenas texto e barras Unicode, sem PDF ou imagem.
- Segurança: OTP de seis dígitos, 10 minutos de validade, limite diário de 5 solicitações por telefone e mínimo de 60 segundos entre solicitações por usuário. KV é eventualmente consistente; para produção com escala elevada, substituir controles por Durable Objects ou D1. As mensagens de confirmação pela W-API são não oficiais; respeitar opt-in explícito e monitorar qualidade/entrega.

**Observação:** `/whatsapp/v1/send` continua como antes, com destinatários predefinidos. Esses endpoints de assinatura são separados e não alteram as outras aplicações (ANFEER/PSTEC).
