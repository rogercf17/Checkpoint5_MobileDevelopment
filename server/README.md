# API do chat (Node + Express + TypeScript)

Valida o Firebase ID Token, gerencia grupos (transações no Firestore), calcula destinatários e envia push pelo Expo Push Service.

## Endpoints

| Método e rota | Auth | Função |
|---|---|---|
| GET /health | não | `{ "status": "ok" }` |
| POST /notifications/messages | sim | body `{ conversationId, messageId }`; valida a mensagem no RTDB, calcula destinatários pela política e envia o push (com trava anti-duplicidade) |
| POST /groups | sim | body `{ name, photoUrl?, memberLimit, notificationPolicy, memberIds }`; o dono entra automaticamente |
| PATCH /groups/:id | dono | altera `name`, `photoUrl`, `notificationPolicy`, `memberLimit` (limite >= integrantes atuais) |
| POST /groups/:id/members | dono | body `{ userId }`; transação com checagem de vagas |
| DELETE /groups/:id/members/:uid | dono | remove integrante (dono não pode ser removido; mínimo 2 integrantes) |
| GET /users/:uid/profile | sim | perfil completo se houver conversa direta ou grupo em comum |

Autenticação: header `Authorization: Bearer <Firebase ID Token>`.

## Variáveis de ambiente

Veja `.env.example`. Em hospedagem, `FIREBASE_PRIVATE_KEY` é colada inteira (com `\n`).

## Rodar local

```
npm install
# crie um .env com as variáveis (ou defina no terminal) e rode:
npm run dev
```

## Deploy (Render)

- Root Directory: `server`
- Build Command: `npm install --include=dev && npm run build`
- Start Command: `npm start`
- Environment: as 4 variáveis do `.env.example`
- Teste: `curl https://SUA-API.onrender.com/health`

## Decisões

- **Limite sem estouro:** `addMember` usa `runTransaction`. O Firestore reexecuta a transação se outra gravação alterar o grupo no meio; com 1 vaga e 2 chamadas simultâneas, uma tem sucesso e a outra recebe "Grupo sem vagas".
- **Espelho de membros no RTDB:** `groupMembers/{groupId}/{uid}: true`, regravado a cada mudança de membros. As regras do RTDB usam esse nó, então remover alguém corta o acesso às novas mensagens.
- **Push sem duplicidade:** `notificationDispatches/{conversationId}_{messageId}` é criado com `create()`; se já existir, a resposta é `{ sent: 0, duplicate: true }`.
- **Política (`all_group_messages`, `mentioned_members`, `direct_messages_only`, `disabled`):** calculada no servidor, remetente sempre excluído. Corpo da notificação genérico ("Nova mensagem").
