import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="relative mx-auto h-32 w-32 rounded-full bg-muted/30 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-muted-foreground/20 animate-[spin_10s_linear_infinite]" />
          <FileQuestion className="h-16 w-16 text-muted-foreground" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-heading font-bold sm:text-5xl">Page not found</h1>
          <p className="text-muted-foreground text-lg">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
