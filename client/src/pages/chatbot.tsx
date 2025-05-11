import { useEffect } from 'react';
import { useLocation } from 'wouter';
import SimpleChatbot from '@/components/simple-chatbot';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useAuth } from '@/lib/auth';

export default function ChatbotPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  
  // 未認証の場合はログインページにリダイレクト
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">
          シンプル AI チャットボット
        </h1>
        
        <p className="text-center text-muted-foreground mb-8 max-w-md mx-auto">
          メンタルヘルスについて気軽に質問できるAIチャットボットです。<br />
          あなたの悩みや質問に、優しくシンプルな言葉で回答します。
        </p>
        
        <SimpleChatbot />
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            このチャットボットは一般的な情報提供のみを目的としています。<br />
            専門的な医療アドバイスや診断の代わりにはなりません。
          </p>
          <p className="mt-2">
            緊急の場合や深刻な症状がある場合は、医療専門家に相談してください。
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}