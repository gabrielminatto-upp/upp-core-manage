import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { processWorkflowCallback } from '@/utils/workflow-callback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function WorkflowCallback() {
  const { executionId } = useParams<{ executionId: string }>();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!executionId) {
      setStatus('error');
      setMessage('ID de execução não fornecido');
      return;
    }

    // Extrair dados do callback da URL
    const callbackData = {
      execution_id: executionId,
      status: searchParams.get('status') as 'completed' | 'failed' || 'completed',
      message: searchParams.get('message') || undefined,
      timestamp: searchParams.get('timestamp') || new Date().toISOString(),
      data: searchParams.get('data') ? JSON.parse(searchParams.get('data') || '{}') : undefined,
    };

    try {
      const result = processWorkflowCallback(callbackData);
      
      if (result.success) {
        setStatus('success');
        setMessage('Callback processado com sucesso!');
      } else {
        setStatus('error');
        setMessage(result.message || 'Erro ao processar callback');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro interno ao processar callback');
    }
  }, [executionId, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
            Workflow Callback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge variant={status === 'success' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}>
              {status === 'processing' ? 'Processando...' : status === 'success' ? 'Sucesso' : 'Erro'}
            </Badge>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {message}
            </p>
          </div>

          {executionId && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Execution ID: {executionId}
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Esta página pode ser fechada automaticamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 