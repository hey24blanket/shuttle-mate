import {
  authenticate,
  organizationRef,
  normalize,
  apiError,
} from "@/lib/server";
import { visibleStore, applyCommand } from "@/lib/engine";
import { Command, Store } from "@/lib/model";
export const runtime = "nodejs";
export async function GET(req: Request) {
  try {
    const actor = await authenticate(req);
    const snapshot = await organizationRef(actor).get();
    if (!snapshot.exists())
      return apiError(
        new Error("기관의 노선 데이터가 아직 등록되지 않았습니다."),
        404,
      );
    return Response.json(
      { actor, state: visibleStore(normalize(snapshot.val()), actor) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e, 401);
  }
}
export async function POST(req: Request) {
  try {
    if (Number(req.headers.get("content-length") || 0) > 100000)
      return apiError(new Error("요청이 너무 큽니다."), 413);
    const actor = await authenticate(req);
    const body = await req.text();
    if (body.length > 100000)
      return apiError(new Error("요청이 너무 큽니다."), 413);
    const { command, eventId, revision } = JSON.parse(body) as {
      command: Command;
      eventId: string;
      revision: number;
    };
    if (
      !command ||
      ![
        "CREATE_TRIP",
        "SAVE_ROUTE",
        "START",
        "ARRIVE",
        "DEPART",
        "COMPLETE",
        "CANCEL",
        "BOARD",
        "REQUEST",
        "RESOLVE",
        "DELAY",
        "GPS",
      ].includes(command.type) ||
      !/^[\w-]{1,100}$/.test(eventId) ||
      !Number.isInteger(revision)
    )
      return apiError(new Error("올바르지 않은 요청입니다."));
    let problem = "";
    const result = await organizationRef(actor).transaction(
      (value: Store | null) => {
        if (!value) return value;
        const current = normalize(value);
        if (current.revision !== revision) {
          problem =
            "다른 화면에서 내용이 바뀌었습니다. 새로 반영된 내용을 확인하고 다시 눌러주세요.";
          return;
        }
        try {
          problem = "";
          return applyCommand(current, command, actor, eventId);
        } catch (e) {
          problem = (e as Error).message;
          return;
        }
      },
      undefined,
      false,
    );
    if (!result.committed || !result.snapshot.exists())
      return apiError(new Error(problem || "기관 데이터가 없습니다."), 409);
    return Response.json(
      { actor, state: visibleStore(normalize(result.snapshot.val()), actor) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
