# Arkitektur for musikvisualiseringsappen

## Arkitekturval

Appen ska byggas med Vite, React och TypeScript. Vite ger snabb lokal utveckling utan tung konfiguration, React passar for ett styrt granssnitt med uppladdning, val av visualisering och dynamiska reglage, och TypeScript behovs for att halla visualiseringsmodellen stabil nar fler metoder laggs till.

For grafik valjs Canvas 2D i forsta versionen. Appens forsta behov ar 2D-overlagringar ovanpa en bild: cirklar, partiklar, staplar, vagformer, glod, dimma, ljusstralar och kameraeffekter. Canvas 2D ar enklare att forsta, testa och vidareutveckla for detta an en tyngre WebGL-stack. Renderingslagret ska anda hallas avskilt sa att en senare WebGL- eller PixiJS-renderer kan laggas till utan att skriva om hela UI:t.

Ljudet analyseras lokalt med Web Audio API. Ingen ljudfil eller bildfil ska skickas till server i forsta versionen.

## Huvudflode

1. Anvandaren laddar upp eller valjer en bakgrundsbild.
2. Anvandaren laddar upp en ljudfil.
3. Appen skapar lokala objekt-URL:er for filerna.
4. Ljudspelaren kopplas till Web Audio API.
5. En renderloop hamtar aktuell ljudanalys per frame.
6. Vald visualisering renderas pa canvas ovanpa bakgrundsbilden.
7. Reglage uppdaterar vald visualiserings installningar i state.
8. Dragbara visualiseringsobjekt uppdaterar position i state.
9. Eventuell tidsatt lattext valjs ut fran ljudets aktuella tid.
10. Forhandsvisningen ritar om direkt.

## Planerad källkodsstruktur

```text
src/
├── audio/
│   ├── audioAnalyzer.ts
│   ├── audioBands.ts
│   └── beatDetection.ts
├── canvas/
│   ├── previewRenderer.ts
│   ├── coordinateSystem.ts
│   └── dragController.ts
├── components/
│   ├── AppShell.tsx
│   ├── UploadPanel.tsx
│   ├── PreviewStage.tsx
│   ├── VisualizationPicker.tsx
│   └── ControlsPanel.tsx
├── hooks/
│   ├── useAudioFile.ts
│   ├── useBackgroundImage.ts
│   ├── usePreviewLoop.ts
│   └── useDragHandle.ts
├── state/
│   ├── appReducer.ts
│   ├── defaultProject.ts
│   └── projectState.ts
├── types/
│   ├── audio.ts
│   ├── controls.ts
│   ├── project.ts
│   └── visualization.ts
├── utils/
│   ├── clamp.ts
│   ├── color.ts
│   └── fileUrls.ts
└── visualizations/
    ├── registry.ts
    ├── pulseCircle.ts
    ├── beatParticles.ts
    └── ...
```

## Central datamodell

```ts
type AudioFrame = {
  time: number;
  volume: number;
  slowEnergy: number;
  energyDelta: number;
  bass: number;
  mids: number;
  treble: number;
  transient: boolean;
  transientStrength: number;
  beatPulse: boolean;
  beatConfidence: number;
  waveform: Float32Array;
  frequencyData: Uint8Array;
  frequencyBands: {
    bass: number;
    lowMid: number;
    mid: number;
    highMid: number;
    treble: number;
  };
};

type VisualizationDefinition<TSettings> = {
  id: string;
  name: string;
  description: string;
  audioInputs: AudioInputKind[];
  defaultSettings: TSettings;
  controls: ControlDefinition<TSettings>[];
  supportsDrag: boolean;
  supportsPositioning: boolean;
  recommendedFor: "calm" | "fast" | "both";
  render: (context: RenderContext, settings: TSettings, audio: AudioFrame) => void;
};
```

Den exakta TypeScript-implementationen ska skapas i senare steg, men modellen ovan ar styrande: UI:t ska kunna visa namn, beskrivning och reglage fran samma definition som renderaren anvander.

`RenderContext` ska vara den gemensamma kontraktsytan mellan renderaren och varje visualisering:

