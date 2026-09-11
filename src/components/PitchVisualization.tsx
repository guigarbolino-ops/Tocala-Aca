import React from 'react';
import { Registration, MatchCapacity, getFormatName } from '../types';
import { Shield, User } from 'lucide-react';

interface PitchVisualizationProps {
  capacity: MatchCapacity;
  starters: Registration[];
}

export const PitchVisualization: React.FC<PitchVisualizationProps> = ({
  capacity,
  starters,
}) => {
  const teamSize = capacity / 2;
  const teamA = starters.slice(0, teamSize);
  const teamB = starters.slice(teamSize, capacity);

  // Pad arrays with empty slots up to teamSize
  const teamAPadded = Array.from({ length: teamSize }, (_, i) => teamA[i] || null);
  const teamBPadded = Array.from({ length: teamSize }, (_, i) => teamB[i] || null);

  const getTierColor = (score?: number) => {
    if (score === undefined) return 'border-dashed border-white/40 bg-white/10 text-white/70';
    if (score >= 100) return 'border-[#EAF1EC] bg-[#3D6348] text-white ring-2 ring-[#CDE0D2]/50';
    if (score >= 80) return 'border-[#FAF3E7] bg-[#976C2F] text-white ring-2 ring-[#ECDDBF]/50';
    return 'border-[#FBF0EC] bg-[#AC5B40] text-white ring-2 ring-[#F2D2C6]/50';
  };

  const renderPlayerBadge = (player: Registration | null, defaultLabel: string, teamColor: 'blue' | 'white') => {
    if (!player) {
      return (
        <div className="flex flex-col items-center justify-center p-1">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-dashed border-white/30 bg-black/20 flex items-center justify-center text-white/50 text-xs">
            <User className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-white/70 font-medium mt-1 truncate max-w-[70px]">
            {defaultLabel}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center group relative cursor-pointer p-1">
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 overflow-hidden flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${getTierColor(player.userScore)}`}>
          {player.userPhoto ? (
            <img 
              src={player.userPhoto} 
              alt={player.userName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="font-bold text-xs">
              {player.userName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-col items-center mt-1">
          <span className="text-[10px] sm:text-xs font-bold text-white truncate max-w-[75px] text-center drop-shadow-md">
            {player.userName.split(' ')[0]}
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/40 text-white font-mono font-bold border border-white/20">
            {player.userScore} pts
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl p-3 sm:p-4 border border-[#E2E8E2] shadow-xs">
      
      {/* Field header */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-[#EAF1EC] text-[#3D6348] font-bold border border-[#CDE0D2]">
            Equipo Claro ({teamA.length}/{teamSize})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#5C6E62]">
          <Shield className="w-3.5 h-3.5 text-[#52795D]" />
          <span className="font-semibold text-[#222B25]">Cancha Táctica {getFormatName(capacity)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-[#FAF3E7] text-[#976C2F] font-bold border border-[#ECDDBF]">
            Equipo Oscuro ({teamB.length}/{teamSize})
          </span>
        </div>
      </div>

      {/* Football Pitch Graphic */}
      <div className="relative w-full aspect-16/10 sm:aspect-16/9 bg-gradient-to-b from-[#52795D] to-[#45684F] rounded-xl overflow-hidden border-2 border-[#689474]/50 shadow-inner flex flex-col justify-between p-2 sm:p-4">
        
        {/* Pitch markings */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Grass stripes */}
          <div className="w-full h-full flex flex-col opacity-10">
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-transparent"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-transparent"></div>
            <div className="flex-1 bg-white"></div>
          </div>
          {/* Outer border */}
          <div className="absolute inset-2 sm:inset-3 border-2 border-white/40 rounded-lg"></div>
          {/* Halfway line */}
          <div className="absolute top-1/2 left-2 right-2 sm:left-3 sm:right-3 h-0.5 bg-white/40 -translate-y-1/2"></div>
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 border-white/40"></div>
          {/* Center spot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/60"></div>
          {/* Top Penalty Area */}
          <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-10 sm:h-14 border-b-2 border-x-2 border-white/40"></div>
          {/* Bottom Penalty Area */}
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-10 sm:h-14 border-t-2 border-x-2 border-white/40"></div>
        </div>

        {/* Team A on Pitch (Top Half) */}
        <div className="relative z-10 grid grid-cols-5 gap-1 sm:gap-2 items-center justify-items-center h-1/2 pb-2">
          {capacity === 10 ? (
            // Fútbol 5 (1-2-2)
            <>
              <div className="col-start-3">{renderPlayerBadge(teamAPadded[0], 'Arquero', 'white')}</div>
              <div className="col-span-5 grid grid-cols-2 w-full max-w-[200px] justify-items-center">
                <div>{renderPlayerBadge(teamAPadded[1], 'Defensa', 'white')}</div>
                <div>{renderPlayerBadge(teamAPadded[2], 'Defensa', 'white')}</div>
              </div>
              <div className="col-span-5 grid grid-cols-2 w-full max-w-[200px] justify-items-center">
                <div>{renderPlayerBadge(teamAPadded[3], 'Medio', 'white')}</div>
                <div>{renderPlayerBadge(teamAPadded[4], 'Delantero', 'white')}</div>
              </div>
            </>
          ) : capacity === 12 ? (
            // Fútbol 6 (1-2-2-1)
            <>
              <div className="col-start-3">{renderPlayerBadge(teamAPadded[0], 'Arquero', 'white')}</div>
              <div className="col-span-5 grid grid-cols-2 w-full max-w-[200px] justify-items-center">
                <div>{renderPlayerBadge(teamAPadded[1], 'Defensa', 'white')}</div>
                <div>{renderPlayerBadge(teamAPadded[2], 'Defensa', 'white')}</div>
              </div>
              <div className="col-span-5 grid grid-cols-3 w-full max-w-[260px] justify-items-center">
                <div>{renderPlayerBadge(teamAPadded[3], 'Medio', 'white')}</div>
                <div>{renderPlayerBadge(teamAPadded[4], 'Medio', 'white')}</div>
                <div>{renderPlayerBadge(teamAPadded[5], 'Delantero', 'white')}</div>
              </div>
            </>
          ) : capacity === 14 ? (
            // Fútbol 7 (1-3-2-1)
            <>
              <div className="col-start-3">{renderPlayerBadge(teamAPadded[0], 'Arquero', 'white')}</div>
              <div className="col-span-5 grid grid-cols-3 w-full max-w-[280px] justify-items-center">
                <div>{renderPlayerBadge(teamAPadded[1], 'Defensa', 'white')}</div>
                <div>{renderPlayerBadge(teamAPadded[2], 'Defensa', 'white')}</div>
                <div>{renderPlayerBadge(teamAPadded[3], 'Defensa', 'white')}</div>
              </div>
              <div className="col-span-5 grid grid-cols-3 w-full max-w-[280px] justify-items-center">
                <div>{renderPlayerBadge(teamAPadded[4], 'Medio', 'white')}</div>
                <div>{renderPlayerBadge(teamAPadded[5], 'Medio', 'white')}</div>
                <div>{renderPlayerBadge(teamAPadded[6], 'Delantero', 'white')}</div>
              </div>
            </>
          ) : (
            // Fútbol 9 (1-3-3-2)
            <>
              <div className="col-start-3">{renderPlayerBadge(teamAPadded[0], 'Arquero', 'white')}</div>
              <div className="col-span-5 grid grid-cols-3 w-full max-w-[280px] justify-items-center">
                <div>{renderPlayerBadge(teamAPadded[1], 'Defensa', 'white')}</div>
                <div>{renderPlayerBadge(teamAPadded[2], 'Defensa', 'white')}</div>
                <div>{renderPlayerBadge(teamAPadded[3], 'Defensa', 'white')}</div>
              </div>
              <div className="col-span-5 grid grid-cols-5 w-full max-w-[320px] justify-items-center">
                <div className="col-span-1">{renderPlayerBadge(teamAPadded[4], 'Medio', 'white')}</div>
                <div className="col-span-1">{renderPlayerBadge(teamAPadded[5], 'Medio', 'white')}</div>
                <div className="col-span-1">{renderPlayerBadge(teamAPadded[6], 'Medio', 'white')}</div>
                <div className="col-span-1">{renderPlayerBadge(teamAPadded[7], 'Delantero', 'white')}</div>
                <div className="col-span-1">{renderPlayerBadge(teamAPadded[8], 'Delantero', 'white')}</div>
              </div>
            </>
          )}
        </div>

        {/* Team B on Pitch (Bottom Half) */}
        <div className="relative z-10 grid grid-cols-5 gap-1 sm:gap-2 items-center justify-items-center h-1/2 pt-2">
          {capacity === 10 ? (
            // Fútbol 5 (1-2-2)
            <>
              <div className="col-span-5 grid grid-cols-2 w-full max-w-[200px] justify-items-center">
                <div>{renderPlayerBadge(teamBPadded[4], 'Delantero', 'blue')}</div>
                <div>{renderPlayerBadge(teamBPadded[3], 'Medio', 'blue')}</div>
              </div>
              <div className="col-span-5 grid grid-cols-2 w-full max-w-[200px] justify-items-center">
                <div>{renderPlayerBadge(teamBPadded[2], 'Defensa', 'blue')}</div>
                <div>{renderPlayerBadge(teamBPadded[1], 'Defensa', 'blue')}</div>
              </div>
              <div className="col-start-3">{renderPlayerBadge(teamBPadded[0], 'Arquero', 'blue')}</div>
            </>
          ) : capacity === 12 ? (
            // Fútbol 6 (1-2-2-1)
            <>
              <div className="col-span-5 grid grid-cols-3 w-full max-w-[260px] justify-items-center">
                <div>{renderPlayerBadge(teamBPadded[5], 'Delantero', 'blue')}</div>
                <div>{renderPlayerBadge(teamBPadded[4], 'Medio', 'blue')}</div>
                <div>{renderPlayerBadge(teamBPadded[3], 'Medio', 'blue')}</div>
              </div>
              <div className="col-span-5 grid grid-cols-2 w-full max-w-[200px] justify-items-center">
                <div>{renderPlayerBadge(teamBPadded[2], 'Defensa', 'blue')}</div>
                <div>{renderPlayerBadge(teamBPadded[1], 'Defensa', 'blue')}</div>
              </div>
              <div className="col-start-3">{renderPlayerBadge(teamBPadded[0], 'Arquero', 'blue')}</div>
            </>
          ) : capacity === 14 ? (
            // Fútbol 7 (1-3-2-1)
            <>
              <div className="col-span-5 grid grid-cols-3 w-full max-w-[280px] justify-items-center">
                <div>{renderPlayerBadge(teamBPadded[6], 'Delantero', 'blue')}</div>
                <div>{renderPlayerBadge(teamBPadded[5], 'Medio', 'blue')}</div>
                <div>{renderPlayerBadge(teamBPadded[4], 'Medio', 'blue')}</div>
              </div>
              <div className="col-span-5 grid grid-cols-3 w-full max-w-[280px] justify-items-center">
                <div>{renderPlayerBadge(teamBPadded[3], 'Defensa', 'blue')}</div>
                <div>{renderPlayerBadge(teamBPadded[2], 'Defensa', 'blue')}</div>
                <div>{renderPlayerBadge(teamBPadded[1], 'Defensa', 'blue')}</div>
              </div>
              <div className="col-start-3">{renderPlayerBadge(teamBPadded[0], 'Arquero', 'blue')}</div>
            </>
          ) : (
            // Fútbol 9 (1-3-3-2)
            <>
              <div className="col-span-5 grid grid-cols-5 w-full max-w-[320px] justify-items-center">
                <div className="col-span-1">{renderPlayerBadge(teamBPadded[8], 'Delantero', 'blue')}</div>
                <div className="col-span-1">{renderPlayerBadge(teamBPadded[7], 'Delantero', 'blue')}</div>
                <div className="col-span-1">{renderPlayerBadge(teamBPadded[6], 'Medio', 'blue')}</div>
                <div className="col-span-1">{renderPlayerBadge(teamBPadded[5], 'Medio', 'blue')}</div>
                <div className="col-span-1">{renderPlayerBadge(teamBPadded[4], 'Medio', 'blue')}</div>
              </div>
              <div className="col-span-5 grid grid-cols-3 w-full max-w-[280px] justify-items-center">
                <div>{renderPlayerBadge(teamBPadded[3], 'Defensa', 'blue')}</div>
                <div>{renderPlayerBadge(teamBPadded[2], 'Defensa', 'blue')}</div>
                <div>{renderPlayerBadge(teamBPadded[1], 'Defensa', 'blue')}</div>
              </div>
              <div className="col-start-3">{renderPlayerBadge(teamBPadded[0], 'Arquero', 'blue')}</div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
