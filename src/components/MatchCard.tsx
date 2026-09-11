import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Flame, 
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  Trash2,
  Share2
} from 'lucide-react';
import { Match, Registration, UserProfile, calculateTier, getFormatName } from '../types';
import { matchService } from '../services/matchService';
import confetti from 'canvas-confetti';

interface MatchCardProps {
  match: Match;
  registrations: Registration[];
  currentUserProfile: UserProfile | null;
  onOpenRules: () => void;
  onRequireLogin: () => void;
  onSelectAdminSettle?: (match: Match) => void;
  onSelectAdminEdit?: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  registrations,
  currentUserProfile,
  onOpenRules,
  onRequireLogin,
  onSelectAdminSettle,
  onSelectAdminEdit,
}) => {
  const [loadingAction, setLoadingAction] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const activeRegistrations = registrations.filter(r => r.status !== 'cancelled');
  const starters = activeRegistrations.filter(r => r.status === 'starter');
  const substitutes = activeRegistrations.filter(r => r.status === 'substitute');

  const myRegistration = currentUserProfile 
    ? activeRegistrations.find(r => r.userId === currentUserProfile.uid)
    : null;

  const isStarter = myRegistration?.status === 'starter';
  const isSubstitute = myRegistration?.status === 'substitute';
  const isRegistered = !!myRegistration;

  const isFull = starters.length >= match.capacity;
  const isPhase1 = match.status === 'phase_1_priority';
  const isPhase2 = match.status === 'phase_2_open';
  const isOpen = isPhase1 || isPhase2;
  const isCompleted = match.status === 'completed';

  // Calculate match date and time
  const matchDate = new Date(match.dateTime);
  const formattedDate = matchDate.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const formattedTime = matchDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Hours left until match
  const hoursUntilMatch = (matchDate.getTime() - Date.now()) / (1000 * 60 * 60);
  const isLateCancellation = hoursUntilMatch < 12;

  // Handle register
  const handleRegister = async () => {
    if (!currentUserProfile) {
      onRequireLogin();
      return;
    }

    try {
      setLoadingAction(true);
      setFeedbackMessage(null);

      const res = await matchService.registerForMatch(match, currentUserProfile);

      if (res.success) {
        if (res.status === 'starter') {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
        setFeedbackMessage({ type: 'success', text: res.message });
      } else {
        setFeedbackMessage({ type: 'info', text: res.message });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error al inscribirse' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle cancellation
  const handleCancel = async () => {
    if (!currentUserProfile) return;

    try {
      setLoadingAction(true);
      setShowConfirmCancel(false);

      const res = await matchService.cancelRegistration(match, currentUserProfile.uid);
      if (res.success) {
        if (res.promotedPlayerName) {
          setFeedbackMessage({
            type: 'info',
            text: `Te diste de baja. ¡El suplente ${res.promotedPlayerName} ascendió automáticamente a titular!`,
          });
        } else {
          setFeedbackMessage({
            type: 'info',
            text: 'Te has dado de baja del partido correctamente.',
          });
        }
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err?.message || 'Error al darse de baja' });
    } finally {
      setLoadingAction(false);
    }
  };

  const getPhaseBadge = () => {
    switch (match.status) {
      case 'phase_1_priority':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#EAF1EC] text-[#3D6348] border border-[#CDE0D2]">
            <Flame className="w-3.5 h-3.5 text-[#D48C70]" />
            Fase 1 (≥ 100 pts)
          </span>
        );
      case 'phase_2_open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#FAF3E7] text-[#976C2F] border border-[#ECDDBF]">
            <Users className="w-3.5 h-3.5" />
            Fase 2: Abierta
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#F1F4F1] text-[#556358] border border-[#DDE6DF]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Finalizado
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#F1F4F1] text-[#556358]">
            <Clock className="w-3.5 h-3.5" />
            Cerrado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#FBF0EC] text-[#AC5B40] border border-[#F2D2C6]">
            <AlertCircle className="w-3.5 h-3.5" />
            Cancelado
          </span>
        );
    }
  };

  const getTierPill = (score: number) => {
    const tier = calculateTier(score);
    if (tier === 'Prioridad 1') {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#EAF1EC] text-[#3D6348] border border-[#CDE0D2]">
          P1 · {score}
        </span>
      );
    }
    if (tier === 'Prioridad 2') {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#FAF3E7] text-[#976C2F] border border-[#ECDDBF]">
          P2 · {score}
        </span>
      );
    }
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#FBF0EC] text-[#AC5B40] border border-[#F2D2C6]">
        P3 · {score}
      </span>
    );
  };

  return (
    <div className="bg-white border border-[#E2E8E2] hover:border-[#CCD6CE] rounded-2xl p-4 sm:p-6 transition-all shadow-xs flex flex-col justify-between relative overflow-hidden">
      
      {/* Top accent indicator */}
      <div className={`absolute top-0 right-0 left-0 h-1.5 ${
        isPhase1 ? 'bg-[#52795D]' : isPhase2 ? 'bg-[#D8A468]' : isCompleted ? 'bg-[#8CA291]' : 'bg-[#DDE6DF]'
      }`} />

      <div>
        {/* Match Header: Title + Format Badge + Phase Badge + Discreet Admin Action */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-[#222B25] tracking-tight">
              {match.title || getFormatName(match.capacity)}
            </h3>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#F1F5F2] text-[#45564A] border border-[#DDE6DF]">
              {getFormatName(match.capacity)}
            </span>
            {getPhaseBadge()}
          </div>

          {/* Discreet Admin Actions (Admin Only) */}
          {currentUserProfile?.role === 'admin' && (
            <div id={`match-admin-actions-${match.id}`} className="flex items-center gap-1.5 shrink-0">
              {onSelectAdminEdit && (
                <button
                  id={`btn-match-manage-${match.id}`}
                  onClick={() => onSelectAdminEdit(match)}
                  className="p-1.5 px-2.5 rounded-lg bg-[#F6F8F6] hover:bg-[#EEF3EF] text-[#45564A] hover:text-[#222B25] border border-[#DDE6DF] transition flex items-center gap-1.5 text-xs shadow-xs"
                  title="Gestionar convocatoria y editar lista de jugadores"
                >
                  <Users className="w-3.5 h-3.5 text-[#52795D]" />
                  <span className="text-[11px] font-medium hidden sm:inline">Gestionar</span>
                </button>
              )}

              {!isCompleted && onSelectAdminSettle && (
                <button
                  id={`btn-match-settle-${match.id}`}
                  onClick={() => onSelectAdminSettle(match)}
                  className="p-1.5 px-2.5 rounded-lg bg-[#F6F8F6] hover:bg-[#EEF3EF] text-[#45564A] hover:text-[#222B25] border border-[#DDE6DF] transition flex items-center gap-1.5 text-xs shadow-xs"
                  title="Liquidar partido (Panel DT)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D48C70]" />
                  <span className="text-[11px] font-medium hidden sm:inline">Liquidar</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date, Location, Cost row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 py-3 border-y border-[#EEF3EF] text-xs sm:text-sm text-[#5C6E62] mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#52795D] shrink-0" />
            <span className="font-bold text-[#222B25] capitalize">{formattedDate} · {formattedTime} hs</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#52795D] shrink-0" />
            <span className="truncate" title={match.location}>{match.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#D48C70] shrink-0" />
            <span>${match.costPerPlayer.toLocaleString('es-AR')} por jugador</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className={`p-3 rounded-xl mb-4 text-xs flex items-center justify-between ${
            feedbackMessage.type === 'success' 
              ? 'bg-[#EAF1EC] text-[#3D6348] border border-[#CDE0D2]'
              : feedbackMessage.type === 'error'
                ? 'bg-[#FBF0EC] text-[#AC5B40] border border-[#F2D2C6]'
                : 'bg-[#FAF3E7] text-[#976C2F] border border-[#ECDDBF]'
          }`}>
            <span>{feedbackMessage.text}</span>
            <button onClick={() => setFeedbackMessage(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* Current User Registration Status Banner */}
        {isRegistered && (
          <div className={`p-3 rounded-xl mb-4 text-xs flex flex-wrap items-center justify-between gap-2 ${
            isStarter 
              ? 'bg-[#EAF1EC] border border-[#CDE0D2] text-[#2F5239]' 
              : 'bg-[#FAF3E7] border border-[#ECDDBF] text-[#80571C]'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#52795D]" />
              <span>
                {isStarter 
                  ? '¡Estás convocado como TITULAR!' 
                  : `Estás en LISTA DE ESPERA (Suplente #${substitutes.findIndex(s => s.userId === currentUserProfile?.uid) + 1})`}
              </span>
            </div>

            {!showConfirmCancel ? (
              <button
                onClick={() => setShowConfirmCancel(true)}
                disabled={loadingAction || isCompleted}
                className="px-3 py-1 rounded-lg bg-[#FBF0EC] hover:bg-[#F7E1D8] text-[#AC5B40] border border-[#F2D2C6] font-semibold transition"
              >
                Darme de baja
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#F2D2C6] shadow-xs">
                <span className="text-[11px] text-[#AC5B40]">
                  {isLateCancellation 
                    ? '⚠️ <12hs: -10 pts de penalización' 
                    : '¿Confirmar baja? (Sin penalización)'}
                </span>
                <button
                  onClick={handleCancel}
                  disabled={loadingAction}
                  className="px-2.5 py-1 rounded bg-[#AC5B40] hover:bg-[#964E36] text-white font-bold text-xs"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setShowConfirmCancel(false)}
                  className="px-2 py-1 rounded bg-[#F1F4F1] text-[#556358] text-xs hover:bg-[#E4ECE6]"
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Button if NOT registered */}
        {!isRegistered && isOpen && (
          <div className="mb-4">
            <button
              onClick={handleRegister}
              disabled={loadingAction}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-xs ${
                isPhase1 && currentUserProfile && currentUserProfile.score < 100
                  ? 'bg-[#F6F8F6] hover:bg-[#EEF3EF] text-[#976C2F] border border-[#ECDDBF]'
                  : isFull
                    ? 'bg-[#D8A468] hover:bg-[#C79357] text-white'
                    : 'bg-[#52795D] hover:bg-[#45684F] text-white'
              }`}
            >
              {loadingAction ? (
                <span>Procesando...</span>
              ) : isPhase1 && currentUserProfile && currentUserProfile.score < 100 ? (
                <>
                  <Clock className="w-4 h-4 text-[#976C2F]" />
                  <span>Anotarme en Lista de Espera (Fase 1: Prioridad 1)</span>
                </>
              ) : isFull ? (
                <>
                  <Users className="w-4 h-4" />
                  <span>Anotarme como Suplente (Cupo titular lleno)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Anotarme al Partido (Titular)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Starters & Substitutes Lists */}
        <div className="flex items-center justify-between text-xs text-[#6B7C70] font-bold uppercase tracking-wider mb-2.5">
          <div className="flex items-center gap-2">
            <span>Titulares ({starters.length}/{match.capacity})</span>
            <span className="text-[#3D6348] font-medium lowercase">({match.capacity - starters.length} vacantes)</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Starters Roster */}
            <div>
              {starters.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#F6F8F6] border border-dashed border-[#DDE6DF] text-center text-xs text-[#7A8C80]">
                  Aún no hay titulares inscriptos. ¡Sé el primero en anotarte!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {starters.map((starter, idx) => (
                    <div 
                      key={starter.id} 
                      className="p-2.5 rounded-xl bg-[#F6F8F6] border border-[#E2EAE3] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-mono font-bold text-[#8D9B91] w-4">
                          {idx + 1}°
                        </span>
                        <img 
                          src={starter.userPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${starter.userId}`} 
                          alt={starter.userName} 
                          className="w-8 h-8 rounded-full border border-[#D2DDD4] bg-[#EAF1EC] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#222B25] truncate">
                            {starter.userName}
                            {starter.userId === currentUserProfile?.uid && ' (Tú)'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {getTierPill(starter.userScore)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Substitutes Waitlist */}
            {substitutes.length > 0 && (
              <div className="pt-3 border-t border-[#EEF3EF]">
                <div className="flex items-center justify-between text-xs text-[#6B7C70] uppercase font-bold tracking-wider mb-2">
                  <span>Lista de Espera / Suplentes ({substitutes.length})</span>
                  <span className="text-[#976C2F] font-medium">Orden de llegada</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {substitutes.map((sub, idx) => (
                    <div 
                      key={sub.id} 
                      className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EBE4DA] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-[#FAF3E7] text-[#976C2F] font-mono font-bold text-[10px] border border-[#ECDDBF]">
                          S{idx + 1}
                        </span>
                        <img 
                          src={sub.userPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${sub.userId}`} 
                          alt={sub.userName} 
                          className="w-7 h-7 rounded-full border border-[#E2DDD5] bg-[#FAF3E7] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-[#354238] truncate block">
                            {sub.userName} {sub.userId === currentUserProfile?.uid && '(Tú)'}
                          </span>
                          <span className="text-[10px] text-[#7A8C80] font-mono">{sub.userScore} pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
      </div>

    </div>
  );
};
