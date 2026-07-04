import { NextResponse } from "next/server";
import { getRuntime } from "@/src/server/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const { db } = await getRuntime();
  const result = await db.query<{ ok: number }>("SELECT 1 AS ok");
  return NextResponse.json({ status: result.rows[0]?.ok === 1 ? "ok" : "degraded", version: "0.6.0" });
}
