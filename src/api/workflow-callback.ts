// Endpoint de callback para o n8n
// Este arquivo pode ser usado para configurar um endpoint que recebe notificações do n8n

export interface WorkflowCallback {
  execution_id: string;
  status: 'completed' | 'failed';
  message?: string;
  timestamp: string;
  data?: any;
}

// Função para processar callbacks do n8n
export const processWorkflowCallback = (callback: WorkflowCallback) => {
  // Aqui você pode implementar a lógica para processar o callback
  // Por exemplo, enviar uma notificação para o frontend
  
  console.log('Workflow callback received:', callback);
  
  // Em uma implementação real, você poderia:
  // 1. Validar o callback
  // 2. Atualizar o status no banco de dados
  // 3. Enviar uma notificação para o frontend via WebSocket ou Server-Sent Events
  // 4. Registrar logs da execução
  
  return {
    success: true,
    message: 'Callback processed successfully'
  };
};

// Exemplo de como configurar um endpoint Express.js (se você tiver um servidor backend)
/*
import express from 'express';
import { processWorkflowCallback } from './workflow-callback';

const app = express();
app.use(express.json());

app.post('/api/workflow-callback', (req, res) => {
  try {
    const callback = req.body as WorkflowCallback;
    const result = processWorkflowCallback(callback);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Invalid callback data' });
  }
});
*/ 