```ts
type RenderContext = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cssWidth: number;
  cssHeight: number;
  pixelWidth: number;
  pixelHeight: number;
  devicePixelRatio: number;
  stage: {
    width: number;
    height: number;
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  elapsedMs: number;
  deltaMs: number;
  toCanvasPoint: (point: NormalizedPoint) => CanvasPoint;
  toNormalizedPoint: (point: CanvasPoint) => NormalizedPoint;
};
```

`stage` beskriver den faktiska bild-/previewytan inuti canvasen. Det gor att visualiseringar kan ritas mot samma koordinatsystem oavsett om canvasens CSS-storlek, intern pixelstorlek eller bakgrundsbildens proportioner andras.

## App-state

Projektets state ska minst innehalla:

- Bakgrundsbild: lokal URL, dimensioner och eventuell anpassning till scenen.
- Ljudfil: lokal URL, filnamn, duration och uppspelningsstatus.
- Vald visualisering: `visualizationId`.
- Installningar per visualisering: sparade med visualiseringens `id`.
- Positioner: koordinater i normaliserad preview-yta, exempelvis `x: 0.5`, `y: 0.5`.
- Bakgrundsrorelse: av/pa, riktning, hastighet och extra zoomutrymme for Ken Burns-liknande pan/zoom.
- Lattext: applicerade rader, redigerbar drafttext, dirty-status, aktiv timingrad och textstil.
- Preview: scenstorlek, skala, aktiv dragning och renderstatus.
- Visualiseringsinstanser: `instanceId`, `visualizationId`, `settings`, `position`, `zIndex` och eventuell `label`.

Normaliserade koordinater gor att placeringar overlever responsiv storleksandring.

Även om första versionen bara behöver en aktiv visualisering ska state utformas för instanser. Då kan flera samtidiga visualiseringar senare läggas till utan att byta grundmodell:

```ts
type VisualizationInstance = {
  instanceId: string;
  visualizationId: string;
  settings: Record<string, unknown>;
  position?: NormalizedPoint;
  zIndex: number;
};
```

## Projekt-snapshot och videoexport

STEG 5 introducerar en serialiserbar `ProjectSnapshot` i `src/types/project.ts` och skapande funktion i `src/state/projectSnapshot.ts`. Den markerar vilken del av state som kan sparas senare utan att blanda in lokala `File`-objekt eller kortlivade `objectUrl`-varden.

STEG 7 lagger till lokal videoexport via `src/components/ExportPanel.tsx` och `src/utils/videoExport.ts`. Exporten spelar in den valda preview-stage-ytan fran canvasen tillsammans med ljudspelarens ljudstream och skriver en nedladdningsbar fil med browserns `MediaRecorder`. MP4 erbjuds nar aktuell webblasare stoder relevant MP4/H.264/AAC-inspelning; WebM finns som alternativ. Ingen fil skickas till server.

Snapshoten innehaller:

- Schema-version.
- Skapad-tidpunkt.
- Vald visualisering.
- Filreferenser for bild och ljud med namn, typ, storlek och relevant metadata.
- Bakgrundsrorelse for Ken Burns-liknande preview.
- Lattextrader och textinstallningar.
- En aktiv visualiseringsinstans med `instanceId`, `visualizationId`, `settings`, `position` och `zIndex`.
- Sparade settings och positioner per visualisering.

Snapshoten forbereder for:

- Projektsparning och projektimport.
- Flera samtidiga visualiseringsinstanser.
- Mer avancerade exportfloden dar renderaren kan lasa en stabil projektmodell.

Snapshoten ska inte tolkas som ett permanent filformat an. Om projektsparning eller mer avancerad export byggs senare ska formatet versionshanteras och migreringar laggas till.

## Lattext

Lattext hanteras lokalt i `src/utils/lyrics.ts` och state. Appen kan redigera LRC-rader pa formen `[mm:ss.xx] text` eller vanlig text utan tidskoder. Parsern sorterar tidsatta rader, skapar `endTime` fran nasta rad och rapporterar varningar for rader som inte kan tolkas.

