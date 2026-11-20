# AUVRIUN • Questionário dos três sócios

Frontend: `https://auvriun.com/socios/` (GitHub Pages).
API: Cloudflare Worker `auvriun-socios` (arquivo `worker.js`).
Banco: Cloudflare D1 com binding `DB`.
Participantes: Adivelto (1), Julio (2), Richard (3).
Questionário: 16 blocos e 61 perguntas. Sem envio ou importação de JSON pelos sócios.

## Ativação inicial na conta Cloudflare

1. Em **Workers & Pages**, crie um Worker a partir do repositório GitHub `richardfinardi/auvriun` na branch `main`.
2. Nas configurações de build, defina **Root directory = `socios`**, **Worker name = `auvriun-socios`**, **Build command = vazio**, **Deploy command = `npx wrangler deploy`**. Faça o deploy. O `wrangler.jsonc` da pasta foi preparado para provisionar automaticamente o D1 no primeiro deploy.
3. Abra **D1 SQL Database** na Cloudflare. Localize o banco vinculado ao Worker em **Settings > Bindings** com nome `DB`. Na área de consulta (Console), execute o SQL presente em [schema.sql](./schema.sql). Ele cria quatro tabelas e um índice. Executar novamente é seguro porque usa `IF NOT EXISTS`.
4. Abra o Worker `auvriun-socios`, em **Settings > Variables and Secrets**, configure **4 Secrets**, todos únicos e fortes (mínimo de 16 caracteres, ideal 32 ou mais):
   - `SOCIO_1_KEY`: código de Adivelto
   - `SOCIO_2_KEY`: código de Julio
   - `SOCIO_3_KEY`: código de Richard
   - `ADMIN_KEY`: código de administração e conciliação
5. Garanta que o domínio `workers.dev` da conta está habilitado e que o endereço de implantação é o mesmo configurado em [config.js](./config.js), inicialmente `https://auvriun-socios.auvriun-monitor.workers.dev`. **O domínio deve ser confirmado no painel da Cloudflare**. Se for diferente, altere `config.js` no GitHub; nunca altere para um endereço não verificado.
6. Teste `https://<endereco-do-worker>/api/health`. O retorno esperado depois do esquema SQL e secrets é `{"ok":true,"service":"auvriun-socios","database_configured":true,"access_configured":true}`.
7. Abra `https://auvriun.com/socios/`, escolha o participante, digite o código individual e responda. As respostas são salvas diretamente no banco D1; depois de todas, clique em **Enviar respostas**.
8. Em **Conciliação das respostas**, informe `ADMIN_KEY` para acompanhar conclusões e, após as três finalizações, comparar as 61 respostas e registrar as decisões negociadas. O painel permite exportar uma planilha e imprimir em PDF somente para trabalho interno.

> O sistema bloqueia a entrada quando o banco, as tabelas ou os quatro códigos de acesso não estão ativados. Não existem senhas versionadas no repositório.

## Segurança e atualização

- Não compartilhar os códigos em grupos públicos nem adicioná-los ao GitHub.
- Os sócios só conseguem ler e alterar sua própria resposta, validada no servidor. Respostas concluídas exigem reabertura pelo administrador.
- A conciliação fica restrita ao administrador e só é disponibilizada após os três concluírem.
- O preenchimento não é assinatura de contrato. Registrar uma decisão “confirmada” também não dispensa assinatura e revisão jurídica.
- Com GitHub conectado à Cloudflare, futuras alterações no código da pasta `socios/` poderão ser implantadas pelo fluxo de builds da Cloudflare.

## Diagnóstico rápido

- `/api/health` inacessível: Worker não implantado, endereço errado ou `workers.dev` desabilitado.
- `/api/health` responde `ok:false`: veja `database_configured` e `access_configured` para encontrar a etapa faltante.
- Mensagem “código inválido”: confira os quatro Secrets e o código específico do participante.
- Não salva: verifique o vínculo `DB`, as tabelas SQL e os logs do Worker.

## Arquivos

- `index.html`, `app.js`, `perguntas.js`: interface e conciliação.
- `config.js`: endereço público da API, sem credenciais.
- `worker.js`: API autenticada que grava no D1.
- `schema.sql`: tabelas de respostas, auditoria, decisões e histórico.
- `wrangler.jsonc`: configuração de deployment.
