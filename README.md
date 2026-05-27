# Audio Visualizer Studio

En lokal webbapp for att bygga musikvisualiseringar. Primar malform ar desktop- och laptopwebblasare, med responsivt stod for smalare webblasarfönster. Appen hanterar bild och ljud lokalt i webblasaren, analyserar ljud med Web Audio API och visar resultatet direkt i en canvasbaserad live-preview.

## Kom igang

```bash
npm install
npm run dev
```

Oppna den lokala adress som Vite skriver ut, vanligtvis `http://localhost:5173`.

## Funktioner i aktuell version

- Lokal bilduppladdning och lokal ljuduppladdning.
- Native ljudspelare med metadata och Web Audio-baserad ljudanalys.
- Dropdown med elva visualiseringar.
- Automatiska effektreglage for vald visualisering.
- `Audio response`-reglage for att gora visualiseringarnas musikreaktion tydligare eller mer subtil.
- Reset av effektinställningar och centrering av positionerade effekter.
- Dragbar position for visualiseringar som har en fokuspunkt.
- Valfri Ken Burns-liknande bildrorelse for bakgrunden, inklusive pan, zoom och organisk drift.
- LRC-/texteditor for lattext med assisterad timing och fyra canvasritade textstilar.
- Videonedladdning via WebCodecs utan realtidsinspelning, med MP4 nar webblasaren stoder det och WebM som alternativ.
- Serialiserbar projektmodell for framtida sparning/export.

## Kontrollera bygget och tester

```bash
npm test
npm run build
```

## Dokumentation

- Manuell testlista: `docs/manual-test-list.md`
- Kända begränsningar: `docs/limitations.md`
- Arkitektur: `docs/architecture.md`
- Verifieringsrapporter: `docs/step-*-verification.md`

## Omfang i aktuell version

- Bild och ljud hanteras lokalt i webblasaren.
- Inga filer skickas till server.
- Web Audio-analys driver visualiseringarna.
- Dropdown-listan innehaller elva visualiseringar.
- Reglage visas automatiskt utifran vald visualisering.
- Samtliga visualiseringar har ett `Audio response`-reglage.
- Positionerade visualiseringar kan flyttas med dragpunkten i previewn.
- Bakgrundsbilden kan ges valfri pan/zoom/organisk rorelse via `Image motion`.
- Lattext kan redigeras som LRC eller vanlig text, tidsattas manuellt och ritas direkt i canvasen.
- Videoexport sker lokalt i webblasaren, foljer valt videoformat och startar inte ljuduppspelning.
- Flera samtidiga visualiseringar och mer avancerad tidslinje/AI-hjalp byggs i senare steg.
