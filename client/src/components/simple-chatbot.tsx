import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function SimpleChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      content: 'こんにちは！メンタルAIのチャットボットです。何かお手伝いできることはありますか？',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // 新しいメッセージが追加されたときに自動スクロール
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    // ユーザーメッセージを追加
    const userMessage: ChatMessage = {
      content: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // チャットボットAPIを呼び出し
      const response = await apiRequest('POST', '/api/chatbot', {
        message: input,
        history: messages.map(msg => ({
          content: msg.content,
          isUser: msg.isUser
        }))
      });

      const data = await response.json();
      
      // ボットの応答を追加
      const botMessage: ChatMessage = {
        content: data.response || 'すみません、エラーが発生しました。',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('チャットボットエラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'メッセージの送信中に問題が発生しました。もう一度お試しください。',
        variant: 'destructive'
      });
      
      // エラーメッセージを追加
      const errorMessage: ChatMessage = {
        content: '申し訳ありません。メッセージの処理中にエラーが発生しました。しばらくしてからもう一度お試しください。',
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto h-[600px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          シンプルチャットボット
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 border-t">
        <ScrollArea 
          ref={scrollAreaRef} 
          className="h-full px-4 py-4"
        >
          <div className="flex flex-col gap-3">
            {messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  message.isUser ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'rounded-xl px-4 py-2 max-w-[80%] break-words',
                    message.isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-2 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>入力中...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="pt-2">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            type="text"
            placeholder="メッセージを入力..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}