import { expect, test } from "vitest"
const { appendHttps, isURLValid } = require("../utils/url")

test('appendHttps', () => {
  expect(appendHttps("http://example.com")).toBe("http://example.com")
  expect(appendHttps("https://example.com")).toBe("https://example.com")
  expect(appendHttps("example.com")).toBe("https://example.com")
})

test('isURLValid', () => {
  expect(isURLValid("http://example.com")).toBe(true)
  expect(isURLValid("https://example.com")).toBe(true)
  expect(isURLValid("example.com")).toBe(true)
  expect(isURLValid("example")).toBe(false)
  expect(isURLValid("https://example.com?query=1")).toBe(true)
  expect(isURLValid("https://example.com#contactme")).toBe(true)
  expect(isURLValid("https://example.com/download/module.pdf")).toBe(true)
})