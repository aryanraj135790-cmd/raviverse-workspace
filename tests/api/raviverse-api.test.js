import { describe, expect, it, vi, afterEach } from "vitest";
import { getRaviVerseData } from "../../js/api/raviverse-api.js";

describe("getRaviVerseData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it("should return validated RaviVerse data when the request succeeds", async () => {
    const mockData = {
      projects: [{ id: 1, name: "RaviVerse" }],
      tasks: [],
      notes: [],
      activities: [],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      }),
    );
    const result = await getRaviVerseData();
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("should throw an error when the server returns an HTTP failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      }),
    );
    await expect(getRaviVerseData()).rejects.toThrow(
      "HTTP failure: Server returned 500.",
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("should throw an error when the network request fails", async () => {
    const networkError = new Error("Connection refused");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));
    const promise = getRaviVerseData();
    await expect(promise).rejects.toMatchObject({
      message: "Network failure: Unable to fetch RaviVerse data.",
      cause: networkError,
    });
  });
  it("should throw an error when JSON parsing fails", async () => {
    const jsonError = new SyntaxError(
      "Unexpected token < in JSON at position 0",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(jsonError),
      }),
    );
    const promise = getRaviVerseData();
    await expect(promise).rejects.toMatchObject({
      message: "Data parsing failure: Invalid RaviVerse JSON.",
      cause: jsonError,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("should throw a validation error when the API returns invalid data", async () => {
    const invalidData = {
      tasks: [],
      notes: [],
      activities: [],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => invalidData,
      }),
    );
    await expect(getRaviVerseData()).rejects.toThrow(
      "Validation failure: 'projects' property missing or is not an array.",
    );
  });
});
