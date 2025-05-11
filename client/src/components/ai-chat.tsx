import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface ChatMessage {
  id?: number;
  content: string;
  isUser: boolean;
  createdAt: string;
}

interface AIChatProps {
  sessionId?: number;
  title?: string;
  description?: string;
}

export default function AIChat({ 
  sessionId = 1, 
  title = "AIコーチングセッション", 
  description = "あなたの状況や悩みを共有してください。AIコーチがサポートします。" 
}: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [partialResponse, setPartialResponse] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // 初期メッセージの設定
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          content: "こんにちは！今日はどのようなお手伝いができますか？あなたの気持ちや状況について教えてください。",
          isUser: false,
          createdAt: new Date().toISOString()
        }
      ]);
    }
  }, [messages.length]);

  // メッセージ履歴の取得
  useEffect(() => {
    if (sessionId) {
      fetchChatHistory();
    }
  }, [sessionId]);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, partialResponse]);

  const fetchChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/history?sessionId=${sessionId}`);
      if (!response.ok) throw new Error("履歴の取得に失敗しました");
      
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const formattedMessages = data.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.isUser,
          createdAt: msg.createdAt
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("チャット履歴の取得エラー:", error);
      toast({
        title: "エラー",
        description: "チャット履歴を取得できませんでした",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isStreaming) return;

    // ユーザーメッセージをUIに追加
    const userMessage: ChatMessage = {
      content: inputValue,
      isUser: true,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsStreaming(true);
    setPartialResponse("");

    try {
      // APIリクエストを送信
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: inputValue
        })
      });

      if (!response.ok) {
        throw new Error("メッセージの送信に失敗しました");
      }

      if (response.body) {
        // ストリーミングレスポンスの処理
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            setPartialResponse(prev => prev + chunk);
          }
        }
        
        // 完了時に完全なメッセージを追加
        const aiMessage: ChatMessage = {
          content: partialResponse,
          isUser: false,
          createdAt: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setPartialResponse("");
      }
    } catch (error) {
      console.error("メッセージ送信エラー:", error);
      toast({
        title: "エラー",
        description: "メッセージの送信に失敗しました",
        variant: "destructive"
      });
      
      // エラーメッセージをUIに追加
      const errorMessage: ChatMessage = {
        content: "申し訳ありません、メッセージの処理中にエラーが発生しました。もう一度お試しください。",
        isUser: false,
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm");
    } catch (error) {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto">
      <Card className="flex flex-col h-full bg-background shadow-lg">
        <div className="px-4 py-3 border-b">
          <h2 className="text-xl font-semibold text-primary">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
              >
                <div className="flex items-start max-w-[80%] space-x-2">
                  {!message.isUser && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src="/images/ai-avatar.png" />
                      <AvatarFallback className="bg-primary text-white">AI</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div>
                    <div
                      className={`p-3 rounded-lg ${
                        message.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatMessageDate(message.createdAt)}
                    </span>
                  </div>
                  
                  {message.isUser && (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src="/images/user-avatar.png" />
                      <AvatarFallback className="bg-secondary">Me</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
            
            {isStreaming && partialResponse && (
              <div className="flex justify-start">
                <div className="flex items-start max-w-[80%] space-x-2">
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarFallback className="bg-primary text-white">AI</AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="whitespace-pre-wrap">{partialResponse}</p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {format(new Date(), "HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-background">
          <div className="flex items-end space-x-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力してください..."
              className="min-h-[60px] resize-none"
              disabled={isLoading || isStreaming}
            />
            <Button
              type="submit"
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || isStreaming}
            >
              {isLoading || isStreaming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}