# Steg 12-verifiering: Separat Filters-tabb

## Scope

Steget lagger till en separat `Filters`-tabb for lokala audio-reactive bildfilter. Filtren sparas i app-state, ingar i `ProjectSnapshot`, ritas i den gemensamma canvasrenderingen och foljer med i videoexportens renderflode.

## Filer och funktioner

- `src/types/imageEffects.ts`: filtermodell, presets och standardinstallningar.
- `src/components/ImageFiltersPanel.tsx`: separat UI-panel for filter.
- `src/canvas/imageEffects.ts`: ren berakning av filterrespons samt canvasritning.
- `src/canvas/renderPreviewFrame.ts`: filterritning efter bakgrund och fore visualisering/lattext.
- `src/utils/videoExport.ts`: exporten tar med samma filterstate som previewn.
- `src/state/appReducer.ts` och `src/state/projectSnapshot.ts`: state, actions och serialisering.

## Automatisk verifiering

- `npm test`: GODKÄNT, 13 testfiler och 50 tester passerade.
- `npm run build`: GODKÄNT, TypeScript och Vite-build passerade.
- `git diff --check`: GODKÄNT, inga whitespacefel.

## Browserkontroll

Dev-server startad pa `http://127.0.0.1:5174/app-audio-visualizer/`.

Verifierat i lokal browser:

- `Filters` visas som separat workbench-tabb bredvid `Visual` och `Ken Burns`.
- Filterpanelen visar rubriken `Image filters`.
- `Filters enabled` ar avstangt som standard.
- Statusraden visas utan bakgrundsbild: `Choose a background image to see filters in the preview.`
- Preset `Glitch flash` kan valjas och uppdaterar reglagen till presetvarden.
- Browserns konsol hade inga fel efter kontrollen.

Praktisk kontroll med uppladdad bild och ljud finns kvar i `docs/manual-test-list.md` for full manuell regressionskontroll.

## Agentgranskning

| Agent | Status | Kommentar |
| --- | --- | --- |
| Produkt- och UX-agent | GODKÄNT | Separat tabb matchar huvudutvecklarens beslut och haller bildfilter skilda fran visualisering och Ken Burns. |
| Ljudanalys-agent | GODKÄNT | Filtren anvander befintlig `AudioFrame` med bas, diskant, transient/beat och energi utan att andra ljudanalysen. |
| Grafik- och interaktionsagent | GODKÄNT | Filter ritas i gemensam canvasrendering efter bakgrund och fore foreground-lager. Canvas-state aterstalls efter filter. |
| Test- och verifieringsagent | GODKÄNT | Reducer, presets, filterberakning, snapshot, bygg och test ar verifierade. |
| Ledaragent / Orchestrator | GODKÄNT | Scope ar genomfort utan att andra visualiseringsval eller Ken Burns-flodet. |

## Slutstatus

GODKÄNT FÖR NÄSTA STEG.
