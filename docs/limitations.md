# Kanda begransningar

## Nuvarande version

- Appen sparar inte projekt till disk och laddar inte om tidigare projekt.
- Videoexport kor i realtid i webblasaren. En fyra minuter lang lat tar alltsa ungefar fyra minuter att spela in.
- MP4-export beror pa webblasarens `MediaRecorder`- och codec-stod. WebM finns som alternativ nar MP4 inte stods.
- Det finns ingen separat server- eller WASM-transkodning till MP4.
- Endast en aktiv visualisering renderas at gangen.
- Varje visualisering har en sparad position, men det finns annu inte flera instanser av samma visualisering.
- Dragbar position anvander en gemensam fokuspunkt. Flera kontrollpunkter per visualisering finns inte.
- Beatdetektering ar en enkel energitopp-/transientmodell, inte professionell taktanalys.
- Ljuduppspelning och codec-stod beror pa webblasaren.
- Uppladdade filer finns bara i den aktuella webblasarsessionen.
- Inställningar sparas i React state och forsvinner vid sidomladdning.
- Lattext maste importeras eller skrivas in av anvandaren. Appen gor ingen AI-transkribering och hamtar inte texter fran externa tjanster.
- Karaoke-stilen visar aktuell och eventuell nasta rad, men har inte ord-for-ord- eller stavelsehighlight.
- Appen ar responsiv for smala webblasarfönster och surfplattor, men ar inte designad som en utpraglad mobilapp.

## Avsiktlig avgransning

Foljande ar framtida funktioner och ska inte beskrivas som klara:

- Projektsparning och import.
- Avancerad export med batchjobb, bildsekvens, keyframes eller separat transcoder.
- Fardiga mallar och presets.
- Flera samtidiga visualiseringar.
- Tidslinje och keyframes.
- Automatisk transkribering eller automatisk tidskodning av lattext.
- AI-hjalp for stilforslag.
