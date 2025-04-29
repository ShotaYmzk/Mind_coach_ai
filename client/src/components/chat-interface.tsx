import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrainCog, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface ChatMessage {
  id: number;
  content: string;
  isUser: boolean;
  createdAt: string;
}

interface ChatProps {
  sessionId?: number;
  title?: string;
  description?: string;
}

export default function ChatInterface({ sessionId, title = "AIコーチングセッション", description = "あなたの状況や悩みを共有してください" }: ChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | undefined>(sessionId);
  
  // Create a new session if needed
  const { mutateAsync: createSession } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chat/sessions", {
        userId: user?.id,
        title: "新しいセッション",
      });
      return res.json();
    },
    onSuccess: (data) => {
      setActiveSessionId(data.id);
    },
  });
  
  // Fetch messages for the active session
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/chat/sessions", activeSessionId, "messages"],
    enabled: !!activeSessionId && !!user,
  });
  
  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      // If no active session, create one first
      if (!activeSessionId) {
        const newSession = await createSession();
        return apiRequest("POST", `/api/chat/sessions/${newSession.id}/messages`, { content });
      }
      return apiRequest("POST", `/api/chat/sessions/${activeSessionId}/messages`, { content });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions", activeSessionId, "messages"] });
    },
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && user) {
      sendMessage(message);
    }
  };
  
  // Format time from Date string
  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };
  
  return (
    <Card className="shadow-card">
      <CardHeader className="px-6 py-5 border-b border-neutral-200">
        <CardTitle className="text-lg font-heading font-medium text-neutral-900">{title}</CardTitle>
        <CardDescription className="mt-1 text-sm text-neutral-500">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoadingMessages ? (
            <>
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-16 w-3/4 ml-auto" />
              <Skeleton className="h-16 w-3/4" />
            </>
          ) : messages?.length > 0 ? (
            messages.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex items-start ${msg.isUser ? "justify-end" : ""}`}
              >
                {!msg.isUser && (
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <BrainCog className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                )}
                <div className={`ml-3 ${msg.isUser ? "mr-3" : ""}`}>
                  <div
                    className={`chat-bubble ${
                      msg.isUser
                        ? "chat-bubble-user bg-secondary-100"
                        : "chat-bubble-ai bg-neutral-200"
                    } p-3 rounded-lg`}
                  >
                    <p className="text-sm text-neutral-800 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className={`text-xs text-neutral-500 ${msg.isUser ? "mr-2 text-right" : "ml-2"} mt-1 inline-block`}>
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
                {msg.isUser && (
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=128&h=128&q=80" alt={user?.name} />
                      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <BrainCog className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-1">AIコーチとの会話を始めましょう</h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                心配事や質問、日々の気分について共有してください。あなたの心の健康をサポートします。
              </p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t border-neutral-200">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex rounded-md shadow-sm">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 rounded-l-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="メッセージを入力..."
              disabled={isSending || !user}
            />
            <Button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-r-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={isSending || !message.trim() || !user}
            >
              {isSending ? "送信中..." : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}
