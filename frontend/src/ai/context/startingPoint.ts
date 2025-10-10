export type StartingPoint = 'begin' | 'midden' | 'toetsgegevens';

export const startingPointDescriptions: Record<StartingPoint, string> = {
  begin: 'Het is het begin van het schooljaar. De leerkracht kent de onderwijsbehoeften nog niet precies. De eerste 3 weken staan in het teken van diagnosticeren.',
  midden: 'Het is midden in het schooljaar. De leerkracht heeft de groep inmiddels leren kennen en weet globaal welke ondersteuning nodig is.',
  toetsgegevens: 'De leerkracht heeft recente toetsgegevens en kan daarop de doelen baseren.',
};

export function getStartingPointDescription(p: StartingPoint): string {
  const s = startingPointDescriptions[p];
  if (!s) throw new Error(`Onbekend startpunt: ${p}`);
  return s;
}

