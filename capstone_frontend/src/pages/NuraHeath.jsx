import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sprout, Satellite, Smartphone, CloudRain, ArrowRight, ArrowUpRight, Activity } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// --- GLOBAL NOISE COMPONENT ---
const GlobalNoise = () => (
  <div 
    className="pointer-events-none fixed inset-0 z-[100] opacity-[0.03] mix-blend-multiply"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
    }}
  />
);

// --- MAGNETIC BUTTON COMPONENT ---
const MagneticButton = ({ children, className, variant = 'canopy' }) => {
  const bgClasses = variant === 'terracotta' ? 'bg-[#C86641]' : variant === 'slate' ? 'bg-[#121816]' : 'bg-[#213A2F]';
  
  return (
    <button className={`group relative overflow-hidden rounded-full px-8 py-4 font-sans text-sm font-semibold tracking-wide text-[#F6F5F0] transition-transform duration-300 hover:scale-105 ${bgClasses} ${className}`}>
      <div className="absolute inset-0 z-0 h-full w-full translate-y-full rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

// --- ARTIFACT 1: NDVI SATELLITE SCANNER ---
const SatelliteScanner = () => {
  return (
    <div className="relative flex h-64 w-full flex-col justify-between rounded-[2rem] bg-[#121816] p-8 overflow-hidden">
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-[#F6F5F0]/50 text-xs font-mono uppercase">
          <Satellite className="h-4 w-4 text-[#C86641]" />
          <span>Sentinel-2 Orbit</span>
        </div>
        <div className="text-[#213A2F] text-xs font-mono bg-[#4A785E]/20 px-2 py-1 rounded">Live</div>
      </div>
      
      {/* Mock Satellite Imagery Grid */}
      <div className="absolute inset-0 top-16 bottom-8 mx-8 grid grid-cols-4 grid-rows-3 gap-1 opacity-40">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`rounded-sm transition-colors duration-1000 ${i % 3 === 0 ? 'bg-[#4A785E]' : i % 5 === 0 ? 'bg-[#C86641]' : 'bg-[#213A2F]'}`} />
        ))}
      </div>

      {/* Laser Scanner */}
      <div className="absolute left-0 right-0 h-0.5 bg-[#F6F5F0] shadow-[0_0_15px_#F6F5F0] z-20 animate-[scan_3s_ease-in-out_infinite]" />
      
      <div className="z-10 flex justify-between items-end">
        <div className="font-mono text-3xl text-[#F6F5F0]">0.64<span className="text-sm text-[#F6F5F0]/50 ml-1">NDVI</span></div>
        <div className="font-sans text-xs text-[#F6F5F0]/60">Vegetation Index</div>
      </div>
      <style>{`@keyframes scan { 0%, 100% { top: 20%; opacity: 0; } 10% { opacity: 1; } 50% { top: 80%; } 90% { opacity: 1; } }`}</style>
    </div>
  );
};

// --- ARTIFACT 2: USSD TERMINAL EMULATOR ---
const USSDTerminal = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { req: "*384*2026#", res: "Welcome to AgriGuard\n1. Register Farm\n2. AI Assessment" },
    { req: "2", res: "Analyzing Musanze Plot...\nYield: 2,400 kg/ha\nStatus: Healthy (Green)" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-64 w-full flex-col justify-between rounded-[2rem] bg-[#C86641] p-8 text-[#F6F5F0] shadow-inner">
      <div className="flex items-center gap-2 opacity-80 mb-4">
        <Smartphone className="h-5 w-5" />
        <span className="font-sans text-sm font-semibold tracking-wide">Offline Gateway</span>
      </div>
      
      <div className="flex-1 bg-[#121816]/20 rounded-xl p-4 font-mono text-sm leading-relaxed whitespace-pre-line backdrop-blur-sm border border-[#F6F5F0]/10 relative overflow-hidden">
        <div className="text-[#F6F5F0]/60 mb-1">{'>'} {steps[step].req}</div>
        <div className="animate-[fade_0.3s_ease-in]">{steps[step].res}</div>
        <div className="absolute bottom-4 right-4 h-3 w-2 bg-[#F6F5F0] animate-pulse" />
      </div>
    </div>
  );
};

