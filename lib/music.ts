// Music with a verified licence, bundled with the app (CC BY allows redistribution).
// Source: incompetech.com (Kevin MacLeod). Licence read on 2026-11-17 at
// https://incompetech.com/music/royalty-free/licenses/ : "Creative Commons — Free.
// No charge. Requires that you credit the music." The site's own credit generator
// produces the exact text in creditFor() (CC BY 4.0). Files re-encoded to 128 kbps MP3.
export interface MusicTrack {
  id: string; file: string; title: string; artist: string; moods: string[]; bpm: number; durationMs: number; source: string;
}
export const LICENCE = { name: 'CC BY 4.0', url: 'http://creativecommons.org/licenses/by/4.0/', monetizable: true, explain: 'Puedes usarla en vídeos monetizados si pones el crédito en la descripción.' };
export const MUSIC: MusicTrack[] = [
  { id: 'km-carefree', file: '/music/km/carefree.mp3', title: "Carefree", artist: 'Kevin MacLeod', moods: ["Animada", "Luminosa", "Tranquila", "Positiva"], bpm: 96, durationMs: 205166, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3" },
  { id: 'km-wallpaper', file: '/music/km/wallpaper.mp3', title: "Wallpaper", artist: 'Kevin MacLeod', moods: ["Animada", "Luminosa", "Tranquila", "Positiva"], bpm: 92, durationMs: 220082, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Wallpaper.mp3" },
  { id: 'km-sneaky-snitch', file: '/music/km/sneaky-snitch.mp3', title: "Sneaky Snitch", artist: 'Kevin MacLeod', moods: ["Animada", "Oscura", "Divertida", "Misteriosa"], bpm: 87, durationMs: 136647, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3" },
  { id: 'km-local-forecast-elevator', file: '/music/km/local-forecast-elevator.mp3', title: "Local Forecast - Elevator", artist: 'Kevin MacLeod', moods: ["Animada", "Luminosa", "Con ritmo"], bpm: 82, durationMs: 189231, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Local%20Forecast%20-%20Elevator.mp3" },
  { id: 'km-fluffing-a-duck', file: '/music/km/fluffing-a-duck.mp3', title: "Fluffing a Duck", artist: 'Kevin MacLeod', moods: ["Animada", "Luminosa", "Divertida"], bpm: 122, durationMs: 67396, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3" },
  { id: 'km-monkeys-spinning-monkeys', file: '/music/km/monkeys-spinning-monkeys.mp3', title: "Monkeys Spinning Monkeys", artist: 'Kevin MacLeod', moods: ["Animada", "Luminosa", "Divertida", "Positiva"], bpm: 144, durationMs: 125100, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3" },
  { id: 'km-investigations', file: '/music/km/investigations.mp3', title: "Investigations", artist: 'Kevin MacLeod', moods: ["Divertida", "Misteriosa"], bpm: 94, durationMs: 93571, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Investigations.mp3" },
  { id: 'km-cipher', file: '/music/km/cipher.mp3', title: "Cipher", artist: 'Kevin MacLeod', moods: ["Luminosa", "Con ritmo", "Positiva"], bpm: 150, durationMs: 231288, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cipher2.mp3" },
  { id: 'km-life-of-riley', file: '/music/km/life-of-riley.mp3', title: "Life of Riley", artist: 'Kevin MacLeod', moods: ["Luminosa", "Relajada", "Positiva"], bpm: 102, durationMs: 235389, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Life%20of%20Riley.mp3" },
  { id: 'km-easy-lemon', file: '/music/km/easy-lemon.mp3', title: "Easy Lemon", artist: 'Kevin MacLeod', moods: ["Luminosa", "Tranquila", "Relajada"], bpm: 82, durationMs: 126407, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Easy%20Lemon.mp3" },
  { id: 'km-lobby-time', file: '/music/km/lobby-time.mp3', title: "Lobby Time", artist: 'Kevin MacLeod', moods: ["Tranquila", "Con ritmo", "Relajada"], bpm: 128, durationMs: 193228, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Lobby%20Time.mp3" },
  { id: 'km-funky-chunk', file: '/music/km/funky-chunk.mp3', title: "Funky Chunk", artist: 'Kevin MacLeod', moods: ["Luminosa", "Con ritmo", "Positiva"], bpm: 115, durationMs: 239047, source: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Funky%20Chunk.mp3" },
];
export const MOODS = [...new Set(MUSIC.flatMap((m) => m.moods))].sort((a, b) => a.localeCompare(b, 'es'));
/** Exactly the credit block incompetech's own generator produces for one title. */
export const creditFor = (m: { title: string }) => `"${m.title}"\nKevin MacLeod (incompetech.com)\nLicensed under Creative Commons: By Attribution 4.0\nhttp://creativecommons.org/licenses/by/4.0/`;
