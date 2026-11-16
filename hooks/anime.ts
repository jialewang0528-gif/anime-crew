import type { AgentRow } from '../types'
import type { Piece } from './agents'

/** What an agent is doing. It picks the character within its model's anime. */
export type Role = 'lead' | 'scout' | 'plan' | 'guide' | 'review' | 'medic' | 'clone'

/** One character: a name for the card, and the cells of its three-row critter, four wide. */
export type Look = {
  name: string
  /** The name's color on the card. */
  color: string
  hair: Piece[]
  /** The cells either side of the eyes: cheeks, hair, a mask. */
  sides: [Piece, Piece]
  skin: string
  /** Two cells while it runs, and the color of each, or one color for both. */
  eyes: string
  ink: string | [string, string]
  /** The eyes once done: ^^ unless the character has its own. */
  happy?: string
  /** The whole face, for a character that is not two eyes between two sides. */
  face?: (mood: Mood) => Piece[]
  legs: (step: boolean) => Piece[]
  /** Drawn in place of the critter once done: the shadow clone's puff of smoke. */
  gone?: Piece[][]
}

type Mood = 'run' | 'done' | 'fail'

const SKIN = '#f3c9a0'
const DARK = '#2a1408'

const walk = (color: string) => (step: boolean): Piece[] => [{ text: step ? '▘▝▘▝' : '▝▘▝▘', color }]
// Two colors, left leg and right: a haori in two halves.
const halves = (left: string, right: string) => (step: boolean): Piece[] => [
  { text: step ? '▘▝' : '▝▘', color: left }, { text: step ? '▘▝' : '▝▘', color: right },
]
const skin = (text: string): Piece => ({ text, color: SKIN })
const hair = (color: string): [Piece, Piece] => [{ text: '▐', color }, { text: '▌', color }]
const ears: [Piece, Piece] = [skin('▐'), skin('▌')]

const NARUTO_LOOK: Look = {
  name: 'Naruto', color: '#f28c28',
  hair: [{ text: '▟▙▟▙', color: '#f5c518' }],
  sides: [{ text: '≡', color: '#9a6a40', bg: SKIN }, { text: '≡', color: '#9a6a40', bg: SKIN }],
  skin: SKIN, eyes: '••', ink: '#2d6fe0', legs: walk('#f28c28'),
}

const NARUTO: Record<Role, Look> = {
  lead: NARUTO_LOOK,
  clone: {
    ...NARUTO_LOOK, name: 'Shadow Clone', color: '#c98a4a',
    hair: [{ text: '▟▙▟▙', color: '#b8993e' }], legs: walk('#b0702e'),
    gone: [[{ text: '▗▄▄▖', color: '#8a8799' }], [{ text: '▐░▒▌', color: '#8a8799' }], [{ text: '▝▀▀▘', color: '#8a8799' }]],
  },
  plan: {
    name: 'Shikamaru', color: '#7f9c4a',
    hair: [{ text: ' ▟▙ ', color: '#5a5a6e' }],
    sides: ears, skin: SKIN, eyes: '--', ink: DARK, legs: walk('#6b8e3d'),
  },
  review: {
    name: 'Kakashi', color: '#a9b0c4',
    hair: [{ text: '▗▟██', color: '#c8ccd8' }],
    sides: hair('#34406a'), skin: SKIN, eyes: '▬•', ink: ['#8e97a8', DARK], happy: '▬^', legs: walk('#34406a'),
  },
  scout: {
    name: 'Neji', color: '#b9b0e0',
    hair: [{ text: '▄██▄', color: '#6e4b3a' }],
    sides: [{ text: '█', color: '#6e4b3a' }, { text: '█', color: '#6e4b3a' }],
    skin: SKIN, eyes: '◦◦', ink: '#8f84c4', legs: walk('#e2dccb'),
  },
  medic: {
    name: 'Sakura', color: '#f49ac2',
    hair: [{ text: '▄██▄', color: '#f49ac2' }],
    sides: hair('#f49ac2'), skin: SKIN, eyes: '••', ink: '#2f9e5e', legs: walk('#d8343a'),
  },
  guide: {
    name: 'Jiraiya', color: '#e8e8ee',
    hair: [{ text: '▟▙▟▙', color: '#e8e8ee' }],
    sides: hair('#e8e8ee'), skin: SKIN, eyes: '••', ink: DARK, legs: halves('#c0392b', '#3e7d4f'),
  },
}

