# PROJECT_BRIEF.md

## 1. Projektets mål

Skapa grunden till en webbaserad app för musikvisualisering.

Appen ska likna grundidén i musicvid.org, men vara betydligt mer användarvänlig, mer styrd och lättare att förstå för en icke-teknisk användare. Den ska inte kopiera musicvid.org, utan använda idén som inspiration för en modernare och enklare upplevelse.

Användaren ska kunna ladda upp en bakgrundsbild, ladda upp en låt, välja mellan flera olika musikvisualiseringar, justera visualiseringarna med enkla reglage och se resultatet direkt i en live-förhandsvisning.

Utvecklingen ska ske i tydliga huvudsteg. Varje huvudsteg ska först granskas och förbättras internt av Codex-agenterna. Ett steg får inte presenteras som färdigt förrän alla relevanta agenter har godkänt det.

---

## 2. Appens huvudfunktioner

Användaren ska kunna:

1. Ladda upp eller välja en bild som bakgrund.
2. Ladda upp en låt eller ljudfil.
3. Se en live-förhandsvisning av hur visualiseringen ser ut.
4. Välja mellan minst tio olika visualiseringsmetoder för takter, rytm, bas, energi eller frekvenser i låten.
5. Dra visualiseringsobjekt runt på skärmen tills de ligger där användaren vill ha dem.
6. Ändra visualiseringen med enkla reglage och knappar.
7. Se ändringarna direkt i förhandsvisningen.

---

## 3. Exempel på reglage och inställningar

Visualiseringarna ska kunna styras med enkla och begripliga reglage. Exempel:

- Storlek på sprites eller objekt.
- Hastighet på partiklar.
- Intensitet.
- Färg.
- Transparens.
- Spridning.
- Rotationshastighet.
- Reaktion på bas, takt eller frekvens.
- Antal partiklar eller objekt.
- Placering.
- Skalning.
- Mjukhet i rörelser.
- Tröskelvärde för när visualiseringen ska reagera på ljudet.
- Hur starkt bakgrunden påverkas av musiken.
- Hur snabbt visualiseringen återgår efter ett taktslag.

Reglagen ska vara kopplade till den visualisering som är vald. Användaren ska inte behöva förstå ljudteknik för att kunna använda appen.

---

## 4. Teknisk inriktning

Appen bör byggas som en modern frontend-app med:

- Vite
- React
- TypeScript

Använd Web Audio API eller annan lämplig lokal webbläsarlösning för att analysera ljudet. Uppladdade filer ska i första versionen hanteras lokalt i webbläsaren.

Undvik externa betaltjänster.

Om Canvas, WebGL, PixiJS, Three.js eller annan grafikmotor passar bäst ska Codex välja och motivera tekniken kort.

Välj hellre en stabil, begriplig och lätt vidareutvecklingsbar lösning än en onödigt komplicerad lösning.

---

## 5. Viktiga designprinciper

Appen ska vara:

- Enkel att förstå.
- Visuell direkt från början.
- Byggd kring live-förhandsvisning.
- Lätt att justera med reglage.
- Möjlig att vidareutveckla med fler visualiseringar senare.
- Tydligt strukturerad i kod.
- Utformad så att en icke-teknisk användare inte fastnar i tekniska inställningar.

Appen ska inte kännas som ett programmeringsverktyg. Den ska kännas som ett kreativt verktyg.

---

## 6. Självreglerande arbetssätt i Codex

Hela utvecklingsarbetet ska bygga på interna iterationer inom Codex.

Codex får inte presentera ett huvudsteg för huvudutvecklaren/användaren direkt efter första genomförandet. Efter varje huvudsteg ska arbetet först gå igenom interna gransknings- och förbättringsvarv.

Processen ska vara:

1. Ledaragenten planerar aktuellt huvudsteg.
2. Ansvariga specialistagenter genomför sina delar.
3. Varje specialistagent granskar sin egen del mot kraven.
4. Test- och verifieringsagenten granskar helheten.
5. Ledaragenten samlar alla godkännanden.
6. Om någon agent underkänner något ska Codex inte presentera steget som klart.
7. Ledaragenten startar då ett internt förbättringsvarv.
8. Efter förbättringen körs samma granskningsprocess igen.
9. Detta upprepas tills alla relevanta agenter har godkänt steget.
10. Först därefter får steget presenteras för huvudutvecklaren/användaren.

