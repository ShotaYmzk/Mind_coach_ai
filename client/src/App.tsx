import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Coaching from "@/pages/coaching";
import Assessment from "@/pages/assessment";
import Admin from "@/pages/admin";
import Profile from "@/pages/profile";
import Reservation from "@/pages/reservation";
import Schedule from "@/pages/schedule";
import Status from "@/pages/status";
import Chatbot from "@/pages/chatbot";
import { AuthProvider } from "@/lib/auth";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { ThemeProvider } from "next-themes";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/coaching" component={Coaching} />
          <Route path="/assessment" component={Assessment} />
          <Route path="/admin" component={Admin} />
          <Route path="/profile" component={Profile} />
          <Route path="/reservation" component={Reservation} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/settings" component={Profile} />
          <Route path="/status" component={Status} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
