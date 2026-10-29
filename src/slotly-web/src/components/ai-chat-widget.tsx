import {
  Bot,
  Check,
  CheckCheck,
  Copy,
  Minus,
  RotateCcw,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/cn";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  link?: {
    label: string;
    to: string;
  };
  copied?: boolean;
  liked?: boolean | null;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Hello! 👋 I'm your Slotly AI Assistant. I can help you schedule appointments, explore features, or guide you through team availability.",
    timestamp: "Just now",
  },
  {
    id: "welcome-2",
    sender: "bot",
    text: "How can I assist your business today?",
    timestamp: "Just now",
  },
];

const SUGGESTED_PROMPTS = [
  { emoji: "🤖", text: "What is Slotly?" },
  { emoji: "📅", text: "Book an appointment" },
  { emoji: "💰", text: "Pricing & plans" },
  { emoji: "🔄", text: "How does calendar sync work?" },
];

function getBotReply(userText: string): { text: string; link?: { label: string; to: string } } {
  const lower = userText.toLowerCase();

  if (lower.includes("book") || lower.includes("appointment") || lower.includes("northstar")) {
    return {
      text: "You can test our customer booking flow right now! Choose a service, select a provider, and pick an open slot in real-time.",
      link: {
        label: "Open Northstar Health Booking",
        to: "/book/northstar-health",
      },
    };
  }

  if (lower.includes("price") || lower.includes("pricing") || lower.includes("plan") || lower.includes("cost")) {
    return {
      text: "Slotly offers transparent pricing: Solo for individual practitioners, Team for shared multi-host scheduling, and Operations for large clinic workflows.",
      link: {
        label: "View Pricing Plans",
        to: "/#pricing",
      },
    };
  }

  if (lower.includes("sync") || lower.includes("calendar") || lower.includes("google") || lower.includes("outlook")) {
    return {
      text: "Slotly syncs bidirectionally in real-time with Google Calendar, Outlook, and Apple iCloud to guarantee zero double-booking across all staff members.",
      link: {
        label: "Explore Integrations",
        to: "/login",
      },
    };
  }

  if (lower.includes("what is") || lower.includes("slotly") || lower.includes("about")) {
    return {
      text: "Slotly is a production-grade multi-tenant booking and scheduling SaaS designed for clinics, salons, and modern businesses with strict tenant isolation and instant booking.",
      link: {
        label: "Sign in to Workspace",
        to: "/login",
      },
    };
  }

  return {
    text: "Thanks for asking! Slotly is built to eliminate scheduling friction with automated intake forms, calendar protection, and instant confirmations.",
    link: {
      label: "Try Customer Booking",
      to: "/book/northstar-health",
    },
  };
}

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: timeString,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking and reply
    setTimeout(() => {
      const replyData = getBotReply(text);
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: replyData.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        link: replyData.link,
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 600);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, isLike: boolean) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, liked: msg.liked === isLike ? null : isLike } : msg
      )
    );
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <aside aria-label="Slotly AI Assistant Chat" className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50">
      {/* 1. Chat Dialog Component (Matching Figma specifications) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mb-2.5 w-[calc(100vw-2.5rem)] sm:w-[350px] h-[460px] max-h-[min(480px,calc(100vh-130px))] rounded-2xl bg-white shadow-2xl border border-gray-200/90 overflow-hidden flex flex-col font-sans"
            style={{
              boxShadow: "0 16px 36px -8px rgba(79, 70, 229, 0.22), 0 6px 18px -4px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Header: Royal Indigo Gradient with Bot Avatar & Status */}
            <div className="relative bg-gradient-to-r from-[#2563EB] via-[#4338CA] to-[#4F46E5] px-4 py-2.5 text-white shadow-sm flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
                  <Bot className="size-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white tracking-tight">Slotly AI</h3>
                    <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[9px] font-semibold text-white/90">
                      Assistant
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-[11px] text-emerald-200 font-medium leading-none">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online · Ready to help
                  </p>
                </div>
              </div>

              {/* Header Actions (Minimize, Reset, Close) */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleResetChat}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                  className="grid size-7 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <RotateCcw className="size-3" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Minimize chat"
                  aria-label="Minimize chat"
                  className="grid size-7 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <Minus className="size-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  aria-label="Close chat"
                  className="grid size-7 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Conversation Message List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F8FAFC]">
              {messages.map((message) => {
                const isBot = message.sender === "bot";
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2 max-w-[88%]",
                      isBot ? "self-start items-end" : "self-end ml-auto flex-row-reverse items-end"
                    )}
                  >
                    {/* Avatar */}
                    {isBot ? (
                      <div className="size-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-xs mb-0.5">
                        <Bot className="size-3.5" />
                      </div>
                    ) : (
                      <div className="size-6 rounded-full bg-[#0B1A2C] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs mb-0.5">
                        You
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div className="space-y-0.5">
                      <div
                        className={cn(
                          "relative px-3.5 py-2 text-xs leading-relaxed shadow-xs",
                          isBot
                            ? "rounded-2xl rounded-bl-xs bg-white text-[#1E293B] border border-gray-200/80"
                            : "rounded-2xl rounded-br-xs bg-gradient-to-r from-[#4F46E5] to-[#4338CA] text-white"
                        )}
                      >
                        <p>{message.text}</p>

                        {/* Optional action button link */}
                        {message.link && (
                          <div className="mt-2 pt-1.5 border-t border-gray-100">
                            <Link
                              to={message.link.to}
                              className="inline-flex items-center gap-1.5 font-bold text-xs text-[#0069FF] hover:underline"
                            >
                              <Sparkles className="size-3" />
                              {message.link.label}
                            </Link>
                          </div>
                        )}

                        {/* Bot Reaction Icons (Matching Figma: Copy, ThumbsUp, ThumbsDown) */}
                        {isBot && (
                          <div className="mt-1.5 -mb-0.5 flex items-center justify-end gap-1 text-gray-400">
                            <button
                              onClick={() => handleCopy(message.id, message.text)}
                              title="Copy text"
                              className="p-1 rounded hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                              {copiedId === message.id ? (
                                <Check className="size-3 text-emerald-600" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, true)}
                              title="Helpful"
                              className={cn(
                                "p-1 rounded hover:bg-gray-100 transition-colors",
                                message.liked === true ? "text-emerald-600" : "hover:text-gray-600"
                              )}
                            >
                              <ThumbsUp className="size-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(message.id, false)}
                              title="Not helpful"
                              className={cn(
                                "p-1 rounded hover:bg-gray-100 transition-colors",
                                message.liked === false ? "text-red-500" : "hover:text-gray-600"
                              )}
                            >
                              <ThumbsDown className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Timestamp & double checkmarks */}
                      <div
                        className={cn(
                          "flex items-center gap-1 text-[10px] text-gray-400 font-medium px-1",
                          !isBot && "justify-end"
                        )}
                      >
                        <span>{message.timestamp}</span>
                        {!isBot && <CheckCheck className="size-3 text-[#4F46E5]" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bot Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 max-w-[85%]">
                  <div className="size-6 rounded-full bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
                    <Bot className="size-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-bl-xs bg-white border border-gray-200/80 px-3 py-2 shadow-xs flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#4F46E5] animate-bounce" />
                    <span className="size-1.5 rounded-full bg-[#4F46E5] animate-bounce [animation-delay:0.2s]" />
                    <span className="size-1.5 rounded-full bg-[#4F46E5] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Pills (Above Input Bar as in Figma) */}
            <div className="bg-white border-t border-gray-100 px-3 py-1.5 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => handleSendMessage(prompt.text)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-50 border border-gray-200/90 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-[#EEF2FF] hover:border-[#4F46E5] hover:text-[#4F46E5] transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{prompt.emoji}</span>
                    <span>{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar (Figma Style: Pill with Send Arrow) */}
            <div className="p-2.5 bg-white border-t border-gray-100 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200/90 px-3 py-1.5 focus-within:bg-white focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-[#4F46E5]/15 transition-all shadow-inner"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message here..."
                  className="chat-input flex-1 bg-transparent text-xs text-[#0B1A2C] placeholder:text-gray-400 outline-none border-0 ring-0 focus:outline-none focus:ring-0 focus:border-0"
                  style={{
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                    backgroundColor: "transparent",
                  }}
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  aria-label="Send message"
                  className={cn(
                    "grid size-7 place-items-center rounded-full transition-all shrink-0 shadow-xs",
                    inputValue.trim()
                      ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] hover:scale-105 active:scale-95"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send className="size-3" />
                </button>
              </form>
              <div className="mt-1 text-center">
                <span className="text-[9px] text-gray-400">
                  Powered by <span className="font-semibold text-gray-500">Slotly AI</span> · Instant scheduling assistance
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Animated SVG Trigger Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close Slotly AI Assistant" : "Open Slotly AI Assistant"}
          title={isOpen ? "Close Slotly AI Assistant" : "Open Slotly AI Assistant"}
          className="relative group transition-transform duration-300 hover:scale-110 active:scale-95 focus:outline-none cursor-pointer bg-transparent border-0 p-0"
        >
          {/* The Animated SVG is the Button */}
          <img
            src="/hello-animation.svg"
            alt="Slotly AI Assistant"
            className="object-contain drop-shadow-2xl select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
            style={{ width: "100px", height: "100px" }}
          />

          {/* Tooltip on hover */}
          {!isOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center">
              <div className="whitespace-nowrap rounded-xl bg-[#0B1A2C] text-white px-3 py-1.5 text-xs font-semibold shadow-xl border border-white/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                💬 Need help? Ask Slotly AI
              </div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
