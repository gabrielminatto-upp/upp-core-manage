# 🎯 URL para usar no n8n

## ✅ **URL de Callback:**

```
http://192.168.1.247:8089/api/workflow-callback/{{$('Webhook').item.json.body.execution_id}}?status=completed&message=Processamento concluído com sucesso
```

## 🔧 **Como configurar no n8n:**

### 1. **Adicione um nó "HTTP Request" no final do workflow**

### 2. **Configure o nó:**
- **Method**: GET
- **URL**: `http://192.168.1.247:8089/api/workflow-callback/{{$('Webhook').item.json.body.execution_id}}?status=completed&message=Processamento concluído com sucesso`

### 3. **Para casos de erro, adicione outro nó HTTP Request:**
- **Method**: GET
- **URL**: `http://192.168.1.247:8089/api/workflow-callback/{{$('Webhook').item.json.body.execution_id}}?status=failed&message=Erro no workflow`

## 🧪 **Teste:**

Acesse no navegador para testar:
```
http://192.168.1.247:8089/api/workflow-callback/test?status=completed&message=Teste
```

## 📋 **Resumo:**
- ✅ Servidor rodando em: `http://192.168.1.247:8089`
- ✅ Callback URL: `http://192.168.1.247:8089/api/workflow-callback/{execution_id}`
- ✅ Método: GET
- ✅ Parâmetros: `status=completed&message=Processamento concluído com sucesso` 