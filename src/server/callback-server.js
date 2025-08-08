import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Armazenar callbacks pendentes
const pendingCallbacks = new Map();

// Endpoint para registrar callbacks
app.post('/api/register-callback', (req, res) => {
  const { executionId, callback } = req.body;
  pendingCallbacks.set(executionId, callback);
  res.json({ success: true, message: 'Callback registrado' });
});

// Endpoint para receber callbacks do n8n
app.post('/api/workflow-callback/:executionId', (req, res) => {
  const { executionId } = req.params;
  const { status, message, timestamp, data } = req.body;
  
  console.log('Callback recebido:', { executionId, status, message });
  
  // Processar o callback
  const callback = pendingCallbacks.get(executionId);
  if (callback) {
    try {
      callback({ execution_id: executionId, status, message, timestamp, data });
      pendingCallbacks.delete(executionId);
      res.json({ success: true, message: 'Callback processado' });
    } catch (error) {
      console.error('Erro ao processar callback:', error);
      res.status(500).json({ success: false, message: 'Erro interno' });
    }
  } else {
    res.status(404).json({ success: false, message: 'Callback não encontrado' });
  }
});

// Endpoint GET para compatibilidade
app.get('/api/workflow-callback/:executionId', (req, res) => {
  const { executionId } = req.params;
  const { status, message } = req.query;
  
  console.log('Callback GET recebido:', { executionId, status, message });
  
  // Processar o callback
  const callback = pendingCallbacks.get(executionId);
  if (callback) {
    try {
      callback({ 
        execution_id: executionId, 
        status: status || 'completed', 
        message: message || 'Processamento concluído',
        timestamp: new Date().toISOString()
      });
      pendingCallbacks.delete(executionId);
      res.json({ success: true, message: 'Callback processado' });
    } catch (error) {
      console.error('Erro ao processar callback:', error);
      res.status(500).json({ success: false, message: 'Erro interno' });
    }
  } else {
    res.status(404).json({ success: false, message: 'Callback não encontrado' });
  }
});

// Endpoint de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!' });
});

const PORT = 8088;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de callback rodando em http://0.0.0.0:${PORT}`);
  console.log(`📋 Endpoint: http://192.168.1.247:${PORT}/api/workflow-callback/{execution_id}`);
});

export { pendingCallbacks }; 