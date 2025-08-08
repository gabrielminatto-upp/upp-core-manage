# 🔧 Resolver Timeout do n8n

## ❌ **Problema:**
O n8n está dando timeout ao tentar acessar o callback.

## ✅ **Solução:**

### **1. Iniciar o servidor de callback:**

```bash
npm run callback-server
```

### **2. Configurar o n8n corretamente:**

#### **URL no n8n:**
```
http://192.168.1.247:8088/api/workflow-callback/{{$('Webhook').item.json.body.execution_id}}
```

#### **Configuração do nó HTTP Request:**
- **Method**: POST
- **URL**: `http://192.168.1.247:8088/api/workflow-callback/{{$('Webhook').item.json.body.execution_id}}`
- **Send Body**: ✅ Ativado
- **Body**:
```json
{
  "status": "completed",
  "message": "Processamento concluído com sucesso",
  "timestamp": "{{ $now }}"
}
```

### **3. Testar a conexão:**

Acesse no navegador:
```
http://192.168.1.247:8088/api/test
```

Deve retornar: `{"message":"Servidor funcionando!"}`

### **4. Verificar se está funcionando:**

No terminal do servidor, você verá logs como:
```
Callback recebido: { executionId: 'update_123', status: 'completed', message: 'Processamento concluído com sucesso' }
```

## 🎯 **Comandos rápidos:**

```bash
# Terminal 1: Servidor de callback
npm run callback-server

# Terminal 2: Frontend (opcional)
npm run dev
```

## 📋 **Resumo da configuração:**

- ✅ **Servidor**: `http://192.168.1.247:8088`
- ✅ **Endpoint**: `/api/workflow-callback/{execution_id}`
- ✅ **Método**: POST
- ✅ **Body**: JSON com status, message, timestamp
- ✅ **CORS**: Habilitado
- ✅ **Logs**: Console mostra callbacks recebidos

Agora o n8n deve conseguir acessar o callback sem timeout! 🚀 