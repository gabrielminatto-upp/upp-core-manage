import { UsuariosList } from "@/components/uppchannel/UsuariosList";
import React, { useState } from "react";

function ControlePlaceholder() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Controle</h1>
      <p className="text-muted-foreground mt-1">
        Aqui futuramente serão exibidos dados separados por clientes.
      </p>
    </div>
  );
}

export default function Uppchannel() {
  const [tab, setTab] = useState<"usuarios" | "controle">("usuarios");

  return (
    <div className="w-full">
      <div className="flex gap-2 border-b border-border mb-6">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "usuarios"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("usuarios")}
        >
          Usuários
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "controle"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("controle")}
        >
          Controle
        </button>
      </div>
      {tab === "usuarios" ? <UsuariosList /> : <ControlePlaceholder />}
    </div>
  );
}
