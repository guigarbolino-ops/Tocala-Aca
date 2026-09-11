/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MatchCard } from './components/MatchCard';
import { Leaderboard } from './components/Leaderboard';
import { AdminPanel } from './components/AdminPanel';
import { RulesModal } from './components/RulesModal';
import { Match, Registration, UserProfile, calculateTier } from './types';
import { matchService } from './services/matchService';
import { 
  Calendar, 
  Trophy, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Flame, 
  Sparkles,
  ShieldCheck,
  PlusCircle,
  Users,
  Database,
  Crown
} from 'lucide-react';

function MainAppContent() {
  const { 
    userProfile, 
    isAdmin, 
    isRealAdmin, 
    viewMode, 
    setViewMode, 
    signInWithGoogle 
  } = useAuth();
  const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard' | 'admin'>('matches');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Firestore Real-Time Data States
  const [matches, setMatches] = useState<Match[]>([]);
  const [registrationsByMatch, setRegistrationsByMatch] = useState<Record<string, Registration[]>>({});
  const [leaderboardUsers, setLeaderboardUsers] = useState<UserProfile[]>([]);
  const [matchFilter, setMatchFilter] = useState<'all' | 'open' | 'completed'>('all');
  const [selectedMatchForSettle, setSelectedMatchForSettle] = useState<Match | null>(null);
  const [selectedMatchForEdit, setSelectedMatchForEdit] = useState<Match | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  // Subscribe to matches in real time
  useEffect(() => {
    let hasCheckedAutoSeed = false;

    const unsubMatches = matchService.subscribeMatches(async (data) => {
      setMatches(data);
      setLoadingMatches(false);

      // If database is completely empty on initial startup, populate with sample matches & players
      if (!hasCheckedAutoSeed && data.length === 0) {
        hasCheckedAutoSeed = true;
        try {
          await matchService.seedInitialDemoData();
        } catch (e) {
          console.warn("Auto-seed skipped or failed:", e);
        }
      }
    });

    const unsubLeaderboard = matchService.subscribeLeaderboard((users) => {
      setLeaderboardUsers(users);
    });

    return () => {
      unsubMatches();
      unsubLeaderboard();
    };
  }, []);

  // Subscribe to registrations for each match
  useEffect(() => {
    if (matches.length === 0) return;

    const unsubs = matches.map((match) => {
      return matchService.subscribeRegistrations(match.id, (regs) => {
        setRegistrationsByMatch((prev) => ({
          ...prev,
          [match.id]: regs,
        }));
      });
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [matches]);

  // Filter matches
  const filteredMatches = matches.filter((m) => {
    if (matchFilter === 'open') {
      return m.status === 'phase_1_priority' || m.status === 'phase_2_open';
    }
    if (matchFilter === 'completed') {
      return m.status === 'completed';
    }
    return true;
  });

  const getTierColor = (score?: number) => {
    if (score === undefined) return 'text-[#5C6E62] bg-[#F1F4F1] border-[#DDE6DF]';
    if (score >= 100) return 'text-[#3D6348] bg-[#EAF1EC] border-[#CDE0D2]';
    if (score >= 80) return 'text-[#976C2F] bg-[#FAF3E7] border-[#ECDDBF]';
    return 'text-[#AC5B40] bg-[#FBF0EC] border-[#F2D2C6]';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-[#222B25]">
      
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRules={() => setIsRulesModalOpen(true)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* User Hero / Stats Header (Player View) */}
        {userProfile && (
          <div className="bg-white border border-[#E2E8E2] rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              
              {/* Profile Details */}
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="relative">
                  <img
                    src={userProfile.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${userProfile.uid}`}
                    alt={userProfile.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-[#CDE0D2] bg-[#EAF1EC] object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  {userProfile.score >= 100 && (
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#52795D] text-white font-bold text-xs shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-xl sm:text-2xl font-black text-[#222B25] tracking-tight">
                      {userProfile.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border inline-flex items-center gap-1.5 ${getTierColor(userProfile.score)}`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {userProfile.tier} ({userProfile.score} pts)
                    </span>
                  </div>
                </div>
              </div>

              {/* Player Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-2xl bg-[#F6F8F6] border border-[#E2EAE3] text-center">
                  <span className="text-[10px] text-[#6B7C70] uppercase font-bold tracking-wider block mb-0.5">Partidos</span>
                  <span className="text-lg font-mono font-black text-[#222B25]">{userProfile.stats?.played || 0}</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#F6F8F6] border border-[#E2EAE3] text-center">
                  <span className="text-[10px] text-[#6B7C70] uppercase font-bold tracking-wider block mb-0.5">Puntual</span>
                  <span className="text-lg font-mono font-black text-[#3D6348]">{userProfile.stats?.onTime || 0}</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#F6F8F6] border border-[#E2EAE3] text-center">
                  <span className="text-[10px] text-[#6B7C70] uppercase font-bold tracking-wider block mb-0.5">Tardes</span>
                  <span className="text-lg font-mono font-black text-[#976C2F]">{userProfile.stats?.late || 0}</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#F6F8F6] border border-[#E2EAE3] text-center">
                  <span className="text-[10px] text-[#6B7C70] uppercase font-bold tracking-wider block mb-0.5">Faltas</span>
                  <span className="text-lg font-mono font-black text-[#AC5B40]">{userProfile.stats?.noShows || 0}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Not Logged In Banner */}
        {!userProfile && (
          <div className="bg-white border border-[#D5E2D8] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#52795D] flex items-center justify-center sm:justify-start gap-1.5">
                <Flame className="w-4 h-4 text-[#D48C70]" /> Bienvenido al Grupo de Fútbol
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#222B25] tracking-tight">
                Inicia sesión para anotarte y sumar puntaje de confiabilidad
              </h2>
              <p className="text-xs sm:text-sm text-[#5C6E62] max-w-xl">
                Al ingresar con Google se creará tu perfil con <strong>100 puntos iniciales (Prioridad 1)</strong>. Los jugadores puntuales obtienen prioridad exclusiva de convocatoria.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                id="btn-google-login-banner"
                onClick={signInWithGoogle}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-extrabold text-sm shadow-xs flex items-center justify-center gap-2.5 transition"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 bg-white rounded-full p-0.5" />
                Ingresar con Google
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: MATCHES VIEW */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#222B25] tracking-tight flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-[#52795D]" />
                  Partidos de la Semana
                </h2>
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center gap-1 bg-[#F1F5F2] p-1 rounded-xl border border-[#E0E7E1]">
                <button
                  id="filter-matches-all"
                  onClick={() => setMatchFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    matchFilter === 'all' ? 'bg-[#52795D] text-white shadow-xs' : 'text-[#5C6E62] hover:text-[#222B25]'
                  }`}
                >
                  Todos ({matches.length})
                </button>
                <button
                  id="filter-matches-open"
                  onClick={() => setMatchFilter('open')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    matchFilter === 'open' ? 'bg-[#52795D] text-white shadow-xs' : 'text-[#5C6E62] hover:text-[#222B25]'
                  }`}
                >
                  Convocatoria Abierta ({matches.filter(m => m.status === 'phase_1_priority' || m.status === 'phase_2_open').length})
                </button>
                <button
                  id="filter-matches-completed"
                  onClick={() => setMatchFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    matchFilter === 'completed' ? 'bg-[#52795D] text-white shadow-xs' : 'text-[#5C6E62] hover:text-[#222B25]'
                  }`}
                >
                  Finalizados ({matches.filter(m => m.status === 'completed').length})
                </button>
              </div>
            </div>

            {/* Match Cards List / Grid */}
            {loadingMatches ? (
              <div className="py-16 text-center text-[#6B7C70] flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#52795D] border-t-transparent animate-spin"></div>
                <p className="text-sm font-medium">Cargando partidos...</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="bg-white border border-[#E2E8E2] rounded-3xl p-10 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-[#F6F8F6] text-[#52795D] flex items-center justify-center mx-auto text-2xl border border-[#E2EAE3]">
                  ⚽
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#222B25]">No hay partidos programados</h3>
                  <p className="text-xs text-[#6B7C70] max-w-md mx-auto mt-1">
                    {isAdmin 
                      ? 'Puedes cargar partidos y jugadores de demostración o crear un nuevo partido desde el panel de administración.' 
                      : 'El administrador del grupo publicará las próximas convocatorias aquí a la brevedad.'}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      id="btn-seed-empty-state"
                      onClick={async () => {
                        await matchService.seedInitialDemoData();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
                    >
                      <Database className="w-4 h-4" />
                      Cargar Partidos y Jugadores de Ejemplo
                    </button>
                    <button
                      id="btn-go-admin-empty-state"
                      onClick={() => setActiveTab('admin')}
                      className="px-4 py-2.5 rounded-xl bg-[#F6F8F6] hover:bg-[#EEF3EF] text-[#222B25] font-semibold text-xs border border-[#DDE6DF] transition"
                    >
                      Ir al Panel DT
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    registrations={registrationsByMatch[match.id] || []}
                    currentUserProfile={userProfile}
                    onOpenRules={() => setIsRulesModalOpen(true)}
                    onRequireLogin={signInWithGoogle}
                    onSelectAdminSettle={isAdmin ? (m) => {
                      setSelectedMatchForSettle(m);
                      setActiveTab('admin');
                    } : undefined}
                    onSelectAdminEdit={isAdmin ? (m) => {
                      setSelectedMatchForEdit(m);
                      setActiveTab('admin');
                    } : undefined}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: LEADERBOARD VIEW */}
        {activeTab === 'leaderboard' && (
          <Leaderboard
            users={leaderboardUsers}
            currentUserId={userProfile?.uid}
          />
        )}

        {/* TAB 3: ADMIN PANEL VIEW (Exclusively for Admins) */}
        {activeTab === 'admin' && (
          isAdmin && userProfile ? (
            <AdminPanel
              matches={matches}
              adminUser={userProfile}
              selectedMatchForSettle={selectedMatchForSettle}
              selectedMatchForEdit={selectedMatchForEdit}
              onCloseSettleModal={() => setSelectedMatchForSettle(null)}
              onCloseEditModal={() => setSelectedMatchForEdit(null)}
            />
          ) : (
            <div id="admin-access-denied-view" className="bg-white border border-[#F2D2C6] rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-5 my-8">
              <div className="w-16 h-16 rounded-2xl bg-[#FBF0EC] text-[#AC5B40] border border-[#F2D2C6] flex items-center justify-center mx-auto text-2xl font-bold">
                🔒
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#222B25] tracking-tight">Acceso Exclusivo para Administradores</h3>
                <p className="text-xs sm:text-sm text-[#6B7C70] mt-2">
                  El Panel DT y las herramientas de liquidación y gestión de convocatorias solo están disponibles para cuentas con rol de Administrador.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {isRealAdmin ? (
                  <button
                    id="btn-switch-to-admin-fallback"
                    onClick={() => {
                      setViewMode('admin');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Cambiar a Vista Administrador
                  </button>
                ) : (
                  <button
                    id="btn-google-login-fallback"
                    onClick={signInWithGoogle}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Ingresar como Administrador
                  </button>
                )}
                <button
                  id="btn-return-matches-denied"
                  onClick={() => setActiveTab('matches')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#F6F8F6] hover:bg-[#EEF3EF] text-[#222B25] font-semibold text-xs border border-[#DDE6DF] transition"
                >
                  Volver a Partidos
                </button>
              </div>
            </div>
          )
        )}

      </main>

      {/* Global Rules Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
