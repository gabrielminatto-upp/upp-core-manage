import { spawn } from "child_process";
import path from "path";

console.log("🚀 Iniciando servidor de callback...");

// Iniciar o servidor de callback
const callbackServer = spawn("node", ["src/server/callback-server.js"], {
  stdio: "inherit",
  cwd: process.cwd(),
});

// Aguardar um pouco para o servidor inicializar
setTimeout(() => {
  console.log("🌐 Iniciando ngrok...");

  // Iniciar ngrok
  const ngrok = spawn("ngrok", ["http", "8089"], {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  // Capturar saída do ngrok para obter a URL
  ngrok.stdout.on("data", (data) => {
    const output = data.toString();
    if (output.includes("https://")) {
      const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok\.io/);
      if (urlMatch) {
        console.log("\n🎯 URL do ngrok:", urlMatch[0]);
        console.log("📋 Use esta URL no n8n para o callback!");
      }
    }
  });

  // Gerenciar encerramento
  process.on("SIGINT", () => {
    console.log("\n🛑 Encerrando...");
    callbackServer.kill();
    ngrok.kill();
    process.exit();
  });
}, 2000);

// Gerenciar encerramento
process.on("SIGINT", () => {
  console.log("\n🛑 Encerrando...");
  callbackServer.kill();
  process.exit();
});
