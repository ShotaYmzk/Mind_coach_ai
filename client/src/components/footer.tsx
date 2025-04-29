import { Twitter, Instagram, Youtube } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-10">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:order-2 space-x-6">
            <a
              href="#"
              className="text-neutral-400 hover:text-neutral-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">Twitter</span>
              <Twitter className="h-6 w-6" />
            </a>
            <a
              href="#"
              className="text-neutral-400 hover:text-neutral-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">Instagram</span>
              <Instagram className="h-6 w-6" />
            </a>
            <a
              href="#"
              className="text-neutral-400 hover:text-neutral-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="sr-only">YouTube</span>
              <Youtube className="h-6 w-6" />
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} MindCoach AI. All rights reserved.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-center space-x-6">
          <Link
            href="/privacy"
            className="text-sm text-neutral-500 hover:text-neutral-600"
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/terms"
            className="text-sm text-neutral-500 hover:text-neutral-600"
          >
            利用規約
          </Link>
          <Link
            href="/help"
            className="text-sm text-neutral-500 hover:text-neutral-600"
          >
            ヘルプ
          </Link>
        </div>
      </div>
    </footer>
  );
}
