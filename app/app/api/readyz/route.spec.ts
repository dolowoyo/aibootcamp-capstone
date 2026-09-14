import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the Prisma boundary so this unit test never requires a live Postgres
// connection (per the project's determinism-at-the-boundary convention —
// mirrors how lib/inference/ mocks the provider boundary, not the DB itself).
const queryRawMock = vi.fn();
const disconnectMock = vi.fn();

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $queryRaw: queryRawMock,
    $disconnect: disconnectMock,
  })),
}));

describe("GET /api/readyz", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with { status: 'ok' } when a real SELECT 1 query against Postgres succeeds", async () => {
    queryRawMock.mockResolvedValueOnce([{ "?column?": 1 }]);

    const { GET } = await import("./route");
    const response = await GET();

    expect(queryRawMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("returns a non-2xx status when the Postgres query fails", async () => {
    queryRawMock.mockRejectedValueOnce(new Error("connection refused"));

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(response.status).toBeLessThan(600);
    const body = await response.json();
    expect(body.status).not.toBe("ok");
  });
});
