import { describe, it, expect } from "vitest";
import { groupTasksByProject } from "../../js/board/group-tasks.js";

describe("groupTasksByProject", () => {
  const projects = [
    { id: 1, name: "Alpha" },
    { id: 2, name: "Beta" },
  ];

  it("should group tasks under their matching project", () => {
    const tasks = [
      { id: 10, title: "A", projectId: 1 },
      { id: 11, title: "B", projectId: 2 },
    ];

    const groups = groupTasksByProject(projects, tasks);

    expect(groups).toHaveLength(2);
    expect(groups[0].project.name).toBe("Alpha");
    expect(groups[0].tasks.map((t) => t.title)).toEqual(["A"]);
    expect(groups[1].project.name).toBe("Beta");
    expect(groups[1].tasks.map((t) => t.title)).toEqual(["B"]);
  });

  it("should bucket tasks without a known project into an unassigned group", () => {
    const tasks = [
      { id: 10, title: "A", projectId: 1 },
      { id: 12, title: "Orphan", projectId: null },
      { id: 13, title: "Ghost", projectId: 999 },
    ];

    const groups = groupTasksByProject(projects, tasks);

    expect(groups).toHaveLength(3);
    const unassigned = groups.find((g) => g.project === null);
    expect(unassigned.tasks.map((t) => t.title)).toEqual(["Orphan", "Ghost"]);
  });

  it("should return an empty list for no projects / no tasks and tolerate null input", () => {
    expect(groupTasksByProject([], [])).toEqual([]);
    expect(groupTasksByProject(null, null)).toEqual([]);
    expect(groupTasksByProject(undefined, undefined)).toEqual([]);
  });
});