const DEMON_SLAYER: Record<Role, Look> = {
  lead: {
    name: 'Tanjiro', color: '#2e9b5f',
    hair: [{ text: '▟▀▀▙', color: '#a2382b' }],
    sides: [{ text: '┊', color: '#e0412a', bg: SKIN }, { text: '┊', color: '#e0412a', bg: SKIN }],
    skin: SKIN, eyes: '••', ink: '#b0302a',
    // The checkered haori shimmers as he walks.
    legs: step => [{ text: step ? '▞▚▞▚' : '▚▞▚▞', color: '#2e9b5f', bg: '#1a1a1a' }],
  },
  clone: {
    name: 'Nezuko', color: '#f28ab2',
    hair: [{ text: '▄█', color: '#4a3a4e' }, { text: '█', color: '#e8833a' }, { text: '◆', color: '#f28ab2' }],
    sides: hair('#4a3a4e'), skin: SKIN, eyes: '••', ink: '#e86aa8',
    // The bamboo muzzle, between her feet.
    legs: step => [{ text: step ? '▘' : '▝', color: '#f4a6c1' }, { text: '▬▬', color: '#7fb069' }, { text: step ? '▝' : '▘', color: '#f4a6c1' }],
  },
  scout: {
    name: 'Inosuke', color: '#94a7bd',
    hair: [{ text: '▙▄▄▟', color: '#94a7bd' }],
    sides: hair('#94a7bd'), skin: '#94a7bd', eyes: '••', ink: '#f4f4f8', legs: walk('#7a5a3a'),
  },
  plan: {
    name: 'Tengen', color: '#d94f8f',
    hair: [{ text: '▄', color: '#e8e8ee' }, { text: '◆', color: '#e0453a' }, { text: '◆', color: '#3fbf6a' }, { text: '▄', color: '#e8e8ee' }],
    sides: ears, skin: SKIN, eyes: '••', ink: '#c0397a', legs: walk('#3c4363'),
  },
  guide: {
    name: 'Rengoku', color: '#f5b301',
    hair: [{ text: '▟', color: '#f5b301' }, { text: '▙', color: '#e0412a' }, { text: '▟', color: '#f5b301' }, { text: '▙', color: '#e0412a' }],
    sides: ears, skin: SKIN, eyes: '••', ink: '#e0412a', legs: halves('#f5b301', '#e0412a'),
  },
  review: {
    name: 'Giyu', color: '#3a6fd8',
    hair: [{ text: '▄▀▀▄', color: '#3d4a6e' }],
    sides: ears, skin: SKIN, eyes: '••', ink: '#3a6fd8', legs: halves('#8e2b2b', '#4f9a5a'),
  },
  medic: {
    name: 'Shinobu', color: '#b48ee6',
    hair: [{ text: '▄█▀', color: '#4a3a66' }, { text: '⋈', color: '#c78ce6' }],
    sides: hair('#4a3a66'), skin: SKIN, eyes: '••', ink: '#9b6fd6', legs: halves('#a6e3c4', '#f5c6e0'),
  },
}

const STRAW = '#e8c35a'
const FUR = '#a0603a'
const eye = (mood: Mood) => (mood === 'fail' ? '×' : mood === 'done' ? '^' : '•')

