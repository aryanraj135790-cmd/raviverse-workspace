import { describe, expect, it } from "vitest";
import { validateRaviVerseData } from "../../js/validation/validators.js";

describe("validateRaviVerseData", () => {
  it("should return valid RaviVerse data", () => {
    const data = {
      projects: [],
      tasks: [],
      notes: [],
      activities: [],
    };
    const result = validateRaviVerseData(data);
    expect(result).toEqual(data);
  });
  it("should throw an error when projects is missing", () => {
    const invalidData = {
      tasks: [],
      notes: [],
      activities: [],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "Validation failure: 'projects' property missing or is not an array.",
    );
  });
  it("should throw an error when projects is not an array", () => {
    const invalidData = {
      projects: {},
      tasks: [],
      notes: [],
      activities: [],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "Validation failure: 'projects' property missing or is not an array.",
    );
  });
  it("should throw an error when a project has an invalid id", () => {
    const invalidData = {
      projects: [
        {
          id: 0,
          name: "DevFlow AI",
        },
      ],
      tasks: [],
      notes: [],
      activities: [],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "Invalid project at index 0: 'id' must be a positive integer and 'name' must be a non-empty string.",
    );
  });
  it("should throw an error when a project has an invalid name", () => {
    const invalidData = {
      projects: [
        {
          id: 1,
          name: "",
        },
      ],
      tasks: [],
      notes: [],
      activities: [],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "Invalid project at index 0: 'id' must be a positive integer and 'name' must be a non-empty string.",
    );
  });
  it("should throw an error when a task has an invalid status", () => {
    const invalidData = {
      projects: [],
      tasks: [
        {
          id: 1,
          title: "Build dashboard",
          status: "in-progress",
        },
      ],
      notes: [],
      activities: [],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "Invalid task at index 0: 'id' must be a positive integer, 'title' must be a non-empty string, and 'status' must be 'completed' or 'pending'.",
    );
  });
  it("should throw an error when a task has an empty title", () => {
    const invalidData = {
      projects: [],
      tasks: [
        {
          id: 1,
          title: "",
          status: "in-progress",
        },
      ],
      notes: [],
      activities: [],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "Invalid task at index 0: 'id' must be a positive integer, 'title' must be a non-empty string, and 'status' must be 'completed' or 'pending'.",
    );
  });
  it("should throw an error when a note has an invalid id", () => {
    const invalidData = {
      projects: [],
      tasks: [],
      notes: [
        {
          id: 0,
          title: "Architecture ideas",
        },
      ],
      activities: [],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "Invalid note at index 0: 'id' must be a positive integer and 'title' must be a non-empty string.",
    );
  });
  it("should throw an error when a note has an empty title", () => {
    const invalidData = {
      projects: [],
      tasks: [],
      notes: [
        {
          id: 1,
          title: "",
        },
      ],
      activities: [],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "Invalid note at index 0: 'id' must be a positive integer and 'title' must be a non-empty string.",
    );
  });
  it("should throw an error when an activity has an invalid id", () => {
    const invalidData = {
      projects: [],
      tasks: [],
      notes: [],
      activities: [
        {
          id: 0,
          type: "project_created",
          entityType: "project",
          entityId: 1,
          createdAt: "2026-08-19T08:15:00Z",
        },
      ],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "[Index 0] Invalid 'id': Expected a positive integer, received: 0",
    );
  });
  it("should throw an error when an activity has an invalid entityType", () => {
    const invalidData = {
      projects: [],
      tasks: [],
      notes: [],
      activities: [
        {
          id: 1,
          type: "project_created",
          entityType: "user",
          entityId: 1,
          createdAt: "2026-08-19T08:15:00Z",
        },
      ],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "[Index 0] Invalid 'entityType': Expected one of [project, task, note], received: 'user'",
    );
  });
  it("should throw an error when an activity has an invalid type", () => {
    const invalidData = {
      projects: [],
      tasks: [],
      notes: [],
      activities: [
        {
          id: 1,
          type: "user_deleted",
          entityType: "project",
          entityId: 1,
          createdAt: "2026-08-19T08:15:00Z",
        },
      ],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "[Index 0] Invalid 'type': Received an unauthorized activity type string: 'user_deleted'",
    );
  });
  it("should throw an error when an activity has an invalid entityId", () => {
    const invalidData = {
      projects: [],
      tasks: [],
      notes: [],
      activities: [
        {
          id: 1,
          type: "project_created",
          entityType: "project",
          entityId: 0,
          createdAt: "2026-08-19T08:15:00Z",
        },
      ],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "[Index 0] Invalid 'entityId': Expected a positive integer, received: 0",
    );
  });
  it("should throw an error when an activity has an empty createdAt", () => {
    const invalidData = {
      projects: [],
      tasks: [],
      notes: [],
      activities: [
        {
          id: 1,
          type: "project_created",
          entityType: "project",
          entityId: 2,
          createdAt: "",
        },
      ],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "[Index 0] Invalid 'createdAt': Expected a non-empty string, received: ''",
    );
  });
  it("should throw an error when an activity has an invalid createdAt format", () => {
    const invalidData = {
      projects: [],
      tasks: [],
      notes: [],
      activities: [
        {
          id: 1,
          type: "project_created",
          entityType: "project",
          entityId: 2,
          createdAt: "2026-08-19",
        },
      ],
    };
    expect(() => validateRaviVerseData(invalidData)).toThrow(
      "[Index 0] Invalid 'createdAt': Expected a valid parseable date string, received: '2026-08-19'",
    );
  });
});
