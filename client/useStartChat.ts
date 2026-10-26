import { useRpc } from "@getpaseo/plugin/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Bot, Library } from "../shared/bot";
import { startBotChat } from "../shared/chat";
import { ensureBotHomeRpc, mountRpc, systemPromptRpc } from "../shared/rpc";
import { newUuid } from "../shared/uuid";
import type { OutgoingMessage } from "./ChatPane";
import type { BotHost } from "./data";

export function useStartChat(bot: Bot | null, library: Library, host: BotHost) {
  const ensureHome = useRpc(ensureBotHomeRpc);
  const compose = useRpc(systemPromptRpc);
  const mountServers = useRpc(mountRpc);
  const queryClient = useQueryClient();

  return async (message: OutgoingMessage, workspaceId?: string) => {
    if (!bot) throw new Error("Choose a bot first.");
    if (!host.api) throw new Error(`${host.label} is offline.`);
    const home = await ensureHome({ botId: bot.id });
    const placement = bot.cwd ? { path: bot.cwd, projectRoot: null } : { path: home.path, projectRoot: home.root };
    const { systemPrompt } = await compose({ bot, local: host.isLocal, message: message.text });
    const agentId = newUuid();
    const plugin = host.isLocal ? await mountServers({ botId: bot.id, agentId }) : {};
    const id = await startBotChat(host.api, {
      bot,
      library,
      ...(host.isLocal ? { agentId } : {}),
      plugin,
      placement,
      ...(workspaceId ? { workspaceId } : {}),
      prompt: message.text,
      systemPrompt,
      images: message.images,
      attachments: message.attachments,
      clientMessageId: message.messageId,
    });
    await queryClient.invalidateQueries({ queryKey: ["paseo-bots", "chats", host.key, bot.id] });
    return id;
  };
}
