import React from 'react';
import { X, ShieldCheck, Award, AlertTriangle, Clock, DollarSign, UserCheck, Flame } from 'lucide-react';
import { SCORING_RULES } from '../types';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E2E8E2] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-[#222B25] p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EEF3EF] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EAF1EC] text-[#52795D] border border-[#CDE0D2]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#222B25] tracking-tight">Reglamento y Sistema de Ranking</h2>
              <p className="text-xs text-[#6B7C70]">Algoritmo de prioridad y confiabilidad para el grupo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#6B7C70] hover:text-[#222B25] hover:bg-[#F1F5F2] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-6 text-sm">
          
          {/* Tiers Explanation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7C70] mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#52795D]" />
              Categorías de Prioridad (Tiers)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#EAF1EC] border border-[#CDE0D2]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#3D6348]">Prioridad 1</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white text-[#3D6348] font-mono font-bold shadow-xs">≥ 100 pts</span>
                </div>
                <p className="text-xs text-[#46574B]">
                  Acceso exclusivo e inmediato en <strong>Fase 1</strong> de convocatoria.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF3E7] border border-[#ECDDBF]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#976C2F]">Prioridad 2</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white text-[#976C2F] font-mono font-bold shadow-xs">80 - 99 pts</span>
                </div>
                <p className="text-xs text-[#7A5B2C]">
                  Se inscriben en <strong>Fase 2 (Abierta)</strong> por orden de llegada.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FBF0EC] border border-[#F2D2C6]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#AC5B40]">Prioridad 3</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white text-[#AC5B40] font-mono font-bold shadow-xs">&lt; 80 pts</span>
                </div>
                <p className="text-xs text-[#8A4833]">
                  Lista de espera. Deben sumar puntos de asistencia para recuperar categoría.
                </p>
              </div>
            </div>
          </div>

          {/* 2-Phase Convocatoria Flow */}
          <div className="p-4 rounded-xl bg-[#F6F8F6] border border-[#E2EAE3] space-y-2">
            <h4 className="font-bold text-[#222B25] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#D48C70]" />
              Flujo de Convocatoria en 2 Fases
            </h4>
            <ul className="space-y-2 text-xs text-[#5C6E62]">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#EAF1EC] text-[#3D6348] flex items-center justify-center font-bold shrink-0 border border-[#CDE0D2]">1</span>
                <span><strong>Fase 1 (Prioridad):</strong> Apertura inicial. Solo pueden anotarse como Titulares los jugadores con 100+ puntos.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FAF3E7] text-[#976C2F] flex items-center justify-center font-bold shrink-0 border border-[#ECDDBF]">2</span>
                <span><strong>Fase 2 (Abierta):</strong> Se abren los cupos restantes para todos los jugadores por orden de llegada.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FBF0EC] text-[#AC5B40] flex items-center justify-center font-bold shrink-0 border border-[#F2D2C6]">3</span>
                <span><strong>Reemplazo Automático:</strong> Si un titular se da de baja, el 1° de la lista de suplentes asciende automáticamente a titular.</span>
              </li>
            </ul>
          </div>

          {/* Scoring Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7C70] mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#52795D]" />
              Tabla de Puntajes y Penalizaciones
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#EAF1EC] border border-[#CDE0D2]">
                <span className="flex items-center gap-2 text-[#3D6348] font-medium">
                  <UserCheck className="w-4 h-4 text-[#52795D]" />
                  Asistencia y puntualidad
                </span>
                <span className="font-bold text-[#3D6348] font-mono text-sm">+{SCORING_RULES.ATTENDED_ON_TIME} pts</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#EAF1EC] border border-[#CDE0D2]">
                <span className="flex items-center gap-2 text-[#3D6348] font-medium">
                  <DollarSign className="w-4 h-4 text-[#52795D]" />
                  Pago a tiempo de la cancha
                </span>
                <span className="font-bold text-[#3D6348] font-mono text-sm">+{SCORING_RULES.PAID_ON_TIME} pt</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F6F8F6] border border-[#E2EAE3]">
                <span className="flex items-center gap-2 text-[#5C6E62]">
                  <Clock className="w-4 h-4 text-[#7A8C80]" />
                  Baja anticipada (&gt;24hs antes)
                </span>
                <span className="font-bold text-[#7A8C80] font-mono text-sm">0 pts</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF3E7] border border-[#ECDDBF]">
                <span className="flex items-center gap-2 text-[#976C2F] font-medium">
                  <Clock className="w-4 h-4 text-[#D8A468]" />
                  Llegada tarde al partido
                </span>
                <span className="font-bold text-[#976C2F] font-mono text-sm">{SCORING_RULES.LATE} pts</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF3E7] border border-[#ECDDBF]">
                <span className="flex items-center gap-2 text-[#976C2F] font-medium">
                  <DollarSign className="w-4 h-4 text-[#D8A468]" />
                  Pago demorado / Deuda pendiente
                </span>
                <span className="font-bold text-[#976C2F] font-mono text-sm">{SCORING_RULES.DEBT} pts</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FBF0EC] border border-[#F2D2C6]">
                <span className="flex items-center gap-2 text-[#AC5B40] font-medium">
                  <AlertTriangle className="w-4 h-4 text-[#D48C70]" />
                  Baja sobre la hora (&lt;12hs)
                </span>
                <span className="font-bold text-[#AC5B40] font-mono text-sm">{SCORING_RULES.LATE_CANCELLATION} pts</span>
              </div>

              <div className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-[#FBF0EC] border border-[#F2D2C6]">
                <span className="flex items-center gap-2 text-[#AC5B40] font-bold">
                  <AlertTriangle className="w-4 h-4 text-[#D48C70]" />
                  Falta sin aviso (No-Show)
                </span>
                <span className="font-bold text-[#AC5B40] font-mono text-sm">{SCORING_RULES.NO_SHOW} pts</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-[#EEF3EF] pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#52795D] hover:bg-[#45684F] text-white font-bold rounded-xl transition shadow-xs"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
