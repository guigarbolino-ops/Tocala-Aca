# Fútbol Amateur - Gestión de Convocatorias y Puntajes

## Stack Tecnológico
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **UI / Iconos / Animaciones**: Lucide React, Motion (`motion/react`), Canvas Confetti
- **Backend / Persistencia**: Firebase Firestore (con base de datos personalizada / applet config) & Firebase Auth (Google Auth + Demo mode)

## Configuración de Firebase
- La configuración reside en `firebase-applet-config.json` en la raíz del proyecto.
- `src/firebase/config.ts` importa y utiliza este archivo automáticamente para inicializar Firebase y Firestore (usando `firestoreDatabaseId`).
- Si se utiliza inicio de sesión con Google, el dominio (ej. `localhost`) debe estar habilitado en la consola de Firebase (Authentication > Settings > Authorized domains).

## Modelo de Datos y Reglas de Negocio

### 1. Prioridad de Convocatoria
Calculado mediante `calculateTier(score)`:
- **Prioridad 1**: >= 100 pts (se anotan directo como titulares si hay cupo disponible).
- **Prioridad 2**: 80 - 99 pts (entran en lista de espera prioritaria).
- **Prioridad 3**: < 80 pts (últimos en lista de espera).

### 2. Reglas de Puntaje
Definidas en `src/types.ts`:
- **Asistencia puntual**: Puntualidad + Asistencia (+2 / +5 según configuración)
- **Llegada tarde**: Penalización por demora (-3 / -5 pts)
- **Cancelación tardía / Aviso previo**: Penalización por baja de último momento (-10 pts)
- **Ausencia sin aviso (Faltazo / No Show)**: Mayor penalización (-20 a -25 pts)
- **Deuda / Pago a tiempo**: Bonificación (+1) o deducción (-5 a -15) según estado de pago

### 3. Roles y Permisos
- **Admin / DT**:
  - Super Admin identificado por email (`Gui.Garbolino@gmail.com` / `DEFAULT_DT_PROFILE`).
  - Acceso al **Panel DT**: creación de partidos, edición de cupos (Fútbol 5, 6, 7, 9), confirmación de listas, liquidación de partidos con asignación de asistencia y penalidades, gestión de jugadores del club.
  - Capacidad de alternar entre vista de DT y vista de Jugador (`viewMode: 'admin' | 'player'`).
- **Jugador**:
  - Vista simplificada con tarjeta de perfil, visualización de puntos, historial de partidos, cancha virtual (`PitchVisualization`) y tabla de posiciones (`Leaderboard`).

## Estructura Principal del Código
- `src/firebase/config.ts`: Inicialización de Firebase con `firebase-applet-config.json`.
- `src/context/AuthContext.tsx`: Contexto global de autenticación, perfil del usuario y alternancia de rol DT/Jugador.
- `src/services/matchService.ts`: Servicios y operaciones de Firestore para partidos, inscripciones y evaluaciones.
- `src/components/AdminPanel.tsx`: Panel de control para el DT.
- `src/components/Leaderboard.tsx`: Tabla de clasificación de jugadores y tiers.
- `src/components/MatchCard.tsx`: Tarjetas de partidos y gestión de convocatorias.
- `src/components/PitchVisualization.tsx`: Cancha interactiva para titulares y suplentes.
