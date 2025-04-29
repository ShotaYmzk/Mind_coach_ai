import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";

export default function ProfileCard() {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }
  
  return (
    <Card className="shadow-card">
      <CardHeader className="px-6 py-5 border-b border-neutral-200">
        <CardTitle className="text-lg font-heading font-medium text-neutral-900">プロフィール</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=128&h=128&q=80" alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-4">
            <h4 className="text-lg font-medium text-neutral-900">{user.name}</h4>
            <p className="text-sm text-neutral-500">{user.location || "設定されていません"}</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="bg-neutral-50 p-4 rounded-md">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700">目標達成度</span>
              <span className="text-sm font-medium text-primary-600">65%</span>
            </div>
            <Progress value={65} className="h-2" />
          </div>
        </div>
        <div className="mt-5">
          <Link href="/profile">
            <Button
              variant="outline"
              className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              プロフィールを編集
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
