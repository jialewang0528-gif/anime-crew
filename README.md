# anime-crew

A compact anime strip for Claude Code subagents, forked from Sparkle Anime Agents (MIT). Each running agent is one line above the prompt: a little anime face, the character's name, a status dot, the time it has been running and what it is doing right now (its latest tool call). About four agents fit per line, two lines max. The cast spans Jujutsu Kaisen, Attack on Titan, My Hero Academia, Dragon Ball, Chainsaw Man, Spy x Family, Hunter x Hunter, Bleach, Death Note, Solo Leveling, Frieren, Naruto, Demon Slayer and One Piece; no two running agents share a character. Press "see what they're doing" or run /anime-agents to open the Agents pane with each agent's current step and recent activity. Unofficial fan project; sprites are original pixel drawings.

## Install

At the prompt of a terminal session:

```
/plugin install anime-crew --marketplace jialewang0528-gif/anime-crew
```

Answer `y` to add the marketplace, then press Enter for the user scope.

From a shell:

```bash
claude plugin install anime-crew --marketplace jialewang0528-gif/anime-crew
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `jialewang0528-gif/anime-crew`, then **Add plugin**.

If you also have Sparkle Anime Agents installed, turn it off so you don't get two agent strips.

## Portraits (optional)

Subagent types named Jarvis, Harvey, Ayanokoji, Leo, Jotaro, Hermes or Rohan get their own looks and a beat label. To show a real portrait for one in the Agents pane, put `<name>.png`, `<name>-working.png` and `<name>-done.png` (lowercase) in `~/.claude/anime-crew/portraits`, or set `ANIME_CREW_PORTRAITS` to another folder.

## Credits

Forked from [Sparkle Anime Agents](https://github.com/gzliang6547/sparkle-anime-agents) by Zhen Liang (MIT). `hooks/bar.ts`, `hooks/parse.ts` and `hooks/watch.ts` come from Simple Progress Bars by Max Hunter (MIT); see the license files. Unofficial fan project, not affiliated with the rights holders of any anime named here; the sprites are original pixel drawings.
