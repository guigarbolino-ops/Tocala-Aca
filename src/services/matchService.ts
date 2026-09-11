import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Match, 
  Registration, 
  UserProfile, 
  Evaluation, 
  calculateTier, 
  calculateDeltaScore 
} from '../types';

export const matchService = {
  // Subscribe to all matches
  subscribeMatches(callback: (matches: Match[]) => void) {
    const q = query(collection(db, 'matches'), orderBy('dateTime', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const matches: Match[] = [];
      snapshot.forEach((doc) => {
        matches.push({ id: doc.id, ...doc.data() } as Match);
      });
      callback(matches);
    }, (error) => {
      console.error("Error fetching matches:", error);
    });
  },

  // Subscribe to registrations for a match
  subscribeRegistrations(matchId: string, callback: (registrations: Registration[]) => void) {
    const q = query(
      collection(db, 'registrations'), 
      where('matchId', '==', matchId)
    );
    return onSnapshot(q, (snapshot) => {
      const list: Registration[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Registration);
      });
      // Sort in memory by registeredAt
      list.sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
      callback(list);
    }, (error) => {
      console.error("Error fetching registrations:", error);
    });
  },

  // Subscribe to all players for leaderboard
  subscribeLeaderboard(callback: (users: UserProfile[]) => void) {
    const q = query(collection(db, 'users'), orderBy('score', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        users.push({
          ...data,
          tier: calculateTier(data.score ?? 100),
        });
      });
      callback(users);
    }, (error) => {
      console.error("Error fetching leaderboard:", error);
    });
  },

  // Create real player / user profile
  async createPlayer(playerData: {
    name: string;
    email?: string;
    phone?: string;
    position?: string;
    score?: number;
    role?: 'player' | 'admin';
  }): Promise<string> {
    const cleanName = playerData.name.trim();
    const uid = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const score = playerData.score !== undefined ? playerData.score : 100;
    const email = playerData.email?.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}_${Math.random().toString(36).substring(2, 5)}@futbolamateur.app`;
    
    const newUser: UserProfile = {
      uid,
      name: cleanName,
      email,
      phone: playerData.phone?.trim() || '',
      position: playerData.position?.trim() || '',
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
      role: playerData.role || 'player',
      score,
      tier: calculateTier(score),
      stats: {
        played: 0,
        late: 0,
        noShows: 0,
        debts: 0,
        onTime: 0,
        paidOnTime: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', uid), newUser);
    return uid;
  },

  // Bulk create real players from raw names / list
  async createMultiplePlayers(
    playersList: Array<{ name: string; score?: number; role?: 'player' | 'admin'; phone?: string }>,
    defaultScore: number = 100
  ): Promise<number> {
    if (!playersList.length) return 0;
    const batch = writeBatch(db);
    let count = 0;

    for (const p of playersList) {
      const cleanName = p.name.trim();
      if (!cleanName) continue;

      const uid = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${count}`;
      const score = p.score !== undefined ? p.score : defaultScore;
      const email = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}_${Math.random().toString(36).substring(2, 5)}@futbolamateur.app`;

      const newUser: UserProfile = {
        uid,
        name: cleanName,
        email,
        phone: p.phone?.trim() || '',
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
        role: p.role || 'player',
        score,
        tier: calculateTier(score),
        stats: {
          played: 0,
          late: 0,
          noShows: 0,
          debts: 0,
          onTime: 0,
          paidOnTime: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      batch.set(doc(db, 'users', uid), newUser);
      count++;
    }

    await batch.commit();
    return count;
  },

  // Update existing player details
  async updatePlayer(userId: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const updatePayload: any = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    if (data.score !== undefined) {
      updatePayload.tier = calculateTier(data.score);
    }
    await updateDoc(userRef, updatePayload);
  },

  // Delete player from club
  async deletePlayer(userId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId));
    // Clean up any registrations for this user
    try {
      const q = query(collection(db, 'registrations'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.warn("Could not clean registrations for deleted user:", err);
    }
  },

  // Create match
  async createMatch(matchData: Omit<Match, 'id' | 'createdAt'>): Promise<string> {
    const matchId = `match_${Date.now()}`;
    const newMatch: Match = {
      ...matchData,
      id: matchId,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'matches', matchId), newMatch);
    return matchId;
  },

  // Update full match details
  async updateMatch(matchId: string, matchData: Partial<Match>): Promise<void> {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, matchData);
  },

  // Update match status (e.g. switch between Phase 1 and Phase 2)
  async updateMatchStatus(matchId: string, status: Match['status']): Promise<void> {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, { status });
  },

  // Delete match and its registrations
  async deleteMatch(matchId: string): Promise<void> {
    await deleteDoc(doc(db, 'matches', matchId));
    // Also cleanup registrations for this match
    try {
      const q = query(collection(db, 'registrations'), where('matchId', '==', matchId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error("Error cleaning up registrations on match delete:", e);
    }
  },

  // ADMIN: Add any registered user directly to a match with full override power
  async adminAddPlayerToMatch(
    matchId: string, 
    user: { uid: string; name: string; email?: string; photoURL?: string; score?: number },
    status: 'starter' | 'substitute' = 'starter',
    paid: boolean = false
  ): Promise<void> {
    const regId = `${matchId}_${user.uid}`;
    const regRef = doc(db, 'registrations', regId);
    const score = user.score ?? 100;

    const registrationData: Registration = {
      id: regId,
      matchId,
      userId: user.uid,
      userName: user.name,
      userEmail: user.email || '',
      userPhoto: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      userScore: score,
      userTier: calculateTier(score),
      registeredAt: new Date().toISOString(),
      status,
      cancellationTime: null,
      paid,
    };

    await setDoc(regRef, registrationData);
  },

  // ADMIN: Add a guest player (invitado) without an existing account
  async adminAddGuestPlayer(
    matchId: string,
    guestName: string,
    status: 'starter' | 'substitute' = 'starter',
    paid: boolean = false
  ): Promise<void> {
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const regId = `${matchId}_${guestId}`;
    const regRef = doc(db, 'registrations', regId);

    const registrationData: Registration = {
      id: regId,
      matchId,
      userId: guestId,
      userName: `${guestName.trim()} (Invitado)`,
      userEmail: 'invitado@futbolamateur.app',
      userPhoto: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
      userScore: 100,
      userTier: 'Prioridad 1',
      registeredAt: new Date().toISOString(),
      status,
      cancellationTime: null,
      paid,
    };

    await setDoc(regRef, registrationData);
  },

  // ADMIN: Change player status (Starter <-> Substitute)
  async adminChangePlayerStatus(regId: string, newStatus: 'starter' | 'substitute'): Promise<void> {
    const regRef = doc(db, 'registrations', regId);
    await updateDoc(regRef, {
      status: newStatus,
      cancellationTime: null,
    });
  },

  // ADMIN: Toggle player payment status
  async adminTogglePayment(regId: string, paid: boolean): Promise<void> {
    const regRef = doc(db, 'registrations', regId);
    await updateDoc(regRef, { paid });
  },

  // ADMIN: Remove / Unregister player with optional automatic replacement
  async adminRemovePlayer(
    matchId: string, 
    regId: string, 
    promoteNextSub: boolean = false
  ): Promise<{ promotedPlayerName?: string }> {
    const regRef = doc(db, 'registrations', regId);
    const regSnap = await getDoc(regRef);

    if (!regSnap.exists()) return {};

    const regData = regSnap.data() as Registration;
    const wasStarter = regData.status === 'starter';

    // Delete or mark as cancelled
    await deleteDoc(regRef);

    let promotedPlayerName: string | undefined = undefined;

    if (wasStarter && promoteNextSub) {
      const q = query(
        collection(db, 'registrations'),
        where('matchId', '==', matchId),
        where('status', '==', 'substitute')
      );
      const subSnap = await getDocs(q);
      const activeSubs: Registration[] = [];
      subSnap.forEach((d) => activeSubs.push(d.data() as Registration));
      activeSubs.sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());

      if (activeSubs.length > 0) {
        const nextInLine = activeSubs[0];
        const nextRef = doc(db, 'registrations', nextInLine.id);
        await updateDoc(nextRef, { status: 'starter' });
        promotedPlayerName = nextInLine.userName;
      }
    }

    return { promotedPlayerName };
  },

  // Register user for a match
  async registerForMatch(
    match: Match, 
    user: UserProfile
  ): Promise<{ success: boolean; status: 'starter' | 'substitute'; message: string }> {
    const regId = `${match.id}_${user.uid}`;
    const regRef = doc(db, 'registrations', regId);

    // 1. Check if user already registered
    const existingSnap = await getDoc(regRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as Registration;
      if (existingData.status !== 'cancelled') {
        return {
          success: false,
          status: existingData.status,
          message: `Ya estás inscripto como ${existingData.status === 'starter' ? 'Titular' : 'Suplente'}.`,
        };
      }
    }

    // 2. Fetch all current active registrations for this match
    const q = query(
      collection(db, 'registrations'),
      where('matchId', '==', match.id),
      where('status', '==', 'starter')
    );
    const starterSnap = await getDocs(q);
    const currentStartersCount = starterSnap.size;

    let assignedStatus: 'starter' | 'substitute' = 'substitute';

    // 3. Apply phase & capacity rules
    if (match.status === 'phase_1_priority') {
      // Phase 1: Only score >= 100 (Prioridad 1) can be starters
      if (user.score >= 100) {
        if (currentStartersCount < match.capacity) {
          assignedStatus = 'starter';
        } else {
          assignedStatus = 'substitute';
        }
      } else {
        // User is not Priority 1 (<100 score) during Phase 1
        // They are enrolled as substitute on waitlist
        assignedStatus = 'substitute';
      }
    } else if (match.status === 'phase_2_open') {
      // Phase 2: Open to all tiers by arrival order
      if (currentStartersCount < match.capacity) {
        assignedStatus = 'starter';
      } else {
        assignedStatus = 'substitute';
      }
    } else {
      return {
        success: false,
        status: 'substitute',
        message: 'La convocatoria para este partido no está abierta actualmente.',
      };
    }

    const registrationData: Registration = {
      id: regId,
      matchId: match.id,
      userId: user.uid,
      userName: user.name,
      userEmail: user.email,
      userPhoto: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      userScore: user.score,
      userTier: calculateTier(user.score),
      registeredAt: new Date().toISOString(),
      status: assignedStatus,
      cancellationTime: null,
      paid: false,
    };

    await setDoc(regRef, registrationData);

    const message = assignedStatus === 'starter'
      ? '¡Excelente! Quedaste inscripto como TITULAR.'
      : match.status === 'phase_1_priority' && user.score < 100
        ? 'Inscripto en LISTA DE ESPERA (Fase 1 exclusiva para Prioridad 1 con 100+ pts).'
        : 'Cupo completo. Quedaste como 1° SUPLENTE en lista de espera.';

    return {
      success: true,
      status: assignedStatus,
      message,
    };
  },

  // Cancel registration with Automatic Replacement Algorithm
  async cancelRegistration(
    match: Match, 
    userId: string
  ): Promise<{ success: boolean; promotedPlayerName?: string }> {
    const regId = `${match.id}_${userId}`;
    const regRef = doc(db, 'registrations', regId);
    const regSnap = await getDoc(regRef);

    if (!regSnap.exists()) {
      return { success: false };
    }

    const currentReg = regSnap.data() as Registration;
    const wasStarter = currentReg.status === 'starter';

    // Mark current registration as cancelled
    await updateDoc(regRef, {
      status: 'cancelled',
      cancellationTime: new Date().toISOString(),
    });

    let promotedPlayerName: string | undefined = undefined;

    // Automatic replacement: if a starter leaves, promote the first substitute
    if (wasStarter) {
      const q = query(
        collection(db, 'registrations'),
        where('matchId', '==', match.id),
        where('status', '==', 'substitute')
      );
      const subSnap = await getDocs(q);
      const activeSubs: Registration[] = [];
      subSnap.forEach((d) => activeSubs.push(d.data() as Registration));

      // Sort by registeredAt ascending (first come, first served)
      activeSubs.sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());

      if (activeSubs.length > 0) {
        const nextInLine = activeSubs[0];
        const nextRef = doc(db, 'registrations', nextInLine.id);
        await updateDoc(nextRef, {
          status: 'starter',
        });
        promotedPlayerName = nextInLine.userName;
      }
    }

    return {
      success: true,
      promotedPlayerName,
    };
  },

  // 1-Click Post-Match Settlement & Batch Score Recalculation
  async settleMatch(
    match: Match,
    evaluations: Evaluation[],
    adminUid: string
  ): Promise<{ success: boolean; count: number }> {
    const batch = writeBatch(db);

    // 1. Mark match as completed
    const matchRef = doc(db, 'matches', match.id);
    batch.update(matchRef, {
      status: 'completed',
    });

    // 2. Process each player evaluation
    for (const ev of evaluations) {
      const evalId = `${match.id}_${ev.userId}`;
      const evalRef = doc(db, 'evaluations', evalId);
      
      const fullEvaluation: Evaluation = {
        ...ev,
        id: evalId,
        matchId: match.id,
        evaluatedAt: new Date().toISOString(),
        evaluatedBy: adminUid,
      };

      batch.set(evalRef, fullEvaluation);

      // Update user doc
      const userRef = doc(db, 'users', ev.userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        const currentScore = userData.score ?? 100;
        const newScore = Math.max(0, currentScore + ev.deltaScore);
        const newTier = calculateTier(newScore);

        const currentStats = userData.stats || {
          played: 0,
          late: 0,
          noShows: 0,
          debts: 0,
          onTime: 0,
          paidOnTime: 0,
        };

        const updatedStats = {
          played: (currentStats.played || 0) + (ev.attended ? 1 : 0),
          late: (currentStats.late || 0) + (ev.penaltyType === 'late' || (!ev.onTime && ev.attended) ? 1 : 0),
          noShows: (currentStats.noShows || 0) + (ev.penaltyType === 'no_show' ? 1 : 0),
          debts: (currentStats.debts || 0) + (!ev.paid || ev.penaltyType === 'debt' ? 1 : 0),
          onTime: (currentStats.onTime || 0) + (ev.attended && ev.onTime ? 1 : 0),
          paidOnTime: (currentStats.paidOnTime || 0) + (ev.paid ? 1 : 0),
        };

        batch.update(userRef, {
          score: newScore,
          tier: newTier,
          stats: updatedStats,
          updatedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
    return { success: true, count: evaluations.length };
  },

  // Seed realistic demo data for immediate testing
  async seedInitialDemoData(): Promise<void> {
    const batch = writeBatch(db);

    // 1. Seed demo players with various score tiers
    const samplePlayers: Array<{ uid: string; name: string; email: string; score: number; role: 'admin' | 'player'; stats: any }> = [
      {
        uid: 'player_messi',
        name: 'Lionel Messi',
        email: 'leo@futbolamateur.app',
        score: 115,
        role: 'player',
        stats: { played: 24, late: 0, noShows: 0, debts: 0, onTime: 24, paidOnTime: 24 }
      },
      {
        uid: 'player_dibu',
        name: 'Emiliano "Dibu" Martínez',
        email: 'dibu@futbolamateur.app',
        score: 106,
        role: 'player',
        stats: { played: 18, late: 1, noShows: 0, debts: 0, onTime: 17, paidOnTime: 18 }
      },
      {
        uid: 'player_depaul',
        name: 'Rodrigo De Paul',
        email: 'rdp@futbolamateur.app',
        score: 102,
        role: 'player',
        stats: { played: 20, late: 2, noShows: 0, debts: 0, onTime: 18, paidOnTime: 20 }
      },
      {
        uid: 'player_julian',
        name: 'Julián Álvarez',
        email: 'julian@futbolamateur.app',
        score: 104,
        role: 'player',
        stats: { played: 15, late: 0, noShows: 0, debts: 0, onTime: 15, paidOnTime: 15 }
      },
      {
        uid: 'player_cuti',
        name: 'Cristian "Cuti" Romero',
        email: 'cuti@futbolamateur.app',
        score: 98,
        role: 'player',
        stats: { played: 14, late: 2, noShows: 0, debts: 1, onTime: 12, paidOnTime: 13 }
      },
      {
        uid: 'player_enzo',
        name: 'Enzo Fernández',
        email: 'enzo@futbolamateur.app',
        score: 95,
        role: 'player',
        stats: { played: 12, late: 1, noShows: 0, debts: 0, onTime: 11, paidOnTime: 12 }
      },
      {
        uid: 'player_macallister',
        name: 'Alexis Mac Allister',
        email: 'alexis@futbolamateur.app',
        score: 92,
        role: 'player',
        stats: { played: 10, late: 1, noShows: 0, debts: 0, onTime: 9, paidOnTime: 10 }
      },
      {
        uid: 'player_lautaro',
        name: 'Lautaro Martínez',
        email: 'toro@futbolamateur.app',
        score: 88,
        role: 'player',
        stats: { played: 9, late: 2, noShows: 0, debts: 1, onTime: 7, paidOnTime: 8 }
      },
      {
        uid: 'player_dimaria',
        name: 'Ángel Di María',
        email: 'fideo@futbolamateur.app',
        score: 100,
        role: 'player',
        stats: { played: 16, late: 0, noShows: 0, debts: 0, onTime: 16, paidOnTime: 16 }
      },
      {
        uid: 'player_paredes',
        name: 'Leandro Paredes',
        email: 'lea@futbolamateur.app',
        score: 75,
        role: 'player',
        stats: { played: 8, late: 3, noShows: 1, debts: 2, onTime: 5, paidOnTime: 6 }
      },
      {
        uid: 'player_garnacho',
        name: 'Alejandro Garnacho',
        email: 'garna@futbolamateur.app',
        score: 72,
        role: 'player',
        stats: { played: 5, late: 2, noShows: 1, debts: 1, onTime: 3, paidOnTime: 4 }
      },
      {
        uid: 'admin_scaloni',
        name: 'Lionel Scaloni (DT Admin)',
        email: 'scaloni@futbolamateur.app',
        score: 120,
        role: 'admin',
        stats: { played: 30, late: 0, noShows: 0, debts: 0, onTime: 30, paidOnTime: 30 }
      }
    ];

    for (const p of samplePlayers) {
      const userRef = doc(db, 'users', p.uid);
      batch.set(userRef, {
        uid: p.uid,
        name: p.name,
        email: p.email,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${p.uid}`,
        role: p.role,
        score: p.score,
        tier: calculateTier(p.score),
        stats: p.stats,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 2. Seed 3 Weekly Matches
    const now = new Date();
    
    // Match 1: Viernes - Fútbol 5 (10 jugadores) - Fase 1 (Prioridad)
    const match1Date = new Date(now);
    match1Date.setDate(now.getDate() + 2);
    match1Date.setHours(20, 0, 0, 0);

    const match1Id = `match_demo_f5_fri`;
    const match1: Match = {
      id: match1Id,
      title: 'Fútbol 5 - Viernes Noche',
      dateTime: match1Date.toISOString(),
      location: 'Predio El Monumental - Cancha Sintético 3',
      capacity: 10,
      costPerPlayer: 3500,
      status: 'phase_1_priority',
      notes: 'Pasto sintético techado. Llevar camiseta clara y oscura.',
      createdAt: new Date().toISOString(),
    };
    batch.set(doc(db, 'matches', match1Id), match1);

    // Registrations for Match 1 (7 titulares score >= 100, 3 vacantes)
    const match1Starters = [
      samplePlayers[0], // Messi (115)
      samplePlayers[1], // Dibu (106)
      samplePlayers[2], // De Paul (102)
      samplePlayers[3], // Julián (104)
      samplePlayers[8], // Di María (100)
    ];

    for (const p of match1Starters) {
      const regId = `${match1Id}_${p.uid}`;
      batch.set(doc(db, 'registrations', regId), {
        id: regId,
        matchId: match1Id,
        userId: p.uid,
        userName: p.name,
        userEmail: p.email,
        userPhoto: `https://api.dicebear.com/7.x/bottts/svg?seed=${p.uid}`,
        userScore: p.score,
        userTier: calculateTier(p.score),
        registeredAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: 'starter',
        paid: true,
      });
    }

    // Match 2: Domingo - Fútbol 7 (14 jugadores) - Fase 2 (Abierta) - CASI LLENO con Suplentes
    const match2Date = new Date(now);
    match2Date.setDate(now.getDate() + 4);
    match2Date.setHours(19, 30, 0, 0);

    const match2Id = `match_demo_f7_sun`;
    const match2: Match = {
      id: match2Id,
      title: 'Fútbol 7 - Clásico de Domingo',
      dateTime: match2Date.toISOString(),
      location: 'Complejo Los Cardales - Cancha Principal 7',
      capacity: 14,
      costPerPlayer: 4200,
      status: 'phase_2_open',
      notes: 'Fútbol 7 césped natural con vestuarios y tercer tiempo.',
      createdAt: new Date().toISOString(),
    };
    batch.set(doc(db, 'matches', match2Id), match2);

    // Registrations for Match 2: 14 starters + 2 substitutes on waitlist
    const match2Players = [
      samplePlayers[0], samplePlayers[1], samplePlayers[2], samplePlayers[3],
      samplePlayers[4], samplePlayers[5], samplePlayers[6], samplePlayers[7],
      samplePlayers[8], samplePlayers[9], samplePlayers[10],
    ];

    match2Players.forEach((p, idx) => {
      const isStarter = idx < 9; // 9 starters currently, 5 available
      const regId = `${match2Id}_${p.uid}`;
      batch.set(doc(db, 'registrations', regId), {
        id: regId,
        matchId: match2Id,
        userId: p.uid,
        userName: p.name,
        userEmail: p.email,
        userPhoto: `https://api.dicebear.com/7.x/bottts/svg?seed=${p.uid}`,
        userScore: p.score,
        userTier: calculateTier(p.score),
        registeredAt: new Date(Date.now() - 3600000 * (10 - idx)).toISOString(),
        status: isStarter ? 'starter' : 'substitute',
        paid: idx % 2 === 0,
      });
    });

    // Match 3: Miércoles que viene - Fútbol 5 (10 jugadores) - Fase 1
    const match3Date = new Date(now);
    match3Date.setDate(now.getDate() + 7);
    match3Date.setHours(21, 0, 0, 0);

    const match3Id = `match_demo_f5_next_wed`;
    const match3: Match = {
      id: match3Id,
      title: 'Fútbol 5 - Miércoles Nocturno',
      dateTime: match3Date.toISOString(),
      location: 'Canchas La Redonda - Pista 1',
      capacity: 10,
      costPerPlayer: 3500,
      status: 'phase_1_priority',
      notes: 'Partido entre semana. Cancha rápida.',
      createdAt: new Date().toISOString(),
    };
    batch.set(doc(db, 'matches', match3Id), match3);

    await batch.commit();
  }
};
