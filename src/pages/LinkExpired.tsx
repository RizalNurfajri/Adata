export default function LinkExpired() {
  // Mock Link component since react-router-dom isn't available
  const Link = ({ to, className, children }) => (
    <a href={to} className={className}>
      {children}
    </a>
  );

  // Mock Button component
  const Button = ({ className, variant, children, ...props }) => {
    const baseClasses = "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none";
    const variantClasses = "bg-blue-500 hover:bg-blue-600 text-white";
    
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      
      {/* Image */}
      <div className="mb-8">
        <img 
          src="https://i.imgur.com/Bbur9QY.jpeg" 
          alt="Link Expired Illustration"
          className="w-96 h-80 object-contain rounded-lg shadow-lg"
        />
      </div>

      {/* Content */}
      <div className="text-center max-w-lg space-y-6">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Login Link Expired
        </h1>
        
        {/* Description */}
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          Hi there, your login link has expired, because you haven't used it. Login link expires after every 24 hours and can only be used once. You can request another link by clicking on the button below.
        </p>
        
        {/* Button */}
        <div className="mb-8">
          <Link to="/request-link">
            <Button className="px-8 py-4 rounded-lg text-lg font-bold tracking-wide">
              REQUEST ANOTHER LINK
            </Button>
          </Link>
        </div>
        
        {/* Footer text */}
        <p className="text-gray-500 text-sm">
          If this issue continue to persist, 
          <Link to="/contact" className="text-blue-500 hover:text-blue-600 underline ml-1">
            let us know
          </Link>.
        </p>
      </div>
    </div>
  )
}