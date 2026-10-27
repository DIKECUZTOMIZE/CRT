import assert from "node:assert/strict";
import { register } from "node:module";
import { beforeEach, describe, it } from "node:test";

// axios.js relies on import.meta.env (Vite only), so stub it for Node.
const axiosStub = `export default { get: (...args) => globalThis.__apiGet(...args) };
export const API_ENDPOINTS = { publicEvents: "/events/public" };
export const normalizeError = (error) => error;`;
const hooks = `export async function resolve(specifier, context, next) {
  if (specifier.endsWith("config/axios.js")) {
    return { url: "data:text/javascript," + encodeURIComponent(${JSON.stringify(axiosStub)}), shortCircuit: true };
  }
  return next(specifier, context);
}`;
register(`data:text/javascript,${encodeURIComponent(hooks)}`, import.meta.url);

const { getAllPublicEvents, getPublicEvents } = await import("./filter.api.js");

const page = (events, totalPages) => ({ data: { data: { events, totalPages } } });
let calls;

const mockPages = (pages) => {
  globalThis.__apiGet = async (_url, config) => {
    calls.push(config.params);
    const next = pages[config.params.page - 1];
    if (next instanceof Error) throw next;
    return next ?? page([], 1);
  };
};

describe("getAllPublicEvents", () => {
  beforeEach(() => {
    calls = [];
  });

  it("concatenates pages with limit 50 and stops at totalPages", async () => {
    mockPages([page([{ _id: "a" }], 2), page([{ _id: "b" }], 2), page([{ _id: "c" }], 2)]);
    const result = await getAllPublicEvents({ state: "Assam" });
    assert.deepEqual(result.map((e) => e._id), ["a", "b"]);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], { state: "Assam", page: 1, limit: 50 });
    assert.equal(calls[1].page, 2);
  });

  it("removes duplicate ids but keeps events without ids", async () => {
    mockPages([page([{ _id: "a" }, { id: "b" }, { title: "x" }], 2), page([{ _id: "a" }, { _id: "b" }, { title: "y" }], 2)]);
    const result = await getAllPublicEvents();
    assert.equal(result.length, 4);
    assert.deepEqual(result.map((e) => e._id ?? e.id ?? e.title), ["a", "b", "x", "y"]);
  });

  it("stops on an empty page", async () => {
    mockPages([page([{ _id: "a" }], 5), page([], 5), page([{ _id: "z" }], 5)]);
    const result = await getAllPublicEvents();
    assert.equal(result.length, 1);
    assert.equal(calls.length, 2);
  });

  it("stops after the first page when pagination metadata is missing or invalid", async () => {
    for (const totalPages of [undefined, "abc", 0, -1, 2.5]) {
      calls = [];
      mockPages([page([{ _id: "a" }], totalPages), page([{ _id: "b" }], totalPages)]);
      const result = await getAllPublicEvents();
      assert.equal(result.length, 1);
      assert.equal(calls.length, 1);
    }
  });

  it("never requests more than 20 pages", async () => {
    globalThis.__apiGet = async (_url, config) => {
      calls.push(config.params);
      return page([{ _id: `e${config.params.page}` }], 999);
    };
    const result = await getAllPublicEvents();
    assert.equal(calls.length, 20);
    assert.equal(result.length, 20);
  });

  it("throws when a later page fails", async () => {
    const failure = new Error("boom");
    mockPages([page([{ _id: "a" }], 3), failure]);
    await assert.rejects(() => getAllPublicEvents(), failure);
  });
});

describe("getPublicEvents", () => {
  it("still makes one request without page or limit", async () => {
    calls = [];
    globalThis.__apiGet = async (_url, config) => {
      calls.push(config.params);
      return page([{ _id: "a" }, { _id: "b" }], 9);
    };
    const result = await getPublicEvents({ state: "Assam", search: "" });
    assert.equal(result.length, 2);
    assert.deepEqual(calls, [{ state: "Assam" }]);
  });
});
