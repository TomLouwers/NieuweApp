export interface Section {
  id: string;
  title: string;
  content: string;
  subsections: Section[];
}

export interface ComplianceChecks {
  beginsituatie: boolean;
  smartiDoelen: boolean;
  interventies: boolean;
  evaluatie: boolean;
  betrokkenen: boolean;
  handelingsgericht: boolean;
}

export interface ComplianceResult {
  overall: number;
  checks: ComplianceChecks;
  warnings: string[];
  errors: string[];
  inspectieProof: boolean;
}

export interface ParsedGroepsplan {
  sections: Section[];
  metadata: {
    groep: number | null;
    vakgebied: string | null;
    periode: string | null;
    aantalLeerlingen: number | null;
  };
  complianceChecks: ComplianceResult;
}

