import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Book, Video, Headphones, ArrowRight } from "lucide-react";

export interface Resource {
  id: number;
  title: string;
  description: string;
  type: string;
  estimatedTime: string;
  url: string;
}

interface ResourceCardProps {
  resource: Resource;
}

export function ResourceIcon({ type }: { type: string }) {
  switch (type) {
    case "article":
      return <Book className="text-primary-600" />;
    case "video":
      return <Video className="text-secondary-600" />;
    case "audio":
      return <Headphones className="text-accent-600" />;
    default:
      return <Book className="text-primary-600" />;
  }
}

export function ResourceBgColor({ type }: { type: string }) {
  switch (type) {
    case "article":
      return "bg-primary-100";
    case "video":
      return "bg-secondary-100";
    case "audio":
      return "bg-accent-100";
    default:
      return "bg-primary-100";
  }
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className={`h-10 w-10 rounded-md ${ResourceBgColor({ type: resource.type })} flex items-center justify-center`}>
            <ResourceIcon type={resource.type} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <Link href={resource.url}>
            <p className="text-sm font-medium text-neutral-900 truncate hover:text-primary-600">
              {resource.title}
            </p>
          </Link>
          <p className="text-xs text-neutral-500">{resource.estimatedTime}</p>
        </div>
      </div>
    </li>
  );
}

export function ResourcesList({ resources }: { resources: Resource[] }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-6">
        <ul className="divide-y divide-neutral-200">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </ul>
        <div className="mt-4 text-center">
          <Link
            href="/resources"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 inline-flex items-center"
          >
            すべてのリソースを見る <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