const ONE_PIECE: Record<Role, Look> = {
  lead: {
    name: 'Luffy', color: '#d63a2f',
    hair: [{ text: '▄', color: STRAW }, { text: '▀▀', color: STRAW, bg: '#d63a2f' }, { text: '▄', color: STRAW }],
    sides: ears, skin: SKIN, eyes: '••', ink: DARK, legs: walk('#d63a2f'),
  },
  clone: {
    name: 'Ace', color: '#e67e22',
    hair: [{ text: '▄', color: '#e67e22' }, { text: '▀▀', color: '#e67e22', bg: '#5a3a1a' }, { text: '▄', color: '#e67e22' }],
    sides: [{ text: '∵', color: '#a0603a', bg: SKIN }, { text: '∵', color: '#a0603a', bg: SKIN }],
    skin: SKIN, eyes: '••', ink: DARK, legs: walk('#6d5a48'),
  },
  scout: {
    name: 'Usopp', color: '#f1c40f',
    hair: [{ text: '▄', color: '#5e4632' }, { text: '◎◎', color: '#f1c40f' }, { text: '▄', color: '#5e4632' }],
    // The long nose sticks out past his face.
    sides: [skin('▐'), skin('▬')], skin: SKIN, eyes: '••', ink: DARK, legs: walk('#c9a26b'),
  },
  plan: {
    name: 'Nami', color: '#f07c2a',
    hair: [{ text: '▄██▄', color: '#f07c2a' }],
    sides: hair('#f07c2a'), skin: SKIN, eyes: '••', ink: '#7a4a2a', legs: walk('#4aa8e8'),
  },
  guide: {
    name: 'Robin', color: '#8e6bbf',
    hair: [{ text: '▄██▄', color: '#4b4b6b' }],
    sides: hair('#4b4b6b'), skin: SKIN, eyes: '••', ink: '#4a8ad8', happy: '✿✿', legs: walk('#8e6bbf'),
  },
  review: {
    name: 'Zoro', color: '#3aa655',
    hair: [{ text: '▄▄▄▄', color: '#3aa655' }],
    sides: [skin('▐'), { text: '⁝', color: '#f1c40f', bg: SKIN }],
    skin: SKIN, eyes: '-•', ink: DARK, happy: '-^', legs: walk('#3a7d44'),
  },
  medic: {
    name: 'Chopper', color: '#ef6ea0',
    hair: [{ text: '▗', color: '#ef6ea0' }, { text: '✕', color: '#ffffff', bg: '#ef6ea0' }, { text: ' ', bg: '#ef6ea0' }, { text: '▖', color: '#ef6ea0' }],
    sides: [{ text: '▐', color: FUR }, { text: '▌', color: FUR }], skin: FUR, eyes: '••', ink: DARK,
    // His blue nose sits between his eyes.
    face: mood => [
      { text: '▐', color: FUR }, { text: eye(mood), color: DARK, bg: FUR, bold: true },
      { text: '▾', color: '#3b7dd8', bg: FUR, bold: true }, { text: eye(mood), color: DARK, bg: FUR, bold: true },
    ],
    legs: walk(FUR),
  },
}

const ANIME: Record<string, Record<Role, Look>> = { opus: NARUTO, sonnet: DEMON_SLAYER, haiku: ONE_PIECE }

const BY_TYPE: Record<string, Role> = { Explore: 'scout', Plan: 'plan', 'claude-code-guide': 'guide', fork: 'clone' }
// For an agent of any other type, the first of these its title matches.
const BY_WORD: [Role, RegExp][] = [
  ['review', /\b(review|audit|critique|inspect|verify)/i],
  ['medic', /\b(debug|fix|bug|error|test|diagnos|repair)/i],
  ['plan', /\b(plan|design|architect|strateg)/i],
  ['scout', /\b(search|find|explore|locate|scan|inventor|survey|investigat)/i],
  ['guide', /\b(explain|docs?\b|document|guide|teach|tutorial|readme)/i],
]

/** The role an agent plays: by its type for the built-in ones, else by the words of its title. */
export function roleOf(a: AgentRow): Role {
  return BY_TYPE[a.type] ?? BY_WORD.find(([, words]) => words.test(a.title))?.[0] ?? 'lead'
}

