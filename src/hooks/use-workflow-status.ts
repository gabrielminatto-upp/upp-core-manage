import { useState, useCallback, useEffect } from "react";
import { useToast } from "./use-toast";

export interface WorkflowExecution {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
  message?: string;
}

export const useWorkflowStatus = () => {
  const { toast } = useToast();
  const [executions, setExecutions] = useState<Map<string, WorkflowExecution>>(
    new Map()
  );

  // Adicionar uma nova execução
  const addExecution = useCallback((executionId: string) => {
    setExecutions((prev) => {
      const newMap = new Map(prev);
      newMap.set(executionId, {
        id: executionId,
        status: "pending",
        startTime: new Date(),
      });
      return newMap;
    });
  }, []);

  // Atualizar o status de uma execução
  const updateExecutionStatus = useCallback(
    (executionId: string, status: "completed" | "failed", message?: string) => {
      setExecutions((prev) => {
        const newMap = new Map(prev);
        const execution = newMap.get(executionId);

        if (execution) {
          newMap.set(executionId, {
            ...execution,
            status,
            endTime: new Date(),
            message,
          });
        }

        return newMap;
      });

      // Mostrar toast baseado no status
      if (status === "completed") {
        toast({
          title: "Workflow concluído!",
          description: "Processamento finalizado com sucesso.",
        });
      } else {
        toast({
          title: "Workflow falhou",
          description: message || "Erro durante a execução.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Função para verificar status via polling
  const checkExecutionStatus = useCallback(
    async (executionId: string) => {
      try {
        // Aqui você faria uma requisição para verificar o status
        // Por exemplo, consultar uma tabela no banco de dados
        const response = await fetch(`/api/workflow-status/${executionId}`);
        const data = await response.json();

        if (data.status === "completed" || data.status === "failed") {
          updateExecutionStatus(executionId, data.status, data.message);
          return true; // Parar polling
        }

        return false; // Continuar polling
      } catch (error) {
        console.error("Erro ao verificar status:", error);
        return false;
      }
    },
    [updateExecutionStatus]
  );

  // Polling automático para execuções pendentes
  useEffect(() => {
    const interval = setInterval(async () => {
      const pendingExecutions = Array.from(executions.values()).filter(
        (exec) => exec.status === "pending" || exec.status === "running"
      );

      for (const execution of pendingExecutions) {
        const shouldStop = await checkExecutionStatus(execution.id);
        if (shouldStop) {
          // Remover da lista de polling
          setExecutions((prev) => {
            const newMap = new Map(prev);
            newMap.delete(execution.id);
            return newMap;
          });
        }
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, [executions, checkExecutionStatus]);

  // Limpar execuções antigas (mais de 1 hora)
  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      setExecutions((prev) => {
        const newMap = new Map(prev);
        for (const [id, execution] of newMap.entries()) {
          if (execution.endTime && execution.endTime < oneHourAgo) {
            newMap.delete(id);
          }
        }
        return newMap;
      });
    }, 5 * 60 * 1000); // Verificar a cada 5 minutos

    return () => clearInterval(interval);
  }, []);

  // Obter execuções pendentes
  const getPendingExecutions = useCallback(() => {
    return Array.from(executions.values()).filter(
      (exec) => exec.status === "pending" || exec.status === "running"
    );
  }, [executions]);

  // Obter execuções por status
  const getExecutionsByStatus = useCallback(
    (status: WorkflowExecution["status"]) => {
      return Array.from(executions.values()).filter(
        (exec) => exec.status === status
      );
    },
    [executions]
  );

  return {
    executions: Array.from(executions.values()),
    pendingExecutions: getPendingExecutions(),
    addExecution,
    updateExecutionStatus,
    checkExecutionStatus,
    getExecutionsByStatus,
  };
};
