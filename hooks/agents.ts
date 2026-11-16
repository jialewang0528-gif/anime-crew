import type { AgentRow } from '../types'
import { beatOf, characterOf, drawCharacter } from './anime'

/** One run of text with one style, as pill.ts draws them. */
export type Piece = { text: string; color?: string; bg?: string; bold?: boolean; dim?: boolean }

const TYPE_COLORS = ['#e8794a', '#34b98a', '#4c8df6', '#e0a43a', '#9b7bf2', '#e5534b']
const HATS = [' ▄▄ ', '▗▄▄▖', ' ▗▖ ', '▄▀▀▄', ' ▀▀ ', '▐▀▀▌']
const HAT_COLORS = ['#c0532b', '#3b6dd8', '#e0a43a', '#7a5af0', '#2b8a63', '#d04a7a']
const BODY = '#e8794a'
const TRACK_BG = '#24222e'
const SPARKS = ['·', '∙', '⋅', '˙', '✦']
// How long a finished agent stays in the band's strip, and how long a quiet one still counts as running.
const STRIP_HOLD_MS = 4000
const STRIP_STALE_MS = 10 * 60_000
const STRIP_CELL = 30 // the fewest cells one agent takes in the strip

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

// The built-in types each get their own color; any other type is colored by a hash of its name.
const KNOWN: Record<string, string> = {
  'general-purpose': '#34b98a', Explore: '#e0a43a', Plan: '#4c8df6', fork: '#9b7bf2', claude: '#e8794a',
}

/** The color an agent type is shown in: the same type, the same color, every session. */
export const typeColor = (type: string) => KNOWN[type] ?? TYPE_COLORS[hash(type) % TYPE_COLORS.length] ?? '#9b7bf2'

/**
 * A three-row pixel critter: its model's anime character for its role (see anime.ts),
 * or else a hat by the agent's id, a face, and legs that step while it runs.
 */
export function mascot(a: AgentRow, now: number): Piece[][] {
  const step = a.status === 'running' && Math.floor(now / 400) % 2 === 1
  const look = characterOf(a)
  if (look !== null) return drawCharacter(look, a.status, step)
  const h = hash(a.id)
  const hat = { text: HATS[h % HATS.length] ?? ' ▄▄ ', color: HAT_COLORS[(h >>> 4) % HAT_COLORS.length] }
  const eyes = a.status === 'failed' ? '××' : a.status === 'done' ? '^^' : '••'
  return [
    [hat],
    [{ text: '▐', color: BODY }, { text: eyes, color: '#2a1408', bg: BODY, bold: true }, { text: '▌', color: BODY }],
    [{ text: step ? '▘▝▘▝' : '▝▘▝▘', color: BODY }],
  ]
}

