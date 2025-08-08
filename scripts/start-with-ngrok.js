const { spawn } = require('child_process');

console.log('🚀 Iniciando servidor de desenvolvimento...');
console.log('💡 Após o servidor iniciar, execute o comando ngrok em outro terminal:');
console.log('   ngrok http 8089');
console.log('');
console.log('🌍 A URL do ngrok será exibida no terminal do ngrok');
console.log('📋 Use essa URL no seu workflow do n8n');
console.log('');

// Iniciar o servidor Vite
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Aguardar até que o processo seja interrompido
process.on('SIGINT', () => {
  console.log('\n🛑 Parando servidor...');
  viteProcess.kill();
  process.exit();
}); 