Ett steg får alltså endast visas som färdigt när det har passerat samtliga interna godkännandesteg.

Om Codex når en punkt där något inte kan lösas utan beslut, behörighet eller information från huvudutvecklaren ska status vara `BLOCKERAT`. Då ska Codex tydligt beskriva vad som saknas och inte låtsas att steget är färdigt.

---

## 7. Grindvakt: Ledaragentens ansvar

Ledaragenten ska fungera som grindvakt.

Ledaragenten får inte släppa igenom ett steg bara för att det finns kod. Den ska bara släppa igenom ett steg om det är fungerande, granskat, testat och godkänt av samtliga relevanta agenter.

Tillåten logik:

- Om alla agenter godkänner: presentera steget.
- Om någon agent underkänner: gör nytt internt förbättringsvarv.
- Om något kräver extern information: markera `BLOCKERAT`.
- Om test eller bygg misslyckas: steget är automatiskt underkänt.
- Om UX-agenten bedömer att flödet är otydligt: steget är underkänt.
- Om Visualiserings-agenten bedömer att visualiseringarna är för svaga, för lika varandra eller för få: steget är underkänt.
- Om Ljudanalys-agenten bedömer att ljuddata inte är tillräckligt användbar för visualiseringarna: steget är underkänt.
- Om Grafik- och interaktionsagenten bedömer att dragning, placering eller live-rendering inte fungerar tillräckligt bra: steget är underkänt.

Codex ska hellre göra flera interna iterationer än presentera ett halvfärdigt resultat.

---

## 8. Agentstruktur

Codex ska skapa en `AGENTS.md` i projektroten som beskriver:

- Projektets mål.
- Tekniska principer.
- Kodstil.
- Kvalitetskrav.
- Hur agenterna samarbetar.
- Hur interna iterationer fungerar.
- Hur verifiering sker efter varje huvudsteg.
- När arbetet är blockerat.
- När arbetet är redo att gå vidare.
- Hur statusar ska användas.

Codex ska även skapa lämpliga agentdefinitioner i `.codex/agents/` om projektet stödjer det. Om det inte är lämpligt ska agentrollerna dokumenteras tydligt i `AGENTS.md`.

Minst dessa agentroller ska finnas:

### 8.1 Ledaragent / Orchestrator

Ansvarar för helheten, delar upp arbetet, kontrollerar att inget steg hoppas över och avgör om projektet får presenteras eller måste gå igenom ett nytt internt förbättringsvarv.

### 8.2 Produkt- och UX-agent

Ansvarar för att appen blir enkel att förstå, att användarflödet är tydligt och att reglage, knappar och förhandsvisning blir användarvänliga.

### 8.3 Ljudanalys-agent

Ansvarar för analys av låten, exempelvis takt, energi, bas, frekvensband och annan ljuddata som visualiseringarna kan använda.

### 8.4 Visualiserings-agent

Ansvarar för att ta fram och implementera minst tio olika visualiseringsmetoder.

### 8.5 Grafik- och interaktionsagent

Ansvarar för canvas/grafik, drag-and-drop, placering av objekt, skalning och live-rendering.

### 8.6 Test- och verifieringsagent

Ansvarar för tester, manuell verifieringslista, teknisk kontroll, byggkontroll och att varje huvudsteg avslutas med tydlig status.

---

## 9. Godkännandeprocess efter varje huvudsteg

Efter varje huvudsteg ska Ledaragenten samla in godkännande från relevanta agenter.

Varje agent ska lämna en kort granskningsrapport med status:

- `GODKÄNT`
- `UNDERKÄNT – KRÄVER INTERN ÅTGÄRD`
- `BLOCKERAT`

Om någon agent sätter status `UNDERKÄNT – KRÄVER INTERN ÅTGÄRD` får steget inte presenteras som färdigt. Då ska Ledaragenten skapa ett internt förbättringsvarv där bristerna åtgärdas. Därefter ska samma godkännandeprocess köras igen.

