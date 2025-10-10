const { validateSLOCode, extractSLOCodes } = require("../lib/slo-database.js");

describe("SLO validation utilities", () => {
  test("validateSLOCode accepts exact and prefix matches (case-insensitive)", () => {
    expect(validateSLOCode("REK-G5-3", 5, "rekenen")).toBe(true);
    expect(validateSLOCode("rek-g5-3b", 5, "rekenen")).toBe(true);
    expect(validateSLOCode("REK-G6-3", 5, "rekenen")).toBe(false);
    expect(validateSLOCode("TAA-G5-3", 5, "rekenen")).toBe(false);
  });

  test("extractSLOCodes finds and de-duplicates codes, normalizes upper-case", () => {
    const text = "We behandelen rek-g5-1 en REK-G5-1, plus TAA-G4-2b in taal.";
    const codes = extractSLOCodes(text);
    expect(codes).toEqual(["REK-G5-1", "TAA-G4-2"]);
  });
});

