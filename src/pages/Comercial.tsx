import { ComercialList } from "@/components/comercial/ComercialList";
import React, { useState } from "react";

function AnalyticsPlaceholder() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
      <p className="text-muted-foreground mt-1">
        Aqui futuramente serão exibidos gráficos e análises detalhadas de performance comercial.
      </p>
    </div>
  );
}

export default function Comercial() {
  const [tab, setTab] = useState<"vendas" | "analytics">("vendas");

  return (
    <div className="w-full">
      <div className="flex gap-2 border-b border-border mb-6">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "vendas"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("vendas")}
        >
          Vendas
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("analytics")}
        >
          Analytics
        </button>
      </div>
      {tab === "vendas" ? <ComercialList /> : <AnalyticsPlaceholder />}
    </div>
  );
}