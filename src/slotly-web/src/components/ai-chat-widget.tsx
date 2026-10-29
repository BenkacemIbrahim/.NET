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
            className="mb-4 w-[calc(100vw-2.5rem)] sm:w-[410px] h-[580px] max-h-[82vh] rounded-3xl bg-white shadow-2xl border border-gray-200/90 overflow-hidden flex flex-col font-sans"
            style={{
              boxShadow: "0 20px 45px -10px rgba(79, 70, 229, 0.22), 0 8px 24px -6px rgba(0, 0, 0, 0.12)",
            }}
          >
            {/* Header: Royal Indigo Gradient with Bot Avatar & Status */}
            <div className="relative bg-gradient-to-r from-[#2563EB] via-[#4338CA] to-[#4F46E5] px-5 py-4 text-white shadow-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="size-10 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
                    <Bot className="size-5.5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-[#10B981] border-2 border-[#4338CA]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-white tracking-tight">Slotly AI</h3>
                    <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-semibold text-white/90">
                      Assistant
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-emerald-200 font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online · Ready to help
                  </p>
                </div>
              </div>

              {/* Header Actions (Minimize, Reset, Close) */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  title="Reset conversation"
                  aria-label="Reset conversation"
                  className="grid size-8 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <RotateCcw className="size-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Minimize chat"
                  aria-label="Minimize chat"
                  className="grid size-8 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <Minus className="size-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  aria-label="Close chat"
                  className="grid size-8 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Conversation Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
              {messages.map((message) => {
                const isBot = message.sender === "bot";
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2.5 max-w-[88%]",
                      isBot ? "self-start items-end" : "self-end ml-auto flex-row-reverse items-end"
                    )}
                  >
                    {/* Avatar */}
                    {isBot ? (
                      <div className="size-7 rounded-full bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-xs mb-1">
                        <Bot className="size-4" />
                      </div>
                    ) : (
                      <div className="size-7 rounded-full bg-[#0B1A2C] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs mb-1">
                        You
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div className="space-y-1">
                      <div
                        className={cn(
                          "relative px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs",
                          isBot
                            ? "rounded-2xl rounded-bl-xs bg-white text-[#1E293B] border border-gray-200/80"
                            : "rounded-2xl rounded-br-xs bg-gradient-to-r from-[#4F46E5] to-[#4338CA] text-white"
                        )}
                      >
                        <p>{message.text}</p>

                        {/* Optional action button link */}
                        {message.link && (
                          <div className="mt-2.5 pt-2 border-t border-gray-100">
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
                          <div className="mt-2 -mb-0.5 flex items-center justify-end gap-1 text-gray-400">
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
                <div className="flex items-center gap-2.5 max-w-[85%]">
                  <div className="size-7 rounded-full bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
                    <Bot className="size-4" />
                  </div>
                  <div className="rounded-2xl rounded-bl-xs bg-white border border-gray-200/80 px-4 py-2.5 shadow-xs flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#4F46E5] animate-bounce" />
                    <span className="size-1.5 rounded-full bg-[#4F46E5] animate-bounce [animation-delay:0.2s]" />
                    <span className="size-1.5 rounded-full bg-[#4F46E5] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Pills (Above Input Bar as in Figma) */}
            <div className="bg-white border-t border-gray-100 px-3 py-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => handleSendMessage(prompt.text)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-50 border border-gray-200/90 px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-[#EEF2FF] hover:border-[#4F46E5] hover:text-[#4F46E5] transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{prompt.emoji}</span>
                    <span>{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar (Figma Style: Pill with Send Arrow) */}
            <div className="p-3 bg-white border-t border-gray-100 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 rounded-2xl bg-gray-50 border border-gray-200/90 px-3.5 py-2 focus-within:bg-white focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-[#4F46E5]/15 transition-all shadow-inner"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 bg-transparent text-xs sm:text-sm text-[#0B1A2C] placeholder:text-gray-400 outline-none"
                />

                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  aria-label="Send message"
                  className={cn(
                    "grid size-8 place-items-center rounded-xl transition-all shadow-xs",
                    inputValue.trim()
                      ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] hover:scale-105 active:scale-95"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send className="size-3.5" />
                </button>
              </form>
              <div className="mt-1.5 text-center">
                <span className="text-[10px] text-gray-400">
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
          className="relative group transition-all duration-300 hover:scale-108 active:scale-95 focus:outline-none cursor-pointer"
        >
          {/* Animated Robot SVG in Floating Container */}
          <div
            className={cn(
              "relative size-16 sm:size-20 rounded-full transition-all duration-300 flex items-center justify-center p-0.5",
              isOpen
                ? "bg-[#0B1A2C] shadow-2xl ring-4 ring-[#4F46E5]/30"
                : "bg-white shadow-2xl hover:shadow-[0_12px_32px_rgba(79,70,229,0.35)] border border-gray-100"
            )}
          >
            {isOpen ? (
              <X className="size-8 text-white transition-transform duration-300 group-hover:rotate-90" />
            ) : (
              <img
                src="/hello-animation.svg"
                alt="AI Assistant"
                className="size-full object-contain pointer-events-none select-none drop-shadow-md"
              />
            )}
          </div>

          {/* Active status indicator badge */}
          {!isOpen && (
            <span className="absolute bottom-0 right-1 flex size-3.5 pointer-events-none">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </span>
          )}

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
