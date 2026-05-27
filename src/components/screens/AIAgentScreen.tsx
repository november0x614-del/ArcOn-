import React, { useState } from "react";
import { ArrowLeft, Bot, Sparkles, Send } from "lucide-react";
import { useApp } from "../../contexts/AppContext";

interface AIAgentScreenProps {
  onBack: () => void;
}

export function AIAgentScreen({ onBack }: AIAgentScreenProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Halo! Saya Arc AI Agent. Ada yang bisa saya bantu dengan wallet atau transaksi USDC kamu hari ini?",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { balance, transactions } = useApp();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const newMsg = {
      id: messages.length + 1,
      sender: "user",
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const localContextString = `Current Balance: ${balance.toFixed(2)} USDC.
Recent Transactions:
${transactions
  .slice(0, 5)
  .map(
    (tx) =>
      `- ${tx.type.toUpperCase()}: ${tx.title} (${tx.amount} ${tx.currency}) [Status: ${tx.status}]`,
  )
  .join("\n")}`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages,
          localContext: localContextString,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "bot",
          text: data.reply || "Maaf, saya tidak dapat merespons saat ini.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "bot",
          text: "Terjadi kesalahan jaringan. Coba lagi nanti.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 relative flex flex-col z-50 animate-in slide-in-from-right duration-300">
      <div className="px-5 pt-6 pb-3 bg-slate-900 shadow-md flex items-center relative z-10 sticky top-0 justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 -ml-2 mr-2 hover:bg-white/10 rounded-full transition-colors active:bg-white/20 cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex bg-white/10 p-2 rounded-xl text-white mr-3">
            <Bot size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-[16px] text-slate-800 flex items-center gap-1">
              Arc Assistant <Sparkles size={14} className="text-white" />
            </h2>
            <span className="text-[11px] text-green-400 font-medium tracking-wide">
              ● Online
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        <div className="text-center my-4">
          <span className="bg-slate-200/50 text-slate-500 font-semibold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest">
            Hari Ini
          </span>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] p-3.5 rounded-2xl ${msg.sender === "user" ? "bg-[#005faa] text-white rounded-tr-sm" : "bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-sm"}`}
            >
              <p className="text-[13px] leading-relaxed">{msg.text}</p>
              <span
                className={`text-[10px] block mt-1.5 text-right opacity-70 ${msg.sender === "user" ? "text-blue-100" : "text-slate-400"}`}
              >
                {msg.time}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in zoom-in duration-300">
            <div className="bg-white text-slate-700 shadow-sm border border-slate-100 p-3.5 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
              <span
                className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              ></span>
              <span
                className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              ></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full py-1.5 px-4 focus-within:border-slate-900 transition-colors">
          <input
            type="text"
            placeholder="Tanya sesuatu ke AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-transparent py-2 outline-none text-[13.5px] text-slate-700"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-8 h-8 flex items-center justify-center bg-[#005faa] text-white rounded-full disabled:opacity-50 disabled:bg-slate-300 transition-colors"
          >
            <Send size={14} className="ml-[-2px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
