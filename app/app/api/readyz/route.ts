import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Readiness: additionally confirms the Postgres connection is live via a real
// query, not just whether a Prisma client object was constructed. Deliberately
// does NOT check the inference sidecar — a demo running in LLM_PROVIDER=fixture
// mode must be fully "ready" with no sidecar running. See
// docs/observability.md's "Health endpoints" section for the full contract.
export async function GET() {
  const prisma = new PrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}
