export type Vakgebied =
  | 'spelling'
  | 'rekenen_automatiseren'
  | 'rekenen_begrip'
  | 'begrijpend_lezen'
  | 'technisch_lezen'
  | 'schrijven';

export type Groep = 1|2|3|4|5|6|7|8;

type MapType = Record<Vakgebied, Record<Groep, string>>;

export const vakgebiedGroepExpectations: MapType = {
  spelling: {
    1: 'Groep 1 is voorbereidend. Focus op fonologisch bewustzijn, rijmen, letterherkenning. GEEN spellingregels, GEEN schrijven van woorden.',
    2: 'Groep 2 begint met klankzuivere woorden schrijven. Focus op letter-klankkoppeling, korte klinkers. Nog geen werkwoordspelling.',
    3: 'Groep 3 start met eerste spellingregels: open/gesloten lettergrepen, verdubbeling. Werkwoordspelling is TE MOEILIJK.',
    4: 'Groep 4 automatiseert klankgroepen, start voorzichtig met werkwoordspelling (tegenwoordige tijd). Dit is complex!',
    5: 'Groep 5 richt zich op werkwoordspelling (tegenwoordige tijd + verleden tijd). Klankgroepenregel moet vast zitten. Lidwoord-regel komt erbij.',
    6: 'Groep 6 verdiept werkwoordspelling (alle tijden), bijwoordelijk gebruik van werkwoorden, samenstellingen. Strategieën worden belangrijker.',
    7: 'Groep 7 werkt aan automatisering van alle regels, focus op moeilijke werkwoorden, lastige samenstellingen, leenwoorden.',
    8: 'Groep 8 finaliseert spelling, focus op zelfreflectie en gebruik van naslagwerken. Voorbereiding op VO.',
  },
  rekenen_automatiseren: {
    1: 'Groep 1 is voorbereidend. Tellen tot 10, sorteren, vergelijken. GEEN optellen/aftrekken.',
    2: 'Groep 2 telt tot 20, splitsen tot 10 begint. Nog geen formele bewerkingen.',
    3: 'Groep 3 start optellen/aftrekken tot 20, tafels van 1,2,5,10 beginnen. Automatiseren is het doel.',
    4: 'Groep 4 breidt uit naar 100, tafels tot 10 automatiseren. Dit kost veel tijd! 15 min per dag oefenen.',
    5: 'Groep 5 focus op snelheid tafels, vermenigvuldigen en delen tot 100. Breuken heel basaal.',
    6: 'Groep 6 alle tafels tot 100 automatisch. Breuken, kommagetallen, procenten komen erbij.',
    7: 'Groep 7 verhouding, verhoudingstabel, procenten. Automatiseren blijft oefenen.',
    8: 'Groep 8 finaliseert automatiseren, voorbereiding Eindtoets. Snelheid onder druk oefenen.',
  },
  rekenen_begrip: {
    1: 'Groep 1: getalbegrip tot 10, ruimtelijk inzicht, vergelijken. Concreet materiaal centraal.',
    2: 'Groep 2: getalbegrip tot 20, eenvoudige contextsommen. Nog veel concreet materiaal.',
    3: 'Groep 3: strategieën voor optellen/aftrekken (splits, verdwijntruuk). Begin van schematisch werken.',
    4: 'Groep 4: rekenstrategieën verfijnen, contextsommen worden complexer. Getallenlijn en kolomrekenen.',
    5: 'Groep 5: splitsend vermenigvuldigen, breuken als deel van geheel, kommagetallen introduceren. Dit is abstract!',
    6: 'Groep 6: verhoudingen, procenten, schaal. Leerlingen moeten zelf strategie kiezen.',
    7: 'Groep 7: complexe meerstegsopgaven, algebra-achtige vraagstukken. Metacognitie belangrijk.',
    8: 'Groep 8: Eindtoets-niveau, alle strategieën flexibel inzetten. Procesvaardigheden.',
  },
  begrijpend_lezen: {
    1: 'Groep 1: begrijpend luisteren bij prentenboeken, eenvoudige vragen. Voorbereidend op begrijpend lezen.',
    2: 'Groep 2: begrijpend luisteren en praten over teksten, begin van strategie-taal.',
    3: 'Groep 3: start begrijpend lezen, heel eenvoudige tekstjes. Eerst decoderen, dan pas begrip.',
    4: 'Groep 4: woordenschat wordt belangrijk, korte informatieve teksten. Strategieën IGDI introduceren.',
    5: 'Groep 5: langere teksten, verschillende tekstsoorten. Strategieën actief gebruiken: voorkennis activeren, vragen stellen.',
    6: 'Groep 6: complexere teksten, figuurlijk taalgebruik. Inferenties maken wordt belangrijk.',
    7: 'Groep 7: studerend lezen, samenvatten, hoofdzaak-bijzaak. Voorbereiding VO.',
    8: 'Groep 8: alle tekstsoorten, kritisch lezen, argumenten herkennen. Eindtoets-niveau.',
  },
  technisch_lezen: {
    1: 'Groep 1: voorbereidend geletterdheid, letterkennis en klanken. Nog geen technisch lezen.',
    2: 'Groep 2: verdere voorbereiding, letter-klankkoppeling, rijmen. Aanloop naar technisch lezen in groep 3.',
    3: 'Groep 3: AVI-M3 tot E3 is normaal. Veel leerlingen blijven haperen, dat is normaal! Vlotte woordherkenning is het doel.',
    4: 'Groep 4: AVI-E4 tot Plus. Automatiseren, vloeiend lezen zonder klankfouten. Sommige leerlingen hebben nog forse achterstanden.',
    5: 'Groep 5: AVI-Plus tot eind groep 5. Technisch lezen is meestal voldoende, focus verschuift naar begrijpend lezen.',
    6: 'Groep 6: Technisch lezen afgerond voor meeste leerlingen. Dyslexie-leerlingen blijven oefenen.',
    7: 'Groep 7: Technisch lezen is hulpmiddel, geen doel meer. Behalve voor zwakke lezers: blijven oefenen.',
    8: 'Groep 8: Idem groep 7. Snelheid onder druk (Eindtoets) wordt belangrijker.',
  },
  schrijven: {
    3: 'Groep 3: korte zinnen, persoonlijke verhalen. Eerst INHOUD, dan pas spelling. Motivatie is alles.',
    4: 'Groep 4: langere teksten (10+ zinnen), verschillende tekstsoorten. Structuur wordt belangrijk (begin-midden-eind).',
    5: 'Groep 5: schrijven met een doel (brief, verslag, verhaal). Revisie en verbeteren introduceren.',
    6: 'Groep 6: argumentatieve teksten, creatief schrijven. Zinsstructuur bewust maken.',
    7: 'Groep 7: complexere teksten, stijl bewust kiezen. Revisie wordt belangrijker.',
    8: 'Groep 8: alle tekstsoorten, voorbereiding VO. Schrijfproces centraal: plannen, schrijven, reviseren.',
  },
};

export function getExpectations(vak: Vakgebied, groep: Groep): string {
  const v = vakgebiedGroepExpectations[vak];
  if (!v) throw new Error(`Onbekend vakgebied: ${vak}`);
  const g = v[groep];
  if (!g) throw new Error(`Geen expectations voor ${vak} groep ${groep}`);
  return g;
}
