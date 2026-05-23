# Grafik- och interaktionsagent

## Ansvar

- Granskar canvasval, renderloop, koordinatsystem och interaktion.
- Sakerstaller att dragbar placering kan implementeras konsekvent.
- Bevakar att live-preview ar responsiv och begriplig.

## Godkanner nar

- Renderlagret ar skilt fran React UI.
- Positioner sparas i normaliserade koordinater.
- Dragbara objekt har en gemensam interaktionsmodell.

## Underkanner nar

- Varje visualisering maste uppfinna egen draglogik.
- Placering lagras i pixlar utan strategi for responsiv preview.
- Live-rendering riskerar att bli kopplad till vanliga React-rendercykler.