Om någon agent sätter status `BLOCKERAT` ska arbetet stoppas och blockeringen beskrivas tydligt.

Det ska framgå:

- Vad som blockerar arbetet.
- Vilken information eller vilket beslut som behövs.
- Vilka filer eller funktioner som påverkas.
- Vad som redan är klart.

En leverans får bara markeras som `GODKÄNT FÖR NÄSTA STEG` om alla relevanta agenter har status `GODKÄNT`.

Ledaragenten får inte överrösta en specialistagent utan att först åtgärda problemet.

---

## 10. Slutlig grindkontroll före presentation

Innan något presenteras för huvudutvecklaren/användaren ska Ledaragenten göra en slutlig grindkontroll:

1. Är alla krav i aktuellt steg uppfyllda?
2. Har varje relevant agent godkänt sin del?
3. Finns det inga kvarstående blockerande fel?
4. Finns det en tydlig verifieringsrapport?
5. Är nästa steg tydligt definierat?
6. Är bygg/test körda där det är möjligt?
7. Är användarflödet begripligt?
8. Har kodstrukturen hållits ren och vidareutvecklingsbar?

Endast om alla dessa punkter är uppfyllda får steget presenteras som färdigt.

Tillåtna slutstatusar efter varje huvudsteg:

- `GODKÄNT FÖR NÄSTA STEG`
- `KRÄVER NYTT INTERNT VARV`
- `BLOCKERAT`

Slutstatus för hela projektet:

- `PUBLICERINGSREDO`
- `KRÄVER NYTT INTERNT VARV`
- `BLOCKERAT`

---

## 11. Visualiseringsmetoder

Codex ska ta fram minst tio visualiseringsmetoder.

De ska vara konkreta och användbara, inte bara namn.

Varje visualiseringsmetod ska ha:

- Namn.
- Kort beskrivning.
- Vilka ljuddata den reagerar på.
- Vilka reglage användaren kan ändra.
- Ungefärlig svårighetsgrad.
- Om den passar bäst för lugna låtar, snabba låtar eller båda.

Minst dessa typer ska övervägas. Codex får förbättra eller byta ut dem om bättre lösningar hittas, men det måste alltid finnas minst tio konkreta metoder.

### 11.1 Pulserande fokuscirkel

En cirkel runt en vald fokuspunkt som pulserar med bas eller övergripande ljudenergi.

Reagerar på:

- Basnivå.
- Total ljudenergi.
- Eventuellt beat/taktslag.

Möjliga reglage:

- Storlek.
- Pulsstyrka.
- Färg.
- Transparens.
- Mjukhet.
- Reaktionströskel.

Passar för:

- Både lugna och snabba låtar.

### 11.2 Beat-partiklar

Partiklar som skjuts ut från en vald punkt vid taktslag.

Reagerar på:

- Beat/taktslag.
- Basnivå.
- Ljudenergi.

Möjliga reglage:

- Antal partiklar.
- Hastighet.
- Livslängd.
- Spridning.
- Storlek.
- Färg.
- Gravitation eller flytrörelse.

Passar för:

- Framför allt snabba eller rytmiska låtar.

### 11.3 Rörlig vågform

En vågform som rör sig över bilden, exempelvis längs nederkant, över hela bilden eller som en mjuk linje genom motivet.

Reagerar på:

- Ljudvåg.
- Mellanregister.
- Total energi.

Möjliga reglage:

- Linjetjocklek.
- Höjd.
- Hastighet.
- Färg.
- Transparens.
- Placering.

Passar för:

- Både lugna och snabba låtar.

### 11.4 Frekvensstaplar

Equalizer-liknande staplar längs nederkant, överkant, sidor eller runt ett valt objekt.

Reagerar på:

- Frekvensband.
- Bas.
- Mellanregister.
- Diskant.

Möjliga reglage:

- Antal staplar.
- Höjd.
- Bredd.
- Avstånd.
- Färg.
- Placering.
- Rund eller rak form.

Passar för:

- Snabba låtar, elektronisk musik och tydligt rytmisk musik.

