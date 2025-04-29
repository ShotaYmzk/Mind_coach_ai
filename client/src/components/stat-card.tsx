import { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  footer?: {
    text: string;
    link: string;
  };
}

export default function StatCard({
  title,
  value,
  icon,
  iconBgColor,
  iconTextColor,
  footer,
}: StatCardProps) {
  return (
    <Card className="overflow-hidden shadow-card">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div
            className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}
          >
            <div className={`${iconTextColor}`}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-neutral-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {footer && (
        <CardFooter className="bg-neutral-50 px-5 py-3">
          <div className="text-sm">
            <Link
              href={footer.link}
              className="font-medium text-primary-600 hover:text-primary-500 flex items-center"
            >
              {footer.text} <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
