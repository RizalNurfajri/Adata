export default function LinkExpired() {
  // Mock Link component since react-router-dom isn't available
  const Link = ({ to, className, children }) => (
    <a href={to} className={className}>
      {children}
    </a>
  );

  // Mock Button component
  const Button = ({ className, variant, children, ...props }) => {
    const baseClasses = "inline-flex items-center justify-center font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
    const variantClasses = "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1";
    
    return (
      <button 
        className={`${baseClasses} ${variantClasses} ${className}`} 
        {...props}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      
      {/* Image */}
      <div className="mb-12 animate-pulse">
        <img 
          src="https://i.imgur.com/wfqAcM7.png" 
          alt="Link Expired Illustration"
          className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl"
        />
      </div>

      {/* Content */}
      <div className="text-center max-w-2xl space-y-8">
        {/* Title with decorative elements */}
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="w-16 h-1 bg-gradient-to-r from-transparent to-blue-400 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-16 h-1 bg-gradient-to-l from-transparent to-blue-400 rounded-full"></div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Oops! Link Expired
          </h1>
          
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>
        
        {/* Description */}
        <div className="space-y-4">
          <p className="text-gray-700 text-lg md:text-xl leading-relaxed font-medium">
            Your login link has expired and can no longer be used.
          </p>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed">
            For security reasons, login links expire after 24 hours and can only be used once. 
            Don't worry - you can easily request a new one below.
          </p>
        </div>
        
        {/* Button with enhanced styling */}
        <div className="pt-4">
          <Link to="/request-link">
            <Button className="px-12 py-4 rounded-2xl text-lg font-bold tracking-wide">
              Get New Login Link
            </Button>
          </Link>
        </div>
        
        {/* Additional help section */}
        <div className="space-y-4 pt-8 border-t border-gray-200 border-opacity-50">
          <p className="text-gray-500 text-sm">
            Still having trouble? 
            <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-semibold ml-1 hover:underline transition-colors">
              Contact our support team
            </Link>
          </p>
          
          <p className="text-gray-400 text-xs">
            💡 Tip: Check your spam folder if you don't receive the new link within 5 minutes
          </p>
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/3 right-20 w-16 h-16 bg-indigo-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
    </div>
  )
}