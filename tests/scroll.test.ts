import { describe, expect, it } from "vitest";
import { ScrollFollow } from "../client/chat/stream/scroll";

describe("reading a streaming bot conversation", () => {
  it("follows streaming output until the reader scrolls away", () => {
    const scroll = new ScrollFollow();
    expect(scroll.observe(0, 64)).toBe(true);
    expect(scroll.observe(20, 64)).toBe(true);
    expect(scroll.observe(200, 64)).toBe(false);
  });

  it.each([32, 64])("honors small upward scrolls while still within %i pixels of the bottom", (threshold) => {
    const scroll = new ScrollFollow();
    scroll.pause();
    expect(scroll.observe(0, threshold)).toBe(false);
    expect(scroll.observe(4, threshold)).toBe(false);
    expect(scroll.observe(12, threshold)).toBe(false);
    expect(scroll.following).toBe(false);
    expect(scroll.observe(120, threshold)).toBe(false);
  });

  it("resumes only when the reader returns to the bottom", () => {
    const scroll = new ScrollFollow();
    scroll.pause();
    scroll.observe(100, 64);
    expect(scroll.observe(20, 64)).toBe(false);
    expect(scroll.observe(0, 64)).toBe(true);
  });

  it("resumes immediately for an explicit jump or a sent message", () => {
    const scroll = new ScrollFollow();
    scroll.pause();
    expect(scroll.resume()).toBe(true);
    expect(scroll.observe(12, 64)).toBe(true);
  });

  it("does not turn an initial native drag at offset zero into a request to follow", () => {
    const scroll = new ScrollFollow();
    scroll.pause();
    expect(scroll.observe(0, 32)).toBe(false);
    expect(scroll.observe(-4, 32)).toBe(false);
    expect(scroll.observe(2, 32)).toBe(false);
    expect(scroll.observe(0, 32)).toBe(true);
  });
});
