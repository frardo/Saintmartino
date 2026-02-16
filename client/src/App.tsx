import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProductDetail from "@/pages/ProductDetail";
import Admin from "@/pages/Admin";
import { Settings } from "lucide-react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Home} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        {import.meta.env.DEV && (
          <Link href="/admin">
            <button className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Admin
            </button>
          </Link>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
