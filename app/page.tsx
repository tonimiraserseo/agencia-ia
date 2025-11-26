"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  X,
  ChevronRight,
  Brain
} from "lucide-react";

interface Agent {
  id: number;
  name: string;
  icon: string;
  description: string;
}

interface ChatMessage {
  type: "system" | "user" | "agent";
  content: string;
  timestamp: string;
  agent?: string;
  icon?: string;
}

const agents: Agent[] = [
  { id: 1, name: "Community Manager", icon: "👥", description: "Gestión de RRSS y engagement" },
  { id: 2, name: "Creativo Digital", icon: "🎨", description: "Diseño gráfico y creatividad" },
  { id: 3, name: "Desarrollador Web", icon: "💻", description: "Código y desarrollo web" },
  { id: 4, name: "Copywriter", icon: "✍️", description: "Textos persuasivos" },
  { id: 5, name: "Consultor Estratégico", icon: "🎯", description: "Estrategia de marketing" },
  { id: 6, name: "Especialista en Ads", icon: "📊", description: "Publicidad digital" },
  { id: 7, name: "Analista de Datos", icon: "📈", description: "Análisis y métricas" },
  { id: 8, name: "Experto en GTM", icon: "🏷️", description: "Tag Manager" },
  { id: 9, name: "Email Marketing", icon: "📧", description: "Automatización email" },
  { id: 10, name: "Experto en CRM", icon: "🤝", description: "Gestión de clientes" },
  { id: 11, name: "SEO Técnico", icon: "🔍", description: "Optimización SEO" },
  { id: 12, name: "Arquitecto de IA", icon: "🤖", description: "Soluciones IA" }
];

export default function AgenciaIA() {
  const [view, setView] = useState<"dashboard" | "chat">("dashboard");
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [provider, setProvider] = useState<"openai" | "gemini">("openai");
  const [multiAgentMode, setMultiAgentMode] = useState<boolean>(false);
  const [isSending, setIsSending] = useState(false);

  const toggleAgentSelection = (id: number) => {
    setSelectedAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const startChat = () => {
    if (selectedAgents.length === 0) return;

    const names = selectedAgents
      .map(id => agents.find(a => a.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    setChatMessages([
      {
        type: "system",
        content: `Conversación iniciada con: ${names}`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    setView("chat");
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || selectedAgents.length === 0 || isSending) return;

    const userMsg: ChatMessage = {
      type: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMsg]);

    const messageToSend = inputMessage;
    setInputMessage("");
    setIsSending(true);

    // Si multiagente está activado → todos responden
    // Si no → solo el primero
    const targetAgentIds = multiAgentMode ? selectedAgents : [selectedAgents[0]];

    try {
      const responses = await Promise.all(
        targetAgentIds.map(async (agentId) => {
          const agent = agents.find(a => a.id === agentId);
          if (!agent) return null;

          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: messageToSend,
              provider,
              agent: agent.name
            })
          });

          const data = await res.json();

          const aiMsg: ChatMessage = {
            type: "agent",
            agent: agent.name,
            icon: agent.icon,
            content: data.reply || "Sin respuesta",
            timestamp: new Date().toLocaleTimeString()
          };

          return aiMsg;
        })
      );

      const validResponses = responses.filter(
        (msg): msg is ChatMessage => msg !== null
      );

      setChatMessages(prev => [...prev, ...validResponses]);
    } catch (error) {
      setChatMessages(prev => [
        ...prev,
        {
          type: "agent",
          content: "Error conectando con IA",
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex items-center gap-3 mb-6">
        <Brain className="text-blue-600" />
        <h1 className="text-2xl font-bold">Agencia IA</h1>
      </header>

      {view === "dashboard" && (
        <>
          {/* Selector IA */}
          <div className="mb-4 flex flex-col gap-2">
            <div>
              <label className="font-semibold mr-2">Proveedor IA:</label>
              <select
                value={provider}
                onChange={(e) =>
                  setProvider(e.target.value as "openai" | "gemini")
                }
                className="border rounded px-2 py-1"
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={multiAgentMode}
                onChange={(e) => setMultiAgentMode(e.target.checked)}
              />
              Modo multiagente colaborativo
            </label>
          </div>

          <h2 className="text-xl mb-4">Selecciona agentes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {agents.map(agent => (
              <div
                key={agent.id}
                onClick={() => toggleAgentSelection(agent.id)}
                className={`p-4 rounded cursor-pointer ${
                  selectedAgents.includes(agent.id)
                    ? "bg-blue-500 text-white"
                    : "bg-white"
                }`}
              >
                <div className="text-3xl">{agent.icon}</div>
                <strong>{agent.name}</strong>
                <p>{agent.description}</p>
              </div>
            ))}
          </div>

          {selectedAgents.length > 0 && (
            <button
              onClick={startChat}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded flex items-center gap-2"
            >
              <MessageSquare /> Iniciar Chat <ChevronRight className="inline" />
            </button>
          )}
        </>
      )}

      {view === "chat" && (
        <div className="bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => setView("dashboard")}>
              <X />
            </button>
            <span className="text-xs text-gray-500">
              IA: {provider.toUpperCase()} •{" "}
              {multiAgentMode ? "Multiagente" : "Un solo agente"}
            </span>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto border rounded p-2 bg-gray-50">
            {chatMessages.map((msg, i) => (
              <div key={i}>
                {msg.type === "system" && (
                  <p className="text-xs text-gray-500 text-center">
                    {msg.content}
                  </p>
                )}
                {msg.type !== "system" && (
                  <div className="mb-2">
                    <strong>
                      {msg.type === "user"
                        ? "Tú"
                        : msg.agent || "Agente"}
                    </strong>
                    <p>{msg.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex mt-4 gap-2">
            <input
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              className="border flex-1 px-2 rounded"
              placeholder="Escribe..."
            />
            <button
              onClick={sendMessage}
              disabled={isSending}
              className="bg-blue-500 px-4 text-white rounded disabled:opacity-50"
            >
              {isSending ? "Enviando..." : <Send />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
