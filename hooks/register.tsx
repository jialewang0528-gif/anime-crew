import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AgentRow, Agents, Bar, Board } from '../types'
import { bar, chips, chipsPerLine, cut, duration, mark, mascot, modelName, stripCrew, tokens, typeColor } from './agents'
import { beatOf, characterOf, pickCast } from './anime'
import { row } from './pill'
import type { Piece } from './pill'
import { ingest, isTaskName, needsRead, settle } from './watch'
import type { Call, TaskFile } from './watch'
import { parse } from './parse'

// Reads the same task files that Simple Progress Bars' `claude-progress` writes,
// with that plugin's own tracking (bar.ts, parse.ts, watch.ts, MIT), and draws them as pills.

const board = atom({ plugin: 'anime-crew', key: 'board' } as const, { bars: [], now: 0 } as Board)
const agents = atom({ plugin: 'anime-crew', key: 'agents' } as const, { rows: [], now: 0 } as Agents)

const PANE = 'anime-crew-agents'
const PANE_TITLE = 'Agents'
// `/agents` ships with Claude Code, and $.command.register refuses a built-in's name.
const COMMAND = 'anime-agents'

const TICK_MS = 250 // also the sparkle frame rate
const ID_CHECK_TICKS = 4
const CALL_KEEP_MS = 60_000
const INDENT = 2
const MAX_ROWS = 3
const STRIP_LINES = 2 // the compact strip's most lines
const LOG_KEEP = 8

type Watch = {
  base: string | null
  dirs: string[]
  calls: Call[]
  hidden: Map<string, number>
  isBusy: boolean
  ticks: number
}

/** Lists one session directory. Reads only the files that changed, and skips hidden ones. */
async function readDir($: EngineInterface, w: Watch, dir: string, byKey: ReadonlyMap<string, Bar>): Promise<TaskFile[]> {
  const entries = await $.fs.list(dir).catch(() => [])
  const tasks = entries.filter(e => e.kind === 'file' && isTaskName(e.name))
    .filter(e => w.hidden.get(`${dir}/${e.name}`) !== e.mtimeMs)
  return Promise.all(tasks.map(async (entry): Promise<TaskFile> => {
    const key = `${dir}/${entry.name}`
    w.hidden.delete(key)
    const changed = needsRead(byKey.get(key), entry.mtimeMs) ? parse(await $.fs.read(key).catch(() => '')) : null
    return { key, name: entry.name, mtimeMs: entry.mtimeMs, update: changed }
  }))
}

async function track<T>($: EngineInterface, w: Watch, isBackground: boolean | undefined, run: () => Promise<T>): Promise<T> {
  if (isBackground) return run()
  const call: Call = { start: await $.clock.now(), end: null }
  w.calls.push(call)
  try {
    return await run()
  } finally {
    call.end = await $.clock.now()
  }
}

const base = (p: string) => p.split('/').filter(Boolean).pop() ?? p
const str = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '')

/** A short line for a tool call: the tool and the one argument that says what it's doing. */
function summarize(tool: string, i: Record<string, unknown>): string {
  const name = tool.startsWith('mcp__') ? tool.split('__').pop() ?? tool : tool
  const pick =
    str(i.description) || str(i.command) ||
    (str(i.file_path) && base(str(i.file_path))) || (str(i.path) && base(str(i.path))) ||
    str(i.pattern) || str(i.query) || str(i.url) || str(i.prompt) || str(i.action) || str(i.text)
  return pick ? `${name}: ${pick}` : name
}

