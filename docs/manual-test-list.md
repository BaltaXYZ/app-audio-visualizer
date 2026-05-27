# Manuell testlista

Anvand denna lista fore ett steg markeras som klart eller innan en storre UI-andring presenteras.

## Start och grundvy

- Kor `npm install` om beroenden saknas.
- Kor `npm run dev` och oppna Vite-adressen i en desktop- eller laptopwebblasare.
- Kontrollera att vansterdelen visar tabbarna `Files`, `Lyrics` och `Visual`.
- Kontrollera att hogerdelen hela tiden visar live-preview, ljudspelare och export.
- Byt mellan tabbarna och kontrollera att bara vald tabs innehall visas i vansterdelen.
- Minska webblasarfönstret och kontrollera att tabbad arbetsyta hamnar fore preview/spelare/export.

## Filer

- Oppna tabben `Files`.
- Valj en vanlig bildfil, till exempel PNG, JPG, SVG eller WebP.
- Kontrollera att bilden visas i previewn med bibehallen aspect ratio.
- Valj en annan bildfil och kontrollera att previewn uppdateras utan layoutskifte.
- Forsok valja en ljudfil i bildinputen och kontrollera att appen visar begripligt fel.
- Valj en vanlig ljudfil, till exempel WAV, MP3, M4A, OGG eller FLAC.
- Kontrollera att ljudspelaren visar filnamn och duration nar metadata finns.
- Forsok valja en bildfil i ljudinputen och kontrollera att appen visar begripligt fel.
- Forsok valja en trasig eller ej spelbar ljudfil och kontrollera att appen visar begripligt fel.

## Visualiseringar

- Oppna tabben `Visual`.
- Oppna dropdown-listan och kontrollera att minst tio visualiseringar finns.
- Byt mellan flera visualiseringar och kontrollera att previewns namn och settings-panel uppdateras.
- Andra minst ett reglage for tre olika visualiseringar och kontrollera att previewn uppdateras direkt.
- Anvand `Reset settings` och kontrollera att reglagen atergar till rimliga standardvarden.
- Valj en positionerad visualisering, dra kontrollpunkten i previewn och kontrollera att effekten flyttas.
- Anvand `Center position` och kontrollera att effekten flyttas tillbaka till mitten.

## Bildrorelse

- Oppna tabben `Visual`.
- Kontrollera att `Image motion` ar avstangt som standard.
- Aktivera `Motion enabled`.
- Valj en riktning, till exempel `Right` eller `Up Right`.
- Valj `Zoom In Out` och kontrollera att bilden zoomar mjukt utan snabba hopp.
- Valj `Organic Drift` och kontrollera att bilden ror sig langsamt med oregelbunden pan/zoom.
- Andra `Speed` och `Zoom room` och kontrollera att bakgrundsbilden panorerar/zoomar mjukt.
- Anvand `Reset motion` och kontrollera att rorelsen stangs av och standardvarden aterstalls.

## Lattext

- Oppna tabben `Lyrics`.
- Klistra in giltig LRC-text med flera tidskoder och klicka `Apply lyrics`.
- Kontrollera att textfältet ar brett, hogt och inte mjukradbryter langa LRC-rader.
- Kontrollera att aktuell timingrad visas under timingkontrollerna.
- Starta ljudet och kontrollera att aktiv textrad byts i previewn nar ljudtiden passerar nasta tidskod.
- Klistra in vanlig text utan tidskoder och kontrollera att appen visar att assisterad timing behovs.
- Anvand `Set time` pa en rad och kontrollera att tiden uppdateras.
- Anvand `Set time & next` medan ljudet spelar och kontrollera att nasta rad markeras.
- Kontrollera att tiden skrivs in i textfältet som LRC, till exempel `[00:12.30] Text`.
- Andra en tidsstämpel eller textrad manuellt och kontrollera att `Unapplied changes` visas.
- Klicka `Apply lyrics` och kontrollera att previewn anvander den nya tiden/texten.
- Anvand `Clear timing` och kontrollera att hakparentestiderna tas bort men textraderna finns kvar.
- Testa stilarna `Subtitle`, `Center lyric`, `Karaoke current/next` och `Poster block`.
- Testa positionerna `Top`, `Center` och `Bottom`.
- Kontrollera att texten inte klipps i 16:9, 9:16, 1:1 och 4:5.

## Videoexport

- Kontrollera att `Download video` ar avstangd innan bild och ljud har valts.
- Ladda bild och ljud, och kontrollera att exportknappen blir aktiv.
- Kontrollera att `Download format` innehaller MP4 och WebM.
- Valj MP4 om webblasaren stoder det och klicka `Download video` for att spela in en kort testvideo.
- Kontrollera att `Save video` visas nar inspelningen ar klar.
- Klicka `Save video` och kontrollera att filen laddas ned.
- Kontrollera att filen sparas med `.mp4`, innehaller video och ljud och foljer valt videoformat.
- Importera lattext och kontrollera att texten syns i exporterad video.
- Byt `Video format`, till exempel fran 16:9 till 9:16, och kontrollera att exportpanelen visar motsvarande exportstorlek.
- Om MP4 inte stods i aktuell webblasare, kontrollera att appen visar begripligt besked och att WebM kan anvandas som alternativ nar det stods.

## Ljudreaktion

- Starta ljuduppspelning.
- Kontrollera att `Sound reaction` gar fran vantande lage till aktivt lage.
- Kontrollera att minst en frekvensbaserad visualisering reagerar tydligt under uppspelning.
- Kontrollera att varje visualisering har `Audio response`.
- Dra upp `Audio response` for minst tre olika visualiseringar och kontrollera att musikreaktionen blir tydligare.
- Pausa ljudet och kontrollera att appen inte tappar layout eller kraschar.
- Soka i ljudfilen och kontrollera att uppspelning och preview fortsatter fungera.

## Teknisk grind

- Kor `npm test`.
- Kor `npm run build`.
- Om nagon kontroll misslyckas ska status vara `UNDERKÄNT - KRÄVER INTERN ÅTGÄRD` tills bristen ar atgardad och kontrollerna har korts om.
