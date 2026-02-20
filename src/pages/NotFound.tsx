import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-8xl font-heading font-bold gradient-text">404</h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Página no encontrada
          </h2>
          <p className="text-muted-foreground">
            La página que buscas no existe o fue movida.
          </p>
        </div>
        <Link to="/">
          <Button className="bg-gradient-nexabis hover:opacity-90 transition-opacity gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al Inicio
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