/** The character an agent is drawn as, or null for a model with no anime. */
export function characterOf(a: AgentRow): Look | null {
  const life = lifeOf(a.type)
  if (life !== null) return life
  if (a.cast !== undefined && CAST[a.cast] !== undefined) return CAST[a.cast] as Look
  const family = /(opus|sonnet|haiku)/i.exec(a.model)?.[1]?.toLowerCase()
  const cast = family === undefined ? undefined : ANIME[family]
  return cast === undefined ? null : cast[roleOf(a)]
}

/** The three rows of a character: hair, a face by how its run went, and legs that step while it runs. */
export function drawCharacter(look: Look, status: AgentRow['status'], step: boolean): Piece[][] {
  const mood: Mood = status === 'failed' ? 'fail' : status === 'done' ? 'done' : 'run'
  if (mood === 'done' && look.gone) return look.gone
  const text = mood === 'fail' ? '××' : mood === 'done' ? (look.happy ?? '^^') : look.eyes
  const [left, right] = typeof look.ink === 'string' ? [look.ink, look.ink] : look.ink
  const face = look.face?.(mood) ?? [
    look.sides[0],
    { text: text.charAt(0), color: left, bg: look.skin, bold: true },
    { text: text.charAt(1), color: right, bg: look.skin, bold: true },
    look.sides[1],
  ]
  return [look.hair, face, look.legs(mood === 'run' && step)]
}

// ---- anime-crew: a wide cast across many anime, one distinct character per running agent ----

const look = (name: string, color: string, hairText: string, hairColor: string, ink: string, legsColor: string, extra: Partial<Look> = {}): Look => ({
  name, color, hair: [{ text: hairText, color: hairColor }], sides: hair(hairColor), skin: SKIN, eyes: '••', ink, legs: walk(legsColor), ...extra,
})

