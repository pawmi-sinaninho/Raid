import { NextResponse } from "next/server";
import { listDefinitions } from "@/src/core/definition-loader";

export async function GET() {
  return NextResponse.json({
    definitions: listDefinitions().map((definition) => ({
      id: definition.id,
      slug: definition.slug,
      definitionVersion: definition.definitionVersion,
      gameVersion: definition.gameVersion,
      names: definition.names,
      participation: definition.participation,
      durationSeconds: definition.timer.durationSeconds
    }))
  });
}
