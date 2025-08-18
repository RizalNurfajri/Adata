import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

// Declare lottie di global untuk TypeScript
declare global {
  interface Window {
    lottie: any;
  }
}

const NotFound = () => {
  const location = useLocation();
  const lottieContainer = useRef<HTMLDivElement>(null);
  const animationInstance = useRef<any>(null);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Initialize Lottie Animation untuk 404
  useEffect(() => {
    let lottieAnimation: any = null;

    const initLottie = async () => {
      try {
        // Load Lottie from CDN jika belum ada di window
        if (!window.lottie) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js'
            script.async = true
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        if (lottieContainer.current && window.lottie) {
          try {
            // Coba load dari animations folder - untuk 404 animation
            const response = await fetch('/animations/404.json')
            const animationData = await response.json()
            
            lottieAnimation = window.lottie.loadAnimation({
              container: lottieContainer.current,
              renderer: 'svg',
              loop: true,
              autoplay: true,
              animationData: animationData
            })
          } catch (fetchError) {
            console.log('404 animation not found, trying fallback path...')
            // Fallback: coba dari path langsung
            lottieAnimation = window.lottie.loadAnimation({
              container: lottieContainer.current,
              renderer: 'svg',
              loop: true,
              autoplay: true,
              path: '/animations/404.json'
            })
          }
          
          animationInstance.current = lottieAnimation
        }

      } catch (error) {
        console.error('Error loading 404 Lottie animation:', error)
      }
    }

    initLottie()

    // Cleanup function
    return () => {
      if (animationInstance.current) {
        animationInstance.current.destroy()
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8 max-w-md mx-auto px-4">
        {/* Lottie Animation Container */}
        <div className="flex justify-center">
          <div 
            ref={lottieContainer}
            className="w-64 h-64 md:w-80 md:h-80"
          />
        </div>

        {/* 404 Content */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold text-primary">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Oops! Halaman Tidak Ditemukan
          </h2>
          <p className="text-muted-foreground text-lg">
            Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground 
                     rounded-lg font-medium transition-all duration-300 
                     hover:bg-primary/90 hover:scale-105 hover:shadow-lg
                     active:scale-95"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Kembali ke Beranda
          </a>
        </div>

        {/* Additional Info */}
        <div className="pt-8 text-sm text-muted-foreground">
          <p>Jika Anda yakin ini adalah kesalahan, silakan hubungi administrator.</p>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" 
             style={{
               backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
               backgroundSize: '40px 40px'
             }}>
        </div>
      </div>
    </div>
  );
};

export default NotFound;