import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../js/supabase/client.js", () => ({
  supabase: { from: vi.fn() },
}));
vi.mock("../../js/supabase/auth.js", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

import { supabase } from "../../js/supabase/client.js";
import { getAuthenticatedUserId } from "../../js/supabase/auth.js";
import {
  ACTIVITY_TYPE,
  ENTITY_TYPE,
  logActivity,
} from "../../js/supabase/activity-writes.js";

function mockInsert() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  supabase.from.mockReturnValue({ insert });
  return insert;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("logActivity", () => {
  it("should insert the exact activities row shape (snake_case columns)", async () => {
    getAuthenticatedUserId.mockResolvedValue("user-1");
    const insert = mockInsert();

    await logActivity({
      type: ACTIVITY_TYPE.TASK_COMPLETED,
      entityType: ENTITY_TYPE.TASK,
      entityName: "Build adapter seam",
      entityId: 42,
    });

    expect(supabase.from).toHaveBeenCalledWith("activities");
    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      type: "task_completed",
      entity_type: "task",
      entity_id: 42,
      entity_name: "Build adapter seam",
      deprecated: false,
    });
  });

  it("should insert entity_id as null when omitted (hard-deleted entity)", async () => {
    getAuthenticatedUserId.mockResolvedValue("user-1");
    const insert = mockInsert();

    await logActivity({
      type: ACTIVITY_TYPE.PROJECT_DELETED,
      entityType: ENTITY_TYPE.PROJECT,
      entityName: "Old project",
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ entity_id: null }),
    );
  });

  it("should pass through the deprecated flag for hard-delete tombstones", async () => {
    getAuthenticatedUserId.mockResolvedValue("user-1");
    const insert = mockInsert();

    await logActivity({
      type: ACTIVITY_TYPE.NOTE_DELETED,
      entityType: ENTITY_TYPE.NOTE,
      entityName: "Purge target",
      entityId: 7,
      deprecated: true,
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ deprecated: true }),
    );
  });

  it("should throw a native Error with the vendor error as cause", async () => {
    getAuthenticatedUserId.mockResolvedValue("user-1");
    const vendorError = { message: "row-level security violation" };
    const insert = vi.fn().mockResolvedValue({ error: vendorError });
    supabase.from.mockReturnValue({ insert });

    await expect(
      logActivity({
        type: ACTIVITY_TYPE.TASK_CREATED,
        entityType: ENTITY_TYPE.TASK,
        entityName: "Any task",
      }),
    ).rejects.toThrow("Failed to log activity: row-level security violation");

    await expect(
      logActivity({
        type: ACTIVITY_TYPE.TASK_CREATED,
        entityType: ENTITY_TYPE.TASK,
        entityName: "Any task",
      }),
    ).rejects.toMatchObject({ cause: vendorError });
  });

  it("should propagate the unauthenticated error from getAuthenticatedUserId", async () => {
    getAuthenticatedUserId.mockRejectedValue(
      new Error("No authenticated user: cannot resolve user_id"),
    );

    await expect(
      logActivity({
        type: ACTIVITY_TYPE.TASK_CREATED,
        entityType: ENTITY_TYPE.TASK,
        entityName: "Any task",
      }),
    ).rejects.toThrow("No authenticated user");
  });
});
