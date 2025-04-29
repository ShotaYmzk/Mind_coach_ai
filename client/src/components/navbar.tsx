import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrainCog, Bell, Menu, X } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "ホーム", href: "/" },
    { name: "コーチング", href: "/coaching" },
    { name: "診断・分析", href: "/assessment" },
    { name: "人間コーチ予約", href: "/reservation" },
  ];

  return (
    <nav className="bg-white border-b border-neutral-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center mr-2">
                <BrainCog className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading font-semibold text-xl text-neutral-800">
                メンタルAI
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${
                    location === link.href
                      ? "border-primary-500 text-neutral-900"
                      : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center">
              <button
                type="button"
                className="bg-white p-1 rounded-full text-neutral-400 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="sr-only">通知を見る</span>
                <Bell className="h-6 w-6" />
              </button>
              
              <div className="ml-4 relative flex-shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=128&h=128&q=80" alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-2 hidden md:block">
                        <div className="text-sm font-medium text-neutral-700">
                          {user.name}
                        </div>
                        <div className="text-xs text-neutral-500">
                          プラン: {user.planType || "プレミアム"}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        プロフィール
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        設定
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="cursor-pointer"
                    >
                      ログアウト
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">ログイン</Button>
              </Link>
              <Link href="/register">
                <Button>登録</Button>
              </Link>
            </div>
          )}
          
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">メニューを開く</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${
                  location === link.href
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-800"
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          {user ? (
            <div className="pt-4 pb-3 border-t border-neutral-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=128&h=128&q=80" alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-neutral-800">
                    {user.name}
                  </div>
                  <div className="text-sm font-medium text-neutral-500">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  プロフィール
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  設定
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
                >
                  ログアウト
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-neutral-200">
              <div className="flex flex-col space-y-2 px-4">
                <Link
                  href="/login"
                  className="block px-4 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  登録
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