Lyrics-editorn arbetar med en drafttext och en applicerad lyrics-lista. Manuella andringar i textfältet markeras som `Unapplied changes` och borjar galla for preview/export forst nar anvandaren klickar `Apply lyrics`. Det gor att halvredigerade tidskoder inte slar igenom i videon.

`PreviewStage` laser aktuell ljudtid fran ljudspelaren och ritar aktiv textrad efter visualiseringarna. Eftersom texten ritas i samma canvas-stage som previewn foljer den med i videoexporten utan separat exportlogik.

Forsta textsteget innehaller fyra stilar:

- `Subtitle`
- `Center lyric`
- `Karaoke current/next`
- `Poster block`

Det finns ingen automatisk transkribering eller extern lattexttjanst i denna version.

## Ljudanalys

`audioAnalyzer` ska kapsla Web Audio API och exponera en enkel frame-baserad modell. Forsta versionen bor ge:

- Total ljudenergi/volym.
- Långsam energihistorik för glöd, dimma och mjuka kameraeffekter.
- Energiförändring mellan snabb och långsam energi.
- Basenergi.
- Mellanregister.
- Diskant.
- Waveform-data for vagformer.
- Frekvensdata for equalizers.
- Transientflagga baserad pa energitoppar och kort historik.
- Approximerad beatpuls som bygger på transienter, cooldown och energitröskel.
- Utjamnade varden sa att visualiseringar inte flimrar.

Beat-detektering ska inte saljas som professionell taktanalys i forsta versionen. Kontraktet ska därför skilja på:

- `transient`: en tydlig kort energitopp i aktuell frame.
- `beatPulse`: en filtrerad puls som lämpar sig för beat-liknande effekter, men fortfarande bara är en approximation.

Frekvensband ska normaliseras till `0..1` så att visualiseringar får jämförbara värden oavsett filvolym. Första implementationen kan använda ungefärliga band:

| Band | Frekvensområde | Användning |
| --- | --- | --- |
| `bass` | 20-250 Hz | Puls, ringar, zoom, basreaktion |
| `lowMid` | 250-500 Hz | Kropp i musik, mjuka rörelser |
| `mid` | 500-2000 Hz | Vågform, generell energi |
| `highMid` | 2000-6000 Hz | Ljusare rörelser, strålar |
| `treble` | 6000-12000 Hz | Diskanttoppar, glitter, strålar |

Normalisering ska kombinera kort historik och klampning:

- Råvärden beräknas från relevanta FFT-bin.
- Ett snabbt envelope-värde används för direkt reaktion.
- Ett långsamt envelope-värde används för `slowEnergy`.
- `energyDelta` beräknas som skillnaden mellan snabb och långsam energi.
- Smoothing ska vara justerbar internt så att snabba visualiseringar kan få piggare data medan dimma/glöd får mjukare data.

## Visualiseringssystem

Alla visualiseringar ska registreras i `src/visualizations/registry.ts`. En visualisering ska inte krava specialskrivna reglage i React. I stallet ska kontrollpanelen lasa `controls` fran vald definition.

Exempel pa kontrolltyper:

- `range`: storlek, intensitet, hastighet, transparens.
- `color`: fargval.
- `select`: reaktionstyp, placering, blandningslage.
- `toggle`: aktivera mjukning, visa centrum, invertera reaktion.

Varje visualisering far ha egna settings, men de ska folja samma kontrollschema.

## Renderloop

`previewRenderer` ska äga canvasens ritcykel och inte vara beroende av React-rendering per bildruta.

Planerad livscykel:

1. `PreviewStage` monteras och skickar canvasreferens, bakgrundsbild och projektstate till renderaren.
2. Renderaren startar `requestAnimationFrame` när previewn är aktiv.
3. Varje frame läser aktuell ljudframe från `audioAnalyzer`. Om ljud saknas eller är pausat används en neutral `AudioFrame` med nollade energivärden, så att previewn fortfarande kan visa statiska visualiseringar.
4. Renderaren rensar canvas, ritar bakgrunden, applicerar eventuell kameraeffekt och ritar aktiva visualiseringsinstanser i `zIndex`-ordning.
5. När komponenten avmonteras, ljudfil byts eller previewn pausas ska animation frame avbrytas och eventuella lyssnare tas bort.
6. Renderaren ska mäta `deltaMs` och skicka det till visualiseringarna så att rörelse inte blir beroende av skärmens uppdateringsfrekvens.

