import test from "node:test";
import assert from "node:assert/strict";
import { validateImageUpload, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "../src/lib/upload/validation";

test("upload validation: rejects null or missing file", () => {
  const result = validateImageUpload(null);
  assert.equal(result.valid, false);
  assert.match(result.error!, /No image file provided/i);

  const undefResult = validateImageUpload(undefined);
  assert.equal(undefResult.valid, false);
  assert.match(undefResult.error!, /No image file provided/i);
});

test("upload validation: rejects empty 0-byte file", () => {
  const result = validateImageUpload({ size: 0, type: "image/png" });
  assert.equal(result.valid, false);
  assert.match(result.error!, /Empty file/i);
});

test("upload validation: rejects invalid MIME types (e.g. text/plain, application/pdf, video/mp4)", () => {
  const textResult = validateImageUpload({ size: 1024, type: "text/plain" });
  assert.equal(textResult.valid, false);
  assert.match(textResult.error!, /Invalid file type/i);

  const pdfResult = validateImageUpload({ size: 2048, type: "application/pdf" });
  assert.equal(pdfResult.valid, false);
  assert.match(pdfResult.error!, /Invalid file type/i);

  const exeResult = validateImageUpload({ size: 4096, type: "application/x-msdownload" });
  assert.equal(exeResult.valid, false);
  assert.match(exeResult.error!, /Invalid file type/i);
});

test("upload validation: rejects files exceeding 10MB limit", () => {
  const oversized = validateImageUpload({
    size: MAX_FILE_SIZE + 1,
    type: "image/jpeg",
  });
  assert.equal(oversized.valid, false);
  assert.match(oversized.error!, /exceeds 10MB limit/i);
});

test("upload validation: accepts valid image types within size limit", () => {
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  for (const type of validTypes) {
    const res = validateImageUpload({ size: 2 * 1024 * 1024, type });
    assert.equal(res.valid, true, `MIME type ${type} should be valid`);
    assert.equal(res.error, undefined);
  }
});
