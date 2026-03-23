"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  User, 
  Heart, 
  Menu, 
  X, 
  Tv,
  Star
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { User as FirebaseUser } from "firebase/auth";

interface HeaderProps {
  user: FirebaseUser;
  showFavorites: boolean;
  setShowFavorites: (show: boolean) => void;
  favoriteCount: number;
}

export default function Header({ user, showFavorites, setShowFavorites, favoriteCount }: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const userInitials = user.displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b" style={{ background: 'rgba(20, 20, 31, 0.9)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B4A, #4A6FFF)' }}>
            <Tv className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Orion<span style={{ color: '#FF6B4A' }}>Stream</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant={!showFavorites ? "default" : "ghost"}
            className={!showFavorites ? "text-white" : "text-white/70"}
            style={!showFavorites ? { background: '#FF6B4A' } : {}}
            onClick={() => setShowFavorites(false)}
          >
            <Tv className="w-4 h-4 mr-2" />
            Canales
          </Button>
          <Button
            variant={showFavorites ? "default" : "ghost"}
            className={showFavorites ? "text-white" : "text-white/70"}
            style={showFavorites ? { background: '#4A6FFF' } : {}}
            onClick={() => setShowFavorites(true)}
          >
            <Heart className="w-4 h-4 mr-2" />
            Favoritos
            {favoriteCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full" style={{ background: '#FF6B4A' }}>
                {favoriteCount}
              </span>
            )}
          </Button>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <User className="w-4 h-4" />
            <span>{user.displayName || user.email?.split('@')[0]}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10" style={{ border: '2px solid rgba(255,107,74,0.3)' }}>
                  <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                  <AvatarFallback style={{ background: 'rgba(255,107,74,0.2)', color: '#FF6B4A' }} className="font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" style={{ background: '#14141F', borderColor: 'rgba(255,255,255,0.1)' }} align="end">
              <DropdownMenuLabel className="text-white">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.displayName || "Usuario"}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.1)' }} />
              
              {/* Mobile-only navigation items */}
              <div className="md:hidden">
                <DropdownMenuItem 
                  className="text-white cursor-pointer"
                  onClick={() => setShowFavorites(false)}
                >
                  <Tv className="w-4 h-4 mr-2" />
                  Todos los Canales
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white cursor-pointer"
                  onClick={() => setShowFavorites(true)}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Favoritos ({favoriteCount})
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
              
              <DropdownMenuItem 
                className="cursor-pointer"
                style={{ color: '#EF4444' }}
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t" style={{ background: '#14141F', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <Button
              variant={!showFavorites ? "default" : "ghost"}
              className={!showFavorites ? "text-white justify-start" : "text-white/70 justify-start"}
              style={!showFavorites ? { background: '#FF6B4A' } : {}}
              onClick={() => {
                setShowFavorites(false);
                setMobileMenuOpen(false);
              }}
            >
              <Tv className="w-4 h-4 mr-2" />
              Todos los Canales
            </Button>
            <Button
              variant={showFavorites ? "default" : "ghost"}
              className={showFavorites ? "text-white justify-start" : "text-white/70 justify-start"}
              style={showFavorites ? { background: '#4A6FFF' } : {}}
              onClick={() => {
                setShowFavorites(true);
                setMobileMenuOpen(false);
              }}
            >
              <Heart className="w-4 h-4 mr-2" />
              Favoritos ({favoriteCount})
            </Button>
            <Button
              variant="ghost"
              className="text-red-400 justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
