import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function LaunchConsoleLink({ className = "" }: { className?: string }) {
  const { isAuthenticated, isLoading } = useAuth();
  const destination = isAuthenticated ? "/app" : "/auth";

  return (
    <Link
      to={destination}
      search={isAuthenticated ? undefined : { mode: "signin", returnTo: "/app" }}
      onClick={(event) => {
        if (isLoading) event.preventDefault();
      }}
      className={className}
      aria-disabled={isLoading}
    >
      {isLoading ? "Checking session…" : isAuthenticated ? "Open console" : "Launch console"}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}
