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
      {/* Lottie Animation Container Only */}
      <div 
        ref={lottieContainer}
        className="w-96 h-96 md:w-[32rem] md:h-[32rem] lg:w-[40rem] lg:h-[40rem]"
      />

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