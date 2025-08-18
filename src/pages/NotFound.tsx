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
      <div className="text-center space-y-6">
        {/* Lottie 404 */}
        <div className="mx-auto w-64 h-64 sm:w-72 sm:h-72">
          {/* @ts-ignore: web component */}
          <lottie-player
            src="/animations/404.json"  // ganti ke URL LottieFiles kalau mau pakai langsung
            background="transparent"
            speed="1"
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
          ></lottie-player>
        </div>

        <h1 className="text-3xl font-bold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">Oops! Page not found</p>

        <a
          href="/"
          className="inline-block rounded-md px-4 py-2 border transition hover:opacity-90
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
