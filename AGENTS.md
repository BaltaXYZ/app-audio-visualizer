# AGENTS.md

## Projektmal

Detta projekt bygger en webbaserad app for musikvisualisering. Appen ska vara ett kreativt verktyg for icke-tekniska anvandare: bakgrundsbild in, ljudfil in, vald visualisering och reglage ska direkt synas i en live-forhandsvisning.

Forsta versionen ska hantera filer lokalt i webblasaren och inte vara beroende av externa betaltjanster.

Primar malform ar en webapp for desktop- och laptopwebblasare. Granssnittet ska vara responsivt nog for smala webblasarfönster och surfplattor, men projektet ska inte styras som en utpraglad mobilapp.

## Teknisk inriktning

- Frontend: Vite, React och TypeScript.
- Ljudanalys: Web Audio API med `AudioContext`, `AnalyserNode`, tidsdomandata, frekvensdata, energiband och enkel beat-/transientdetektering.
- Grafik: Canvas 2D som forsta renderingsmotor. Det ar tillrackligt for bildbakgrund, partiklar, staplar, ringar, glod, vaga och dragbara 2D-objekt. WebGL/PixiJS/Three.js ska bara laggas till om Canvas 2D inte racker for ett senare krav.
- State: React state med reducer/context i forsta versionen. En extern state-bibliotek ska bara laggas till om stateflodet blir tydligt for stort.
- Uppladdade filer: lokala `File`-objekt och `URL.createObjectURL`. Ingen serveruppladdning i forsta versionen.
- Visualiseringar: gemensamt typat register med metadata, standardinstallningar, kontrollschema och renderfunktion.

## Planerad mappstruktur

```text
.
├── .codex/
│   └── agents/
├── docs/
│   ├── architecture.md
│   ├── step-1-verification.md
│   └── visualizations.md
├── public/
│   └── assets/
├── src/
│   ├── audio/
│   ├── canvas/
│   ├── components/
│   ├── hooks/
│   ├── state/
│   ├── types/
│   ├── utils/
│   └── visualizations/
└── PROJECT_BRIEF.md
```

## Kodstil

- Skriv TypeScript med tydliga typer for app-state, ljuddata, visualiseringsdefinitioner och kontrollschema.
- Hall renderingslogik och React-komponenter separerade: React styr UI och state, canvasmoduler renderar.
- Undvik hardkodade specialfall i komponenter nar samma beteende kan beskrivas i visualiseringens metadata.
- Reglage ska genereras fran vald visualiserings `controls`.
- Namn ska vara begripliga for nasta utvecklare: `audioFrame`, `visualizationRegistry`, `previewStage`, `controlSchema`.
- Kommentarer ska bara laggas dar koden annars blir svar att folja.

## Kvalitetskrav

- Appen ska vara begriplig utan ljudteknisk kunskap.
- Live-forhandsvisning ar central och far inte behandlas som en sekundar vy.
- Ljuddata ska vara praktiskt anvandbar for visualiseringar: bas, mellanregister, diskant, total energi, transient/beat och tidsdomandata.
- Minst tio visualiseringsmetoder ska finnas innan projektet kan godkannas som helhet.
- Visualiseringar ska vara tillrackligt olika i uttryck och kontrollbehov.
- Dragbar placering ska sparas i appens state for visualiseringar som har position.
- Bygg och tester ska koras dar det finns stod. Misslyckad bygg eller test betyder `UNDERKÄNT - KRÄVER INTERN ÅTGÄRD`.
- Om en funktion inte kan verifieras praktiskt far den inte beskrivas som klar.

## Agentroller

### Ledaragent / Orchestrator

Ansvarar for helheten, delar upp arbetet, samlar granskningar och avgor om ett huvudsteg far presenteras. Ledaragenten far inte godkanna ett steg om nagon relevant specialistagent har underkant eller blockerat det.

### Produkt- och UX-agent

Ansvarar for anvandarflode, begriplighet, panelstruktur, knapptexter, reglage och att appen kanns som ett kreativt verktyg snarare an ett tekniskt verktyg.

### Ljudanalys-agent

Ansvarar for Web Audio-arkitektur, ljuddataformat, energiband, beat-/transientdetektering och att ljuddata racker for de visualiseringar som anges.

### Visualiserings-agent

Ansvarar for visualiseringskatalogen, att metoderna ar konkreta, olika varandra och har relevanta ljudinputs och reglage.

### Grafik- och interaktionsagent

Ansvarar for canvasarkitektur, renderloop, koordinatsystem, responsiv forhandsvisning, drag-and-drop och tydlig koppling mellan position i UI och state.

### Test- och verifieringsagent

Ansvarar for byggkontroll, teststrategi, manuell verifieringslista, granskningsrapport och att status satts enligt reglerna.

## Intern arbetsprocess

Varje huvudsteg ska folja denna ordning:

1. Ledaragenten definierar scope for aktuellt huvudsteg.
2. Relevanta agentroller genomfor eller granskar sina delar.
3. Varje specialistagent lamnar status: `GODKÄNT`, `UNDERKÄNT - KRÄVER INTERN ÅTGÄRD` eller `BLOCKERAT`.
4. Vid `UNDERKÄNT - KRÄVER INTERN ÅTGÄRD` atgardas bristerna internt och granskningsrundan kors om.
5. Vid `BLOCKERAT` stoppas arbetet tills saknad information, beslut eller behorighet finns.
6. Ledaragenten gor slutlig grindkontroll.
7. Endast om alla relevanta agentroller ar `GODKÄNT` far steget presenteras som `GODKÄNT FÖR NÄSTA STEG`.

## Statusregler

- `GODKÄNT`: agenten ser inga blockerande brister inom sitt ansvarsomrade.
- `UNDERKÄNT - KRÄVER INTERN ÅTGÄRD`: brist finns men kan losas utan extern input.
- `BLOCKERAT`: arbetet kraver beslut, information, behorighet eller material fran huvudutvecklaren.
- `GODKÄNT FÖR NÄSTA STEG`: slutstatus for ett huvudsteg nar samtliga relevanta agentroller godkant.
- `KRÄVER NYTT INTERNT VARV`: slutstatus om nagot fortfarande maste atgardas internt.

## Blockeringsregler

Markera `BLOCKERAT` nar:

- Ett krav inte kan tolkas tillrackligt sakert utan beslut fran huvudutvecklaren.
- En nodvandig fil, behorighet eller miljoinstallning saknas.
- Teknisk verifiering inte kan goras och det finns hog risk att status annars blir missvisande.

Beskriv alltid vad som blockerar, vilka filer/funktioner som paverkas och vad som redan ar klart.

## Redo for presentation

Ett steg far presenteras for huvudutvecklaren forst nar:

- Alla krav for steget ar uppfyllda eller tydligt avgransade.
- Relevanta agentroller har godkant.
- Eventuella interna forbattringsvarv ar dokumenterade.
- Bygg/test har korts dar det finns stod.
- Verifieringsrapporten anger filer, teststeg, risker och slutstatus.
