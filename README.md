# TV Launcher

A fullscreen, TV-style (Apple TV / Google TV vibe) launcher for PC.
Built with Electron + React + Tailwind.

## Daily use

Double-click **`TV Launcher.lnk`** in this folder, or copy that shortcut into your
Start Menu (`%APPDATA%\Microsoft\Windows\Start Menu\Programs`).

It starts the fast unpacked build in `release\win-unpacked\` — no terminal, no dev
server, no desktop icon.

`release\TV Launcher.exe` is a portable single-file build of the same app, handy for
copying elsewhere. It unpacks itself on launch, so it starts slower.

## Controls

| Keys | Action |
| --- | --- |
| Arrows | Browse; in a details panel, choose an action |
| Enter | Open details for a match; run the highlighted action; on the shelves, open a series or play a film |
| Backspace / Home | Close details, then return to search results, then the shelves |
| `/` or `F` | Open the search bar and find films and shows |
| S | Add or replace the TMDB token |
| Esc / Ctrl+Q / Exit button | Quit to Windows |

Inside the details panel or search dialog, Esc closes that layer first; press it
again on the shelves to quit. Ctrl+Q and the Exit button always quit.

## Dev

```bash
npm install
npm run dev
```

`npm start` builds and runs the production app without packaging.

## Rebuild the app

Close the launcher first, then:

```bash
npm run package
```

Refreshes `release\win-unpacked\` (what the folder shortcut starts) and rebuilds
the portable `release\TV Launcher.exe`.

## Notes

- Movies and series are scanned from `C:\Mvs`.
- Playback uses VLC (`C:\Program Files\VideoLAN\VLC\vlc.exe`), with a short
  streaming-style intro before the file starts.
- Posters come from TMDB. The token is stored in `%APPDATA%\TV Launcher\.env`
  (or `.env` in this folder during dev) and is never bundled into the exe.
- Press **S** in the app to change the token.
- Click the **Search movies & shows** bar at the top (or press `/` / `F`) to search
  TMDB as you type. Picking a result — by click or Enter — opens a details panel
  with the poster, year, rating, genres, tagline, overview, cast, director or
  creator, runtime or episode count, release date, country, and library status.
- In the details panel, a title already in `C:\Mvs` offers **Play now** (films) or
  **Open series** (shows), plus **More like this**. A title that is not in the
  library offers **More like this** and **View on TMDB**.
- **More like this** loads 12 recommendations; every card opens its own details
  panel. Search results and recommendations are cached for the session.
