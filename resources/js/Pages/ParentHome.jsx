import AppLayout from '@/Layouts/AppLayout';
import { usePage } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { chatHistoryKey, loadArchivedChatSessions, loadChatHistory, saveChatHistory } from "@/lib/chat-history";
import { Loader2, Send, Bot, UserRound, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ParentHome() {
  const { props } = usePage();
  const userId = props?.auth?.user?.id;
  const storageKey = chatHistoryKey(userId, 'home');
  const [chatMessages, setChatMessages] = useState(() => loadChatHistory(storageKey, []));
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [archivedSessions, setArchivedSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const { data: portal, isLoading } = useQuery({
    queryKey: ['parent-home'],
    queryFn: async () => {
      const { data } = await http.get('/parent-portal');
      return data?.data ?? data;
    },
  });

  const children = portal?.children ?? [];
  const selectedSession = archivedSessions.find((session) => session.id === selectedSessionId) ?? archivedSessions[0];

  useEffect(() => {
    saveChatHistory(storageKey, chatMessages);
  }, [chatMessages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSending]);

  useEffect(() => {
    // Prevent scrolling on the page
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Restore scrolling when component unmounts
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  const answerParentQuestion = (text) => {
    const q = text.toLowerCase();
    
    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return 'Hello! I can help you with your child\'s grades, attendance, documents, transfers, and more. What would you like to know?';
    }
    if (q.includes('grade') || q.includes('average') || q.includes('report') || q.includes('score')) {
      return 'To view your child\'s grades and academic performance, please visit the Parent Portal page. There you can see detailed grade reports, general averages, and download report cards.';
    }
    if (q.includes('attendance') || q.includes('absent') || q.includes('late') || q.includes('present')) {
      return 'You can check your child\'s attendance records in the Parent Portal. Go to the Attendance tab to view absence count, late marks, and attendance summary for the current school year.';
    }
    if (q.includes('transfer')) {
      return 'To request a transfer, visit the Parent Portal and go to the Transfer Request tab. Fill in the destination school, reason for transfer, and the intended transfer date. The registrar will review and process your request.';
    }
    if (q.includes('form 137') || q.includes('good moral') || q.includes('certificate') || q.includes('document') || q.includes('report card')) {
      return 'You can download important documents from the Parent Portal under the Documents tab. Available documents include the Report Card (Form 138), Form 137, and Good Moral Certificate as PDF files.';
    }
    if (q.includes('enroll') || q.includes('enrollment') || q.includes('register')) {
      return 'For enrollment inquiries, school staff handle official placement. If your child is missing or unassigned to a section, please contact the registrar office directly.';
    }
    if (q.includes('violation') || q.includes('discipline') || q.includes('behavior')) {
      return 'You can view your child\'s violations and disciplinary records in the Parent Portal under the Violations tab. This helps you stay informed about behavioral concerns.';
    }
    if (q.includes('help') || q.includes('contact') || q.includes('support')) {
      return 'I\'m here to help with portal navigation and general questions about your child\'s academics. For specific concerns or technical support, please reach out to the school registrar or administration office.';
    }
    
    return 'I can help with questions about grades, attendance, documents, transfers, violations, and enrollment. Feel free to ask!';
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;

    setIsSending(true);
    setChatInput("");

    const history = chatMessages.slice(-8);

    setChatMessages((messages) => [
      ...messages,
      { role: "user", text },
    ]);

    try {
      const { data } = await http.post('/parent/chatbot', {
        message: text,
        history,
      });
      const response = data?.data?.answer ?? data?.answer ?? answerParentQuestion(text);

      setChatMessages((messages) => [
        ...messages,
        { role: "assistant", text: response },
      ]);
    } catch (error) {
      const response = answerParentQuestion(text);
      setChatMessages((messages) => [
        ...messages,
        { role: "assistant", text: response },
      ]);
      toast.error(error?.response?.data?.message ?? 'Assistant is using offline help for now.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  const openHistory = () => {
    const sessions = loadArchivedChatSessions(userId, 'home');
    setArchivedSessions(sessions);
    setSelectedSessionId(sessions[0]?.id ?? null);
    setHistoryOpen(true);
  };

  const continueArchivedSession = (session) => {
    if (!session?.messages?.length) return;

    setChatMessages(session.messages);
    setHistoryOpen(false);
    toast.success('Conversation loaded');
  };

  return (
    <AppLayout>
      <div className="flex flex-col w-full h-[calc(100vh-119px)] bg-white">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto min-h-0 w-full">
          <div
            className={`flex min-h-full flex-col items-center w-full px-4 py-8 ${
              chatMessages.length === 0 ? 'justify-center' : 'justify-end'
            }`}
          >
            <div className="w-full max-w-3xl">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mb-6">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">Portal Assistant</h1>
                  <p className="text-slate-600 max-w-md">
                    Ask me anything about your child's grades, attendance, documents, transfers, and more. I'm here to help!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                      )}
                      <div className={`max-w-xl px-4 py-3 rounded-lg ${
                        msg.role === 'assistant'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-blue-600 text-white'
                      }`}>
                        <p className="text-base leading-relaxed break-words">{msg.text}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center shrink-0 mt-1">
                          <UserRound className="w-5 h-5 text-slate-700" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      </div>
                      <div className="bg-slate-100 text-slate-800 px-4 py-3 rounded-lg">
                        <p className="text-base">Thinking...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 px-4 py-4 bg-white shrink-0 w-full">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Input
              type="text"
              placeholder="Ask me anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="flex-1 h-12 text-base px-4"
            />
            <Button
              onClick={sendChat}
              disabled={!chatInput.trim() || isSending}
              className="h-12 w-12 p-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
            <span>Portal Assistant • Press Enter to send</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openHistory}
              className="h-7 px-2 text-xs text-slate-500"
            >
              <History className="w-3.5 h-3.5 mr-1" />
              History
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Conversation history</DialogTitle>
          </DialogHeader>

          {archivedSessions.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Previous conversations will appear here after you log out.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[260px_1fr]">
              <div className="max-h-[420px] overflow-y-auto border rounded-md">
                {archivedSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => continueArchivedSession(session)}
                    className="w-full text-left px-3 py-3 border-b last:border-b-0 hover:bg-blue-50"
                  >
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{session.title}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(session.createdAt).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>

              <div className="max-h-[420px] overflow-y-auto rounded-md border bg-white p-4 space-y-3">
                {(selectedSession?.messages ?? []).map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
