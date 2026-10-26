import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOT_LABEL } from "../shared/bot";
import { fakeHost, makeBot } from "./helpers";

const exec = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ execFile: exec }));
import { interruptLocalAgent, stopBotChat } from "../server/chat-control";

function fixture(labels: Record<string, string> = { [BOT_LABEL]: "bot-1" }) {
  const host = fakeHost([makeBot()]);
  host.attach({ agents: { ref: () => ({ refresh: async () => ({ agent: { labels, title: null } }) }) } } as never);
  return host;
}

describe("stopping bot conversations", () => {
  it("interrupts the exact conversation without sending a new message or archiving it", async () => {
    const interrupt = vi.fn(async () => {});
    expect(await stopBotChat(fixture(), { botId: "bot-1", agentId: "chat" }, interrupt)).toEqual({ ok: true });
    expect(interrupt).toHaveBeenCalledExactlyOnceWith("chat");
  });

  it.each([{} as Record<string, string>, { [BOT_LABEL]: "other-bot" }])("rejects an agent outside the selected bot", async (labels) => {
    const interrupt = vi.fn();
    await expect(stopBotChat(fixture(labels), { botId: "bot-1", agentId: "chat" }, interrupt)).rejects.toThrow("does not belong");
    expect(interrupt).not.toHaveBeenCalled();
  });

  it("rejects a deleted bot", async () => {
    const interrupt = vi.fn();
    await expect(stopBotChat(fixture(), { botId: "missing", agentId: "chat" }, interrupt)).rejects.toThrow("no longer exists");
    expect(interrupt).not.toHaveBeenCalled();
  });
});

describe("Paseo CLI interruption", () => {
  beforeEach(() => {
    vi.stubEnv("PASEO_HOME", "/tmp/isolated-bots-home");
    exec.mockReset();
    exec.mockImplementation((_command, _args, _options, callback) => callback(null, "{}", ""));
  });
  afterEach(() => vi.unstubAllEnvs());

  it("targets one agent in the plugin's own daemon home without a shell", async () => {
    await interruptLocalAgent("4f7b7419-4a6b-4d77-9930-9aa9585b0093");
    expect(exec).toHaveBeenCalledWith("paseo", ["agent", "stop", "4f7b7419-4a6b-4d77-9930-9aa9585b0093", "--home", "/tmp/isolated-bots-home", "--json"], expect.objectContaining({ timeout: 30_000, windowsHide: true }), expect.any(Function));
    expect(exec.mock.calls[0]![2]).not.toHaveProperty("shell");
  });

  it("reports a missing CLI with a usable fallback", async () => {
    exec.mockImplementation((_command, _args, _options, callback) => callback(Object.assign(new Error("missing"), { code: "ENOENT" })));
    await expect(interruptLocalAgent("chat")).rejects.toThrow("Open the conversation in Paseo");
  });

  it("reports a failed stop without exposing command output", async () => {
    exec.mockImplementation((_command, _args, _options, callback) => callback(new Error("private diagnostic")));
    await expect(interruptLocalAgent("chat")).rejects.toThrow("Could not stop this conversation");
  });
});
