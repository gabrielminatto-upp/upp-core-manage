# 🎯 URL para usar no n8n

## ✅ **URL de Callback:**

```
http://192.168.1.247:8088/api/workflow-callback/{{$('Webhook').item.json.body.execution_id}}
```

## 🔧 **Como configurar no n8n:**

### 1. **Adicione um nó "HTTP Request" no final do workflow**

### 2. **Configure o nó:**
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

### 3. **Para casos de erro, adicione outro nó HTTP Request:**
- **Method**: POST
- **URL**: `http://192.168.1.247:8088/api/workflow-callback/{{$('Webhook').item.json.body.execution_id}}`
- **Send Body**: ✅ Ativado
- **Body**:
```json
{
  "status": "failed",
  "message": "Erro no workflow",
  "timestamp": "{{ $now }}"
}
```

## 🧪 **Teste:**

Acesse no navegador para testar:
```
http://192.168.1.247:8088/api/test
```

Deve retornar: `{"message":"Servidor funcionando!"}`

## 📋 **Resumo:**
- ✅ Servidor rodando em: `http://192.168.1.247:8088`
- ✅ Callback URL: `http://192.168.1.247:8088/api/workflow-callback/{execution_id}`
- ✅ Método: POST
- ✅ Body: JSON com status, message e timestamp 