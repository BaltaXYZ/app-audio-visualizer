# Visualiseringskatalog

Varje visualisering ska finnas som en egen definition i det gemensamma visualiseringsregistret. Tabellen anger forsta produktionsmalet for varje metod.

| Nr | Namn | Beskrivning | Reagerar pa | Reglage | Svarighet | Passar for |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Pulserande fokuscirkel | En cirkel runt vald punkt som vaxer, krymper och andas med musiken. | Bas, total energi, beatstyrka. | Storlek, pulsstyrka, farg, transparens, mjukhet, reaktionstroskel. | Lag | Lugna och snabba latar |
| 2 | Beat-partiklar | Partiklar skjuts ut fran vald punkt nar energitoppar upptacks. | Beat/transient, bas, total energi. | Antal partiklar, hastighet, livslangd, spridning, storlek, farg, flyt/gravitation. | Medel | Rytmiska och snabba latar |
| 3 | Rorlig vagform | En mjuk linje visar ljudvagen over eller runt bilden. | Waveform, mellanregister, total energi. | Linjetjocklek, hojd, hastighet, farg, transparens, placering, mjukhet. | Lag | Lugna och snabba latar |
| 4 | Frekvensstaplar | Equalizer-staplar langs kant eller vald axel. | Frekvensband, bas, mellanregister, diskant. | Antal staplar, maxhojd, bredd, avstand, farg, placering, rund/rak form. | Medel | Elektronisk och rytmisk musik |
| 5 | Ljusglod som andas | En mjuk glod over bakgrunden som vaxer och minskar med energin. | Total energi, langsam energihistorik, bas. | Intensitet, farg, radie, mjukhet, transparens, reaktionshastighet. | Lag | Lugna och stamningsfulla latar |
| 6 | Sprite-objekt som hoppar | Sma objekt eller enkla former hoppar, skakar eller roterar pa energitoppar. | Beat/transient, bas, plotsliga energitoppar. | Storlek, rorelsestyrka, rotationsstyrka, antal objekt, mjukhet, placering. | Medel | Snabba eller lekfulla latar |
| 7 | Expanderande ringar | Ringar skapas fran en punkt och expanderar utat nar ljudet passerar en troskel. | Beat, bas, energitoppar. | Ringhastighet, maxradie, linjetjocklek, farg, transparens, samtidiga ringar. | Medel | Lugna och snabba latar |
| 8 | Flytande prickfalt | Ett falt av prickar driver langsamt och reagerar med storre rorelse vid mer energi. | Total energi, bas eller diskant, frekvensband. | Antal prickar, rorelsehastighet, spridning, storlek, farg, reaktionsstyrka. | Medel | Atmosfariska latar och mjuk snabb musik |
| 9 | Radial equalizer | Frekvenssegment ritas runt vald punkt, person eller logotyp. | Frekvensband, bas, mellanregister, diskant. | Radie, antal segment, segmenthojd, farg, rotationshastighet, transparens. | Medel | Snabba och tydligt rytmiska latar |
| 10 | Kamera- och zoompuls | Bakgrunden far subtil zoom, skakning eller panorering som foljer energin. | Bas, beat, total energi. | Zoomstyrka, skakstyrka, mjukhet, reaktionshastighet, maxrorelse, aktiveringstroskel. | Medel | Kraftfull musik, men kan goras subtil |
| 11 | Spektral dimma | En fargsloja eller dimma som skiftar med frekvensbalansen. | Bas, mellanregister, diskant, langsam energi. | Tathet, fargpalett, rorelsehastighet, transparens, blandningslage, reaktionsstyrka. | Hog | Lugna, filmiska och poetiska latar |
| 12 | Ljudstyrda ljusstralar | Linjer eller stralar vaxer fran kanter eller punkter nar energin okar. | Total energi, diskanttoppar, bastryck. | Antal stralar, langd, bredd, intensitet, farg, spridning, mjukhet. | Medel | Lugna och dramatiska latar |

## Minimikrav per visualisering

Varje implementation ska innehalla:

- `id`: stabilt maskinnamn.
- `name`: anvandarvanligt namn.
- `description`: kort forklaring i vanligt sprak.
- `audioInputs`: vilka delar av `AudioFrame` den anvander.
- `defaultSettings`: startvarden som ger synlig effekt utan justering.
- `controls`: reglage som UI:t kan rendera automatiskt.
- `supportsDrag`: om objektet kan dras.
- `supportsPositioning`: om position sparas.
- `recommendedFor`: lugna latar, snabba latar eller bada.
- `render`: canvasfunktion som ritar for aktuell frame.

## Foreslagna id:n

```text
pulse-circle
beat-particles
moving-waveform
frequency-bars
breathing-glow
jumping-sprites
expanding-rings
floating-dot-field
radial-equalizer
camera-zoom-pulse
spectral-fog
audio-light-rays
```

## Granskningsregel

Visualiserings-agenten ska underkanna ett steg om:

- Fler an tva visualiseringar ser nastan likadana ut.
- En visualisering saknar tydliga reglage.
- Standardinstallningar inte ger en synlig effekt.
- Visualiseringen pastas reagera pa beat/frekvens utan att anvanda relevant ljuddata.
- Farre an tio konkreta visualiseringsmetoder finns i katalogen.
