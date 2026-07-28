// AssistantPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bot, Send, User, Sparkles, RefreshCw, Volume2, Mic } from 'lucide-react';

export default function AssistantPage() {
  const { chatHistory, sendChatMessage, isThinking, refreshData } = useApp();
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isThinking]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    const text = inputText;
    setInputText('');
    await sendChatMessage(text);
  };

  const quickPrompts = [
    "What can I cook with my active pantry items?",
    "Suggest a meal plan to save LKR 2000 this month.",
    "Which ingredients in my cabinet are expiring soon?"
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-3rem)] gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">HomeOS AI Assistant</h1>
            <p className="text-xs text-slate-400">Context-Aware Household Operating System</p>
          </div>
        </div>

        <button
          onClick={refreshData}
          className="p-2 rounded-xl bg-[#0f172a] border border-[#1e293b] hover:border-indigo-500/50 text-slate-300 transition-all"
          title="Refresh Assistant Context"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => sendChatMessage(prompt)}
            disabled={isThinking}
            className="px-3 py-1.5 bg-[#0f172a] border border-[#1e293b] hover:border-indigo-500/40 text-slate-300 hover:text-white rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Window */}
      <div className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 overflow-y-auto flex flex-col gap-4">
        {chatHistory.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                    : 'bg-[#070a13] border border-[#1e293b] text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#070a13] border border-[#1e293b] p-3 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Querying HomeOS LangGraph Workflow & SQLite Inventory...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex items-center gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask HomeOS anything about your pantry, meals, or budget..."
          disabled={isThinking}
          className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded-2xl px-5 py-3.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isThinking}
          className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
