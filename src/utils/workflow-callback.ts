// Sistema de callback para workflows do n8n
// O n8n responde diretamente via webhook usando o nó "Respond to Webhook"

interface WorkflowCallbackData {
  execution_id: string;
  status: "completed" | "failed";
  message?: string;
  timestamp: string;
  data?: any;
}

// Função para processar resposta do webhook do n8n
export const processWorkflowResponse = (data: WorkflowCallbackData) => {
  console.log("Resposta do workflow recebida:", data);

  // Aqui você pode implementar a lógica para processar a resposta
  // Por exemplo, mostrar notificação para o usuário

  return {
    success: true,
    message: "Resposta processada com sucesso",
  };
};

// Função para gerar URL de callback (não é mais necessária com Respond to Webhook)
export const generateCallbackUrl = (executionId: string) => {
  // Com o nó "Respond to Webhook", o n8n responde diretamente
  // Não precisamos de uma URL de callback separada
  return null;
};

// Função para simular resposta (para testes)
export const simulateWorkflowResponse = (
  executionId: string,
  status: "completed" | "failed",
  message?: string
) => {
  const data: WorkflowCallbackData = {
    execution_id: executionId,
    status,
    message,
    timestamp: new Date().toISOString(),
  };

  return processWorkflowResponse(data);
};
