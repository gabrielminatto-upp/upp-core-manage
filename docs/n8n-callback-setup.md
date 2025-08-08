# Configuração do Callback para n8n

## URL de Callback

Quando o workflow do n8n terminar, ele deve fazer uma requisição GET para a seguinte URL:

```
http://192.168.1.247:8089/api/workflow-callback/{execution_id}?status=completed&message=Processamento concluído com sucesso
```

## Parâmetros da URL

- `execution_id`: ID único da execução (enviado no webhook inicial)
- `status`: `completed` ou `failed`
- `message`: Mensagem opcional sobre o resultado
- `timestamp`: Timestamp opcional (padrão: momento atual)
- `data`: Dados adicionais em JSON (opcional)

## Exemplos de URLs

### Sucesso:
```
http://192.168.1.247:8089/api/workflow-callback/update_1234567890_abc123?status=completed&message=Usuários atualizados com sucesso
```

### Falha:
```
http://192.168.1.247:8089/api/workflow-callback/update_1234567890_abc123?status=failed&message=Erro ao processar dados
```

### Com dados adicionais:
```
http://192.168.1.247:8089/api/workflow-callback/update_1234567890_abc123?status=completed&message=Processamento concluído&data={"processed":150,"errors":0}
```

## Configuração no n8n

### 1. No final do seu workflow, adicione um nó "HTTP Request"

### 2. Configure o nó HTTP Request:
- **Method**: GET
- **URL**: `http://192.168.1.247:8089/api/workflow-callback/{{ $json.execution_id }}?status=completed&message=Workflow executado com sucesso`

### 3. Para casos de erro, adicione outro nó HTTP Request:
- **Method**: GET  
- **URL**: `http://192.168.1.247:8089/api/workflow-callback/{{ $json.execution_id }}?status=failed&message=Erro no workflow`

### 4. Extrair execution_id do webhook inicial:
No início do workflow, extraia o `execution_id` do payload recebido:
```javascript
// No nó "Set" ou "Code"
{
  "execution_id": "{{ $json.execution_id }}"
}
```

## Fluxo Completo

1. Frontend envia webhook para n8n com `execution_id` e `callback_url`
2. n8n processa o workflow
3. n8n faz GET para a URL de callback com o resultado
4. Frontend recebe o callback e atualiza o status
5. Usuário vê notificação de conclusão

## Teste Manual

Para testar manualmente, você pode acessar a URL diretamente no navegador:

```
http://192.168.1.247:8089/api/workflow-callback/test_123?status=completed&message=Teste manual
```

## Troubleshooting

- Verifique se a URL está acessível
- Confirme se o `execution_id` está sendo passado corretamente
- Verifique os logs do console para erros
- Use a página de callback para debug
- Certifique-se de que o firewall não está bloqueando a porta 8089 