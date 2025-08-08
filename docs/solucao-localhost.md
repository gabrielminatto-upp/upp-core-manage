# 🔧 Solução para o problema do localhost no n8n

## ❌ **Problema:**
O n8n não consegue acessar `localhost:8089` porque está rodando em um ambiente diferente.

## ✅ **Soluções:**

### **Opção 1: Usar ngrok (Recomendado)**

#### **Passo 1: Instalar ngrok**
```bash
npm install -g ngrok
```

#### **Passo 2: Iniciar o servidor**
```bash
npm run dev
```

#### **Passo 3: Em outro terminal, expor via ngrok**
```bash
ngrok http 8089
```

#### **Passo 4: Usar a URL do ngrok no n8n**
A URL será algo como: `https://abc123.ngrok.io`

Use essa URL no seu workflow do n8n:
```
https://abc123.ngrok.io/api/workflow-callback/{{$('Webhook').item.json.body.execution_id}}?status=completed&message=Processamento concluído com sucesso
```

### **Opção 2: Usar IP da máquina**

#### **Passo 1: Descobrir seu IP**
```bash
ipconfig
```
Procure por "IPv4 Address" (ex: 192.168.1.100)

#### **Passo 2: Configurar Vite para aceitar conexões externas**
Edite `vite.config.ts`:
```typescript
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Permite conexões externas
    port: 8089,
  },
  // ... resto da configuração
}));
```

#### **Passo 3: Usar o IP no n8n**
```
http://192.168.1.100:8089/api/workflow-callback/{{$('Webhook').item.json.body.execution_id}}?status=completed&message=Processamento concluído com sucesso
```

### **Opção 3: Deploy temporário**

#### **Passo 1: Fazer deploy no Vercel/Netlify**
```bash
npm run build
# Fazer upload dos arquivos da pasta dist
```

#### **Passo 2: Usar a URL de produção**
```
https://seu-app.vercel.app/api/workflow-callback/{{$('Webhook').item.json.body.execution_id}}?status=completed&message=Processamento concluído com sucesso
```

## 🎯 **Recomendação:**

**Use a Opção 1 (ngrok)** porque:
- ✅ Funciona imediatamente
- ✅ Não precisa de configuração adicional
- ✅ URL pública acessível de qualquer lugar
- ✅ Gratuito para uso básico

## 📋 **Comandos rápidos:**

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Expor via ngrok
ngrok http 8089

# Copiar a URL do ngrok e usar no n8n
```

## 🔍 **Teste:**

Após configurar, teste acessando a URL no navegador:
```
https://sua-url-ngrok.ngrok.io/api/workflow-callback/test?status=completed&message=Teste
```

Se aparecer uma página de callback, está funcionando! 