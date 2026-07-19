import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("renders the painter study site", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Coat Ready/i);
  assert.match(html, /Painter.*First Class/i);
  assert.match(html, /Practice exam/i);
  assert.match(html, /Paint math/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("ships the complete study bank and practical stations", async () => {
  const source = await readFile(new URL("../app/data.ts", import.meta.url), "utf8");
  const questionBlock = source.slice(source.indexOf("export const questions"), source.indexOf("export const practicalStations"));
  const stationBlock = source.slice(source.indexOf("export const practicalStations"), source.indexOf("export const readinessItems"));
  assert.equal((questionBlock.match(/\{ id: \d+, topic:/g) ?? []).length, 48);
  assert.equal((stationBlock.match(/number: "\d\d"/g) ?? []).length, 8);
  assert.match(source, /OSHA 29 CFR 1926\.451/);
  assert.match(source, /SEPTA Painter–First Class \(1131\) posting/);
});
