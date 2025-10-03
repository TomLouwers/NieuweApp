const { SLO_CODES, getValidSLOCodes, validateSLOCode, extractSLOCodes } = require("../lib/slo-database.js");

describe("slo-database", () => {
  test("SLO_CODES structure and sample content", () => {
    expect(SLO_CODES).toBeTruthy();
    expect(SLO_CODES.rekenen).toBeTruthy();
    expect(Array.isArray(SLO_CODES.rekenen[5])).toBe(true);
    expect(SLO_CODES.rekenen[5][0]).toMatch(/^REK-G5-\d+$/);
  });

  test("getValidSLOCodes for rekenen groep 5", () => {
    const list = getValidSLOCodes(5, "rekenen");
    expect(list.length).toBeGreaterThan(0);
    expect(list).toContain("REK-G5-1");
    expect(list).toContain("REK-G5-5");
  });

  test("validateSLOCode exact and prefix variants", () => {
    expect(validateSLOCode("REK-G5-4", 5, "rekenen")).toBe(true);
    expect(validateSLOCode("rek-g5-4b", 5, "rekenen")).toBe(true); // prefix ok, case-insensitive
    expect(validateSLOCode("REK-G6-1", 5, "rekenen")).toBe(false);
    expect(validateSLOCode("LEZ-G5-1", 5, "rekenen")).toBe(false);
  });

  test("getValidSLOCodes throws on unsupported vak", () => {
    expect(() => getValidSLOCodes(5, "wereldoriëntatie")).toThrow(/Ongeldig 'vak'/);
  });

  test("extractSLOCodes finds base codes and de-duplicates", () => {
    const text = `We werken aan REK-G5-1 en REK-G5-2. 
Daarnaast komt taalcode TAA-G5-3b voor en lezen LEZ-G4-2.
Herhaling: rek-g5-2.`;
    const codes = extractSLOCodes(text);
    expect(codes).toEqual(["REK-G5-1", "REK-G5-2", "TAA-G5-3", "LEZ-G4-2"]);
  });
});

