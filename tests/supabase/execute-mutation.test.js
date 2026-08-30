import { describe, expect, it, vi, beforeEach } from "vitest";
import { executeMutation } from "../../js/supabase/execute-mutation.js";
import * as activityWrites from "../../js/supabase/activity-writes.js";

vi.mock("../../js/supabase/activity-writes.js", () => ({
  logActivity: vi.fn().mockResolvedValue({ success: true }),
}));

describe("executeMutation Guard & Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw TypeError if log payload is missing", async () => {
    const mockAction = vi.fn().mockResolvedValue({ id: 1 });

    await expect(executeMutation({ action: mockAction })).rejects.toThrow(
      TypeError,
    );

    expect(mockAction).not.toHaveBeenCalled();
  });

  it("should throw TypeError if action is not a function", async () => {
    await expect(
      executeMutation({ action: "invalid", log: { type: "test" } }),
    ).rejects.toThrow(TypeError);
  });

  it("should execute action successfully and return DB result", async () => {
    const dbRow = { id: 42, title: "Write Vitest Tests" };
    const mockAction = vi.fn().mockResolvedValue(dbRow);
    const logPayload = { type: "task_created", entityId: 42 };

    const result = await executeMutation({
      action: mockAction,
      log: logPayload,
    });

    expect(mockAction).toHaveBeenCalledTimes(1);
    expect(result).toEqual(dbRow);
    expect(activityWrites.logActivity).toHaveBeenCalledWith(logPayload);
  });

  it("should wrap action error with native Error + .cause and skip logging", async () => {
    const originalDbError = new Error("Unique constraint violation");
    const mockAction = vi.fn().mockRejectedValue(originalDbError);
    const logSpy = vi.spyOn(activityWrites, "logActivity");

    let thrownError;
    try {
      await executeMutation({
        action: mockAction,
        log: { type: "task_created" },
      });
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError.message).toBe("Database mutation failed.");
    expect(thrownError.cause).toBe(originalDbError);

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("should support dynamic log functions receiving the action result", async () => {
    const dbRow = { id: 101, title: "Dynamic Task" };
    const mockAction = vi.fn().mockResolvedValue(dbRow);
    const logFn = vi.fn((result) => ({
      type: "task_created",
      entityId: result.id,
      entityName: result.title,
    }));

    await executeMutation({ action: mockAction, log: logFn });

    expect(logFn).toHaveBeenCalledWith(dbRow);
    expect(activityWrites.logActivity).toHaveBeenCalledWith({
      type: "task_created",
      entityId: 101,
      entityName: "Dynamic Task",
    });
  });

  it("should swallow logActivity failure with console.warn and still return action result", async () => {
    const dbRow = { id: 200, status: "completed" };
    const mockAction = vi.fn().mockResolvedValue(dbRow);
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    vi.spyOn(activityWrites, "logActivity").mockRejectedValueOnce(
      new Error("Network timeout"),
    );

    const result = await executeMutation({
      action: mockAction,
      log: { type: "task_completed" },
    });

    expect(result).toEqual(dbRow);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Activity log failed after DB mutation succeeded:",
      expect.any(Error),
    );

    consoleWarnSpy.mockRestore();
  });
});
