import { useAuth, logout } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, Heart, Settings, Chrome } from "lucide-react";

export function UserMenu() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return <div className="w-10 h-10 bg-secondary rounded-full animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className="flex items-center gap-2 hover:bg-primary/10 transition-colors"
      >
        <a
          href="/auth/google"
          className="flex items-center gap-2"
          onClick={() => {
            // Optional: Add console log for debugging
            console.log("🔐 Initiating Google OAuth login...");
          }}
        >
          <Chrome className="h-4 w-4" />
          <span>Entrar</span>
        </a>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium truncate">
          {user?.name}
        </div>
        <div className="px-2 py-1 text-xs text-muted-foreground truncate">
          {user?.email}
        </div>
        <div className="my-1.5 border-t" />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <Settings className="h-4 w-4 mr-2" />
          Minha Conta
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/profile#favoritos")}>
          <Heart className="h-4 w-4 mr-2" />
          Favoritos
        </DropdownMenuItem>
        <div className="my-1.5 border-t" />
        <DropdownMenuItem
          onClick={async () => {
            await logout();
          }}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
