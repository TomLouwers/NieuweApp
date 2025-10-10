"use strict";

async function handler(_req, res) {
  const doc = {
    openapi: "3.1.0",
    info: {
      title: "NieuweApp API",
      version: "1.0.0",
      description: "Authenticated v1 API for generating groepsplannen and health checks.",
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        GenerateRequest: {
          type: "object",
          required: ["groep", "vak", "periode"],
          properties: {
            groep: { type: "integer", minimum: 1, maximum: 8 },
            vak: { type: "string", enum: ["rekenen", "taal", "lezen"] },
            periode: { type: "string", minLength: 1, maxLength: 64 },
            previousContent: { type: ["string", "null"], maxLength: 2000 },
            output: { type: "string", enum: ["markdown", "pdf"], default: "markdown" },
            strictMode: { type: "boolean", default: true },
            filename: { type: "string", maxLength: 120 },
          },
          additionalProperties: false,
        },
        GenerateResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            content: { type: "string" },
            metadata: {
              type: "object",
              properties: {
                model: { type: "string" },
                duration_ms: { type: "integer" },
                input: {
                  type: "object",
                  properties: {
                    groep: { type: "integer" },
                    vak: { type: "string" },
                    periode: { type: "string" },
                  },
                },
                length: { type: "integer" },
                words: { type: "integer" },
                slo: {
                  type: "object",
                  properties: {
                    suggested: { type: "array", items: { type: "string" } },
                    referenced: { type: "array", items: { type: "string" } },
                    valid_reference_count: { type: "integer" },
                  },
                },
                strictMode: { type: "boolean" },
              },
            },
            warnings: { type: "array", items: { type: "string" } },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", default: false },
            content: { type: "string" },
            metadata: { type: "object" },
          },
        },
      },
    },
    paths: {
      "/api/v1/health": {
        get: {
          summary: "Service health",
          security: [],
          responses: { "200": { description: "OK" } },
        },
      },
      "/api/v1/groepsplan/generate": {
        post: {
          summary: "Genereer groepsplan (Markdown of PDF)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/GenerateRequest" } },
            },
          },
          responses: {
            "200": {
              description: "OK (Markdown JSON) or PDF stream",
              content: {
                "application/json": { schema: { $ref: "#/components/schemas/GenerateResponse" } },
                "application/pdf": { schema: { type: "string", format: "binary" } },
              },
            },
            "400": { description: "Bad Request", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "401": { description: "Unauthorized" },
            "422": { description: "Quality gates failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            "429": { description: "Rate limited" },
            "500": { description: "Server error" },
          },
        },
      },
      "/api/v1/groepsplan/upload": {
        post: {
          summary: "Upload document for extraction",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } },
            },
          },
          responses: { "200": { description: "OK" }, "400": { description: "Bad Request" }, "401": { description: "Unauthorized" }, "429": { description: "Rate limited" } },
        },
      },
    },
  };
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json(doc);
}

module.exports = handler;
module.exports.default = module.exports;
