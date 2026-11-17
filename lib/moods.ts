// incompetech "feel" tags in Spanish
export const MOOD_ES: Record<string, string> = {
  Bouncy: 'Animada', Bright: 'Luminosa', Calming: 'Tranquila', Uplifting: 'Positiva', Dark: 'Oscura', Humorous: 'Divertida',
  Mysterious: 'Misteriosa', Grooving: 'Con ritmo', Relaxed: 'Relajada', Driving: 'Enérgica', Intense: 'Intensa', Eerie: 'Inquietante',
  Unnerving: 'Tensa', Somber: 'Sombría', Mystical: 'Mística', Epic: 'Épica', Action: 'Acción', Suspenseful: 'Suspense', Aggressive: 'Agresiva', 'Ren Faire': 'Renacentista', Medieval: 'Medieval',
};
export const moodsEs = (feel: string) => [...new Set(feel.split(',').map((f) => f.trim()).filter(Boolean).map((f) => MOOD_ES[f] ?? f))];
