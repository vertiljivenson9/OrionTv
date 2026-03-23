"use client";

import { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/");
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.replace("/");
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (name && result.user) {
          await result.user.updateProfile({ displayName: name });
        }
        setSuccess("¡Cuenta creada!");
        setTimeout(() => router.replace("/"), 1000);
      }
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/user-not-found") setError("Usuario no encontrado");
      else if (code === "auth/wrong-password") setError("Contraseña incorrecta");
      else if (code === "auth/email-already-in-use") setError("Email ya registrado");
      else if (code === "auth/weak-password") setError("Mínimo 6 caracteres");
      else if (code === "auth/invalid-email") setError("Email inválido");
      else setError(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace("/");
    } catch (err: any) {
      setError(err?.message || "Error con Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Loading screen while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#FF6B4A', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0F' }}>
      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 relative" style={{ background: '#0A0A0F' }}>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" style={{ background: 'rgba(255, 107, 74, 0.2)' }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" style={{ background: 'rgba(74, 111, 255, 0.2)' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl xl:text-6xl font-bold text-white">Orion<span style={{ color: '#FF6B4A' }}>Stream</span></h1>
              <div className="w-20 h-1 mt-4 rounded-full" style={{ background: 'linear-gradient(to right, #FF6B4A, #4A6FFF)' }} />
            </div>
            <p className="text-xl" style={{ color: 'rgba(255,255,255,0.6)' }}>Television en vivo, donde quiera que estés.</p>
            <div className="space-y-4 pt-8">
              {['Transmisión en vivo 24/7', 'Canales de todo el mundo', 'Favoritos personalizados', 'Disponible en cualquier dispositivo'].map((l, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#FF6B4A' }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden text-center">
            <h1 className="text-3xl font-bold text-white">Orion<span style={{ color: '#FF6B4A' }}>Stream</span></h1>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white">{isLogin ? "Bienvenido" : "Crear cuenta"}</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>{isLogin ? "Inicia sesión para continuar" : "Regístrate para comenzar"}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }}>{error}</div>}
            {success && <div className="p-3 rounded-xl text-sm text-green-400" style={{ background: 'rgba(34,197,94,0.1)' }}>{success}</div>}

            {!isLogin && (
              <input
                type="text"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl text-white placeholder:text-white/30 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-xl text-white placeholder:text-white/30 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 px-4 pr-16 rounded-xl text-white placeholder:text-white/30 focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/50">
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 font-medium rounded-xl text-white disabled:opacity-50 transition-all"
              style={{ background: '#FF6B4A' }}
            >
              {loading ? "Cargando..." : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center"><span className="px-4 text-sm" style={{ background: '#0A0A0F', color: 'rgba(255,255,255,0.3)' }}>o</span></div>
          </div>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-12 font-medium rounded-xl text-gray-800 flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
            style={{ background: 'white' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Cargando..." : "Continuar con Google"}
          </button>

          <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }} 
              style={{ color: '#FF6B4A' }}
            >
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>

          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Al continuar aceptas <a href="/terms" style={{ color: '#FF6B4A' }}>Términos</a> y <a href="/privacy" style={{ color: '#FF6B4A' }}>Privacidad</a>
          </p>
        </div>
      </div>
    </div>
  );
}
