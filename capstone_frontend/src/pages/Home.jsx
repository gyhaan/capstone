import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, 
  Smartphone, 
  Satellite, 
  CloudRain, 
  BarChart3, 
  Map, 
  ArrowRight, 
  CheckCircle2,
  ShieldAlert // <-- New icon for the modal
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  
  // --- NEW: State for the EULA Modal ---
  const [showEula, setShowEula] = useState(false);

  useEffect(() => {
    // Check if they have already accepted the terms in a previous session
    const hasAccepted = localStorage.getItem('agriGuard_eula_accepted');
    
    if (!hasAccepted) {
      setShowEula(true);
      // Prevent scrolling while the modal is open
      document.body.style.overflow = 'hidden';
    }

    // Cleanup scrolling if component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleAccept = () => {
    localStorage.setItem('agriGuard_eula_accepted', 'true');
    setShowEula(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  const handleDecline = () => {
    // Throw them out! Redirects them away from the application.
    // You can change this URL to wherever you want to banish them to.
    window.location.href = "https://www.google.com"; 
  };
  // -------------------------------------

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 relative">
      
      {/* --- NEW: EULA Blocking Modal --- */}
      {showEula && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome to AgriGuard</h2>
                <p className="text-sm text-gray-500">Action Required to Proceed</p>
              </div>
            </div>
            
            <div className="space-y-4 text-gray-600 mb-8">
              <p>
                Before accessing the AgriGuard predictive platform, you must read and agree to our End-User Licence Agreement (EULA) and Privacy Policy.
              </p>
              <p className="text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                <strong>Key terms:</strong> Your GPS and phone number are strictly used for generating AI crop health assessments and will not be sold. Predictions are for advisory purposes only.
              </p>
              
              {/* Opens the legal page in a NEW tab so they don't lose the modal */}
              <button 
                onClick={() => window.open('/legal', '_blank')}
                className="text-green-600 hover:text-green-700 font-semibold text-sm underline underline-offset-2"
              >
                Read the full Privacy Policy & Terms of Service
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <button 
                onClick={handleDecline}
                className="px-6 py-3 w-full sm:w-auto text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 font-semibold rounded-xl transition-colors"
              >
                I Decline
              </button>
              <button 
                onClick={handleAccept}
                className="px-6 py-3 w-full sm:w-auto flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all"
              >
                I Accept & Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {/* -------------------------------- */}

      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Sprout className="h-8 w-8 text-green-600" />
          <span className="text-2xl font-extrabold text-green-950 tracking-tight">AgriGuard</span>
        </div>
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-8 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-green-50 -z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)' }}></div>
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-4">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Live in Musanze District
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-tight">
            Bridging the Yield Gap with <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Data-Driven Farming</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Empowering Rwandan smallholder farmers with satellite AI, real-time weather forecasting, and offline USSD access to predict harvests and defeat climate vulnerability.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-green-200 transition-all flex items-center gap-2"
            >
              Launch Web Platform <ArrowRight className="h-5 w-5" />
            </button>
            <button className="px-8 py-4 bg-white border-2 border-gray-200 hover:border-green-600 hover:text-green-700 text-gray-700 text-lg font-bold rounded-xl transition-all flex items-center gap-2">
              <Smartphone className="h-5 w-5" /> Dial *384*...#
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">A Complete Precision Agriculture Suite</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">No internet? No smartphone? No problem. AgriGuard is built to reach every farmer, regardless of their hardware.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Satellite className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Satellite NDVI AI</h3>
              <p className="text-gray-600 leading-relaxed">We process free Google Earth Engine vegetation data through a Scikit-learn ML model to predict your crop's health and harvest yield instantly.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="h-14 w-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Offline USSD Access</h3>
              <p className="text-gray-600 leading-relaxed">Powered by Africa's Talking. Farmers can register plots, run AI assessments, and receive health alerts on basic feature phones with zero internet.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="h-14 w-14 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-6">
                <CloudRain className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Weather Advisory</h3>
              <p className="text-gray-600 leading-relaxed">Integrated with Open-Meteo to provide 7-day localized rainfall and temperature forecasts, coupled with actionable agricultural advice.</p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="h-14 w-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Map className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">GIS Heatmap Command</h3>
              <p className="text-gray-600 leading-relaxed">Extension officers can view a live, interactive map of Rwanda displaying color-coded farm health statuses to spot regional droughts early.</p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="h-14 w-14 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Automated Cron Jobs</h3>
              <p className="text-gray-600 leading-relaxed">Our backend works while you sleep. Automated weekly updates track your farm's stress levels over the entire agricultural season.</p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-green-600 border border-green-500 shadow-lg text-white">
              <div className="h-14 w-14 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Built for Impact</h3>
              <p className="text-green-100 leading-relaxed">Successfully tested with over 70% positive feedback from local farmers, proving that precision farming doesn't require expensive hardware.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-8 text-center text-gray-400">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-4">
          <Sprout className="h-10 w-10 text-green-500 mb-2" />
          <p className="text-lg">AgriGuard Capstone Project</p>
          <p className="text-sm">Developed by Ganza Owen Yhaan • BSc. Software Engineering, ALU</p>
          
          <div className="mt-4 pt-4 border-t border-gray-800 w-full max-w-xs">
            <button 
              onClick={() => navigate('/legal')}
              className="text-sm text-gray-400 hover:text-green-500 transition-colors underline underline-offset-4"
            >
              Privacy Policy & Terms of Service
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;