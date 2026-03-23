"use client";

import { useState, useEffect } from "react";
import { Play, ChevronRight } from "lucide-react";

interface WelcomeScreenProps {
  onAccept: () => void;
}

export default function WelcomeScreen({ onAccept }: WelcomeScreenProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate splash screen animation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    onAccept();
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6" style={{ background: '#0A0A0F' }}>
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Nebula effects */}
      <div
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, #FF6B4A 0%, transparent 70%)',
          left: '10%',
          top: '20%',
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full blur-3xl opacity-15"
        style={{
          background: 'radial-gradient(circle, #4A6FFF 0%, transparent 70%)',
          right: '10%',
          bottom: '20%',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 text-center flex-1 flex flex-col items-center justify-center">
        {/* Logo */}
        <div className={`transition-all duration-1000 ${isLoading ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
          {/* Play button in circle */}
          <div className="relative mb-6">
            <div
              className="w-28 h-28 mx-auto rounded-full flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8A70 100%)',
                boxShadow: '0 0 60px rgba(255, 107, 74, 0.4)',
              }}
            >
              <Play className="w-12 h-12 text-white fill-white ml-1" />
            </div>
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: '#FF6B4A' }}
            />
          </div>

          {/* Orion text */}
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-2 tracking-tight">
            Orion<span style={{ color: '#FF6B4A' }}>TV</span>
          </h1>

          {/* Live TV badge */}
          <div
            className="inline-block px-4 py-1 rounded-full text-sm font-medium text-white/80"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            Live TV
          </div>
        </div>
      </div>

      {/* Bottom section with accept button */}
      <div className={`relative z-10 w-full max-w-sm transition-all duration-700 delay-500 ${isLoading ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'}`}>
        {/* Welcome text */}
        <p className="text-white text-lg text-center mb-6">
          Bienvenido a <span style={{ color: '#FF6B4A' }}>OrionTV</span>
        </p>

        {/* Accept button */}
        <button
          onClick={handleAccept}
          className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8A70 100%)',
            boxShadow: '0 4px 20px rgba(255, 107, 74, 0.3)',
          }}
        >
          Aceptar términos y políticas
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Terms text */}
        <p className="text-white/40 text-xs text-center mt-4 leading-relaxed">
          Al continuar, aceptas nuestros{' '}
          <a href="/terms" className="underline hover:text-white/60">Términos de Servicio</a>
          {' '}y{' '}
          <a href="/privacy" className="underline hover:text-white/60">Política de Privacidad</a>
        </p>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
