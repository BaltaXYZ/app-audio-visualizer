# Kanda begransningar

## Nuvarande version

- Appen sparar inte projekt till disk och laddar inte om tidigare projekt.
- Export av video eller bildsekvens ar forberett i arkitekturen men inte implementerat.
- Endast en aktiv visualisering renderas at gangen.
- Varje visualisering har en sparad position, men det finns annu inte flera instanser av samma visualisering.
- Dragbar position anvander en gemensam fokuspunkt. Flera kontrollpunkter per visualisering finns inte.
- Beatdetektering ar en enkel energitopp-/transientmodell, inte professionell taktanalys.
- Ljuduppspelning och codec-stod beror pa webblasaren.
- Uppladdade filer finns bara i den aktuella webblasarsessionen.
- Inställningar sparas i React state och forsvinner vid sidomladdning.
- Ken Burns-liknande bildrorelse finns i live-previewn, men export av rorelsen till video ar inte implementerad.
- Appen ar responsiv for smala webblasarfönster och surfplattor, men ar inte designad som en utpraglad mobilapp.

## Avsiktlig avgransning

Foljande ar framtida funktioner och ska inte beskrivas som klara:

- Projektsparning och import.
- Videoexport.
- Fardiga mallar och presets.
- Flera samtidiga visualiseringar.
- Tidslinje och keyframes.
- Text eller lattext ovanpa previewn.
- AI-hjalp for stilforslag.
