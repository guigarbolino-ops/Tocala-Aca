import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Users, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Clock, 
  SlidersHorizontal,
  RefreshCw,
  Database,
  Trash2,
  Edit3,
  UserPlus,
  UserCheck,
  UserX,
  ArrowRightLeft,
  Search,
  ShieldCheck,
  Save,
  Check,
  CircleAlert
} from 'lucide-react';
import { 
  Match, 
  Registration, 
  Evaluation, 
  PenaltyType, 
  calculateDeltaScore,
  UserProfile,
  MatchCapacity,
  getFormatName,
  calculateTier
} from '../types';
import { matchService } from '../services/matchService';
import confetti from 'canvas-confetti';

interface AdminPanelProps {
  matches: Match[];
  adminUser: UserProfile;
  selectedMatchForSettle: Match | null;
  selectedMatchForEdit?: Match | null;
  onCloseSettleModal: () => void;
  onCloseEditModal?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  matches,
  adminUser,
  selectedMatchForSettle,
  selectedMatchForEdit,
  onCloseSettleModal,
  onCloseEditModal,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeSettleMatch, setActiveSettleMatch] = useState<Match | null>(selectedMatchForSettle);
  const [activeEditMatch, setActiveEditMatch] = useState<Match | null>(selectedMatchForEdit || null);
  
  const [settleRegistrations, setSettleRegistrations] = useState<Registration[]>([]);
  const [editRegistrations, setEditRegistrations] = useState<Registration[]>([]);
  const [allClubUsers, setAllClubUsers] = useState<UserProfile[]>([]);
  
  const [evaluations, setEvaluations] = useState<Record<string, {
    attended: boolean;
    onTime: boolean;
    paid: boolean;
    penaltyType: PenaltyType;
  }>>({});
  
  const [loadingAction, setLoadingAction] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // In-app confirmation states (replaces window.confirm)
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [playerToRemove, setPlayerToRemove] = useState<Registration | null>(null);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  // Player Management Modal States
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [playersModalTab, setPlayersModalTab] = useState<'single' | 'bulk' | 'list'>('single');
  
  // Single Player Form State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [newPlayerEmail, setNewPlayerEmail] = useState('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('Polifuncional');
  const [newPlayerScore, setNewPlayerScore] = useState(100);
  const [newPlayerRole, setNewPlayerRole] = useState<'player' | 'admin'>('player');

  // Bulk Player Form State
  const [bulkPlayersText, setBulkPlayersText] = useState('');
  const [bulkDefaultScore, setBulkDefaultScore] = useState(100);

  // Plantel Search & Deletion State
  const [plantelSearchQuery, setPlantelSearchQuery] = useState('');
  const [playerToDeleteFromClub, setPlayerToDeleteFromClub] = useState<UserProfile | null>(null);

  // Active Tab inside the Match Management Modal: 'roster' | 'details'
  const [editModalTab, setEditModalTab] = useState<'roster' | 'details'>('roster');

  // Add Player State inside Roster Management
  const [addPlayerMode, setAddPlayerMode] = useState<'registered' | 'guest'>('registered');
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<string>('');
  const [guestNameInput, setGuestNameInput] = useState<string>('');
  const [addPlayerRole, setAddPlayerRole] = useState<'starter' | 'substitute'>('starter');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  // Match details editing state
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCapacity, setEditCapacity] = useState<MatchCapacity>(10);
  const [editCost, setEditCost] = useState(3500);
  const [editStatus, setEditStatus] = useState<Match['status']>('phase_1_priority');
  const [editNotes, setEditNotes] = useState('');

  // Helper date conversions
  const getCurrentDayMonth = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const getIsoFromDayMonth = (dayMonthStr: string) => {
    const currentYear = new Date().getFullYear();
    const parts = dayMonthStr.split(/[\/\-]/);
    if (parts.length >= 2) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      return `${currentYear}-${month}-${day}`;
    }
    return '';
  };

  const getDayMonthFromIso = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    } catch {
      return getCurrentDayMonth();
    }
  };

  const getTimeFromIso = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '20:00';
    }
  };

  // New match form state
  const [formDate, setFormDate] = useState(getCurrentDayMonth());
  const [formTime, setFormTime] = useState('20:00');
  const [formLocation, setFormLocation] = useState('Predio El Monumental - Cancha 3');
  const [formCapacity, setFormCapacity] = useState<MatchCapacity>(10);
  const [formCost, setFormCost] = useState(3500);
  const [formTitle, setFormTitle] = useState('Fútbol 5 Semanal');
  const [formStatus, setFormStatus] = useState<Match['status']>('phase_1_priority');
  const [formNotes, setFormNotes] = useState('Césped sintético. Camiseta clara u oscura.');

  // Subscribe to all club users for the add-player picker
  useEffect(() => {
    const unsubUsers = matchService.subscribeLeaderboard((users) => {
      setAllClubUsers(users);
    });
    return () => unsubUsers();
  }, []);

  useEffect(() => {
    if (selectedMatchForSettle) {
      setActiveSettleMatch(selectedMatchForSettle);
    }
  }, [selectedMatchForSettle]);

  useEffect(() => {
    if (selectedMatchForEdit) {
      openEditModal(selectedMatchForEdit);
    }
  }, [selectedMatchForEdit]);

  // Load registrations when active settle match changes
  useEffect(() => {
    if (!activeSettleMatch) {
      setSettleRegistrations([]);
      setEvaluations({});
      return;
    }

    const unsubscribe = matchService.subscribeRegistrations(activeSettleMatch.id, (regs) => {
      const activeRegs = regs.filter(r => r.status === 'starter' || r.status === 'substitute');
      setSettleRegistrations(activeRegs);

      // Initialize evaluation defaults for starters
      const initialEvals: Record<string, { attended: boolean; onTime: boolean; paid: boolean; penaltyType: PenaltyType }> = {};
      activeRegs.forEach(reg => {
        const isStarter = reg.status === 'starter';
        initialEvals[reg.userId] = {
          attended: isStarter,
          onTime: isStarter,
          paid: reg.paid || false,
          penaltyType: 'none',
        };
      });
      setEvaluations(initialEvals);
    });

    return () => unsubscribe();
  }, [activeSettleMatch]);

  // Load registrations when active edit match changes
  useEffect(() => {
    if (!activeEditMatch) {
      setEditRegistrations([]);
      return;
    }

    const unsubscribe = matchService.subscribeRegistrations(activeEditMatch.id, (regs) => {
      setEditRegistrations(regs);
    });

    return () => unsubscribe();
  }, [activeEditMatch]);

  // Open Edit Modal and fill form state
  const openEditModal = (match: Match, initialTab: 'roster' | 'details' = 'roster') => {
    setActiveEditMatch(match);
    setEditModalTab(initialTab);
    setEditTitle(match.title || getFormatName(match.capacity));
    setEditDate(getDayMonthFromIso(match.dateTime));
    setEditTime(getTimeFromIso(match.dateTime));
    setEditLocation(match.location);
    setEditCapacity(match.capacity);
    setEditCost(match.costPerPlayer);
    setEditStatus(match.status);
    setEditNotes(match.notes || '');
    setUserSearchQuery('');
    setSelectedUserIdToAdd('');
    setGuestNameInput('');
  };

  const closeEditModal = () => {
    setActiveEditMatch(null);
    if (onCloseEditModal) onCloseEditModal();
  };

  // Starters & substitutes in edit match
  const editStarters = useMemo(() => {
    return editRegistrations.filter(r => r.status === 'starter');
  }, [editRegistrations]);

  const editSubstitutes = useMemo(() => {
    return editRegistrations.filter(r => r.status === 'substitute');
  }, [editRegistrations]);

  // Filtered club users available to add (exclude those already in match)
  const availableUsersToAdd = useMemo(() => {
    const existingUserIds = new Set(
      editRegistrations.filter(r => r.status !== 'cancelled').map(r => r.userId)
    );
    return allClubUsers.filter(u => {
      if (existingUserIds.has(u.uid)) return false;
      if (!userSearchQuery) return true;
      return (
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
      );
    });
  }, [allClubUsers, editRegistrations, userSearchQuery]);

  // Trigger toast helper
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  // Handle Match Creation
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const isoDate = getIsoFromDayMonth(formDate);
    if (!isoDate) {
      showError("Formato de fecha inválido. Usa dd/mm (ej: 28/08)");
      return;
    }

    try {
      setLoadingAction(true);
      const combinedDateTime = new Date(`${isoDate}T${formTime}:00`).toISOString();

      await matchService.createMatch({
        title: formTitle,
        dateTime: combinedDateTime,
        location: formLocation,
        capacity: formCapacity,
        costPerPlayer: Number(formCost),
        status: formStatus,
        notes: formNotes,
      });

      setShowCreateModal(false);
      showToast('¡Partido programado con éxito!');
    } catch (err: any) {
      showError("Error al crear partido: " + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Match Update Details
  const handleUpdateMatchDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditMatch) return;

    const isoDate = getIsoFromDayMonth(editDate);
    if (!isoDate) {
      showError("Formato de fecha inválido. Usa dd/mm (ej: 28/08)");
      return;
    }

    try {
      setLoadingAction(true);
      const combinedDateTime = new Date(`${isoDate}T${editTime}:00`).toISOString();

      await matchService.updateMatch(activeEditMatch.id, {
        title: editTitle,
        dateTime: combinedDateTime,
        location: editLocation,
        capacity: editCapacity,
        costPerPlayer: Number(editCost),
        status: editStatus,
        notes: editNotes,
      });

      // Update local match object
      setActiveEditMatch(prev => prev ? {
        ...prev,
        title: editTitle,
        dateTime: combinedDateTime,
        location: editLocation,
        capacity: editCapacity,
        costPerPlayer: Number(editCost),
        status: editStatus,
        notes: editNotes,
      } : null);

      showToast('¡Detalles del partido actualizados!');
    } catch (err: any) {
      showError("Error al actualizar partido: " + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // ADMIN: Add Registered Player or Guest to Match
  const handleAdminAddPlayer = async () => {
    if (!activeEditMatch) return;

    try {
      setLoadingAction(true);
      if (addPlayerMode === 'registered') {
        if (!selectedUserIdToAdd) {
          showError("Selecciona un jugador de la lista");
          return;
        }
        const userToAdd = allClubUsers.find(u => u.uid === selectedUserIdToAdd);
        if (!userToAdd) {
          showError("Jugador no encontrado");
          return;
        }

        await matchService.adminAddPlayerToMatch(
          activeEditMatch.id,
          userToAdd,
          addPlayerRole
        );

        setSelectedUserIdToAdd('');
        showToast(`¡${userToAdd.name} incorporado como ${addPlayerRole === 'starter' ? 'Titular' : 'Suplente'}!`);
      } else {
        // Guest mode
        if (!guestNameInput.trim()) {
          showError("Ingresa el nombre del invitado");
          return;
        }

        await matchService.adminAddGuestPlayer(
          activeEditMatch.id,
          guestNameInput.trim(),
          addPlayerRole
        );

        setGuestNameInput('');
        showToast(`¡${guestNameInput.trim()} incorporado al partido!`);
      }
    } catch (err: any) {
      showError("Error al añadir jugador: " + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // ADMIN: Remove Player from Match
  const executeAdminRemovePlayer = async () => {
    if (!activeEditMatch || !playerToRemove) return;

    try {
      setLoadingAction(true);
      const res = await matchService.adminRemovePlayer(activeEditMatch.id, playerToRemove.id, true);
      
      let msg = `${playerToRemove.userName} fue removido del partido.`;
      if (res.promotedPlayerName) {
        msg += ` 🚀 ${res.promotedPlayerName} subió a Titular.`;
      }
      showToast(msg);
      setPlayerToRemove(null);
    } catch (err: any) {
      showError("Error al remover jugador: " + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // ADMIN: Toggle Starter <-> Substitute
  const handleAdminChangeStatus = async (reg: Registration, newStatus: 'starter' | 'substitute') => {
    if (!activeEditMatch) return;
    try {
      setLoadingAction(true);
      await matchService.adminChangePlayerStatus(reg.id, newStatus);
      showToast(`${reg.userName} ahora es ${newStatus === 'starter' ? 'Titular' : 'Suplente'}`);
    } catch (err: any) {
      showError("Error al cambiar estado: " + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Quick Phase Toggle
  const handleTogglePhase = async (match: Match) => {
    try {
      setLoadingAction(true);
      const nextStatus: Match['status'] = 
        match.status === 'phase_1_priority' ? 'phase_2_open' : 'phase_1_priority';
      
      await matchService.updateMatchStatus(match.id, nextStatus);
      showToast(`Estado cambiado a: ${nextStatus === 'phase_2_open' ? 'Fase 2 (Abierta)' : 'Fase 1 (Prioridad)'}`);
    } catch (err: any) {
      showError("Error al cambiar fase: " + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Delete Match Execution
  const executeDeleteMatch = async () => {
    if (!matchToDelete) return;
    try {
      setLoadingAction(true);
      await matchService.deleteMatch(matchToDelete.id);
      showToast('Partido eliminado correctamente');
      setMatchToDelete(null);
    } catch (err: any) {
      showError("Error al eliminar partido: " + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Post-Match Settlement & Batch Recalculation
  const handleExecuteSettlement = async () => {
    if (!activeSettleMatch) return;

    try {
      setLoadingAction(true);

      const evaluationList: Evaluation[] = settleRegistrations.map(reg => {
        const ev = evaluations[reg.userId] || {
          attended: false,
          onTime: false,
          paid: false,
          penaltyType: 'none' as PenaltyType,
        };

        const delta = calculateDeltaScore(ev.attended, ev.onTime, ev.paid, ev.penaltyType);

        return {
          id: `${activeSettleMatch.id}_${reg.userId}`,
          matchId: activeSettleMatch.id,
          userId: reg.userId,
          userName: reg.userName,
          attended: ev.attended,
          onTime: ev.onTime,
          paid: ev.paid,
          penaltyType: ev.penaltyType,
          deltaScore: delta,
        };
      });

      await matchService.settleMatch(activeSettleMatch, evaluationList, adminUser.uid);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      setActiveSettleMatch(null);
      onCloseSettleModal();
      showToast('🎉 ¡Partido finalizado y puntajes recalculados exitosamente!');
    } catch (err: any) {
      showError("Error en liquidación: " + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Seed Data Execution
  const executeSeedDemoData = async () => {
    try {
      setSeedLoading(true);
      setShowSeedConfirm(false);
      await matchService.seedInitialDemoData();
      showToast('¡Datos de demostración cargados exitosamente!');
    } catch (err: any) {
      showError("Error al cargar demo: " + err?.message);
    } finally {
      setSeedLoading(false);
    }
  };

  // Handle Create Single Real Player
  const handleCreateSinglePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {
      showError("Ingresa el nombre del jugador");
      return;
    }

    try {
      setLoadingAction(true);
      const createdUid = await matchService.createPlayer({
        name: newPlayerName.trim(),
        phone: newPlayerPhone.trim(),
        email: newPlayerEmail.trim(),
        position: newPlayerPosition,
        score: Number(newPlayerScore) || 100,
        role: newPlayerRole,
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 }
      });

      showToast(`¡Jugador "${newPlayerName.trim()}" creado con éxito con ${newPlayerScore} pts!`);
      setNewPlayerName('');
      setNewPlayerPhone('');
      setNewPlayerEmail('');
      setNewPlayerPosition('Polifuncional');
      setNewPlayerScore(100);
      setNewPlayerRole('player');
    } catch (err: any) {
      showError("Error al crear jugador: " + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Bulk Player Creation
  const handleCreateBulkPlayers = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkPlayersText
      .split(/[\n,]+/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      showError("Ingresa al menos un nombre para cargar");
      return;
    }

    try {
      setLoadingAction(true);
      const playersToCreate = lines.map(name => ({
        name,
        score: Number(bulkDefaultScore) || 100,
        role: 'player' as const,
      }));

      const count = await matchService.createMultiplePlayers(playersToCreate, Number(bulkDefaultScore) || 100);

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.7 }
      });

      showToast(`¡${count} jugadores creados exitosamente con ${bulkDefaultScore} pts!`);
      setBulkPlayersText('');
      setPlayersModalTab('list');
    } catch (err: any) {
      showError("Error al cargar jugadores en lote: " + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Quick Score Adjustment for Existing Player
  const handleQuickAdjustScore = async (user: UserProfile, delta: number) => {
    try {
      const newScore = Math.max(0, (user.score ?? 100) + delta);
      await matchService.updatePlayer(user.uid, { score: newScore });
      showToast(`Puntaje de ${user.name} actualizado a ${newScore} pts`);
    } catch (err: any) {
      showError("Error al actualizar puntaje: " + err?.message);
    }
  };

  // Handle Delete Player from Club
  const executeDeletePlayerFromClub = async () => {
    if (!playerToDeleteFromClub) return;
    try {
      setLoadingAction(true);
      await matchService.deletePlayer(playerToDeleteFromClub.uid);
      showToast(`El jugador "${playerToDeleteFromClub.name}" fue eliminado del club.`);
      setPlayerToDeleteFromClub(null);
    } catch (err: any) {
      showError("Error al eliminar jugador: " + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Filtered club users for the Plantel List
  const filteredClubUsers = useMemo(() => {
    if (!plantelSearchQuery.trim()) return allClubUsers;
    const q = plantelSearchQuery.toLowerCase().trim();
    return allClubUsers.filter(u => 
      u.name.toLowerCase().includes(q) || 
      (u.phone && u.phone.includes(q)) || 
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.position && u.position.toLowerCase().includes(q))
    );
  }, [allClubUsers, plantelSearchQuery]);

  // Toggle user evaluation field in settlement
  const updatePlayerEval = (userId: string, field: 'attended' | 'onTime' | 'paid' | 'penaltyType', val: any) => {
    setEvaluations(prev => {
      const current = prev[userId] || { attended: true, onTime: true, paid: true, penaltyType: 'none' };
      return {
        ...prev,
        [userId]: {
          ...current,
          [field]: val,
        }
      };
    });
  };

  const getTierBadge = (score: number) => {
    if (score >= 100) {
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#EAF1EC] text-[#3D6348] font-bold border border-[#CDE0D2]">P1 · {score}</span>;
    }
    if (score >= 80) {
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FAF3E7] text-[#976C2F] font-bold border border-[#ECDDBF]">P2 · {score}</span>;
    }
    return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FBF0EC] text-[#AC5B40] font-bold border border-[#F2D2C6]">P3 · {score}</span>;
  };

  return (
    <div className="space-y-6" id="admin-panel-container">
      
      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#52795D] text-white font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#AC5B40] text-white font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <CircleAlert className="w-5 h-5 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Admin Panel Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E2E8E2] p-4 sm:p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EAF1EC] text-[#3D6348] font-bold text-xs border border-[#CDE0D2]">
              PANEL DE CONTROL DT
            </span>
            <span className="text-xs text-[#6B7C70]">· {adminUser.name}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#222B25] tracking-tight">
            Gestión de Partidos, Convocatorias y Jugadores
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7C70] mt-0.5">
            Edita la lista de convocados, promueve titulares, modifica datos del partido y liquida puntajes post-partido.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="admin-create-match-btn"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            Crear Partido
          </button>

          <button
            id="admin-seed-demo-btn"
            onClick={() => {
              setPlayersModalTab('single');
              setShowPlayersModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-[#F6F8F6] hover:bg-[#EEF3EF] text-[#222B25] text-xs sm:text-sm font-bold border border-[#DDE6DF] flex items-center gap-2 transition shadow-xs"
            title="Crear y administrar jugadores reales del plantel"
          >
            <UserPlus className="w-4 h-4 text-[#52795D]" />
            <span>Crear jugadores</span>
          </button>
        </div>
      </div>

      {/* Active Matches Management Table */}
      <div className="bg-white border border-[#E2E8E2] rounded-2xl p-4 sm:p-6 shadow-xs">
        <h3 className="text-base sm:text-lg font-black text-[#222B25] mb-4 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-[#52795D]" />
          Partidos del Sistema ({matches.length})
        </h3>

        {matches.length === 0 ? (
          <div className="p-8 text-center bg-[#F6F8F6] rounded-xl border border-dashed border-[#DDE6DF]">
            <p className="text-[#6B7C70] text-sm mb-3">No hay partidos creados en el sistema.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#52795D] hover:bg-[#45684F] text-white font-bold text-xs rounded-xl transition shadow-xs"
            >
              Crear el primer partido
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const mDate = new Date(m.dateTime);
              return (
                <div 
                  key={m.id}
                  id={`admin-match-row-${m.id}`}
                  className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E2EAE3] flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-[#CAD8CD] transition shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F5F2] text-[#45564A] border border-[#DDE6DF]">
                        {getFormatName(m.capacity)}
                      </span>
                      {m.status === 'phase_1_priority' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EAF1EC] text-[#3D6348] border border-[#CDE0D2]">
                          🔥 Fase 1 (Prioridad 1)
                        </span>
                      ) : m.status === 'phase_2_open' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FAF3E7] text-[#976C2F] border border-[#ECDDBF]">
                          🟢 Fase 2 (Abierta)
                        </span>
                      ) : m.status === 'completed' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F4F8] text-[#556987] border border-[#D5DFEC]">
                          🏁 Finalizado y Liquidado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F1F4F1] text-[#7A8C80]">
                          🔒 Cerrado
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-[#222B25] text-base">{m.title || getFormatName(m.capacity)}</h4>
                    <p className="text-xs text-[#6B7C70] flex flex-wrap items-center gap-3">
                      <span>📅 {mDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} {mDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</span>
                      <span>📍 {m.location}</span>
                      <span>💵 ${m.costPerPlayer.toLocaleString('es-AR')}</span>
                      <span>👥 Capacidad: {m.capacity} jugadores</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* EDIT MATCH & ROSTER BUTTON */}
                    <button
                      id={`edit-match-btn-${m.id}`}
                      onClick={() => openEditModal(m, 'roster')}
                      className="px-3.5 py-1.5 rounded-lg bg-[#FAF3E7] hover:bg-[#F5ECE0] text-[#976C2F] border border-[#ECDDBF] text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                      title="Editar convocatoria y lista de jugadores"
                    >
                      <Users className="w-3.5 h-3.5 text-[#976C2F]" />
                      <span>Editar Jugadores & Partido</span>
                    </button>

                    {/* Toggle Phase Button */}
                    {m.status !== 'completed' && (
                      <button
                        id={`toggle-phase-btn-${m.id}`}
                        onClick={() => handleTogglePhase(m)}
                        disabled={loadingAction}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          m.status === 'phase_1_priority'
                            ? 'bg-white hover:bg-[#F6F8F6] text-[#45564A] border-[#DDE6DF]'
                            : 'bg-[#EAF1EC] hover:bg-[#DDEEE0] text-[#3D6348] border-[#CDE0D2]'
                        }`}
                      >
                        {m.status === 'phase_1_priority' ? 'Pasar a Fase 2' : 'Volver a Fase 1'}
                      </button>
                    )}

                    {/* Settle Match Button */}
                    {m.status !== 'completed' && (
                      <button
                        id={`settle-match-btn-${m.id}`}
                        onClick={() => setActiveSettleMatch(m)}
                        className="px-3 py-1.5 rounded-lg bg-[#52795D] hover:bg-[#45684F] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D48C70]" />
                        Liquidar
                      </button>
                    )}

                    {/* Delete Match Button */}
                    <button
                      id={`delete-match-btn-${m.id}`}
                      onClick={() => setMatchToDelete(m)}
                      className="p-2 rounded-lg text-[#7A8C80] hover:text-[#AC5B40] hover:bg-[#FBF0EC] border border-transparent hover:border-[#F2D2C6] transition flex items-center justify-center"
                      title="Eliminar partido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: EDIT MATCH & FULL ROSTER MANAGEMENT (ADMIN POWER) */}
      {/* ======================================================== */}
      {activeEditMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8E2] rounded-2xl w-full max-w-4xl shadow-2xl text-[#222B25] max-h-[94vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#EEF3EF] flex items-center justify-between bg-[#FAFBF9]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#EAF1EC] text-[#3D6348] font-bold text-xs border border-[#CDE0D2]">
                    EDICIÓN ADMINISTRADOR DT
                  </span>
                  <span className="text-xs text-[#6B7C70]">{getFormatName(activeEditMatch.capacity)}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#222B25] mt-1">
                  {activeEditMatch.title || 'Gestión de Partido'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={closeEditModal} 
                  className="p-2 text-[#6B7C70] hover:text-[#222B25] rounded-lg hover:bg-[#F1F5F2] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs inside Modal */}
            <div className="flex items-center border-b border-[#EEF3EF] bg-[#F6F8F6] px-4 sm:px-6">
              <button
                onClick={() => setEditModalTab('roster')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                  editModalTab === 'roster'
                    ? 'border-[#52795D] text-[#3D6348] bg-white'
                    : 'border-transparent text-[#6B7C70] hover:text-[#222B25]'
                }`}
              >
                <Users className="w-4 h-4 text-[#52795D]" />
                <span>Lista de Jugadores ({editStarters.length}/{activeEditMatch.capacity} Titulares · {editSubstitutes.length} Suplentes)</span>
              </button>

              <button
                onClick={() => setEditModalTab('details')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
                  editModalTab === 'details'
                    ? 'border-[#52795D] text-[#3D6348] bg-white'
                    : 'border-transparent text-[#6B7C70] hover:text-[#222B25]'
                }`}
              >
                <Edit3 className="w-4 h-4 text-[#52795D]" />
                <span>Datos del Partido</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* TAB 1: FULL ROSTER MANAGEMENT */}
              {editModalTab === 'roster' && (
                <div className="space-y-6">
                  
                  {/* ADD PLAYER SECTION */}
                  <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E2EAE3] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-[#222B25] flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-[#52795D]" />
                        Añadir Jugador Directamente al Partido
                      </h4>

                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#DDE6DF] text-xs">
                        <button
                          type="button"
                          onClick={() => setAddPlayerMode('registered')}
                          className={`px-2.5 py-1 rounded font-semibold transition ${
                            addPlayerMode === 'registered' ? 'bg-[#52795D] text-white font-bold' : 'text-[#6B7C70] hover:text-[#222B25]'
                          }`}
                        >
                          Jugador Registrado
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddPlayerMode('guest')}
                          className={`px-2.5 py-1 rounded font-semibold transition ${
                            addPlayerMode === 'guest' ? 'bg-[#52795D] text-white font-bold' : 'text-[#6B7C70] hover:text-[#222B25]'
                          }`}
                        >
                          Invitado / Manual
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {addPlayerMode === 'registered' ? (
                        <div className="sm:col-span-6 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-[#6B7C70]">Seleccionar Jugador del Club</label>
                            <button
                              type="button"
                              onClick={() => {
                                setPlayersModalTab('single');
                                setShowPlayersModal(true);
                              }}
                              className="text-[11px] text-[#52795D] hover:underline font-semibold flex items-center gap-1"
                            >
                              + Crear nuevo jugador
                            </button>
                          </div>
                          <select
                            value={selectedUserIdToAdd}
                            onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDE6DF] text-[#222B25] text-xs sm:text-sm focus:outline-none focus:border-[#52795D]"
                          >
                            <option value="">-- Elige un jugador ({availableUsersToAdd.length} disponibles) --</option>
                            {availableUsersToAdd.map((u) => (
                              <option key={u.uid} value={u.uid}>
                                {u.name} · Score: {u.score} pts ({u.currentTier})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="sm:col-span-6 space-y-1">
                          <label className="text-[11px] font-semibold text-[#6B7C70]">Nombre del Jugador Invitado</label>
                          <input
                            type="text"
                            value={guestNameInput}
                            onChange={(e) => setGuestNameInput(e.target.value)}
                            placeholder="Ej: Marcelo (Amigo de Juan)"
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDE6DF] text-[#222B25] text-xs sm:text-sm focus:outline-none focus:border-[#52795D]"
                          />
                        </div>
                      )}

                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[11px] font-semibold text-[#6B7C70]">Puesto</label>
                        <select
                          value={addPlayerRole}
                          onChange={(e) => setAddPlayerRole(e.target.value as 'starter' | 'substitute')}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDE6DF] text-[#222B25] text-xs sm:text-sm focus:outline-none focus:border-[#52795D]"
                        >
                          <option value="starter">Titular</option>
                          <option value="substitute">Suplente</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          id="btn-admin-add-player-confirm"
                          onClick={handleAdminAddPlayer}
                          disabled={loadingAction}
                          className="w-full py-2 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-xs transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Añadir</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* STARTERS LIST */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#222B25] flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#52795D]" />
                        <span>Titulares Convocados</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#EAF1EC] text-[#3D6348] text-xs font-bold font-mono border border-[#CDE0D2]">
                          {editStarters.length} / {activeEditMatch.capacity}
                        </span>
                      </h4>
                      {editStarters.length >= activeEditMatch.capacity && (
                        <span className="text-[11px] text-[#976C2F] font-semibold">Cupo completo</span>
                      )}
                    </div>

                    {editStarters.length === 0 ? (
                      <div className="p-4 text-center bg-[#F6F8F6] rounded-xl border border-dashed border-[#DDE6DF] text-xs text-[#6B7C70]">
                        No hay jugadores titulares inscriptos en este partido.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {editStarters.map((starter, index) => (
                          <div
                            key={starter.id}
                            id={`roster-starter-${starter.id}`}
                            className="p-3 rounded-xl bg-white border border-[#E2EAE3] hover:border-[#CAD8CD] flex items-center justify-between gap-3 transition shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-5 text-center font-mono text-xs font-bold text-[#7A8C80]">
                                #{index + 1}
                              </span>
                              <img
                                src={starter.userPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${starter.userId}`}
                                alt={starter.userName}
                                className="w-8 h-8 rounded-full bg-[#EAF1EC] border border-[#DDE6DF] object-cover shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#222B25] truncate max-w-[140px] sm:max-w-[180px]">
                                  {starter.userName}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {getTierBadge(starter.userScore)}
                                </div>
                              </div>
                            </div>

                            {/* Actions on this player */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Demote to Substitute */}
                              <button
                                id={`demote-player-${starter.id}`}
                                onClick={() => handleAdminChangeStatus(starter, 'substitute')}
                                className="p-2 rounded-lg text-[#6B7C70] hover:text-[#976C2F] hover:bg-[#FAF3E7] border border-[#DDE6DF] transition flex items-center gap-1 text-xs"
                                title="Pasar a Suplente"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[10px]">A Suplente</span>
                              </button>

                              {/* Remove Player */}
                              <button
                                id={`remove-player-${starter.id}`}
                                onClick={() => setPlayerToRemove(starter)}
                                className="p-2 rounded-lg text-[#7A8C80] hover:text-[#AC5B40] hover:bg-[#FBF0EC] border border-[#DDE6DF] hover:border-[#F2D2C6] transition flex items-center justify-center"
                                title="Dar de baja del partido"
                              >
                                <Trash2 className="w-4 h-4 text-[#AC5B40]" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SUBSTITUTES LIST */}
                  <div className="space-y-3 pt-4 border-t border-[#EEF3EF]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#222B25] flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#D48C70]" />
                        <span>Lista de Espera / Suplentes</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#FAF3E7] text-[#976C2F] text-xs font-bold font-mono border border-[#ECDDBF]">
                          {editSubstitutes.length}
                        </span>
                      </h4>
                      <span className="text-[11px] text-[#6B7C70]">
                        Orden de prioridad cronológico (el 1° asciende ante una baja)
                      </span>
                    </div>

                    {editSubstitutes.length === 0 ? (
                      <div className="p-4 text-center bg-[#F6F8F6] rounded-xl border border-dashed border-[#DDE6DF] text-xs text-[#6B7C70]">
                        No hay suplentes en lista de espera para este partido.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {editSubstitutes.map((sub, index) => (
                          <div
                            key={sub.id}
                            id={`roster-sub-${sub.id}`}
                            className="p-3 rounded-xl bg-white border border-[#E2EAE3] hover:border-[#CAD8CD] flex items-center justify-between gap-3 transition shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-5 text-center font-mono text-xs font-bold text-[#976C2F]">
                                S{index + 1}
                              </span>
                              <img
                                src={sub.userPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${sub.userId}`}
                                alt={sub.userName}
                                className="w-8 h-8 rounded-full bg-[#FAF3E7] border border-[#ECDDBF] object-cover shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#222B25] truncate max-w-[140px] sm:max-w-[180px]">
                                  {sub.userName}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {getTierBadge(sub.userScore)}
                                </div>
                              </div>
                            </div>

                            {/* Actions on substitute */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Promote to Starter */}
                              <button
                                id={`promote-player-${sub.id}`}
                                onClick={() => handleAdminChangeStatus(sub, 'starter')}
                                className="p-2 rounded-lg text-[#6B7C70] hover:text-[#3D6348] hover:bg-[#EAF1EC] border border-[#DDE6DF] transition flex items-center gap-1 text-xs"
                                title="Promover a Titular"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[10px]">A Titular</span>
                              </button>

                              {/* Remove Player */}
                              <button
                                id={`remove-sub-${sub.id}`}
                                onClick={() => setPlayerToRemove(sub)}
                                className="p-2 rounded-lg text-[#7A8C80] hover:text-[#AC5B40] hover:bg-[#FBF0EC] border border-[#DDE6DF] hover:border-[#F2D2C6] transition flex items-center justify-center"
                                title="Dar de baja de suplentes"
                              >
                                <Trash2 className="w-4 h-4 text-[#AC5B40]" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB 2: EDIT MATCH DETAILS */}
              {editModalTab === 'details' && (
                <form onSubmit={handleUpdateMatchDetails} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-[#45564A] font-semibold mb-1">Título del Partido</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Ej: Fútbol 5 - Viernes Noche"
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#45564A] font-semibold mb-1 text-xs">Fecha (dd/mm)</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          placeholder="DD/MM"
                          maxLength={5}
                          className="w-full px-3 py-2 pr-10 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D] font-mono tracking-wider"
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center text-[#7A8C80] hover:text-[#52795D] transition">
                          <Calendar className="w-4 h-4 pointer-events-none" />
                          <input
                            type="date"
                            tabIndex={-1}
                            onChange={(e) => {
                              if (e.target.value) {
                                const [year, month, day] = e.target.value.split('-');
                                setEditDate(`${day}/${month}`);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#45564A] font-semibold mb-1 text-xs">Hora</label>
                      <input
                        type="time"
                        required
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#45564A] font-semibold mb-1">Predio y Cancha</label>
                    <input
                      type="text"
                      required
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="Ej: Canchas Los Álamos - Pista 2"
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#45564A] font-semibold mb-1">Formato / Capacidad</label>
                      <select
                        value={editCapacity}
                        onChange={(e) => setEditCapacity(Number(e.target.value) as MatchCapacity)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                      >
                        <option value={10}>Fútbol 5 (10 jugadores)</option>
                        <option value={12}>Fútbol 6 (12 jugadores)</option>
                        <option value={14}>Fútbol 7 (14 jugadores)</option>
                        <option value={18}>Fútbol 9 (18 jugadores)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#45564A] font-semibold mb-1">Costo por Jugador ($)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={editCost}
                        onChange={(e) => setEditCost(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#45564A] font-semibold mb-1">Estado de Convocatoria</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as Match['status'])}
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                    >
                      <option value="phase_1_priority">🔥 Fase 1 (Prioridad 1 con ≥100 pts)</option>
                      <option value="phase_2_open">🟢 Fase 2 (Convocatoria Abierta)</option>
                      <option value="closed">🔒 Convocatoria Cerrada</option>
                      <option value="completed">🏁 Finalizado / Liquidado</option>
                      <option value="cancelled">❌ Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#45564A] font-semibold mb-1">Notas / Indicaciones</label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Detalles sobre vestuarios, camisetas, estacionamiento..."
                      className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-[#EEF3EF]">
                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="px-5 py-2.5 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-bold flex items-center gap-2 shadow-xs transition"
                    >
                      <Save className="w-4 h-4" />
                      <span>{loadingAction ? 'Guardando...' : 'Guardar Cambios del Partido'}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#EEF3EF] flex items-center justify-between bg-[#FAFBF9]">
              <span className="text-xs text-[#6B7C70]">
                Los cambios se reflejan en tiempo real para todos los participantes.
              </span>
              <button
                type="button"
                onClick={closeEditModal}
                className="px-5 py-2 rounded-xl bg-[#F1F5F2] hover:bg-[#E2EAE3] text-[#222B25] text-xs sm:text-sm font-semibold transition"
              >
                Cerrar Gestión
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE MATCH MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8E2] rounded-2xl w-full max-w-lg shadow-2xl p-6 text-[#222B25] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EEF3EF] pb-3 mb-4">
              <h3 className="text-lg font-bold text-[#222B25] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#52795D]" />
                Programar Nuevo Partido
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#6B7C70] hover:text-[#222B25]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-[#45564A] font-semibold mb-1">Título del Partido</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej: Fútbol 5 - Viernes Noche"
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#45564A] font-semibold mb-1 text-xs">Fecha (dd/mm)</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      placeholder="DD/MM"
                      maxLength={5}
                      className="w-full px-3 py-2 pr-10 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D] font-mono tracking-wider"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center text-[#7A8C80] hover:text-[#52795D] transition">
                      <Calendar className="w-4 h-4 pointer-events-none" />
                      <input
                        type="date"
                        tabIndex={-1}
                        onChange={(e) => {
                          if (e.target.value) {
                            const [year, month, day] = e.target.value.split('-');
                            setFormDate(`${day}/${month}`);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[#45564A] font-semibold mb-1 text-xs">Hora</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#45564A] font-semibold mb-1">Predio y Cancha</label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ej: Canchas Los Álamos - Pista 2"
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#45564A] font-semibold mb-1">Formato / Capacidad</label>
                  <select
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value) as MatchCapacity)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                  >
                    <option value={10}>Fútbol 5 (10 jugadores)</option>
                    <option value={12}>Fútbol 6 (12 jugadores)</option>
                    <option value={14}>Fútbol 7 (14 jugadores)</option>
                    <option value={18}>Fútbol 9 (18 jugadores)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#45564A] font-semibold mb-1">Costo por Jugador ($)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#45564A] font-semibold mb-1">Fase Inicial</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as Match['status'])}
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                >
                  <option value="phase_1_priority">🔥 Fase 1 (Prioridad 1 con ≥100 pts)</option>
                  <option value="phase_2_open">🟢 Fase 2 (Convocatoria Abierta para todos)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#45564A] font-semibold mb-1">Notas / Indicaciones</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Detalles sobre vestuarios, camisetas, estacionamiento..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#EEF3EF]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F1F5F2] text-[#45564A] font-semibold hover:bg-[#E2EAE3]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-bold flex items-center gap-2 shadow-xs transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{loadingAction ? 'Creando...' : 'Crear Partido'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: POST-MATCH SETTLEMENT (LIQUIDACIÓN Y RECALCULO)   */}
      {/* ======================================================== */}
      {activeSettleMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8E2] rounded-2xl w-full max-w-4xl shadow-2xl text-[#222B25] max-h-[94vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-[#EEF3EF] flex items-center justify-between bg-[#FAFBF9]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF1EC] text-[#3D6348] font-bold text-xs border border-[#CDE0D2]">
                  LIQUIDACIÓN FINAL DE PARTIDO
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#222B25] mt-1">
                  {activeSettleMatch.title || 'Evaluación de Asistencia y Puntajes'}
                </h3>
                <p className="text-xs text-[#6B7C70] mt-0.5">
                  Marca asistencia, puntualidad, pago y penalizaciones. Al finalizar, el sistema recalculará los puntajes y tiers automáticamente.
                </p>
              </div>

              <button 
                onClick={() => {
                  setActiveSettleMatch(null);
                  onCloseSettleModal();
                }} 
                className="p-2 text-[#6B7C70] hover:text-[#222B25] rounded-lg hover:bg-[#F1F5F2] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {settleRegistrations.length === 0 ? (
                <div className="p-8 text-center bg-[#F6F8F6] rounded-xl border border-dashed border-[#DDE6DF] text-[#6B7C70]">
                  No se encontraron jugadores registrados en este partido para liquidar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E0E7E1] text-[#5C6E62] font-bold uppercase text-[10px] tracking-wider bg-[#F1F5F2]">
                        <th className="py-2.5 px-3">Jugador</th>
                        <th className="py-2.5 px-2 text-center">Rol</th>
                        <th className="py-2.5 px-2 text-center">Asistió (+1)</th>
                        <th className="py-2.5 px-2 text-center">Puntual (+1)</th>
                        <th className="py-2.5 px-2 text-center">Pagó (+1)</th>
                        <th className="py-2.5 px-3">Penalización</th>
                        <th className="py-2.5 px-3 text-right">Variación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF3EF]">
                      {settleRegistrations.map((reg) => {
                        const ev = evaluations[reg.userId] || {
                          attended: false,
                          onTime: false,
                          paid: false,
                          penaltyType: 'none' as PenaltyType,
                        };
                        const delta = calculateDeltaScore(ev.attended, ev.onTime, ev.paid, ev.penaltyType);

                        return (
                          <tr key={reg.id} className="hover:bg-[#F6F8F6] transition">
                            {/* Player info */}
                            <td className="py-3 px-3 font-semibold text-[#222B25]">
                              <div className="flex items-center gap-2">
                                <img 
                                  src={reg.userPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${reg.userId}`} 
                                  alt={reg.userName}
                                  className="w-7 h-7 rounded-full bg-[#EAF1EC] border border-[#DDE6DF]"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <span className="block truncate max-w-[140px] font-bold">{reg.userName}</span>
                                  <span className="text-[10px] text-[#6B7C70] font-mono">Score actual: {reg.userScore} pts</span>
                                </div>
                              </div>
                            </td>

                            {/* Starter / Sub */}
                            <td className="py-3 px-2 text-center">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                                reg.status === 'starter' 
                                  ? 'bg-[#EAF1EC] text-[#3D6348] border-[#CDE0D2]' 
                                  : 'bg-[#FAF3E7] text-[#976C2F] border-[#ECDDBF]'
                              }`}>
                                {reg.status === 'starter' ? 'Titular' : 'Suplente'}
                              </span>
                            </td>

                            {/* Attended checkbox */}
                            <td className="py-3 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={ev.attended}
                                onChange={(e) => {
                                  updatePlayerEval(reg.userId, 'attended', e.target.checked);
                                  if (!e.target.checked) {
                                    updatePlayerEval(reg.userId, 'onTime', false);
                                  }
                                }}
                                className="w-4 h-4 rounded text-[#52795D] focus:ring-[#52795D] bg-white border-[#DDE6DF] cursor-pointer"
                              />
                            </td>

                            {/* On-Time checkbox */}
                            <td className="py-3 px-2 text-center">
                              <input
                                type="checkbox"
                                disabled={!ev.attended}
                                checked={ev.onTime}
                                onChange={(e) => updatePlayerEval(reg.userId, 'onTime', e.target.checked)}
                                className="w-4 h-4 rounded text-[#52795D] focus:ring-[#52795D] bg-white border-[#DDE6DF] cursor-pointer disabled:opacity-30"
                              />
                            </td>

                            {/* Paid checkbox */}
                            <td className="py-3 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={ev.paid}
                                onChange={(e) => updatePlayerEval(reg.userId, 'paid', e.target.checked)}
                                className="w-4 h-4 rounded text-[#52795D] focus:ring-[#52795D] bg-white border-[#DDE6DF] cursor-pointer"
                              />
                            </td>

                            {/* Penalty select */}
                            <td className="py-3 px-3">
                              <select
                                value={ev.penaltyType}
                                onChange={(e) => {
                                  const pType = e.target.value as PenaltyType;
                                  updatePlayerEval(reg.userId, 'penaltyType', pType);
                                  if (pType === 'no_show') {
                                    updatePlayerEval(reg.userId, 'attended', false);
                                    updatePlayerEval(reg.userId, 'onTime', false);
                                  } else if (pType === 'late') {
                                    updatePlayerEval(reg.userId, 'onTime', false);
                                  }
                                }}
                                className="px-2 py-1 rounded-lg bg-white border border-[#DDE6DF] text-xs text-[#222B25]"
                              >
                                <option value="none">Ninguna / Normal</option>
                                <option value="late">Llegó tarde (-3 pts)</option>
                                <option value="late_cancellation">Baja sobre la hora (-10 pts)</option>
                                <option value="no_show">Falta sin aviso / No-Show (-25 pts)</option>
                                <option value="debt">Deuda impaga (-5 pts)</option>
                              </select>
                            </td>

                            {/* Delta Score Preview */}
                            <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                              <span className={delta > 0 ? 'text-[#3D6348]' : delta < 0 ? 'text-[#AC5B40]' : 'text-[#7A8C80]'}>
                                {delta > 0 ? `+${delta}` : delta} pts
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-[#EEF3EF] flex flex-wrap items-center justify-between gap-3 bg-[#FAFBF9]">
              <div className="text-xs text-[#6B7C70]">
                Se actualizarán <strong className="text-[#222B25]">{settleRegistrations.length}</strong> perfiles en Firestore.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSettleMatch(null);
                    onCloseSettleModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F1F5F2] text-[#45564A] font-semibold text-xs sm:text-sm hover:bg-[#E2EAE3]"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={loadingAction || settleRegistrations.length === 0}
                  onClick={handleExecuteSettlement}
                  className="px-6 py-2.5 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-extrabold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4 text-[#D48C70]" />
                  {loadingAction ? 'Procesando Liquidación...' : 'Finalizar Partido y Recalcular Scores'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* IN-APP CONFIRMATION MODAL: DELETE MATCH                   */}
      {/* ======================================================== */}
      {matchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8E2] rounded-2xl w-full max-w-md shadow-2xl p-6 text-[#222B25] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-[#AC5B40] mb-3">
              <div className="p-2.5 rounded-xl bg-[#FBF0EC] border border-[#F2D2C6]">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#222B25]">¿Eliminar este partido?</h3>
            </div>

            <p className="text-sm text-[#45564A] mb-2">
              Estás a punto de eliminar <strong className="text-[#222B25]">{matchToDelete.title || 'el partido'}</strong>.
            </p>
            <p className="text-xs text-[#6B7C70] mb-6">
              Esta acción dará de baja automáticamente a todos los jugadores inscriptos y no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMatchToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F2] hover:bg-[#E2EAE3] text-[#45564A] font-semibold text-xs sm:text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-match"
                onClick={executeDeleteMatch}
                disabled={loadingAction}
                className="px-5 py-2 rounded-xl bg-[#AC5B40] hover:bg-[#964E35] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{loadingAction ? 'Eliminando...' : 'Sí, Eliminar Partido'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* IN-APP CONFIRMATION MODAL: REMOVE PLAYER FROM ROSTER     */}
      {/* ======================================================== */}
      {playerToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8E2] rounded-2xl w-full max-w-md shadow-2xl p-6 text-[#222B25] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-[#AC5B40] mb-3">
              <div className="p-2.5 rounded-xl bg-[#FBF0EC] border border-[#F2D2C6]">
                <UserX className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#222B25]">¿Dar de baja al jugador?</h3>
            </div>

            <p className="text-sm text-[#45564A] mb-2">
              ¿Confirmas que deseas remover a <strong className="text-[#222B25]">{playerToRemove.userName}</strong> de este partido?
            </p>
            {playerToRemove.status === 'starter' && (
              <div className="p-3 rounded-xl bg-[#EAF1EC] border border-[#CDE0D2] text-xs text-[#3D6348] mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-[#D48C70]" />
                <span>El 1° suplente en lista de espera subirá automáticamente a Titular.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setPlayerToRemove(null)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F2] hover:bg-[#E2EAE3] text-[#45564A] font-semibold text-xs sm:text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-remove-player"
                onClick={executeAdminRemovePlayer}
                disabled={loadingAction}
                className="px-5 py-2 rounded-xl bg-[#AC5B40] hover:bg-[#964E35] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{loadingAction ? 'Removiendo...' : 'Dar de Baja'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* IN-APP CONFIRMATION MODAL: LOAD DEMO DATA                */}
      {/* ======================================================== */}
      {showSeedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8E2] rounded-2xl w-full max-w-md shadow-2xl p-6 text-[#222B25] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-[#52795D] mb-3">
              <div className="p-2.5 rounded-xl bg-[#EAF1EC] border border-[#CDE0D2]">
                <Database className="w-6 h-6 text-[#52795D]" />
              </div>
              <h3 className="text-lg font-bold text-[#222B25]">¿Cargar datos de prueba?</h3>
            </div>

            <p className="text-sm text-[#45564A] mb-4">
              Esto creará partidos de demostración y perfiles de jugadores en la base de datos Firestore.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSeedConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F2] hover:bg-[#E2EAE3] text-[#45564A] font-semibold text-xs sm:text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-seed-demo"
                onClick={executeSeedDemoData}
                disabled={seedLoading}
                className="px-5 py-2 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2"
              >
                <Database className="w-4 h-4 text-[#D48C70]" />
                <span>{seedLoading ? 'Cargando...' : 'Cargar Datos Demo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PLAYER CREATION & PLANTEL MANAGEMENT              */}
      {/* ======================================================== */}
      {showPlayersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8E2] rounded-2xl w-full max-w-2xl shadow-2xl text-[#222B25] max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-[#EEF3EF] flex items-center justify-between bg-[#FAFBF9]">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF1EC] text-[#3D6348] font-bold text-xs border border-[#CDE0D2]">
                  GESTIÓN Y ALTA DE JUGADORES
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#222B25] mt-1 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#52795D]" />
                  Crear Jugadores y Plantel Real
                </h3>
                <p className="text-xs text-[#6B7C70] mt-0.5">
                  Carga jugadores reales para administrarlos, anotarlos en partidos y gestionar sus prioridades.
                </p>
              </div>

              <button 
                onClick={() => setShowPlayersModal(false)} 
                className="p-2 text-[#6B7C70] hover:text-[#222B25] rounded-lg hover:bg-[#F1F5F2] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-[#EEF3EF] px-4 sm:px-6 bg-[#F6F8F6]">
              <button
                type="button"
                onClick={() => setPlayersModalTab('single')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                  playersModalTab === 'single'
                    ? 'border-[#52795D] text-[#3D6348] bg-white'
                    : 'border-transparent text-[#6B7C70] hover:text-[#222B25]'
                }`}
              >
                Crear Jugador (Individual)
              </button>
              <button
                type="button"
                onClick={() => setPlayersModalTab('bulk')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                  playersModalTab === 'bulk'
                    ? 'border-[#52795D] text-[#3D6348] bg-white'
                    : 'border-transparent text-[#6B7C70] hover:text-[#222B25]'
                }`}
              >
                Carga Rápida en Lote
              </button>
              <button
                type="button"
                onClick={() => setPlayersModalTab('list')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                  playersModalTab === 'list'
                    ? 'border-[#52795D] text-[#3D6348] bg-white'
                    : 'border-transparent text-[#6B7C70] hover:text-[#222B25]'
                }`}
              >
                Plantel del Club ({allClubUsers.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* TAB 1: CREAR JUGADOR INDIVIDUAL */}
              {playersModalTab === 'single' && (
                <form onSubmit={handleCreateSinglePlayer} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-[#45564A] font-semibold mb-1">
                      Nombre y Apellido <span className="text-[#AC5B40]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Ej: Santiago López"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#45564A] font-semibold mb-1">
                        Teléfono / WhatsApp (Opcional)
                      </label>
                      <input
                        type="text"
                        value={newPlayerPhone}
                        onChange={(e) => setNewPlayerPhone(e.target.value)}
                        placeholder="Ej: +54 9 11 4444-5555"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#45564A] font-semibold mb-1">
                        Posición Habitual
                      </label>
                      <select
                        value={newPlayerPosition}
                        onChange={(e) => setNewPlayerPosition(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                      >
                        <option value="Polifuncional">Polifuncional</option>
                        <option value="Arquero">Arquero</option>
                        <option value="Defensor">Defensor</option>
                        <option value="Mediocampista">Mediocampista</option>
                        <option value="Delantero">Delantero</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#45564A] font-semibold mb-1">
                        Email (Opcional)
                      </label>
                      <input
                        type="email"
                        value={newPlayerEmail}
                        onChange={(e) => setNewPlayerEmail(e.target.value)}
                        placeholder="santiago@ejemplo.com"
                        className="w-full px-3 py-2.5 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#45564A] font-semibold mb-1">
                        Rol en la Aplicación
                      </label>
                      <select
                        value={newPlayerRole}
                        onChange={(e) => setNewPlayerRole(e.target.value as 'player' | 'admin')}
                        className="w-full px-3 py-2.5 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D]"
                      >
                        <option value="player">Jugador Regular</option>
                        <option value="admin">Administrador / DT</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#45564A] font-semibold mb-1">
                      Puntaje Inicial de Partida
                    </label>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {[
                        { score: 100, label: '100 pts (Prioridad 1 · Estándar)' },
                        { score: 110, label: '110 pts (Prioridad 1 · Plus)' },
                        { score: 85, label: '85 pts (Prioridad 2)' },
                        { score: 70, label: '70 pts (Prioridad 3)' },
                      ].map((preset) => (
                        <button
                          key={preset.score}
                          type="button"
                          onClick={() => setNewPlayerScore(preset.score)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            newPlayerScore === preset.score
                              ? 'bg-[#EAF1EC] text-[#3D6348] border-[#CDE0D2] font-bold shadow-2xs'
                              : 'bg-[#F6F8F6] text-[#6B7C70] border-[#DDE6DF] hover:bg-[#EEF3EF]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      value={newPlayerScore}
                      onChange={(e) => setNewPlayerScore(Number(e.target.value))}
                      className="w-36 px-3 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] font-mono font-bold focus:outline-none focus:border-[#52795D]"
                    />
                    <span className="text-xs text-[#6B7C70] ml-3">
                      Nivel asignado: <strong>{calculateTier(newPlayerScore)}</strong>
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#EEF3EF] flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPlayersModal(false)}
                      className="px-4 py-2 rounded-xl bg-[#F1F5F2] hover:bg-[#E2EAE3] text-[#45564A] font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loadingAction}
                      className="px-6 py-2.5 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-bold flex items-center gap-2 shadow-xs transition"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{loadingAction ? 'Creando...' : 'Guardar y Crear Jugador'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: CARGA RÁPIDA EN LOTE */}
              {playersModalTab === 'bulk' && (
                <form onSubmit={handleCreateBulkPlayers} className="space-y-4 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-[#EAF1EC] border border-[#CDE0D2] text-[#3D6348] text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#D48C70]" />
                      Importación rápida de plantel
                    </p>
                    <p className="text-[11px] text-[#45564A]">
                      Pega la lista de tus jugadores (un nombre por línea o separados por comas). Se generarán automáticamente los perfiles listos para convocar.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#45564A] font-semibold mb-1">
                      Nombres de Jugadores
                    </label>
                    <textarea
                      rows={7}
                      required
                      value={bulkPlayersText}
                      onChange={(e) => setBulkPlayersText(e.target.value)}
                      placeholder={"Martín López\nLucas Rossi\nGonzalo Morales\nFederico Romero\nJuan Pablo Pérez"}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] focus:outline-none focus:border-[#52795D] font-sans"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-[#45564A] font-semibold text-xs">Puntaje base para todos:</label>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={bulkDefaultScore}
                        onChange={(e) => setBulkDefaultScore(Number(e.target.value))}
                        className="w-24 px-2.5 py-1.5 rounded-lg bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] font-mono font-bold text-xs"
                      />
                      <span className="text-xs text-[#6B7C70]">({calculateTier(bulkDefaultScore)})</span>
                    </div>

                    <div className="text-xs font-semibold text-[#52795D]">
                      {bulkPlayersText.split(/[\n,]+/).map(l => l.trim()).filter(Boolean).length} jugadores detectados
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EEF3EF] flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPlayersModal(false)}
                      className="px-4 py-2 rounded-xl bg-[#F1F5F2] hover:bg-[#E2EAE3] text-[#45564A] font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loadingAction || !bulkPlayersText.trim()}
                      className="px-6 py-2.5 rounded-xl bg-[#52795D] hover:bg-[#45684F] text-white font-bold flex items-center gap-2 shadow-xs transition"
                    >
                      <Users className="w-4 h-4" />
                      <span>{loadingAction ? 'Cargando Lote...' : 'Crear Todos los Jugadores'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: PLANTEL DEL CLUB / JUGADORES EXISTENTES */}
              {playersModalTab === 'list' && (
                <div className="space-y-3">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#8D9B91] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={plantelSearchQuery}
                      onChange={(e) => setPlantelSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre, teléfono o posición..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F6F8F6] border border-[#DDE6DF] text-[#222B25] text-xs focus:outline-none focus:border-[#52795D]"
                    />
                  </div>

                  {/* Players list */}
                  {filteredClubUsers.length === 0 ? (
                    <div className="p-8 text-center bg-[#F6F8F6] rounded-xl border border-dashed border-[#DDE6DF] text-[#6B7C70] text-xs">
                      No se encontraron jugadores registrados con ese criterio.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#EEF3EF] max-h-[50vh] overflow-y-auto pr-1">
                      {filteredClubUsers.map((user) => (
                        <div key={user.uid} className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#F6F8F6] px-2 rounded-xl transition">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                              alt={user.name}
                              className="w-8 h-8 rounded-full bg-[#EAF1EC] border border-[#DDE6DF] shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#222B25] text-xs truncate">{user.name}</span>
                                {user.role === 'admin' && (
                                  <span className="px-1.5 py-0.2 rounded bg-[#EAF1EC] text-[#3D6348] text-[9px] font-bold border border-[#CDE0D2]">
                                    DT / Admin
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-[#6B7C70] mt-0.5">
                                {user.phone && <span>📞 {user.phone}</span>}
                                {user.position && <span className="text-[#52795D]">· {user.position}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {getTierBadge(user.score ?? 100)}

                            {/* Quick score adjusters */}
                            <div className="flex items-center gap-1 bg-[#F1F5F2] p-0.5 rounded-lg border border-[#E0E7E1]">
                              <button
                                type="button"
                                onClick={() => handleQuickAdjustScore(user, -5)}
                                className="px-1.5 py-0.5 text-[10px] font-bold text-[#AC5B40] hover:bg-white rounded transition"
                                title="Restar 5 puntos"
                              >
                                -5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjustScore(user, 5)}
                                className="px-1.5 py-0.5 text-[10px] font-bold text-[#3D6348] hover:bg-white rounded transition"
                                title="Sumar 5 puntos"
                              >
                                +5
                              </button>
                            </div>

                            {/* Delete player button */}
                            <button
                              type="button"
                              onClick={() => setPlayerToDeleteFromClub(user)}
                              className="p-1.5 text-[#AC5B40] hover:bg-[#FBF0EC] rounded-lg transition"
                              title="Eliminar jugador del club"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#EEF3EF] flex items-center justify-between bg-[#FAFBF9]">
              <span className="text-xs text-[#6B7C70]">
                {allClubUsers.length} jugadores en el club.
              </span>
              <button
                type="button"
                onClick={() => setShowPlayersModal(false)}
                className="px-5 py-2 rounded-xl bg-[#F1F5F2] hover:bg-[#E2EAE3] text-[#222B25] text-xs sm:text-sm font-semibold transition"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* IN-APP CONFIRMATION: DELETE PLAYER FROM CLUB             */}
      {/* ======================================================== */}
      {playerToDeleteFromClub && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E2E8E2] rounded-2xl w-full max-w-md shadow-2xl p-6 text-[#222B25] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-[#AC5B40] mb-3">
              <div className="p-2.5 rounded-xl bg-[#FBF0EC] border border-[#F2D2C6]">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#222B25]">¿Eliminar jugador del club?</h3>
            </div>

            <p className="text-sm text-[#45564A] mb-2">
              Estás a punto de eliminar a <strong className="text-[#222B25]">{playerToDeleteFromClub.name}</strong> del registro del club.
            </p>
            <p className="text-xs text-[#6B7C70] mb-6">
              Se eliminará su historial, puntajes y registros en partidos. Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPlayerToDeleteFromClub(null)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F2] hover:bg-[#E2EAE3] text-[#45564A] font-semibold text-xs sm:text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDeletePlayerFromClub}
                disabled={loadingAction}
                className="px-5 py-2 rounded-xl bg-[#AC5B40] hover:bg-[#964E35] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{loadingAction ? 'Eliminando...' : 'Sí, Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
