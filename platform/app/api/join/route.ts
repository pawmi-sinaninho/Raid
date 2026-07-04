import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/src/server/api";
import { getRuntime } from "@/src/server/runtime";
import { assertSameOrigin } from "@/src/server/security";

const JoinSession = z.object({
  inviteToken: z.string().min(20),
  displayName: z.string().trim().min(1).max(40)
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = JoinSession.parse(await request.json());
    const { store } = await getRuntime();
    return NextResponse.json(await store.joinByInvite(input.inviteToken, input.displayName), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
