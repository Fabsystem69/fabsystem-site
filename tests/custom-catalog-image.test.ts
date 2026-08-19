import assert from "node:assert/strict";
import test from "node:test";
import { validateCustomItemImageDataUrl } from "@/lib/custom-catalog-image";

const TINY_JPEG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

test("custom item image validation accepts a small JPEG data URL", () => {
  assert.doesNotThrow(() => validateCustomItemImageDataUrl(TINY_JPEG));
});

test("custom item image validation rejects unsupported formats", () => {
  assert.throws(() => validateCustomItemImageDataUrl("data:image/gif;base64,R0lGODlh"));
});

test("custom item image validation rejects payloads over 250KB", () => {
  const oversized = `data:image/jpeg;base64,${"A".repeat(400_000)}`;
  assert.throws(() => validateCustomItemImageDataUrl(oversized));
});

test("custom item image validation rejects an empty payload", () => {
  assert.throws(() => validateCustomItemImageDataUrl("data:image/png;base64,"));
});