Renderaren ska också hantera `ResizeObserver` för previewytan. När CSS-storleken ändras ska canvasens interna pixelstorlek sättas till `cssSize * devicePixelRatio`, medan ritkommandon arbetar i ett stabilt stage-koordinatsystem.

## Koordinatsystem

Koordinater ska hanteras i tre lager:

- CSS-pixlar: pointer events och layoutens synliga storlek.
- Canvas-pixlar: intern canvasupplösning efter `devicePixelRatio`.
- Normaliserad stage-position: sparad projektposition mellan `0` och `1`.

Konvertering ska ske i `coordinateSystem.ts`, inte i varje visualisering. Hit testing och dragning använder CSS-punkt från pointer event, konverterar till stagepunkt, och sparar därefter normaliserad position.

Vid responsiv resize:

- Bakgrundsbildens aspect ratio behålls.
- `stage.offsetX`, `stage.offsetY` och `stage.scale` beräknas på nytt.
- Sparade normaliserade positioner ritas på rätt plats i den nya scenstorleken.

## UI-struktur

Forsta anvandarflodet ska vara webapp-forst och optimerat for desktop/laptop:

- Vanster eller topp: uppladdning av bild och ljud.
- Mitten: stor live-forhandsvisning.
- Hoger eller botten: val av visualisering och reglage for vald visualisering.
- Ljudspelare nara forhandsvisningen sa att kopplingen mellan musik och bild ar tydlig.

Smalare webblasarfönster ska fa en responsiv staplad layout i begriplig ordning: uppladdning, preview, visualisering, reglage. Detta ar stöd för webbresponsivitet, inte en mobilappsinriktning.

## Drag och interaktion

Visualiseringar med `supportsPositioning` ska ha en dragbar kontrollpunkt i previewn. Positionen ska sparas i state som normaliserade koordinater. Draglogiken ska ligga i canvas/interaktionslagret, inte i varje visualisering, sa att beteendet blir konsekvent.

Planerat dragflöde:

1. `pointerdown`: `dragController` kör hit testing mot aktiva instansers kontrollpunkter i omvänd `zIndex`-ordning.
2. Om träff finns sparas `activeDrag = { instanceId, pointerId, startPoint, startPosition }` i previewstate och pointer capture aktiveras.
3. `pointermove`: CSS-koordinaten konverteras till normaliserad stage-position, klampas till `0..1` och skickas som state-uppdatering för rätt `instanceId`.
4. `pointerup` eller `pointercancel`: pointer capture släpps och `activeDrag` rensas.
5. Renderloop använder nästa state-snapshot och visar flytten direkt.

Hit testing ska utgå från en gemensam drag handle per positionerad instans. En visualisering kan senare exponera fler handles, men första versionen behöver bara centrum-/fokuspunkt.

## Teststrategi

Nar appkod finns ska verifiering ske i tre lager:

- Typkontroll och bygg: `npm run build`.
- Enhetstester dar det ar rimligt: ljudbandsberakning, beatdetektering, reducer och kontrollschema.
- Manuell verifiering: ladda bild, ladda ljud, spela upp, byt visualisering, dra objekt, andra reglage och kontrollera direkt effekt i previewn.

## Framtida utbyggnad

Arkitekturen ska inte blockera sparade projekt, tidslinje eller mer avancerade exportfloden. Darfor ska:

- State vara serialiserbart sa langt som mojligt.
- Renderaren kunna anropas deterministiskt for en given tidpunkt.
- Visualiseringar vara fristaende definitioner.
- Filhantering separeras fran projektdata sa att sparade projekt senare kan aterlanka eller importera filer.