export const register: Register = on => {
  const w: Watch = { base: null, dirs: [], calls: [], hidden: new Map(), isBusy: false, ticks: 0 }
  let home: string | null = null
  let portraits: string | null = null

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const [configDir, homeDir, profile, id] = await Promise.all([
      $.env.get('CLAUDE_CONFIG_DIR'), $.env.get('HOME'), $.env.get('USERPROFILE'), $.session.id(),
    ])
    home = homeDir || profile || null
    portraits = (await $.env.get('ANIME_CREW_PORTRAITS')) || null
    const config = configDir || (home ? `${home}/.claude` : null)
    if (config !== null) {
      w.base = `${config}/progress`
      w.dirs = [`${w.base}/${id}`]
      const tick = async () => {
        if (w.base === null || w.isBusy) return
        w.isBusy = true
        try {
          w.ticks += 1
          if (w.ticks % ID_CHECK_TICKS === 0) {
            const dir = `${w.base}/${await $.session.id()}`
            if (!w.dirs.includes(dir)) w.dirs.push(dir)
          }
          const now = await $.clock.now()
          const prev = await read($, board)
          w.calls = w.calls.filter(c => c.end === null || now - c.end < CALL_KEEP_MS)
          const byKey = new Map(prev.bars.map(b => [b.key, b]))
          const files = (await Promise.all(w.dirs.map(d => readDir($, w, d, byKey)))).flat()
          const { bars, expired } = settle(ingest(byKey, files), w.calls, now)
          for (const b of expired) w.hidden.set(b.key, b.updatedAt)
          // Redraw every tick while a bar shows, so the sparkles and the critter move.
          if (bars.length > 0 || prev.bars.length > 0) await update($, board, () => ({ bars, now }))
          // The agents' clock: times, sweeps and critters move while an agent runs, and the band's
          // strip keeps time until a finished agent's moment there is over.
          const crew = await read($, agents)
          if (crew.rows.some(a => a.status === 'running') || stripCrew(crew.rows, crew.now).length > 0) {
            await update($, agents, s => ({ ...s, now }))
          }
        } finally {
          w.isBusy = false
        }
      }
      $.clock.every(TICK_MS, () => void tick())
    }
        await $.command.register({ name: COMMAND, description: 'Open the Agents pane: what each subagent is doing, its recent steps, tokens and time' })
    return result
  })

  on('command.run', { command: COMMAND }, async $ => {
    await $.ui.open({ id: PANE, title: PANE_TITLE })
    return { text: 'Agents pane opened.' }
  })

  // A subagent starts: it gets a card, and the pane opens.
  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    const id = started.agentId
    if (id !== undefined) {
      const now = await $.clock.now()
      const prior = await read($, agents)
      const taken = new Set(prior.rows.filter(a => a.status === 'running' && a.cast).map(a => a.cast as string))
      const fresh: AgentRow = {
        id, title: e.description || e.subagentType, type: e.subagentType, model: started.model ?? '',
        status: 'running', startedAt: now, activeAt: now, endedAt: null, tools: 0, lastTool: '', tokens: 0,
        doing: 'starting', log: [], cast: pickCast(id, taken),
      }
      // A new batch, after every earlier agent finished, starts a clean pane.
      await update($, agents, s => {
        const isNewBatch = s.rows.every(a => a.status !== 'running')
        return { rows: [...(isNewBatch ? [] : s.rows.filter(a => a.id !== id)), fresh], now }
      })
      void $.ui.open({ id: PANE, title: PANE_TITLE })
    }
    return started
  })

  on('tool.call', async ($, e, next) => {
    const id = e.agentId
    if (id !== undefined) {
      const now = await $.clock.now()
      // An agent that started before this mod loaded has no card yet: give it one now.
      const known = (await read($, agents)).rows.some(a => a.id === id)
      if (!known) {
        await update($, agents, s => {
          const taken = new Set(s.rows.filter(a => a.status === 'running' && a.cast).map(a => a.cast as string))
          const row: AgentRow = {
            id, title: 'subagent', type: 'agent', model: '', status: 'running', startedAt: now, activeAt: now,
            endedAt: null, tools: 0, lastTool: '', tokens: 0, doing: 'working', log: [], cast: pickCast(id, taken),
          }
          return { ...s, rows: [...s.rows, row], now }
        })
        void $.ui.open({ id: PANE, title: PANE_TITLE })
      }
      await update($, agents, s => ({
        ...s, rows: s.rows.map(a => {
          if (a.id !== id) return a
          const doing = summarize(e.tool, e as unknown as Record<string, unknown>)
          const log = [...(a.log ?? []), { at: now, text: doing }].slice(-LOG_KEEP)
          return { ...a, tools: a.tools + 1, lastTool: e.tool, activeAt: now, doing, log }
        }),
      }))
    }
    return next(e)
  })

  // A subagent's run ends: its card turns done (or failed) and counts the run's tokens.
  on('turn.complete', async ($, e, next) => {
    const id = e.agentId
    if (id !== undefined) {
      const now = await $.clock.now()
      const u = e.usage
      const used = u ? u.input_tokens + u.output_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens : 0
      const status: AgentRow['status'] = e.reason === 'answer' ? 'done' : 'failed'
      await update($, agents, s => ({
        now,
        rows: s.rows.map(a => (a.id === id
          ? { ...a, status, endedAt: now, tokens: a.tokens + used, model: u?.model ?? a.model }
          : a)),
      }))
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const { Box, Text } = ui
    const Image = 'Image' in ui ? ui.Image : null
    const { rows, now } = await read($, agents)
    const usage = await $.session.usage().catch(() => null)
    const w = Math.max(28, (e.viewport?.columns ?? 48) - 2)

    if (rows.length === 0) {
      return (
        <Box flexDirection="column" paddingTop={1}>
          <Text dimColor>No agents yet. Cards appear here while subagents run.</Text>
        </Box>
      )
    }

    const first = Math.min(...rows.map(a => a.startedAt))
    const isRunning = rows.some(a => a.status === 'running')
    const last = isRunning ? now : Math.max(...rows.map(a => a.endedAt ?? now))
    const total = rows.reduce((n, a) => n + a.tokens, 0)
    const cost = usage?.cost ? `≈$${usage.cost.usd.toFixed(2)}` : '—'
    const running = rows.filter(a => a.status === 'running')
    const finished = rows.filter(a => a.status !== 'running').sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))

    const metric = (label: string, value: string) => (
      <Box key={label} flexDirection="column" borderStyle="round" borderColor="#3a3848" paddingX={1} flexGrow={1}>
        <Text dimColor>{label}</Text>
        <Text bold>{value}</Text>
      </Box>
    )

    // Agents with a beat (Jarvis, Harvey...) can show a real portrait: <key>-working.png, <key>-done.png, <key>.png.
    // Put them in ~/.claude/anime-crew/portraits, or point ANIME_CREW_PORTRAITS at another folder.
    const portrait = (a: AgentRow): string | null => {
      const key = a.type.toLowerCase()
      if (home === null || beatOf(a.type) === null) return null
      const suffix = a.status === 'running' ? '-working' : a.status === 'done' ? '-done' : ''
      return `${portraits ?? `${home}/.claude/anime-crew/portraits`}/${key}${suffix}.png`
    }
    const card = (a: AgentRow) => {
      const photo = portrait(a)
      const color = typeColor(a.type)
      const critter = mascot(a, now)
      const who = characterOf(a)
      const status = mark(a, now)
      const info = w - 6
      const right = `${tokens(a.tokens)} · ${duration((a.endedAt ?? now) - a.startedAt)}`
      const steps = a.tools === 0 ? 'starting' : `${a.tools} tool${a.tools === 1 ? '' : 's'}${a.lastTool ? ` · ${a.lastTool}` : ''}`
      const lines: { text: string; color?: string; bold?: boolean; dim?: boolean }[][] = [
        [{ text: cut(a.title, info - 3).padEnd(info - 2), bold: true }, { text: ` ${status.text}`, color: status.color }],
        [
          ...(who ? [{ text: `${who.name} `, color: who.color, bold: true }] : []),
          beatOf(a.type) ? { text: `your ${beatOf(a.type)} agent`, color, bold: true } : { text: cut(a.type, 20), color },
          { text: ` ${modelName(a.model)}`, dim: true },
        ],
        [{ text: cut(steps, info - right.length - 1).padEnd(info - right.length), dim: true }, { text: right, dim: true }],
      ]
      const recent = (a.log ?? []).slice(-5).reverse()
      return (
        <Box key={a.id} flexDirection="column" paddingTop={1}>
          {photo !== null && Image !== null ? (
            <Box key="head" flexDirection="row" gap={2}>
              <Image key={`face-${a.id}`} source={{ file: photo, format: 'png' }} columns={10} rows={5} alt={who?.name ?? a.type} />
              <Box flexDirection="column">
                {lines.map((line, r) => (
                  <Box key={`p${r}`} flexDirection="row">
                    {line.map((p, i) => (
                      <Text key={`t${i}`} color={p.color} bold={p.bold} dimColor={p.dim} wrap="truncate">{p.text}</Text>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : lines.map((line, r) => (
            <Box key={`r${r}`} flexDirection="row">
              {(critter[r] ?? []).map((p, i) => (
                <Text key={`m${i}`} color={p.color} backgroundColor={p.bg} bold={p.bold}>{p.text}</Text>
              ))}
              <Text>  </Text>
              {line.map((p, i) => (
                <Text key={`t${i}`} color={p.color} bold={p.bold} dimColor={p.dim} wrap="truncate">{p.text}</Text>
              ))}
            </Box>
          ))}
          {a.status === 'running' && a.doing ? (
            <Box key="now" paddingLeft={6}><Text color={color} bold>Now </Text><Text wrap="truncate">{cut(a.doing, w - 10)}</Text></Box>
          ) : null}
          {recent.map((r, i) => (
            <Box key={`l${i}`} paddingLeft={6}><Text dimColor wrap="truncate">{duration(r.at - a.startedAt).padStart(5)}  {cut(r.text, w - 14)}</Text></Box>
          ))}
          <Box key="bar" flexDirection="row">
            {bar(a, w, now).map((p, i) => (
              <Text key={`b${i}`} color={p.color} backgroundColor={p.bg}>{p.text}</Text>
            ))}
          </Box>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          {metric('Session cost', cost)}
          {metric('Agent tokens', tokens(total))}
          {metric('Time', duration(last - first))}
        </Box>
        {running.length > 0 && <Box paddingTop={1}><Text dimColor>Running · {running.length}</Text></Box>}
        {running.map(card)}
        {finished.length > 0 && <Box paddingTop={1}><Text dimColor>Finished · {finished.length}</Text></Box>}
        {finished.map(card)}
      </Box>
    )
  })

  // Both plugins sit in the user tier, and Simple Progress Bars may run first and draw the band
  // without passing it on. Its board is emptied as it is written, so it always passes the band to us.
  on('state.set', { plugin: 'simple-progress-bars', key: 'board' }, ($, e, next) => next({ ...e, value: { bars: [], now: 0 } }))

  on('tool.call', { tool: 'Bash' },($, e, next) => track($, w, e.run_in_background, () => next(e)))

  // Answers the band itself, without `next`: the plain bars beneath are replaced, not doubled.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const { bars, now } = await read($, board)
    const team = await read($, agents)
    if (e.props.hasSurvey) return next(e)

    // A terminal's pane is known to be on screen, so it stands in for the strip. Whether a desktop
    // window paints a placed pane can't be told from here, so there the strip shows regardless.
    const hasPane = e.surface === 'terminal' && (await $.ui.panes()).some(p => p.id === PANE && p.isPlaced && p.isShown)
    // Agents live in the side pane now, not above the prompt.
    const crew: AgentRow[] = []
    void hasPane
    const width = e.props.bodyColumns - INDENT - 1
    const shown = bars.slice(0, Math.min(MAX_ROWS, e.props.maxRows))
    const more = bars.length - shown.length
    const room = e.props.maxRows - shown.length - (more > 0 ? 1 : 0) - 1
    const fit = Math.max(0, Math.min(STRIP_LINES, room, Math.ceil(crew.length / chipsPerLine(width))))
    const { rows: lines, shown: seen } = fit > 0 ? chips(crew, width, team.now, fit) : { rows: [], shown: 0 }
    const unseen = crew.length - seen
    if (shown.length === 0 && lines.length === 0) return next(e)
    const running = crew.filter(a => a.status === 'running').length
    const { Box, Text, Button } = $.ui.resolve(e)
    const openPane = () => void $.ui.open({ id: PANE, title: PANE_TITLE, focus: true })
    return (
      <Box flexDirection="column">
        {lines.length > 0 ? (
          <Box key="head" flexDirection="row" paddingLeft={INDENT} gap={1}>
            <Text dimColor>{running} agent{running === 1 ? '' : 's'} working{unseen > 0 ? ` · +${unseen} more` : ''}</Text>
            <Button key="open-agents" label="see what they're doing" plain onPress={openPane} />
          </Box>
        ) : null}
        {lines.map((line, r) => (
          <Box key={`strip${r}`} flexDirection="row" paddingLeft={INDENT}>
            {line.map((p: Piece, i) => (
              <Text key={String(i)} color={p.color} backgroundColor={p.bg} bold={p.bold} dimColor={p.dim} wrap="truncate">{p.text}</Text>
            ))}
          </Box>
        ))}
        {shown.map(bar => (
          <Box key={bar.key} flexDirection="row" paddingLeft={INDENT}>
            {row(bar, width, now).map((p: Piece, i) => (
              <Text key={String(i)} color={p.color} backgroundColor={p.bg} bold={p.bold} dimColor={p.dim} wrap="truncate">{p.text}</Text>
            ))}
          </Box>
        ))}
        {more > 0 ? <Box key="more" paddingLeft={INDENT}><Text dimColor>+{more} more</Text></Box> : null}
      </Box>
    )
  })
}
