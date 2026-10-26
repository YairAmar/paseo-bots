import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { BotsHost } from "./host";

const execute = promisify(execFile);

export async function interruptLocalAgent(agentId: string): Promise<void> {
  const home = process.env.PASEO_HOME || join(homedir(), ".paseo");
  try {
    await execute("paseo", ["agent", "stop", agentId, "--home", home, "--json"], { timeout: 30_000, maxBuffer: 256 * 1024, windowsHide: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error("Paseo CLI was not found on this host. Open the conversation in Paseo to stop it.");
    throw new Error("Could not stop this conversation. Check its status and try again.");
  }
}

export async function stopBotChat(host: BotsHost, input: { botId: string; agentId: string }, interrupt = interruptLocalAgent): Promise<{ ok: boolean }> {
  const bot = await host.bot(input.botId);
  if (!bot) throw new Error("This bot no longer exists.");
  const chat = await host.chatOf(input.agentId);
  if (!chat || chat.botId !== bot.id) throw new Error("This conversation does not belong to the selected bot on this host.");
  await interrupt(input.agentId);
  return { ok: true };
}
