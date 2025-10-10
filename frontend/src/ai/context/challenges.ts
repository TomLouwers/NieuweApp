export const challengeKeys = [
  "enorme_niveauverschillen",
  "veel_dyslexie_dyscalculie",
  "weinig_instructietijd",
  "ondersteuning_werkte_niet",
  "nieuw_in_groep",
  "grote_groep_weinig_ruimte",
  "moeite_zelfstandig_werken",
  "gaat_prima_continuiteit",
] as const;

export type ChallengeKey = typeof challengeKeys[number];

const challengeGuidanceMap: Record<ChallengeKey, string> = {
  enorme_niveauverschillen: `Deze groep heeft zeer grote niveauverschillen (waarschijnlijk 3+ jaar spreiding).

Specifieke focus voor dit groepsplan:
- Benadruk de DRIE-groepen aanpak (Mickey Mouse expliciet)
- Compacte instructie voor Meer-groep: max 10 min, daarna zelfstandig aan verrijking
- Verlengde instructie voor Intensieve groep: +15-20 min, met concreet materiaal (rekenrek, stappenplan)
- Benoem hoe je als leerkracht rondloopt tijdens verwerking
- Geef concrete organisatie: wie waar zit, welk materiaal ligt klaar
- Preventief handelen: intensieve groep krijgt VOOR de les al voorkennis/woordenschat

Interventies moeten ZEER specifiek zijn, niet "extra aandacht" maar "15 min extra instructie met MAB-materiaal, 3x per week, maandag/woensdag/vrijdag voor de les".
`,
  veel_dyslexie_dyscalculie: `Deze groep heeft meerdere leerlingen met dyslexie en/of dyscalculie.

Specifieke focus voor dit groepsplan:
- Benoem visuele ondersteuning: stappenplannen op A4, gebruik van kleur, lettertype (Comic Sans/Verdana)
- Extra herhalingsfrequentie: niet 1x per week maar 4x per week korte herhaling
- Multisensorisch: niet alleen lezen/schrijven maar ook voelen/zeggen/doen
- Auditieve ondersteuning: teksten voorlezen, audio bij opdrachten
- Kleinere stappen: split complexe opdrachten in 3-4 deelstappen met tussenchecks
- Positieve bekrachtiging: focus op wat WEL lukt, kleine successen vieren

Interventies moeten compenserende strategieën bevatten (hoe omgaan met de dyslexie), niet alleen "meer oefenen".
`,
  weinig_instructietijd: `Deze leerkracht heeft weinig instructietijd door uitval, gedragsproblemen, of grote groep.

Specifieke focus voor dit groepsplan:
- Preventief werken: duidelijke structuur, alles van tevoren klaargezet
- Efficiënte groepsorganisatie: vaste plekken, materiaal binnen handbereik
- Zelfstandigheid bevorderen: taakkaarten, duidelijke planning op bord
- Peer tutoring: Meer-groep helpt Basisgroep, ontlast leerkracht
- Compacte instructie: max 15 min, daarna zelfstandig aan het werk
- Gedragsmanagement: duidelijke afspraken, visuele regels

Pedagogische aanpak moet expliciet aandacht geven aan werkhouding en zelfstandigheid als doel.
`,
  ondersteuning_werkte_niet: `De ondersteuning van vorig blok was niet effectief genoeg.

Specifieke focus voor dit groepsplan:
- Analyseer (impliciet) waarom het niet werkte: te algemeen? te ambitieus? te weinig tijd?
- Deze keer: MINDER doelen, maar WEL haalbaar
- Focus op 1-2 kerndoelen, niet 5 verschillende dingen tegelijk
- Verhoogde evaluatiefrequentie: niet pas na 12 weken, maar al na 4 weken tussenevaluatie
- Betrek IB'er actiever: wekelijks kort overleg in plaats van eens per 6 weken
- Concreter: als vorige plan "extra oefening" zei, schrijf nu "15 min, 3x pw, met dit materiaal"

Toon realisme: erken dat ondersteuning tijd kost, en stel haalbare verwachtingen.
`,
  nieuw_in_groep: `De leerkracht is nieuw in deze groep en kent de leerlingen nog niet goed.

Specifieke focus voor dit groepsplan:
- Eerste 2-3 weken: diagnose en observatie voorop
- Doelen zijn breed en aanpasbaar ("na 3 weken evaluatie: zijn de groepen goed ingedeeld?")
- Gebruik generieke maar solide interventies (niet te specifiek op individuele leerlingen)
- Benadruk gesprekken met leerlingen en ouders om onderwijsbehoeften in kaart te brengen
- Flexibiliteit: dit plan wordt na 4 weken aangepast op basis van bevindingen

Schrijf voorzichtig: geen stellige uitspraken over wat leerlingen kunnen/niet kunnen, want dat weet de leerkracht nog niet zeker.
`,
  grote_groep_weinig_ruimte: `Deze groep is groot (28+) en er is weinig fysieke ruimte voor differentiatie.

Specifieke focus voor dit groepsplan:
- Convergente differentiatie: alle groepen krijgen DEZELFDE lesstof, maar op verschillend niveau
- Minder rondlopen/aparte hoekjes, meer slim organiseren op plekken
- Gebruik van digitale middelen: Meer-groep werkt zelfstandig op laptop/tablet met verrijking
- Instructie op 2 niveaus: Basis+Meer samen, dan apart Intensief (of omgekeerd)
- Station teaching: groepen roteren, leerkracht blijft op 1 plek

Wees eerlijk: in een grote groep is maatwerk beperkt. Focus op haalbare, efficiënte organisatie.
`,
  moeite_zelfstandig_werken: `Veel leerlingen hebben moeite met zelfstandig werken.

Specifieke focus voor dit groepsplan:
- Pedagogische aanpak staat voorop: zelfstandigheid is een DOEL op zich
- Kleine, overzichtelijke opdrachten: niet "maak blz 30-35" maar "maak eerst som 1-5, kom dan checken"
- Visuele planning: taakkaart met pictogrammen, timer voor tijd
- Positieve bekrachtiging: belonen van zelfstandig werk, niet straffen van vragen
- Geleidelijke opbouw: week 1 alleen met ondersteuning, week 4 al 10 min alleen
- Maatjes-systeem: leerlingen helpen elkaar, niet direct naar juf

Interventies moeten gericht zijn op het opbouwen van zelfstandigheid, niet alleen op vakinhoud.
`,
  gaat_prima_continuiteit: `Het gaat goed in deze groep, de leerkracht wil vooral continuïteit.

Specifieke focus voor dit groepsplan:
- Bevestig wat al goed gaat, bouw daarop voort
- Doelen zijn ambitieus maar haalbaar (geen "overleven" maar echt vooruitgang)
- Focus op verfijning: hoe kan de aanpak nog efficiënter? Hoe kan Meer-groep nóg meer uitdaging?
- Monitoring: hoe blijft de leerkracht scherp op verschillen, zodat het goed blijft gaan?
- Rust en regelmaat: geen grote veranderingen, wel kleine optimalisaties

Toon: positief en vooruitkijkend, geen probleem-taal. Dit is een luxe-situatie.
`,
};

export function getChallengeGuidance(key: ChallengeKey): string {
  const t = challengeGuidanceMap[key];
  if (!t) throw new Error(`Onbekende challenge: ${key}`);
  return t;
}