// --- ARTIFACT 3: CLIMATE TELEMETRY ---
const ClimateTelemetry = () => {
  return (
    <div className="relative flex h-64 w-full flex-col justify-between rounded-[2rem] bg-[#F6F5F0] border border-[#121816]/5 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
      <div className="flex justify-between w-full items-start">
        <div className="font-sans font-semibold text-[#121816] flex items-center gap-2">
          <CloudRain className="h-5 w-5 text-[#4A785E]" /> 7-Day Precipitation
        </div>
        <span className="text-[#121816]/40 text-xs font-mono">mm/h</span>
      </div>
      
      <div className="flex justify-between items-end h-24 mt-auto gap-2">
        {[40, 70, 20, 90, 10, 50, 80].map((h, i) => (
          <div key={i} className="w-full flex flex-col items-center gap-2">
            <div className="w-full bg-[#213A2F]/10 rounded-t-md relative overflow-hidden" style={{ height: '100px' }}>
              <div 
                className={`absolute bottom-0 w-full rounded-t-md transition-all duration-1000 ${i === 3 ? 'bg-[#C86641]' : 'bg-[#4A785E]'}`} 
                style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[#121816]/40">D{i+1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function AgriGuardLanding() {
  const mainRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animations
      gsap.fromTo('.hero-anim', 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power4.out', delay: 0.2 }
      );

      // Philosophy Parallax & Reveal
      gsap.to('.parallax-bg', {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: { trigger: '.philosophy-section', start: 'top bottom', end: 'bottom top', scrub: true }
      });
      
      gsap.fromTo('.phil-text',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.2, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.philosophy-section', start: 'top 60%' } }
      );

      // Protocol Sticky Stacking Archive
      const cards = gsap.utils.toArray('.protocol-card');
      cards.forEach((card, i) => {
        if (i !== cards.length - 1) {
          gsap.to(card, {
            scale: 0.92,
            opacity: 0.4,
            filter: 'blur(10px)',
            ease: 'none',
            scrollTrigger: {
              trigger: cards[i + 1],
              start: 'top bottom',
              end: 'top top',
              scrub: true,
            }
          });
        }
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={mainRef} className="bg-[#F6F5F0] selection:bg-[#C86641] selection:text-[#F6F5F0] font-sans antialiased overflow-x-hidden">
      <GlobalNoise />
      
      {/* NAVBAR */}
      <nav className={`fixed left-1/2 top-6 z-50 flex w-[90%] max-w-6xl -translate-x-1/2 items-center justify-between rounded-full px-6 py-3 transition-all duration-500 ${isScrolled ? 'bg-white/70 backdrop-blur-xl border border-[#213A2F]/10 shadow-[0_4px_30px_rgba(0,0,0,0.05)] text-[#213A2F]' : 'bg-transparent text-[#F6F5F0]'}`}>
        <div className="flex items-center gap-2 font-sans text-xl font-bold tracking-tight">
          <Sprout className={`h-6 w-6 ${isScrolled ? 'text-[#4A785E]' : 'text-[#F6F5F0]'}`} />
          AGRIGUARD
        </div>
        <div className="hidden items-center gap-8 font-sans text-sm font-medium md:flex">
          <a href="#intelligence" className="hover:opacity-70 transition-opacity">Intelligence</a>
          <a href="#philosophy" className="hover:opacity-70 transition-opacity">Impact</a>
          <a href="#pipeline" className="hover:opacity-70 transition-opacity">Pipeline</a>
        </div>
        <button className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${isScrolled ? 'bg-[#213A2F] text-[#F6F5F0]' : 'bg-[#F6F5F0] text-[#121816]'}`}>
          Launch Dashboard
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="relative flex h-[100dvh] w-full items-end p-8 pb-20 md:p-16 md:pb-24">
        {/* Earthy/Agricultural BG */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2944&auto=format&fit=crop")' }}
        />
        {/* Terracotta to Dark Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#121816] via-[#213A2F]/80 to-transparent" />
        
        <div className="relative z-20 w-full max-w-7xl mx-auto flex flex-col items-start gap-4">
          <div className="hero-anim flex items-center gap-2 rounded-full border border-[#F6F5F0]/20 bg-[#F6F5F0]/10 px-4 py-1.5 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-[#C86641] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#F6F5F0]">Live in Musanze District</span>
          </div>
          <h1 className="hero-anim flex flex-col text-[11vw] leading-[0.9] md:text-[7vw]">
            <span className="font-sans font-extrabold tracking-tight text-[#F6F5F0]">Predicting the</span>
            <span className="font-serif italic text-[#C86641] pr-8">Harvest.</span>
          </h1>
          <div className="hero-anim mt-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <MagneticButton variant="canopy">Enter Dashboard <ArrowRight className="ml-2 h-4 w-4" /></MagneticButton>
            <p className="max-w-md font-sans text-sm md:text-base leading-relaxed text-[#F6F5F0]/80 border-l border-[#C86641] pl-4">
              Empowering Rwandan smallholder farmers with satellite AI, real-time weather telemetry, and offline USSD access to defeat climate vulnerability.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES (Functional Artifacts) */}
      <section id="intelligence" className="relative z-20 -mt-10 rounded-t-[3rem] bg-[#F6F5F0] px-8 py-32 md:px-16 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <h2 className="font-sans text-4xl font-semibold tracking-tight text-[#121816] md:text-6xl">
              Data-Driven <br/><span className="font-serif italic text-[#4A785E]">Agronomy.</span>
            </h2>
            <p className="max-w-sm font-sans text-[#121816]/70 leading-relaxed">
              We bypass expensive IoT hardware by synthesizing orbital telemetry and machine learning into functional interfaces built for rural deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-6">
              <SatelliteScanner />
              <div>
                <h3 className="font-sans text-xl font-bold text-[#121816]">Orbital Assessment</h3>
                <p className="mt-2 text-sm text-[#121816]/60">Google Earth Engine vegetation indexing processed via Scikit-learn to map crop stress dynamically.</p>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <USSDTerminal />
              <div>
                <h3 className="font-sans text-xl font-bold text-[#121816]">Last-Mile Delivery</h3>
                <p className="mt-2 text-sm text-[#121816]/60">Zero internet required. Full AI diagnostic access via Africa's Talking USSD architecture for basic feature phones.</p>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <ClimateTelemetry />
              <div>
                <h3 className="font-sans text-xl font-bold text-[#121816]">Micro-Climate Modeling</h3>
                <p className="mt-2 text-sm text-[#121816]/60">7-day continuous precipitation and temperature forecasting mapped against historic seasonal baselines.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY / IMPACT */}
      <section id="philosophy" className="philosophy-section relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-[#121816] px-8 py-32 md:px-16">
        <div 
          className="parallax-bg absolute inset-0 z-0 h-[130%] w-full bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1592982537447-6f23349666b6?q=80&w=2836&auto=format&fit=crop")' }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#121816] via-transparent to-[#121816]" />
        
        <div className="relative z-20 flex flex-col items-center text-center max-w-5xl">
          <h2 className="flex flex-col text-[7vw] leading-[1.1] md:text-[5vw]">
            <span className="phil-text font-sans font-medium text-[#F6F5F0]/60">Agriculture used to rely on the sky.</span>
            <span className="phil-text mt-4 font-serif italic text-[#C86641]">Now, it relies on the data.</span>
          </h2>
          <p className="phil-text mt-12 max-w-2xl text-lg md:text-xl text-[#F6F5F0]/70 font-sans font-light">
            By shifting from traditional guesswork to algorithmic precision, we equip smallholder farmers to mitigate climate shocks before they affect the harvest.
          </p>
        </div>
      </section>

      {/* THE PIPELINE (Sticky Stacking Archive) */}
      <section id="pipeline" className="relative h-[300vh] bg-[#F6F5F0]">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          
          {/* Layer 1: Data Acquisition */}
          <div className="protocol-card absolute inset-0 flex items-center justify-center bg-[#213A2F] p-8 md:p-16 rounded-b-[3rem]">
            <div className="flex w-full max-w-6xl flex-col items-center gap-12 md:flex-row justify-between">
              <div className="w-full md:w-1/2">
                <p className="font-mono text-xs uppercase tracking-widest text-[#C86641] mb-4">Architecture / 01</p>
                <h2 className="font-sans text-5xl font-bold text-[#F6F5F0] mb-6">Telemetry <span className="font-serif italic text-[#4A785E]">Acquisition</span></h2>
                <p className="text-lg text-[#F6F5F0]/70 font-sans max-w-md">The FastAPI backend initiates asynchronous pulls from Open-Meteo and Google Earth Engine, structuring raw atmospheric and vegetation arrays.</p>
              </div>
              <div className="w-full md:w-1/2 flex justify-center">
                {/* Abstract Satellite Graphic */}
                <div className="relative h-64 w-64 border-2 border-dashed border-[#F6F5F0]/20 rounded-full flex items-center justify-center animate-[spin_30s_linear_infinite]">
                   <div className="absolute top-0 w-4 h-4 bg-[#C86641] rounded-full -mt-2 shadow-[0_0_20px_#C86641]" />
                   <div className="h-32 w-32 border border-[#F6F5F0]/40 rounded-full flex items-center justify-center">
                     <Activity className="text-[#F6F5F0] h-8 w-8 animate-pulse" />
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Layer 2: Machine Learning */}
          <div className="protocol-card absolute inset-0 flex items-center justify-center bg-[#C86641] p-8 md:p-16 rounded-b-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.2)]">
            <div className="flex w-full max-w-6xl flex-col items-center gap-12 md:flex-row-reverse justify-between">
              <div className="w-full md:w-1/2">
                <p className="font-mono text-xs uppercase tracking-widest text-[#121816] mb-4">Architecture / 02</p>
                <h2 className="font-sans text-5xl font-bold text-[#121816] mb-6">Algorithmic <span className="font-serif italic text-[#F6F5F0]">Synthesis</span></h2>
                <p className="text-lg text-[#121816]/80 font-sans max-w-md">Our pre-trained Scikit-learn model, loaded entirely in RAM via Joblib, processes the DataFrame to output predicted yields (kg/ha) with an R² accuracy &gt; 0.70.</p>
              </div>
              <div className="w-full md:w-1/2 flex justify-center">
                {/* Abstract Neural Network Graphic */}
                <svg className="h-64 w-64 text-[#121816]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10,50 L40,20 L40,80 Z M40,20 L90,50 L40,80" className="opacity-50" />
                  <circle cx="10" cy="50" r="4" fill="currentColor" />
                  <circle cx="40" cy="20" r="4" fill="currentColor" />
                  <circle cx="40" cy="80" r="4" fill="currentColor" />
                  <circle cx="90" cy="50" r="4" fill="#F6F5F0" />
                  <path d="M0,50 L10,50 M90,50 L100,50" className="animate-pulse" />
                </svg>
              </div>
            </div>
          </div>

          {/* Layer 3: Output & GIS Mapping */}
          <div className="protocol-card absolute inset-0 flex items-center justify-center bg-[#F6F5F0] p-8 md:p-16">
            <div className="flex w-full max-w-6xl flex-col items-center gap-12 md:flex-row justify-between">
              <div className="w-full md:w-1/2">
                <p className="font-mono text-xs uppercase tracking-widest text-[#C86641] mb-4">Architecture / 03</p>
                <h2 className="font-sans text-5xl font-bold text-[#121816] mb-6">Dashboard <span className="font-serif italic text-[#4A785E]">Visualization</span></h2>
                <p className="text-lg text-[#121816]/70 font-sans max-w-md">Outputs are mapped into a React-Leaflet GIS heatmap and synced to the MongoDB NoSQL ledger, allowing extension officers to monitor regional stress in real-time.</p>
              </div>
              <div className="w-full md:w-1/2 flex justify-center h-64 border border-[#121816]/10 rounded-[2rem] overflow-hidden bg-[#213A2F]/5 relative">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(33,58,47,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(33,58,47,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
                 {/* Mock Map Markers */}
                 <div className="absolute top-1/4 left-1/3 h-4 w-4 bg-[#4A785E] rounded-full shadow-[0_0_15px_#4A785E] animate-bounce" />
                 <div className="absolute top-1/2 left-2/3 h-4 w-4 bg-[#C86641] rounded-full shadow-[0_0_15px_#C86641]" />
                 <div className="absolute bottom-1/3 left-1/2 h-4 w-4 bg-[#4A785E] rounded-full shadow-[0_0_15px_#4A785E]" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#121816] px-8 py-20 md:px-16 text-[#F6F5F0]">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="flex flex-col gap-6 w-full md:w-1/2">
            <div className="flex items-center gap-2 font-sans text-3xl font-bold tracking-tight text-[#F6F5F0]">
              <Sprout className="h-8 w-8 text-[#4A785E]" />
              AGRIGUARD
            </div>
            <p className="font-serif italic text-2xl text-[#F6F5F0]/70 max-w-sm">
              An ALU Capstone Project dedicated to Rwandan food security.
            </p>
            <div className="mt-4 flex items-center gap-3 font-mono text-xs uppercase tracking-widest border border-[#F6F5F0]/10 rounded-full px-4 py-2 w-max">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Musanze Node Active
            </div>
          </div>
          
          <div className="flex flex-col gap-8 w-full md:w-auto md:min-w-[300px]">
            <div className="flex flex-col gap-4">
              <h4 className="font-sans font-semibold text-[#C86641]">Engineer</h4>
              <p className="font-sans text-sm text-[#F6F5F0]/80">Ganza Owen Yhaan</p>
              <p className="font-sans text-sm text-[#F6F5F0]/60">BSc. Software Engineering</p>
            </div>
            <div className="flex gap-4">
              <MagneticButton variant="canopy" className="px-6 py-3 w-full justify-center">
                Launch App <ArrowUpRight className="h-4 w-4"/>
              </MagneticButton>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Global Typography Imports */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-serif { font-family: 'Playfair Display', serif; }
      `}} />
    </div>
  );
}