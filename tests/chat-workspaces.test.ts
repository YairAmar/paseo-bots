import { describe, expect, it, vi } from "vitest";
import { BOT_LABEL, EMPTY_LIBRARY } from "../shared/bot";
import { startBotChat, type ChatApi, type StartChatInput } from "../shared/chat";
import { makeBot } from "./helpers";

function fixture(snapshot: object | null = { projectId: "project", projectRootPath: "/project", title: "Research" }) {
  const createAgent = vi.fn(async () => ({ id: "new-chat" }));
  const setTitle = vi.fn();
  const workspace = { current: () => snapshot, refresh: vi.fn(async () => snapshot), setTitle, archive: vi.fn(), agents: { create: createAgent } };
  const api = {
    projects: { list: vi.fn(async () => ({ projects: [] })) },
    workspaces: { ref: vi.fn(() => workspace), list: vi.fn(async () => ({ entries: [] })), create: vi.fn(async () => workspace), open: vi.fn(async () => workspace) },
    providers: { snapshot: vi.fn() },
  };
  const input: StartChatInput = { bot: makeBot({ model: "model" }), library: EMPTY_LIBRARY, placement: { path: "/bots/inbox", projectRoot: null }, prompt: "Check the project", systemPrompt: "Bot instructions and memory" };
  return { api: api as unknown as ChatApi, spies: api, workspace, createAgent, input };
}

describe("bot conversations in existing workspaces", () => {
  it("creates the conversation in the chosen workspace and preserves its bot configuration", async () => {
    const f = fixture();
    const image = { data: "image", mimeType: "image/png" };
    expect(await startBotChat(f.api, { ...f.input, workspaceId: "research", agentId: "chosen-agent", clientMessageId: "message", images: [image] })).toBe("new-chat");
    expect(f.spies.workspaces.ref).toHaveBeenCalledWith("research");
    expect(f.workspace.refresh).toHaveBeenCalledOnce();
    expect(f.createAgent).toHaveBeenCalledWith(expect.objectContaining({ agentId: "chosen-agent", prompt: "Check the project", clientMessageId: "message", images: [image], labels: { [BOT_LABEL]: f.input.bot.id }, config: expect.objectContaining({ systemPrompt: "Bot instructions and memory", provider: "claude/model" }) }));
    expect(f.spies.workspaces.create).not.toHaveBeenCalled();
    expect(f.spies.workspaces.list).not.toHaveBeenCalled();
    expect(f.workspace.setTitle).not.toHaveBeenCalled();
  });

  it.each([null, { projectId: "project", projectRootPath: "/project", archivedAt: "2026-01-01" }])("rejects an unavailable workspace without creating a conversation elsewhere", async (snapshot) => {
    const f = fixture(snapshot);
    await expect(startBotChat(f.api, { ...f.input, workspaceId: "unavailable" })).rejects.toThrow("no longer available");
    expect(f.createAgent).not.toHaveBeenCalled();
    expect(f.spies.workspaces.create).not.toHaveBeenCalled();
  });

  it("keeps creating the bot's own workspace when no workspace is selected", async () => {
    const f = fixture();
    await startBotChat(f.api, f.input);
    expect(f.spies.workspaces.create).toHaveBeenCalledWith({ title: f.input.bot.name, source: { kind: "directory", path: "/bots/inbox" } });
    expect(f.createAgent).toHaveBeenCalledOnce();
  });
});
