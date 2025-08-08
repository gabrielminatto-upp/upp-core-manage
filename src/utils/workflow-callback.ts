// Sistema de callback para workflows do n8n
// Este arquivo gerencia callbacks via URL que podem ser chamados pelo n8n

interface WorkflowCallbackData {
  execution_id: string;
  status: 'completed' | 'failed';
  message?: string;
  timestamp: string;
  data?: any;
}

// Armazenar callbacks pendentes
const pendingCallbacks = new Map<string, (data: WorkflowCallbackData) => void>();

// Função para registrar um callback
export const registerWorkflowCallback = (
  executionId: string, 
  callback: (data: WorkflowCallbackData) => void
) => {
  pendingCallbacks.set(executionId, callback);
  
  // Limpar callback após 1 hora
  setTimeout(() => {
    pendingCallbacks.delete(executionId);
  }, 60 * 60 * 1000);
};

// Função para processar callback recebido
export const processWorkflowCallback = (data: WorkflowCallbackData) => {
  const callback = pendingCallbacks.get(data.execution_id);
  
  if (callback) {
    callback(data);
    pendingCallbacks.delete(data.execution_id);
    return { success: true, message: 'Callback processado com sucesso' };
  }
  
  return { success: false, message: 'Callback não encontrado' };
};

// Função para gerar URL de callback
export const generateCallbackUrl = (executionId: string) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/api/workflow-callback/${executionId}`;
};

// Função para simular callback (para testes)
export const simulateWorkflowCallback = (executionId: string, status: 'completed' | 'failed', message?: string) => {
  const data: WorkflowCallbackData = {
    execution_id: executionId,
    status,
    message,
    timestamp: new Date().toISOString(),
  };
  
  return processWorkflowCallback(data);
}; 