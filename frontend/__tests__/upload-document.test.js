const { createReqRes } = require("../test-utils/mockReqRes.js");

describe("upload-document API", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("DOCX upload parses text and metadata", async () => {
    const longDocxText = [
      "Groepsplan rekenen voor groep 5. ",
      "Periode Q2 met focus op automatiseren en verhaalsommen. ",
      "Leerlingen werken aan REK-G5-2 en strategieën worden verwoord. ",
      "Differentiatie op tempo en complexiteit binnen de klas. ",
      "Formatieve evaluatie door observaties en korte checks."
    ].join("");

    jest.doMock("formidable", () => {
      let currentFile = null;
      return {
        IncomingForm: function () {
          return {
            parse: (req, cb) => cb(null, {}, { document: currentFile }),
          };
        },
        __setMockFile: (f) => {
          currentFile = f;
        },
      };
    });

    jest.doMock("mammoth", () => ({
      extractRawText: jest.fn(async () => ({ value: longDocxText })),
    }));

    const formidable = require("formidable");

    const file = {
      mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      originalFilename: "plan.docx",
      filepath: "C:/tmp/mock.docx",
      size: 1024,
    };
    formidable.__setMockFile(file);

    const handler = require("../pages/api/upload-document.js");
    const { req, res } = createReqRes({ method: "POST" });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json?.success).toBe(true);
    expect(res._json?.filename).toBe("plan.docx");
    expect((res._json?.text || "").length).toBeGreaterThan(100);
    expect(res._json?.metadata?.groep).toBe(5);
    expect(res._json?.metadata?.vak).toBe("rekenen");
    expect(res._json?.metadata?.periode).toBe("Q2");
    expect(res._json?.metadata?.slo_codes).toContain("REK-G5-2");
  });

  test("PDF upload parses text and metadata", async () => {
    const longPdfText = [
      "Groep 3 plan taal periode Q1. ",
      "Doelen: woordenschat, zinsbouw. TAA-G3-1 als uitgangspunt. ",
      "Instructie en oefening, differentiatie naar niveau. "
    ].join("");

    jest.doMock("formidable", () => {
      let currentFile = null;
      return {
        IncomingForm: function () {
          return {
            parse: (req, cb) => cb(null, {}, { document: currentFile }),
          };
        },
        __setMockFile: (f) => {
          currentFile = f;
        },
      };
    });

    jest.doMock("pdf-parse", () => jest.fn(async () => ({ text: longPdfText })));

    const formidable = require("formidable");

    const file = {
      mimetype: "application/pdf",
      originalFilename: "plan.pdf",
      filepath: "C:/tmp/mock.pdf",
      size: 4096,
    };
    formidable.__setMockFile(file);

    const handler = require("../pages/api/upload-document.js");
    const { req, res } = createReqRes({ method: "POST" });

    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._json?.success).toBe(true);
    expect(res._json?.filename).toBe("plan.pdf");
    expect((res._json?.text || "").length).toBeGreaterThan(50);
    expect(res._json?.metadata?.groep).toBe(3);
    expect(res._json?.metadata?.vak).toBe("taal");
    expect(res._json?.metadata?.periode).toBe("Q1");
    expect(res._json?.metadata?.slo_codes).toContain("TAA-G3-1");
  });

  test("Unsupported file type returns 400", async () => {
    jest.doMock("formidable", () => {
      let currentFile = null;
      return {
        IncomingForm: function () {
          return {
            parse: (req, cb) => cb(null, {}, { document: currentFile }),
          };
        },
        __setMockFile: (f) => {
          currentFile = f;
        },
      };
    });

    const formidable = require("formidable");
    const file = {
      mimetype: "text/plain",
      originalFilename: "note.txt",
      filepath: "C:/tmp/mock.txt",
      size: 1000,
    };
    formidable.__setMockFile(file);

    const handler = require("../pages/api/upload-document.js");
    const { req, res } = createReqRes({ method: "POST" });

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json?.success).toBe(false);
    expect(String(res._json?.error || "")).toMatch(/niet ondersteund|Upload een PDF of DOCX/i);
  });

  test("File larger than 5MB returns 400", async () => {
    jest.doMock("formidable", () => {
      let currentFile = null;
      return {
        IncomingForm: function () {
          return {
            parse: (req, cb) => cb(null, {}, { document: currentFile }),
          };
        },
        __setMockFile: (f) => {
          currentFile = f;
        },
      };
    });

    const formidable = require("formidable");
    const file = {
      mimetype: "application/pdf",
      originalFilename: "big.pdf",
      filepath: "C:/tmp/mock-big.pdf",
      size: 6 * 1024 * 1024, // 6MB
    };
    formidable.__setMockFile(file);

    const handler = require("../pages/api/upload-document.js");
    const { req, res } = createReqRes({ method: "POST" });

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json?.success).toBe(false);
    expect(String(res._json?.error || "")).toMatch(/te groot|5MB/i);
  });
});

