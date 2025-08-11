import { processWorkflowCallback } from "@/utils/workflow-callback";

export interface WorkflowCallback {
  execution_id: string;
  status: "completed" | "failed";
  message?: string;
  timestamp: string;
  data?: any;
}

// Função para processar callbacks do n8n
export const processWorkflowCallback = (callback: WorkflowCallback) => {
  // Aqui você pode implementar a lógica para processar o callback
  // Por exemplo, enviar uma notificação para o frontend

  console.log("Workflow callback received:", callback);

  // Em uma implementação real, você poderia:
  // 1. Validar o callback
  // 2. Atualizar o status no banco de dados
  // 3. Enviar uma notificação para o frontend via WebSocket ou Server-Sent Events
  // 4. Registrar logs da execução

  return {
    success: true,
    message: "Callback processed successfully",
  };
};

// Endpoint para receber webhook de callback
export const handleCallbackWebhook = async (request: Request) => {
  try {
    const body = await request.json();

    // Validar o payload
    if (!body.execution_id || !body.status) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Payload inválido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Processar o callback
    const result = processWorkflowCallback(body);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Erro interno",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