### 11.5 Ljusglöd som andas

En mjuk ljusglöd över bakgrunden som långsamt växer och krymper med musiken.

Reagerar på:

- Total ljudenergi.
- Långsammare energiförändringar.
- Eventuellt bas.

Möjliga reglage:

- Intensitet.
- Färg.
- Radie.
- Mjukhet.
- Transparens.
- Reaktionshastighet.

Passar för:

- Särskilt lugna, poetiska eller stämningsfulla låtar.

### 11.6 Sprite-objekt som hoppar eller skakar

Små objekt, ikoner eller bildfragment som hoppar, skakar eller vibrerar när musiken slår till.

Reagerar på:

- Beat/taktslag.
- Bas.
- Plötsliga energitoppar.

Möjliga reglage:

- Storlek.
- Rörelsestyrka.
- Rotationsstyrka.
- Antal objekt.
- Mjukhet.
- Placering.

Passar för:

- Snabba eller lekfulla låtar.

### 11.7 Expanderande ringar

Ringar som expanderar från en eller flera valda punkter när ljudet passerar ett tröskelvärde.

Reagerar på:

- Beat.
- Bas.
- Energitoppar.

Möjliga reglage:

- Ringhastighet.
- Maxradie.
- Linjetjocklek.
- Färg.
- Transparens.
- Antal samtidiga ringar.

Passar för:

- Både lugna och snabba låtar.

### 11.8 Flytande prickfält

Ett fält av små prickar som rör sig mjukt och påverkas av ljudets energi.

Reagerar på:

- Total ljudenergi.
- Frekvensband.
- Bas eller diskant beroende på inställning.

Möjliga reglage:

- Antal prickar.
- Rörelsehastighet.
- Spridning.
- Storlek.
- Färg.
- Reaktionsstyrka.

Passar för:

- Särskilt atmosfäriska och mjuka låtar, men kan även fungera för snabb musik.

### 11.9 Radial equalizer

En cirkulär equalizer runt en vald punkt, person, logotyp eller annan fokuspunkt i bilden.

Reagerar på:

- Frekvensband.
- Bas.
- Mellanregister.
- Diskant.

Möjliga reglage:

- Radie.
- Antal segment.
- Segmenthöjd.
- Färg.
- Rotationshastighet.
- Transparens.

Passar för:

- Både snabba och tydligt rytmiska låtar.

### 11.10 Kamera- och zoompuls

Bakgrunden rör sig subtilt genom en mjuk zoom, skakning eller panorering som följer musiken.

Reagerar på:

- Bas.
- Beat.
- Total ljudenergi.

Möjliga reglage:

- Zoomstyrka.
- Skakstyrka.
- Mjukhet.
- Reaktionshastighet.
- Maxrörelse.
- Aktiveringströskel.

Passar för:

- Särskilt kraftfull musik, men ska kunna göras subtil för lugna låtar.

### 11.11 Spektral dimma

En mjuk dimma eller färgslöja som förändras med frekvenserna i musiken.

Reagerar på:

- Låga, mellanliggande och höga frekvenser.
- Långsam förändring i ljudenergi.

Möjliga reglage:

- Täthet.
- Färgpalett.
- Rörelsehastighet.
- Transparens.
- Blandningsläge.
- Reaktionsstyrka.

Passar för:

- Lugna, filmiska och poetiska låtar.

### 11.12 Ljudstyrda ljusstrålar

Ljusa strålar eller linjer som växer fram från kanter eller valda punkter när musiken ökar i energi.

Reagerar på:

- Total energi.
- Diskanttoppar.
- Bastryck.

Möjliga reglage:

- Antal strålar.
- Längd.
- Bredd.
- Intensitet.
- Färg.
- Spridning.
- Mjukhet.

Passar för:

- Både lugna och dramatiska låtar.

---

## 12. Arkitekturkrav för visualiseringar

Visualiseringarna ska inte hårdkodas på ett rörigt sätt.

Det ska finnas en gemensam modell för visualiseringar så att nya visualiseringar kan läggas till senare.

Varje visualisering bör beskrivas med exempelvis:

