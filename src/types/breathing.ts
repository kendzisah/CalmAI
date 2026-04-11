export type BreathingPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';
export type BreathingTechnique = 'box' | '478' | 'custom';

export const PHASE_LABELS: Record<BreathingPhase, string> = {
  inhale: 'Inhale...',
  hold1: 'Hold...',
  exhale: 'Exhale...',
  hold2: 'Hold...',
};

export const PHASE_ORDER: BreathingPhase[] = ['inhale', 'hold1', 'exhale', 'hold2'];

export interface BreathingSession {
  id: string;
  userId?: string;
  technique: BreathingTechnique;
  durationSeconds: number;
  cyclesCompleted: number;
  completed: boolean;
  createdAt: string;
}
