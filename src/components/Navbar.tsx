import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Trophy, 
  Calendar, 
  Settings, 
  LogIn, 
  LogOut, 
  HelpCircle, 
  Moon, 
  Sun, 
  User, 
  ChevronDown, 
  Crown, 
  Sparkles,
  Users,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PriorityTier } from '../types';
import { LogoBadge } from './LogoBadge';

interface NavbarProps {
  activeTab: 'matches' | 'leaderboard' | 'admin';
  setActiveTab: (tab: 'matches' | 'leaderboard' | 'admin') => void;
  onOpenRules: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRules,
  isDarkMode,
  setIsDarkMode,
}) => {
  const { 
    currentUser, 
    userProfile, 
    isAdmin, 
    isRealAdmin,
    viewMode,
    setViewMode,
    signInWithGoogle, 
    logout 
  } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const getTierColor = (tier?: PriorityTier) => {
    switch (tier) {
      case 'Prioridad 1':
        return 'bg-[#EAF1EC] text-[#3D6348] border-[#CDE0D2]';
      case 'Prioridad 2':
        return 'bg-[#FAF3E7] text-[#976C2F] border-[#ECDDBF]';
      case 'Prioridad 3':
        return 'bg-[#FBF0EC] text-[#AC5B40] border-[#F2D2C6]';
      default:
        return 'bg-[#F1F4F1] text-[#556358] border-[#DDE6DF]';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8E2] transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('matches')} 
              className="cursor-pointer flex items-center gap-3 group"
            >
              <LogoBadge className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-[#C86D51]/30 shadow-sm" />
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#222B25] tracking-tight leading-none uppercase">
                  TOCALA ACÁ
                </h1>
              </div>
            </div>

            {/* Rules Quick Button */}
            <button
              onClick={onOpenRules}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#526356] hover:text-[#222B25] hover:bg-[#EEF3EF] transition ml-2 border border-[#E2E8E2]"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#52795D]" />
              Reglamento
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F1F5F2] p-1 rounded-xl border border-[#E0E7E1]">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'matches'
                  ? 'bg-[#52795D] text-white shadow-xs'
                  : 'text-[#5C6E62] hover:text-[#222B25] hover:bg-[#E4ECE6]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Partidos
            </button>

            <button
              id="nav-tab-leaderboard"
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'leaderboard'
                  ? 'bg-[#52795D] text-white shadow-xs'
                  : 'text-[#5C6E62] hover:text-[#222B25] hover:bg-[#E4ECE6]'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Ranking
            </button>

            {/* Admin Only: Panel DT Tab */}
            {isAdmin && (
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'admin'
                    ? 'bg-[#52795D] text-white shadow-xs'
                    : 'text-[#5C6E62] hover:text-[#222B25] hover:bg-[#E4ECE6]'
                }`}
              >
                <Settings className="w-4 h-4" />
                Panel DT
                <span className="w-2 h-2 rounded-full bg-[#D48C70] animate-pulse"></span>
              </button>
            )}
          </nav>

          {/* Right Header: User Pill / Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {userProfile ? (
              isRealAdmin ? (
                /* Admin View Switcher Dropdown */
                <div className="relative">
                  <button
                    id="btn-admin-view-switcher"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F6F8F6] hover:bg-[#EEF3EF] border border-[#DDE6DF] text-xs font-bold text-[#222B25] transition shadow-xs"
                    title="Alternar vista de la aplicación"
                  >
                    {viewMode === 'admin' ? (
                      <>
                        <Crown className="w-4 h-4 text-[#52795D]" />
                        <span>Vista DT</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 text-[#3D6348]" />
                        <span>Vista Jugador</span>
                      </>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-[#738277]" />
                  </button>

                  {/* Clean Dropdown */}
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)} 
                      />
                      <div 
                        id="admin-view-dropdown" 
                        className="absolute right-0 mt-2 w-52 rounded-2xl bg-white border border-[#DDE6DF] shadow-xl p-2 z-50 text-xs text-[#222B25] animate-in fade-in zoom-in-95 duration-100"
                      >
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7C70]">
                          Ver aplicación como
                        </div>

                        <div className="space-y-1 mt-1">
                          <button
                            id="btn-select-view-admin"
                            onClick={() => {
                              setViewMode('admin');
                              setActiveTab('admin');
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between font-semibold transition ${
                              viewMode === 'admin'
                                ? 'bg-[#EAF1EC] text-[#3D6348] font-bold border border-[#CDE0D2]'
                                : 'hover:bg-[#F6F8F6] text-[#222B25]'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-[#52795D]" />
                              <span>Admin / DT</span>
                            </span>
                            {viewMode === 'admin' && <Check className="w-4 h-4 text-[#3D6348]" />}
                          </button>

                          <button
                            id="btn-select-view-player"
                            onClick={() => {
                              setViewMode('player');
                              if (activeTab === 'admin') setActiveTab('matches');
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between font-semibold transition ${
                              viewMode === 'player'
                                ? 'bg-[#EAF1EC] text-[#3D6348] font-bold border border-[#CDE0D2]'
                                : 'hover:bg-[#F6F8F6] text-[#222B25]'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-[#3D6348]" />
                              <span>Jugador</span>
                            </span>
                            {viewMode === 'player' && <Check className="w-4 h-4 text-[#3D6348]" />}
                          </button>
                        </div>

                        <div className="my-1.5 border-t border-[#EEF3EF]" />

                        <button
                          id="btn-logout"
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#FBF0EC] text-[#AC5B40] font-semibold flex items-center gap-2 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Cerrar sesión</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Player User: Only a clean LogOut button */
                <button
                  id="btn-player-logout"
                  onClick={logout}
                  className="px-3.5 py-2 rounded-xl bg-[#F6F8F6] hover:bg-[#FBF0EC] text-[#AC5B40] border border-[#E0E7E1] hover:border-[#F2D2C6] text-xs font-bold flex items-center gap-2 transition shadow-xs"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              )
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-google-login-navbar"
                  onClick={signInWithGoogle}
                  className="px-4 py-2 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 bg-white rounded-full p-0.5" />
                  <span>Ingresar con Google</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-white border-t border-[#E2E8E2] px-2 py-2 shadow-xs">
        <button
          id="nav-mobile-matches"
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${
            activeTab === 'matches' ? 'text-[#52795D]' : 'text-[#68796E]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Partidos
        </button>

        <button
          id="nav-mobile-leaderboard"
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${
            activeTab === 'leaderboard' ? 'text-[#52795D]' : 'text-[#68796E]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Ranking
        </button>

        {/* Mobile Admin Only Tab */}
        {isAdmin && (
          <button
            id="nav-mobile-admin"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex flex-col items-center gap-1 ${
              activeTab === 'admin' ? 'text-[#52795D]' : 'text-[#68796E]'
            }`}
          >
            <Settings className="w-4 h-4" />
            Panel DT
          </button>
        )}

        <button
          id="nav-mobile-rules"
          onClick={onOpenRules}
          className="flex-1 py-1.5 rounded-lg text-xs font-bold text-[#68796E] flex flex-col items-center gap-1"
        >
          <HelpCircle className="w-4 h-4" />
          Reglas
        </button>
      </div>
    </header>
  );
};
