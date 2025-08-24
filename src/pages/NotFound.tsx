import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 -mt-12"> {/* naik 3rem */}
        {/* Gambar 404 responsif lebih kecil */}
        <div className="mx-auto w-full max-w-lg"> {/* dari sm:max-w-2xl jadi max-w-lg */}
          <img
            src="/404.webp"
            alt="404 Not Found"
            className="w-full h-auto"
          />
        </div>

        <a
          href="/"
          className="inline-block rounded-md px-5 py-2 border transition hover:opacity-90
                     bg-primary text-primary-foreground border-primary"
          aria-label="Return to Home"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
