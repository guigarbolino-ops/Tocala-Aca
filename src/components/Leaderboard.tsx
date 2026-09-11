import React, { useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Search, 
  Filter, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  UserCheck,
  Award,
  Sparkles
} from 'lucide-react';
import { UserProfile, calculateTier, PriorityTier } from '../types';

interface LeaderboardProps {
  users: UserProfile[];
  currentUserId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'played'>('score');

  // Filter and sort
  const filteredUsers = users
    .filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const userTier = calculateTier(user.score);
      const matchesTier = selectedTier === 'all' || userTier === selectedTier;
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        return (b.score ?? 100) - (a.score ?? 100);
      }
      return (b.stats?.played ?? 0) - (a.stats?.played ?? 0);
    });

  const top3 = users.slice(0, 3);

  const getTierBadge = (score: number) => {
    const tier = calculateTier(score);
    if (tier === 'Prioridad 1') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF1EC] text-[#3D6348] border border-[#CDE0D2]">
          <Sparkles className="w-3 h-3 text-[#D48C70]" />
          Prioridad 1 (≥100)
        </span>
      );
    }
    if (tier === 'Prioridad 2') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FAF3E7] text-[#976C2F] border border-[#ECDDBF]">
          Prioridad 2 (80-99)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FBF0EC] text-[#AC5B40] border border-[#F2D2C6]">
        Prioridad 3 (&lt;80)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#222B25] tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-[#D48C70]" />
            Ranking de Confiabilidad y Puntaje
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7C70] mt-0.5">
            Tabla de posiciones del grupo. La puntualidad, asistencia y pago a tiempo otorgan prioridad de convocatoria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy('score')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-xs ${
              sortBy === 'score' 
                ? 'bg-[#52795D] text-white border-[#52795D]' 
                : 'bg-white text-[#45564A] border-[#DDE6DF] hover:bg-[#F6F8F6]'
            }`}
          >
            Ordenar por Score
          </button>
          <button
            onClick={() => setSortBy('played')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-xs ${
              sortBy === 'played' 
                ? 'bg-[#52795D] text-white border-[#52795D]' 
                : 'bg-white text-[#45564A] border-[#DDE6DF] hover:bg-[#F6F8F6]'
            }`}
          >
            Partidos Jugados
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* 2nd place */}
          <div className="bg-white border border-[#E2E8E2] rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden order-2 sm:order-1 shadow-xs">
            <div className="absolute top-3 left-3 p-1 rounded-full bg-[#F1F4F1] text-[#6B7C70]">
              <Medal className="w-4 h-4 text-[#8D9B91]" />
            </div>
            <span className="text-xs font-bold text-[#8D9B91] mb-2">2° PUESTO</span>
            <img 
              src={top3[1].photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[1].uid}`}
              alt={top3[1].name}
              className="w-14 h-14 rounded-full border-2 border-[#DDE6DF] mb-2 shadow-xs bg-[#EAF1EC]"
              referrerPolicy="no-referrer"
            />
            <h4 className="font-bold text-[#222B25] text-sm truncate max-w-full">{top3[1].name}</h4>
            <div className="text-[#3D6348] font-mono font-black text-lg my-0.5">{top3[1].score} pts</div>
            <div className="text-[11px] text-[#6B7C70]">{top3[1].stats?.played || 0} partidos · {top3[1].stats?.onTime || 0} puntuales</div>
          </div>

          {/* 1st place (Champion) */}
          <div className="bg-[#FAF8F3] border-2 border-[#E5D2A6] rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden order-1 sm:order-2 shadow-sm sm:-translate-y-2">
            <div className="absolute top-3 left-3 p-1 rounded-full bg-[#FAF3E7] text-[#976C2F] border border-[#ECDDBF]">
              <Trophy className="w-5 h-5 text-[#976C2F]" />
            </div>
            <span className="text-xs font-black text-[#976C2F] mb-2 tracking-wider">👑 1° PUESTO (LÍDER)</span>
            <img 
              src={top3[0].photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[0].uid}`}
              alt={top3[0].name}
              className="w-16 h-16 rounded-full border-2 border-[#D8A468] mb-2 shadow-sm ring-4 ring-[#ECDDBF]/60 bg-[#FAF3E7]"
              referrerPolicy="no-referrer"
            />
            <h4 className="font-black text-[#222B25] text-base truncate max-w-full">{top3[0].name}</h4>
            <div className="text-[#976C2F] font-mono font-black text-2xl my-0.5">{top3[0].score} pts</div>
            <div className="text-xs text-[#80571C] font-medium">{top3[0].stats?.played || 0} partidos jugados</div>
          </div>

          {/* 3rd place */}
          <div className="bg-white border border-[#E2E8E2] rounded-2xl p-4 flex flex-col items-center text-center relative overflow-hidden order-3 sm:order-3 shadow-xs">
            <div className="absolute top-3 left-3 p-1 rounded-full bg-[#FBF0EC] text-[#AC5B40]">
              <Medal className="w-4 h-4 text-[#D48C70]" />
            </div>
            <span className="text-xs font-bold text-[#D48C70] mb-2">3° PUESTO</span>
            <img 
              src={top3[2].photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[2].uid}`}
              alt={top3[2].name}
              className="w-14 h-14 rounded-full border-2 border-[#F2D2C6] mb-2 shadow-xs bg-[#FBF0EC]"
              referrerPolicy="no-referrer"
            />
            <h4 className="font-bold text-[#222B25] text-sm truncate max-w-full">{top3[2].name}</h4>
            <div className="text-[#3D6348] font-mono font-black text-lg my-0.5">{top3[2].score} pts</div>
            <div className="text-[11px] text-[#6B7C70]">{top3[2].stats?.played || 0} partidos · {top3[2].stats?.onTime || 0} puntuales</div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E2E8E2] shadow-xs">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#7A8C80] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar jugador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-xs sm:text-sm text-[#222B25] placeholder-[#7A8C80] focus:outline-none focus:border-[#52795D]"
          />
        </div>

        {/* Tier filter tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'Prioridad 1', label: 'Prioridad 1 (≥100)' },
            { id: 'Prioridad 2', label: 'Prioridad 2 (80-99)' },
            { id: 'Prioridad 3', label: 'Prioridad 3 (<80)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTier(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedTier === tab.id
                  ? 'bg-[#52795D] text-white shadow-xs'
                  : 'text-[#5C6E62] hover:text-[#222B25] hover:bg-[#F1F5F2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Standings Table */}
      <div className="bg-white border border-[#E2E8E2] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F1F5F2] text-[#5C6E62] text-[11px] uppercase font-bold tracking-wider border-b border-[#E0E7E1]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Pos</th>
                <th className="py-3.5 px-4">Jugador</th>
                <th className="py-3.5 px-4 text-center">Categoría</th>
                <th className="py-3.5 px-3 text-center">Jugados</th>
                <th className="py-3.5 px-3 text-center">Puntual</th>
                <th className="py-3.5 px-3 text-center">Tardes</th>
                <th className="py-3.5 px-3 text-center">Faltas</th>
                <th className="py-3.5 px-3 text-center">Deudas</th>
                <th className="py-3.5 px-4 text-right">Score Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3EF]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#7A8C80]">
                    No se encontraron jugadores con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((player, idx) => {
                  const isCurrent = player.uid === currentUserId;
                  return (
                    <tr
                      key={player.uid}
                      className={`hover:bg-[#F6F8F6] transition ${
                        isCurrent ? 'bg-[#EAF1EC]/60 border-l-4 border-l-[#52795D]' : ''
                      }`}
                    >
                      {/* Position */}
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {idx === 0 ? (
                          <span className="text-[#976C2F] font-bold">🥇 1</span>
                        ) : idx === 1 ? (
                          <span className="text-[#6B7C70] font-bold">🥈 2</span>
                        ) : idx === 2 ? (
                          <span className="text-[#D48C70] font-bold">🥉 3</span>
                        ) : (
                          <span className="text-[#8D9B91]">{idx + 1}</span>
                        )}
                      </td>

                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={player.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.uid}`}
                            alt={player.name}
                            className="w-8 h-8 rounded-full border border-[#DDE6DF] bg-[#EAF1EC] shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-bold text-[#222B25] block">
                              {player.name}
                              {isCurrent && <span className="ml-1 text-[#3D6348] text-xs font-bold">(Tú)</span>}
                            </span>
                            <span className="text-[11px] text-[#6B7C70]">
                              {player.role === 'admin' ? 'Administrador / DT' : player.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-center">
                        {getTierBadge(player.score ?? 100)}
                      </td>

                      {/* Played */}
                      <td className="py-3 px-3 text-center font-mono font-semibold text-[#222B25]">
                        {player.stats?.played || 0}
                      </td>

                      {/* On-Time */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#3D6348]">
                        {player.stats?.onTime || 0}
                      </td>

                      {/* Late */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#976C2F]">
                        {player.stats?.late || 0}
                      </td>

                      {/* No-Shows */}
                      <td className="py-3 px-3 text-center font-mono text-[#AC5B40] font-bold">
                        {player.stats?.noShows || 0}
                      </td>

                      {/* Debts */}
                      <td className="py-3 px-3 text-center font-mono text-[#AC5B40] font-bold">
                        {player.stats?.debts || 0}
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4 text-right font-mono font-black text-base text-[#3D6348]">
                        {player.score ?? 100} pts
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