const MORE: Record<string, Look> = {
  // Jujutsu Kaisen
  gojo: look('Gojo', '#7fc8ff', '▟▙▟▙', '#f2f4ff', '#1b1b2a', '#1b1b2a', { eyes: '▬▬', happy: '◦◦', ink: '#1b1b2a' }),
  itadori: look('Itadori', '#f08aa8', '▟▙▟▙', '#f08aa8', '#6b3a2a', '#2a2f4a'),
  megumi: look('Megumi', '#5a6b9a', '▙▟▙▟', '#20222e', '#2c3a6a', '#20222e'),
  nobara: look('Nobara', '#e8833a', '▄██▄', '#c8642a', '#6b3a2a', '#20222e'),
  sukuna: look('Sukuna', '#d64545', '▟▙▟▙', '#f08aa8', '#d64545', '#e8e0d0', { sides: [{ text: '≡', color: '#20222e', bg: SKIN }, { text: '≡', color: '#20222e', bg: SKIN }] }),
  // Attack on Titan
  eren: look('Eren', '#3aa66a', '▄██▄', '#5a3a26', '#2fb38a', '#6b4a2a'),
  levi: look('Levi', '#8a93a6', '▄▀▀▄', '#1e1e26', '#5a6270', '#e8e8ee'),
  mikasa: look('Mikasa', '#c0392b', '▄██▄', '#1e1e26', '#3a3a4a', '#c0392b'),
  // My Hero Academia
  deku: look('Deku', '#2e9b5f', '▙▟▙▟', '#1f5a3a', '#2e9b5f', '#3a8a5a'),
  bakugo: look('Bakugo', '#f5a623', '▟▙▟▙', '#f2d16b', '#d63a2f', '#2a2a2a'),
  todoroki: { ...look('Todoroki', '#e8e8ee', '▄█', '#e8e8ee', '#5a7ad8', '#2a2f4a'), hair: [{ text: '▄█', color: '#e8e8ee' }, { text: '█▄', color: '#d63a2f' }], sides: [{ text: '▐', color: '#e8e8ee' }, { text: '▌', color: '#d63a2f' }], ink: ['#5a6270', '#5a7ad8'] },
  allmight: look('All Might', '#3a6fd8', '▟▙▟▙', '#f5d142', '#3a6fd8', '#3a6fd8'),
  // Dragon Ball
  goku: look('Goku', '#f28c28', '▟▙▟▙', '#16161e', '#16161e', '#f28c28'),
  vegeta: look('Vegeta', '#3a5ad8', '▗██▖', '#16161e', '#16161e', '#3a5ad8'),
  // Chainsaw Man
  denji: look('Denji', '#f2a32a', '▙▟▙▟', '#e8c35a', '#6b3a2a', '#2a2a2a'),
  power: look('Power', '#e05a8a', '▗▄▄▖', '#f2a6c1', '#d64545', '#2a2a2a', { hair: [{ text: '▚', color: '#d64545' }, { text: '▄▄', color: '#f2a6c1' }, { text: '▞', color: '#d64545' }] }),
  makima: look('Makima', '#c0392b', '▄██▄', '#b03a2e', '#e8c35a', '#2a2a2a', { eyes: '◎◎' }),
  // Spy x Family
  anya: look('Anya', '#f49ac2', '▟██▙', '#f49ac2', '#2e9b5f', '#2a2a2a'),
  loid: look('Loid', '#c8b26a', '▄██▄', '#e8d48a', '#2d6fe0', '#2a3a5a'),
  yor: look('Yor', '#c0392b', '▄██▄', '#1e1e26', '#c0392b', '#1e1e26'),
  // Hunter x Hunter
  gon: look('Gon', '#3aa655', '▟▙▟▙', '#1e2a1e', '#5a3a26', '#3aa655'),
  killua: look('Killua', '#7fb3ff', '▟▙▟▙', '#eef0f8', '#3a7ad8', '#5a4a8a'),
  // Bleach, Death Note, Solo Leveling, Frieren
  ichigo: look('Ichigo', '#f28c28', '▟▙▟▙', '#f28c28', '#5a3a26', '#16161e'),
  l: look('L', '#a0a0b0', '▙▟▙▟', '#16161e', '#16161e', '#e8e8ee', { sides: [{ text: '▐', color: '#16161e' }, { text: '▌', color: '#16161e' }], eyes: '◉◉' }),
  light: look('Light', '#d6a03a', '▄██▄', '#8a5a2a', '#8a3a2a', '#3a3a4a'),
  jinwoo: look('Jinwoo', '#8a5ae8', '▙▟▙▟', '#16161e', '#8a5ae8', '#16161e'),
  frieren: look('Frieren', '#9ad8b0', '▄██▄', '#eef0f8', '#2fb38a', '#eef0f8'),
}

/** Every character an agent can be drawn as, by key. */
export const CAST: Record<string, Look> = {
  ...MORE,
  naruto: NARUTO.lead, kakashi: NARUTO.review, sakura: NARUTO.medic, shikamaru: NARUTO.plan, neji: NARUTO.scout, jiraiya: NARUTO.guide,
  tanjiro: DEMON_SLAYER.lead, nezuko: DEMON_SLAYER.clone, inosuke: DEMON_SLAYER.scout, rengoku: DEMON_SLAYER.guide, giyu: DEMON_SLAYER.review, shinobu: DEMON_SLAYER.medic,
  luffy: ONE_PIECE.lead, zoro: ONE_PIECE.review, nami: ONE_PIECE.plan, robin: ONE_PIECE.guide, usopp: ONE_PIECE.scout, chopper: ONE_PIECE.medic,
}
const CAST_KEYS = Object.keys(CAST)

function castHash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/** Picks a character for a new agent: by its id, skipping any a running agent already wears. */
export function pickCast(id: string, taken: ReadonlySet<string>): string {
  const start = castHash(id) % CAST_KEYS.length
  for (let i = 0; i < CAST_KEYS.length; i++) {
    const key = CAST_KEYS[(start + i) % CAST_KEYS.length] as string
    if (!taken.has(key)) return key
  }
  return CAST_KEYS[start] as string
}