/** Formats ms as m:ss, or h:mm:ss from one hour. */
export function duration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** Formats a token count: 950, 31k, 1.2M. */
export function tokens(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

/** A short model name: claude-opus-5-5 is "Opus 5.5". */
export function modelName(model: string): string {
  const m = /(opus|sonnet|haiku|fable)[-_ ]?(\d+)(?:[-.](\d+))?/i.exec(model)
  if (!m) return model
  const family = (m[1] ?? '').charAt(0).toUpperCase() + (m[1] ?? '').slice(1).toLowerCase()
  return `${family} ${m[2]}${m[3] ? `.${m[3]}` : ''}`
}

export function cut(text: string, max: number): string {
  const chars = [...text]
  return chars.length <= max ? text : max <= 1 ? '' : `${chars.slice(0, max - 1).join('')}…`
}

/** An agent's status mark: a pulsing dot, a tick or a cross. */
export function mark(a: AgentRow, now: number): Piece {
  if (a.status === 'done') return { text: '✓', color: '#34b98a' }
  if (a.status === 'failed') return { text: '✕', color: '#e5534b' }
  return { text: '●', color: Math.floor(now / 500) % 2 === 0 ? '#e8794a' : '#7a3f26' }
}

/** The agents the band shows, running ones first: those at work, and those that ended a moment ago. */
export function stripCrew(rows: readonly AgentRow[], now: number): AgentRow[] {
  const working = rows.filter(a => a.status === 'running' && now - (a.activeAt ?? a.startedAt) < STRIP_STALE_MS)
  const ended = rows.filter(a => a.status !== 'running' && a.endedAt !== null && now - a.endedAt < STRIP_HOLD_MS)
  return [...working, ...ended]
}

/** How many agents fit side by side in `w` cells. */
export const stripFits = (w: number) => Math.max(1, Math.floor(w / STRIP_CELL))

/** The band's strip: agents side by side in three rows, each a critter beside its name, task and time. */
export function strip(crew: readonly AgentRow[], w: number, now: number): Piece[][] {
  const text = Math.floor(w / Math.max(1, crew.length)) - 7 // less the critter (4), its gap (2) and a gap before the next
  const rows: Piece[][] = [[], [], []]
  for (const a of crew) {
    const critter = mascot(a, now)
    const who = characterOf(a)
    const lines: Piece[][] = [
      [{ text: cut(who?.name ?? a.type, text - 2), color: who?.color ?? typeColor(a.type), bold: true }, { text: ' ' }, mark(a, now)],
      [{ text: cut(a.title, text) }],
      [{ text: cut(`${duration((a.endedAt ?? now) - a.startedAt)} · ${a.lastTool || 'starting'}`, text), dim: true }],
    ]
    lines.forEach((line, r) => {
      const used = line.reduce((n, p) => n + [...p.text].length, 0)
      rows[r]?.push(...(critter[r] ?? []), { text: '  ' }, ...line, { text: ' '.repeat(Math.max(0, text - used) + 1) })
    })
  }
  return rows
}

/** The card's bar: full in the type's color once done, a sparkly sweep while it runs. */
export function bar(a: AgentRow, w: number, now: number): Piece[] {
  const color = a.status === 'failed' ? '#e5534b' : typeColor(a.type)
  if (a.status !== 'running') return [{ text: '▀'.repeat(w), color }]
  const seg = Math.max(3, Math.floor(w / 4))
  const span = Math.max(1, w - seg)
  const t = Math.floor(now / 90) % (2 * span)
  const from = t < span ? t : 2 * span - t
  const tick = Math.floor(now / 250)
  const out: Piece[] = []
  for (let i = 0; i < w; i++) {
    if (i >= from && i < from + seg) out.push({ text: '▀', color })
    else {
      const r = hash(`${i}:${tick}`) / 4294967296
      out.push({ text: r < 0.4 ? (SPARKS[Math.floor(r * 50) % SPARKS.length] ?? '·') : ' ', color: '#5a5670', bg: TRACK_BG })
    }
  }
  return out
}

// ---- anime-crew: the compact strip, one line per agent, laid out in a grid ----

const CHIP = 34 // the fewest cells one agent takes on a line

/** How many agents fit on one line of `w` cells. */
export const chipsPerLine = (w: number) => Math.max(1, Math.floor(w / CHIP))

/** Dark or light text, whichever reads on `bg`. */
function inkOn(bg: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(bg)
  if (!m) return '#111111'
  const n = parseInt(m[1] as string, 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.55 ? '#111111' : '#ffffff'
}

/** One agent as a single line: a bold name badge in the character's color, status, time, and what it is doing now. */
function chip(a: AgentRow, width: number, now: number): Piece[] {
  const who = characterOf(a)
  const name = who?.name ?? a.type
  const color = who?.color ?? typeColor(a.type)
  const time = duration((a.endedAt ?? now) - a.startedAt)
  const doing = a.status === 'done' ? 'done' : a.status === 'failed' ? 'failed' : (a.doing || a.title || 'starting')
  const beat = beatOf(a.type)
  // His own agents say so: "Harvey · Career". Any other agent is a random anime character.
  const badge = beat ? ` ${name} · ${beat} ` : ` ${name} `
  const head = [...badge].length + 1 + 1 + 1 + time.length + 1
  const room = Math.max(4, width - head - 1)
  const pieces: Piece[] = [
    { text: badge, color: inkOn(color), bg: color, bold: true }, { text: ' ' },
    mark(a, now), { text: ' ' },
    { text: time, dim: true }, { text: ' ' },
    { text: cut(doing, room) },
  ]
  const used = pieces.reduce((n, p) => n + [...p.text].length, 0)
  pieces.push({ text: ' '.repeat(Math.max(1, width - used)) })
  return pieces
}

/** The compact strip: agents as one-line chips, `per` to a line, at most `lines` lines. */
export function chips(crew: readonly AgentRow[], w: number, now: number, lines: number): { rows: Piece[][]; shown: number } {
  const per = chipsPerLine(w)
  const shown = Math.min(crew.length, per * lines)
  const width = Math.floor(w / Math.min(per, Math.max(1, shown)))
  const rows: Piece[][] = []
  for (let i = 0; i < shown; i += per) rows.push(crew.slice(i, i + per).flatMap(a => chip(a, width, now)))
  return { rows, shown }
}
