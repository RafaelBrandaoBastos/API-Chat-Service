# API WebSocket do Sistema de Chat

Esta documentação descreve os eventos WebSocket disponíveis na aplicação.

## Conexão

Para conectar ao WebSocket, use o namespace `/chat`:

```javascript
const socket = io('http://localhost:3000/chat', {
  extraHeaders: {
    Authorization: 'Bearer seu-token-jwt',
  },
});
```

## Eventos do Cliente para o Servidor

### `getRooms`

Obtém todas as salas a que o usuário autenticado pertence.

**Parâmetros**: Nenhum

**Retorno**:

```json
{
  "event": "rooms",
  "data": [
    { "id": "uuid-sala", "name": "Nome da Sala", "users": [...] },
    ...
  ]
}
```

### `getAllRooms`

Obtém todas as salas disponíveis no sistema.

**Parâmetros**: Nenhum

**Retorno**:

```json
{
  "event": "allRooms",
  "data": [
    { "id": "uuid-sala", "name": "Nome da Sala", "users": [...] },
    ...
  ]
}
```

### `joinRoom`

Adiciona o usuário autenticado a uma sala.

**Parâmetros**:

```json
{
  "roomId": "string"
}
```

**Retorno**:

```json
{
  "event": "joinedRoom",
  "data": {
    "room": { "id": "uuid-sala", "name": "Nome da Sala", "users": [...] }
  }
}
```

**Erro**:

```json
{
  "event": "error",
  "data": { "message": "Mensagem de erro" }
}
```

### `leaveRoom`

Remove o usuário autenticado de uma sala.

**Parâmetros**:

```json
{
  "roomId": "string"
}
```

**Retorno**:

```json
{
  "event": "leftRoom",
  "data": {
    "room": { "id": "uuid-sala", "name": "Nome da Sala", "users": [...] }
  }
}
```

**Erro**:

```json
{
  "event": "error",
  "data": { "message": "Mensagem de erro" }
}
```

### `sendDirectMessage`

Envia uma mensagem direta para outro usuário.

**Parâmetros**:

```json
{
  "receiverId": "string",
  "content": "string"
}
```

**Retorno**:

```json
{
  "event": "messageSent",
  "data": {
    "message": { "id": "uuid", "content": "Texto da mensagem", ... }
  }
}
```

**Erro**:

```json
{
  "event": "error",
  "data": { "message": "Mensagem de erro" }
}
```

### `sendRoomMessage`

Envia uma mensagem para uma sala.

**Parâmetros**:

```json
{
  "roomId": "string",
  "content": "string"
}
```

**Retorno**:

```json
{
  "event": "messageSent",
  "data": {
    "roomId": "string",
    "message": { "id": "uuid", "content": "Texto da mensagem", ... }
  }
}
```

**Erro**:

```json
{
  "event": "error",
  "data": { "message": "Mensagem de erro" }
}
```

### `getRoomMessages`

Obtém o histórico de mensagens de uma sala.

**Parâmetros**:

```json
{
  "roomId": "string"
}
```

**Retorno**:

```json
{
  "event": "roomMessages",
  "data": {
    "roomId": "string",
    "messages": [
      { "id": "uuid", "content": "Texto da mensagem", "sender": {...}, ... },
      ...
    ]
  }
}
```

### `getDirectMessages`

Obtém o histórico de mensagens diretas com outro usuário.

**Parâmetros**:

```json
{
  "otherUserId": "string"
}
```

**Retorno**:

```json
{
  "event": "directMessages",
  "data": {
    "otherUserId": "string",
    "messages": [
      { "id": "uuid", "content": "Texto da mensagem", "sender": {...}, "receiver": {...}, ... },
      ...
    ]
  }
}
```

### `typing`

Indica que um usuário está digitando.

**Parâmetros**:

```json
{
  "roomId": "string (opcional)",
  "receiverId": "string (opcional)"
}
```

## Eventos do Servidor para o Cliente

### `userConnected`

Emitido quando um usuário se conecta ao sistema.

**Dados**:

```json
{
  "userId": "string"
}
```

### `userDisconnected`

Emitido quando um usuário se desconecta do sistema.

**Dados**:

```json
{
  "userId": "string"
}
```

### `userJoined`

Emitido quando um usuário entra em uma sala.

**Dados**:

```json
{
  "roomId": "string",
  "userId": "string"
}
```

### `userLeft`

Emitido quando um usuário sai de uma sala.

**Dados**:

```json
{
  "roomId": "string",
  "userId": "string"
}
```

### `newDirectMessage`

Emitido quando uma nova mensagem direta é enviada ao usuário.

**Dados**:

```json
{
  "id": "uuid",
  "content": "string",
  "sender": { "id": "string", "login": "string" },
  "receiver": { "id": "string", "login": "string" },
  "createdAt": "2023-04-20T12:00:00Z"
}
```

### `newRoomMessage`

Emitido quando uma nova mensagem é enviada a uma sala que o usuário está.

**Dados**:

```json
{
  "roomId": "string",
  "message": {
    "id": "uuid",
    "content": "string",
    "sender": { "id": "string", "login": "string" },
    "createdAt": "2023-04-20T12:00:00Z"
  }
}
```

### `messageSent`

Confirmação enviada ao remetente após uma mensagem ser enviada com sucesso.

**Dados**: Igual a `newDirectMessage` ou `newRoomMessage`

### `typing`

Emitido quando um usuário está digitando.

**Dados para salas**:

```json
{
  "userId": "string",
  "roomId": "string"
}
```

**Dados para mensagens diretas**:

```json
{
  "userId": "string",
  "direct": true
}
```

## Erros

Todos os comandos podem retornar um evento de erro:

```json
{
  "event": "error",
  "data": {
    "message": "Descrição do erro"
  }
}
```

## Autenticação via JWT

Para autenticar, primeiro faça login por meio da API REST para obter o token JWT:

```
POST /auth/login
```

Depois, ao estabelecer a conexão WebSocket, adicione o token no header:

```javascript
const socket = io('http://localhost:3000/chat', {
  extraHeaders: {
    Authorization: 'Bearer seu-token-jwt',
  },
});
```

O token JWT será validado automaticamente e o socket será autenticado com o ID do usuário. Todas as operações usarão o ID do usuário extraído do token JWT.