/** The one-line face for the compact strip: hair-colored sides around the eyes. */
export function miniFace(l: Look, status: AgentRow['status']): Piece[] {
  const text = status === 'failed' ? '××' : status === 'done' ? (l.happy ?? '^^') : l.eyes
  const [left, right] = typeof l.ink === 'string' ? [l.ink, l.ink] : l.ink
  const hairColor = l.hair[0]?.color ?? '#888'
  return [
    { text: '▐', color: hairColor },
    { text: text.charAt(0), color: left, bg: l.skin, bold: true },
    { text: text.charAt(1), color: right, bg: l.skin, bold: true },
    { text: '▌', color: hairColor },
  ]
}

// ---- Seven named agent types (a personal agent crew): each is drawn as its own character ----

const LIFE: Record<string, Look> = {
  // Jarvis: Iron Man's AI, a blue hologram with a glowing arc-reactor face.
  jarvis: look('Jarvis', '#4fc3f7', '▗▄▄▖', '#4fc3f7', '#e0f7ff', '#1e88e5', { skin: '#0d47a1', sides: [{ text: '▐', color: '#4fc3f7' }, { text: '▌', color: '#4fc3f7' }], eyes: '◉◉' }),
  // Harvey Specter: slicked dark hair, sharp navy suit.
  harvey: look('Harvey', '#c9a227', '▄▀▀▄', '#2a1f1a', '#3a2a1a', '#1f2a44', { legs: halves('#1f2a44', '#c9a227') }),
  // Ayanokoji: soft brown hair, calm half-lidded eyes, Advanced Nurturing red blazer.
  ayanokoji: look('Ayanokoji', '#b04a5a', '▄██▄', '#7a5a3a', '#6a4a8a', '#b04a5a', { eyes: '--', happy: '--' }),
  // Leo Valdez: curly black hair and a flame in hand.
  leo: look('Leo', '#f28c28', '▙▟▙▟', '#1e1a16', '#5a3a26', '#6b4a2a', { sides: [skin('▐'), { text: '♨', color: '#f28c28', bg: SKIN }] }),
  // Jotaro Kujo: the black cap that melts into his hair, green eyes, long black coat.
  jotaro: look('Jotaro', '#3aa66a', '▀██▀', '#16161e', '#2e9b5f', '#16161e', { hair: [{ text: '▄', color: '#16161e' }, { text: '██', color: '#16161e', bg: '#c9a227' }, { text: '▄', color: '#16161e' }] }),
  // Hermes: winged messenger cap.
  hermes: look('Hermes', '#e8c35a', '▚▄▄▞', '#e8e8ee', '#3a7ad8', '#c9a227', { hair: [{ text: '◥', color: '#e8e8ee' }, { text: '▄▄', color: '#c9a227' }, { text: '◤', color: '#e8e8ee' }] }),
  // Rohan Kishibe: green zigzag headband over sharp green hair, pen in hand.
  rohan: look('Rohan', '#4caf50', '▀▀▀▀', '#4caf50', '#2e7d32', '#3a3a4a', { hair: [{ text: '▞▚▞▚', color: '#2e7d32', bg: '#9ccc65' }], sides: [{ text: '▐', color: '#4caf50' }, { text: '✎', color: '#4caf50', bg: SKIN }] }),
}

/** His own agents by subagent type (Jarvis, Harvey, Ayanokoji, Leo, Jotaro, Hermes, Rohan), or null. */
export function lifeOf(type: string): Look | null {
  return LIFE[type.toLowerCase()] ?? null
}

const BEATS: Record<string, string> = {
  jarvis: 'Week', harvey: 'Career', ayanokoji: 'School', leo: 'Build', jotaro: 'Clubs', hermes: 'Network', rohan: 'Write',
}

/** His agent's beat ("Career" for Harvey), or null for any other agent. */
export function beatOf(type: string): string | null {
  return BEATS[type.toLowerCase()] ?? null
}
