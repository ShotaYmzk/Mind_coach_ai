import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceIcon, ResourceBgColor, type Resource } from "@/components/resource-card";
import { Book, Video, Headphones, Search, Clock, ExternalLink } from "lucide-react";

export default function Resources() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch resources
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["/api/resources"],
  });
  
  // Filter resources based on search term and active tab
  const filteredResources = resources.filter((resource: Resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && resource.type === activeTab;
  });
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-neutral-900 mb-2">メンタルヘルスリソース</h1>
        <p className="text-neutral-600 max-w-2xl">
          メンタルヘルス向上のための厳選されたリソースコレクション。記事、ビデオ、オーディオガイドなどを活用して、日々の心の健康をサポートしましょう。
        </p>
      </div>
      
      {/* Search and filter */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <Input
              type="text"
              placeholder="リソースを検索..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
            <TabsList>
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="article">記事</TabsTrigger>
              <TabsTrigger value="video">ビデオ</TabsTrigger>
              <TabsTrigger value="audio">オーディオ</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Resources grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource: Resource) => (
            <Card key={resource.id} className="overflow-hidden hover:shadow-card-hover transition-shadow duration-300">
              <div className={`h-2 ${ResourceBgColor({ type: resource.type })}`}></div>
              <CardHeader className="pb-2">
                <div className="flex items-center mb-2">
                  <div className={`h-8 w-8 rounded-md ${ResourceBgColor({ type: resource.type })} flex items-center justify-center mr-2`}>
                    <ResourceIcon type={resource.type} />
                  </div>
                  <span className="text-xs text-neutral-500 uppercase">
                    {resource.type === "article" ? "記事" : 
                     resource.type === "video" ? "ビデオ" : "オーディオ"}
                  </span>
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-neutral-500 mb-4">
                  <Clock className="h-4 w-4 mr-2" />
                  {resource.estimatedTime}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <a href={resource.url}>
                    閲覧する <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center py-10">
            <Search className="h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="text-xl font-medium text-neutral-700 mb-2">リソースが見つかりませんでした</h3>
            <p className="text-neutral-500 mb-4 max-w-md mx-auto">
              検索条件に一致するリソースがありません。キーワードを変更するか、フィルターをリセットしてみてください。
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setActiveTab("all");
              }}
            >
              すべてのリソースを表示
            </Button>
          </div>
        </Card>
      )}
      
      {/* Premium resources call-to-action */}
      {user && (
        <Card className="mt-12 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <CardContent className="p-8">
            <div className="md:flex items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h3 className="text-2xl font-bold mb-2">プレミアムリソースにアクセス</h3>
                <p className="text-primary-100 max-w-xl">
                  専門家監修のワークブック、詳細なガイド、専用瞑想音声など、より高度なリソースコレクションを活用しましょう。
                </p>
              </div>
              <Button className="bg-white text-primary-700 hover:bg-primary-50">
                プレミアムを開始
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