- `id`
- `name`
- `description`
- `audioInputs`
- `defaultSettings`
- `controls`
- `renderFunction` eller motsvarande
- `supportsDrag`
- `supportsPositioning`
- `recommendedFor`

Det ska finnas en tydlig koppling mellan vald visualisering, dess inställningar och de reglage som visas i gränssnittet.

---

## 13. Huvudsteg

Arbetet ska delas upp i ungefär fem huvudsteg.

### STEG 1: Projektanalys, arkitektur och agentstruktur

Codex ska:

- Analysera kraven.
- Välja teknisk lösning.
- Skapa mappstruktur.
- Skapa `AGENTS.md`.
- Skapa eller dokumentera agentroller.
- Skapa regler för agenternas samarbete.
- Skapa självreglerande godkännandeprocess.
- Ta fram lista över minst tio visualiseringsmetoder.
- Ta fram arkitektur för appen.
- Avsluta med intern granskning, eventuella förbättringsvarv och först därefter verifieringsrapport.

### STEG 2: Grundapp och uppladdning

Codex ska:

- Skapa appens grundlayout.
- Lägga till uppladdning av bakgrundsbild.
- Lägga till uppladdning av ljudfil.
- Visa bakgrundsbild i förhandsvisning.
- Skapa grundläggande ljudspelare.
- Skapa tydligt användarflöde.
- Avsluta med intern granskning, eventuella förbättringsvarv och först därefter verifieringsrapport.

### STEG 3: Ljudanalys och visualiseringsmotor

Codex ska:

- Implementera ljudanalys.
- Skapa gemensamt system för visualiseringar.
- Göra det möjligt att välja visualiseringsmetod.
- Implementera några första visualiseringar.
- Säkerställa att visualiseringarna faktiskt reagerar på ljuddata.
- Avsluta med intern granskning, eventuella förbättringsvarv och först därefter verifieringsrapport.

### STEG 4: Interaktiv redigering och full visualiseringsuppsättning

Codex ska:

- Lägga till reglage för visualiseringarnas egenskaper.
- Lägga till drag-and-drop för visualiseringsobjekt där det är relevant.
- Göra så att ändringar syns direkt i förhandsvisningen.
- Implementera resterande visualiseringsmetoder tills minst tio finns.
- Se till att varje visualisering har relevanta reglage.
- Spara placeringar och inställningar i appens state.
- Avsluta med intern granskning, eventuella förbättringsvarv och först därefter verifieringsrapport.

### STEG 5: Polering, test och dokumentation

Codex ska:

- Förbättra användarvänlighet.
- Lägga till tydlig README.
- Lägga till test där det är rimligt.
- Kontrollera byggbarhet.
- Skapa manuell testlista.
- Identifiera kvarvarande begränsningar.
- Förbereda arkitekturen för framtida funktioner, till exempel export, utan att nödvändigtvis implementera det i första versionen.
- Avsluta med slutlig intern granskning och slutstatus.

---

## 14. Verifieringsrapport efter varje huvudsteg

Efter varje godkänt huvudsteg ska Codex skriva en kort verifieringsrapport med:

- Vad som är klart.
- Vad som inte är klart.
- Vilka filer som ändrats eller skapats.
- Hur man testar steget.
- Vilka interna förbättringsvarv som gjordes.
- Vilka agenter som godkänt.
- Eventuella risker.
- Status:
  - `GODKÄNT FÖR NÄSTA STEG`
  - `KRÄVER NYTT INTERNT VARV`
  - `BLOCKERAT`

Om status är `KRÄVER NYTT INTERNT VARV` ska steget inte presenteras som färdigt. Då ska Codex fortsätta internt tills bristerna är åtgärdade.

Om status är `BLOCKERAT` ska Codex tydligt förklara vad som blockerar arbetet.

---

## 15. Kvalitetskrav

Följande krav är bindande:

