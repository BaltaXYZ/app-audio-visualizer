# Manuell testlista

Anvand denna lista fore ett steg markeras som klart eller innan en storre UI-andring presenteras.

## Start och grundvy

- Kor `npm install` om beroenden saknas.
- Kor `npm run dev` och oppna Vite-adressen i en desktop- eller laptopwebblasare.
- Kontrollera att appen visar uppladdning till vanster, preview som stor huvudvy och ljudspelare under previewn.
- Minska webblasarfönstret och kontrollera att ordningen blir uppladdning, preview/spelare och sedan visualiseringar.

## Filer

- Valj en vanlig bildfil, till exempel PNG, JPG, SVG eller WebP.
- Kontrollera att bilden visas i previewn med bibehallen aspect ratio.
- Valj en annan bildfil och kontrollera att previewn uppdateras utan layoutskifte.
- Forsok valja en ljudfil i bildinputen och kontrollera att appen visar begripligt fel.
- Valj en vanlig ljudfil, till exempel WAV, MP3, M4A, OGG eller FLAC.
- Kontrollera att ljudspelaren visar filnamn och duration nar metadata finns.
- Forsok valja en bildfil i ljudinputen och kontrollera att appen visar begripligt fel.
- Forsok valja en trasig eller ej spelbar ljudfil och kontrollera att appen visar begripligt fel.

## Visualiseringar

- Oppna dropdown-listan och kontrollera att minst tio visualiseringar finns.
- Byt mellan flera visualiseringar och kontrollera att previewns namn och settings-panel uppdateras.
- Andra minst ett reglage for tre olika visualiseringar och kontrollera att previewn uppdateras direkt.
- Anvand `Reset settings` och kontrollera att reglagen atergar till rimliga standardvarden.
- Valj en positionerad visualisering, dra kontrollpunkten i previewn och kontrollera att effekten flyttas.
- Anvand `Center position` och kontrollera att effekten flyttas tillbaka till mitten.

## Bildrorelse

- Kontrollera att `Image motion` ar avstangt som standard.
- Aktivera `Motion enabled`.
- Valj en riktning, till exempel `Right` eller `Up Right`.
- Andra `Speed` och `Zoom room` och kontrollera att bakgrundsbilden panorerar/zoomar mjukt.
- Anvand `Reset motion` och kontrollera att rorelsen stangs av och standardvarden aterstalls.

## Ljudreaktion

- Starta ljuduppspelning.
- Kontrollera att `Sound reaction` gar fran vantande lage till aktivt lage.
- Kontrollera att minst en frekvensbaserad visualisering reagerar tydligt under uppspelning.
- Pausa ljudet och kontrollera att appen inte tappar layout eller kraschar.
- Soka i ljudfilen och kontrollera att uppspelning och preview fortsatter fungera.

## Teknisk grind

- Kor `npm test`.
- Kor `npm run build`.
- Om nagon kontroll misslyckas ska status vara `UNDERKÄNT - KRÄVER INTERN ÅTGÄRD` tills bristen ar atgardad och kontrollerna har korts om.
