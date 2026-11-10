// EXPERIMENT: sidebar content. Sample values: edit freely.

export interface Track {
  title: string;
  artist: string;
  /** Beats per minute for the generated loop. */
  bpm: number;
  /** Chord per bar as MIDI notes (lowest note is used for the bass). */
  chords: number[][];
  /** Cover sky gradient (top, bottom). */
  sky: [string, string];
  /** Optional real audio file in /public (e.g. '/music/track.mp3'). If set, it is played instead of the generator. */
  src?: string;
  /** Length shown in the player, in seconds (generated tracks loop for this long). */
  duration: number;
}

export const tracks: Track[] = [
  {
    title: 'Midnight Deploy',
    artist: 'Chill Compiler',
    bpm: 72,
    sky: ['#2b2f6b', '#e98fa9'],
    duration: 192,
    chords: [
      [60, 64, 67, 71, 74], // Cmaj9
      [57, 60, 64, 67, 71], // Am9
      [62, 65, 69, 72, 76], // Dm9
      [55, 59, 62, 65, 69], // G13
    ],
  },
  {
    title: 'Rainy Standup',
    artist: 'Chill Compiler',
    bpm: 66,
    sky: ['#1d3a52', '#8ec5d6'],
    duration: 176,
    chords: [
      [57, 60, 64, 67, 71], // Am9
      [53, 57, 60, 64, 67], // Fmaj9
      [60, 64, 67, 71, 74], // Cmaj9
      [52, 55, 59, 62, 66], // Em9
    ],
  },
  {
    title: 'Green Build',
    artist: 'Chill Compiler',
    bpm: 78,
    sky: ['#2f4a3b', '#f0c987'],
    duration: 168,
    chords: [
      [53, 57, 60, 64, 67], // Fmaj9
      [50, 53, 57, 60, 64], // Dm9
      [58, 62, 65, 69, 72], // Bbmaj9
      [55, 58, 60, 64, 67], // C9
    ],
  },
];

export const watching = {
  title: 'Black Clover',
  kind: 'Anime',
  season: 2,
  /** Optional: set both to show an episode count and progress line. */
  episode: undefined as number | undefined,
  total: undefined as number | undefined,
  /** Optional real image in /public (shown in black and white). */
  image: undefined as string | undefined,
};