- Appen ska vara enkel att förstå för en icke-teknisk användare.
- Det ska finnas live-förhandsvisning.
- Uppladdade filer ska hanteras lokalt i webbläsaren.
- Kod ska vara tydligt strukturerad.
- Visualiseringarna ska ha en gemensam modell.
- Reglage ska vara kopplade till den valda visualiseringen.
- Dragbar placering ska sparas i appens state.
- Appen ska kunna köras lokalt med tydliga instruktioner.
- Bygg och tester ska köras om det finns stöd för det.
- Om bygg eller tester misslyckas får steget inte godkännas.
- Om användarflödet blir för tekniskt eller rörigt får steget inte godkännas.
- Om visualiseringarna är för lika varandra får steget inte godkännas.
- Om det finns färre än tio konkreta visualiseringsmetoder får projektet inte godkännas.
- Om ljudanalysen inte ger användbar data till visualiseringarna får steget inte godkännas.
- Om live-förhandsvisningen inte fungerar får steget inte godkännas.
- Om reglagen inte påverkar visualiseringen tydligt får steget inte godkännas.
- Om drag-and-drop påstås finnas men inte fungerar praktiskt får steget inte godkännas.

---

## 16. Framtida funktioner som ska förberedas men inte nödvändigtvis byggas i första versionen

Codex ska tänka på att appen senare kan behöva:

- Exportera video.
- Spara projekt.
- Ladda om tidigare projekt.
- Ha färdiga mallar.
- Ha flera visualiseringar samtidigt.
- Ha tidslinje.
- Ha text eller låttext ovanpå videon.
- Ha presets för olika musikstilar.
- Ha enklare AI-hjälp för att föreslå visualisering.

Dessa behöver inte byggas i första versionen om det gör projektet för stort, men arkitekturen ska inte stänga dörren för dem.

---

## 17. Första uppgift till Codex

Börja med STEG 1.

Arbeta iterativt och självreglerande inom Codex. Presentera inte STEG 1 förrän alla interna iterationer är klara och samtliga relevanta agenter har godkänt steget.

Om något underkänns ska Codex först förbättra det internt och sedan köra om granskningen.

Endast ett fullständigt godkänt STEG 1 får visas för huvudutvecklaren/användaren.

När STEG 1 är godkänt ska Codex presentera:

1. Kort sammanfattning av arkitekturvalet.
2. Skapad eller föreslagen mappstruktur.
3. Agentstruktur.
4. Samarbetsregler.
5. Lista över minst tio visualiseringsmetoder.
6. Verifieringsrapport.
7. Status: `GODKÄNT FÖR NÄSTA STEG`, `KRÄVER NYTT INTERNT VARV` eller `BLOCKERAT`.

Codex får inte gå vidare till STEG 2 förrän huvudutvecklaren/användaren uttryckligen ber om det.

---

## 18. Rekommenderad initialprompt till Codex

När denna fil ligger i projektroten kan huvudutvecklaren starta Codex med denna korta prompt:

```text
Läs PROJECT_BRIEF.md noggrant. Följ den som huvudspecifikation.

Börja med STEG 1 enligt PROJECT_BRIEF.md.

Om AGENTS.md redan finns ska du läsa den också. Om AGENTS.md inte finns ska du skapa den under STEG 1.

Uppdatera AGENTS.md under STEG 1 så att den innehåller den faktiska agentstrukturen, samarbetsreglerna, test-/verifieringsreglerna och projektets arbetsprinciper.

Arbeta självreglerande. Presentera inte STEG 1 förrän alla interna iterationer är klara och steget är godkänt av samtliga relevanta agenter.

Gå inte vidare till STEG 2 förrän jag uttryckligen ber om det.
```

---

## 19. Viktig sammanfattning

Det viktigaste i projektet är inte bara att skapa kod, utan att Codex arbetar som ett självreglerande utvecklingsteam.

Huvudutvecklaren/användaren ska inte behöva hitta de mest uppenbara bristerna först. Codex ska själv upptäcka, åtgärda och omgranska brister innan ett huvudsteg presenteras.

Målet är därför:

- Tydliga huvudsteg.
- Interna iterationer.
- Agentgranskning.
- Hård godkännandeprocess.
- Live-förhandsvisning.
- Minst tio konkreta visualiseringsmetoder.
- Enkel användarupplevelse.
- Vidareutvecklingsbar kod.
