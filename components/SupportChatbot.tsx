"use client";

import { MessageCircle, Send, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SUPPORT_EMAIL } from "@/config/emails";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

const getReply = (input: string) => {
  const value = input.toLowerCase();

  if (value.includes("order")) {
    return "For order assistance, open your account orders tab or cart. I can also route you to a human for payment, delivery, or reorder questions.";
  }

  if (value.includes("print") || value.includes("stl") || value.includes("obj")) {
    return "For printing guidance, use the Printing Service page to upload STL or OBJ files and review dimensions, material usage, time, compatible printers, and cost.";
  }

  if (value.includes("product") || value.includes("printer")) {
    return "For product support, browse the store categories or open a product page to compare specifications, pricing, and availability.";
  }

  return "I can help with products, orders, and the printing service. If you need a human, use the escalation button below.";
};

export default function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Support assistant is ready. Ask about products, orders, or 3D printing service guidance.",
    },
  ]);

  const mailtoLink = useMemo(
    () =>
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        "Creality Support Request"
      )}&body=${encodeURIComponent(
        "I need help with:\n\nProduct / Order / Printing Service\n\nDetails:\n"
      )}`,
    []
  );

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: current.length + 1, role: "user", text: trimmed },
      { id: current.length + 2, role: "assistant", text: getReply(trimmed) },
    ]);
    setInput("");
  };

  return (
    <div className="support-widget fixed bottom-5 right-5 z-[80]">
      {open ? (
        <div className="w-[320px] rounded-3xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Support Chat</p>
              <p className="text-xs text-gray-500">Product, order, and printing help</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close chatbot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[320px] space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === "assistant"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-black text-white"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-1 text-[11px] opacity-70">
                    {message.role === "assistant" ? (
                      <MessageCircle className="h-3 w-3" />
                    ) : (
                      <UserRound className="h-3 w-3" />
                    )}
                    <span>{message.role === "assistant" ? "Assistant" : "You"}</span>
                  </div>
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask for support"
                className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-black"
              />
              <button
                type="button"
                onClick={handleSend}
                className="rounded-full bg-black p-2.5 text-white transition hover:bg-gray-800"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <a
              href={mailtoLink}
              className="mt-3 inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Talk to Human
            </a>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800"
        >
          <MessageCircle className="h-4 w-4" />
          Support
        </button>
      )}
    </div>
  );
}
