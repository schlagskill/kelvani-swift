import test from "node:test";
import assert from "node:assert/strict";
import { managerRoute, requestedWorkspace } from "../routes.js";
const base = "chrome-extension://test/index.html";
test("hash-based changes retain the loaded document and override its initial workspace", () => {
  const route = managerRoute(`${base}?workspace=old`, "new & work");
  assert.equal(route, `${base}?workspace=old#workspace=new+%26+work`);
  assert.equal(requestedWorkspace(route), "new & work");
  assert.equal(new URL(route).pathname, "/index.html");
  assert.equal(new URL(route).search, "?workspace=old");
});
test("empty/current requests preserve the existing URL and current context", () => {
  const current = `${base}?workspace=old#workspace=new`;
  assert.equal(managerRoute(current, "new"), current);
  assert.equal(managerRoute(current, ""), current);
  assert.equal(requestedWorkspace(`${base}?workspace=legacy`), "legacy");
});
