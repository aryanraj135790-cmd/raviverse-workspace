import { describe, it, expect } from "vitest";
import { createBoardStore, TASK_STATUS } from "../../js/board/board-store.js";

const baseData = {
  projects: [{ id: 1, name: "Alpha" }],
  tasks: [{ id: 10, title: "Existing", status: "active", projectId: 1, completedAt: null }],
  groups: [],
};

function readyStore() {
  const store = createBoardStore({ status: "idle", data: null, error: null });
  store.setStatus("success", baseData, null);
  return store;
}

describe("createBoardStore — status transitions", () => {
  it("should transition through valid statuses and keep data on non-success states", () => {
    const store = readyStore();
    store.setStatus("loading", null, null);
    expect(store.getState().status).toBe("loading");
    expect(store.getState().data).toEqual(baseData); // preserved while loading

    store.setStatus("error", null, new Error("boom"));
    expect(store.getState().status).toBe("error");
    expect(store.getState().error.message).toBe("boom");

    store.setStatus("idle", null, null);
    expect(store.getState().data).toBeNull(); // idle resets data
  });

  it("should throw on an invalid status", () => {
    const store = createBoardStore({ status: "idle", data: null, error: null });
    expect(() => store.setStatus("bogus", null, null)).toThrow(/Invalid status/);
  });
});

describe("createBoardStore — optimistic create (ADR-005)", () => {
  it("should add the task with a temporary negative id and normalize project_id", () => {
    const store = readyStore();
    store.beginMutation("create");
    const tempId = store.applyOptimisticCreate({ title: "New", project_id: 1 });

    expect(tempId).toBeLessThan(0);
    const tasks = store.getState().data.tasks;
    expect(tasks.length).toBe(2);
    expect(tasks[1].id).toBe(tempId);
    expect(tasks[1].projectId).toBe(1);
    expect(tasks[1].status).toBe(TASK_STATUS.ACTIVE);
    expect(store.getState().pendingMutation.optimisticTaskId).toBe(tempId);
  });

  it("should replace the optimistic task with the confirmed row", () => {
    const store = readyStore();
    store.beginMutation("create");
    store.applyOptimisticCreate({ title: "New", project_id: 1 });
    store.confirmCreate({ id: 42, projectId: 1, title: "New", status: "active", completedAt: null });

    const tasks = store.getState().data.tasks;
    expect(tasks.length).toBe(2);
    expect(tasks[1].id).toBe(42);
    expect(store.getState().pendingMutation).toBeNull();
  });

  it("should restore the snapshot on rollback (phantom-create removed)", () => {
    const store = readyStore();
    store.beginMutation("create");
    store.applyOptimisticCreate({ title: "New", project_id: 1 });
    store.rollbackMutation();

    const tasks = store.getState().data.tasks;
    expect(tasks.length).toBe(1);
    expect(tasks[0].id).toBe(10);
    expect(store.getState().pendingMutation).toBeNull();
  });
});

describe("createBoardStore — optimistic update/delete", () => {
  it("should merge optimistic updates into the task", () => {
    const store = readyStore();
    store.applyOptimisticUpdate(10, { title: "Renamed" });
    expect(store.getState().data.tasks[0].title).toBe("Renamed");
  });

  it("should remove the task optimistically on delete", () => {
    const store = readyStore();
    store.applyOptimisticDelete(10);
    expect(store.getState().data.tasks.length).toBe(0);
  });

  it("should regenerate groups so renders reflect optimistic changes", () => {
    const store = readyStore();
    store.applyOptimisticCreate({ title: "Grouped", project_id: 1 });
    const group = store.getState().data.groups.find((g) => g.project?.id === 1);
    expect(group.tasks.length).toBe(2);
  });
});
