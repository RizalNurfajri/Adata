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
      <div className="text-center space-y-6 -mt-12">  {/* naik 3rem */}
        {/* Lottie 404 lebih besar & responsif */}
        <div className="mx-auto w-full max-w-xl sm:max-w-2xl">
          {/* @ts-ignore: web component */}
          <lottie-player
            src="/animations/404.json"
            background="transparent"
            speed="1"
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
          ></lottie-player>
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
