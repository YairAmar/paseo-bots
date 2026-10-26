import type { PluginWorkspacePanelProps } from "@getpaseo/plugin/client";
import { useSettings } from "@getpaseo/plugin/client";
import { SettingsCard, SettingsSelect } from "@getpaseo/plugin/client/ui";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { botSettings, EMPTY_LIBRARY } from "../shared/bot";
import { Composer } from "./chat/Composer";
import { useBotHost } from "./data";
import { useKeyboardHeight } from "./keyboard";
import { useStartChat } from "./useStartChat";
import { ui } from "./typography";

export function WorkspaceChat({ theme, host: localHost, layout, workspaceId, navigation }: PluginWorkspacePanelProps) {
  const { colors } = theme;
  const settings = useSettings(botSettings);
  const [selected, setSelected] = useState<string | null>(null);
  const bots = settings.status === "ready" ? settings.values.bots.filter((bot) => !bot.archived && (!bot.hostId || bot.hostId === localHost.id)) : [];
  const bot = bots.find((entry) => entry.id === selected) ?? bots[0] ?? null;
  const host = useBotHost(null, localHost);
  const start = useStartChat(bot, settings.status === "ready" ? settings.values.library ?? EMPTY_LIBRARY : EMPTY_LIBRARY, host);
  const keyboardHeight = useKeyboardHeight();
  return (
    <View style={{ flex: 1, minHeight: 0, paddingBottom: keyboardHeight, backgroundColor: colors.surface0 }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: colors.foreground, fontSize: ui(18), fontWeight: "500" }}>Chat with a bot</Text>
        <Text style={{ color: colors.foregroundMuted, fontSize: ui(14) }}>Start a conversation in this workspace with the bot's instructions, memory, skills and tools.</Text>
        {settings.status !== "ready" ? <ActivityIndicator color={colors.foregroundMuted} /> : bots.length === 0 ? (
          <Text style={{ color: colors.foregroundMuted, fontSize: ui(14) }}>Create a bot on this host in Bots first.</Text>
        ) : (
          <SettingsCard>
            <SettingsSelect label="Bot" value={bot?.id ?? ""} options={bots.map((entry) => ({ label: entry.name, value: entry.id }))} onValueChange={setSelected} />
          </SettingsCard>
        )}
      </View>
      <View style={{ flex: 1 }} />
      {bot ? <Composer
        colors={colors}
        bot={bot}
        host={host}
        agentId={null}
        draftScope={workspaceId}
        running={false}
        layout={layout}
        keyboardOpen={keyboardHeight > 0}
        onStart={async (message) => {
          if (!navigation) throw new Error("Update Paseo to open bot conversations in workspace tabs.");
          const agentId = await start(message, workspaceId);
          navigation.openAgent({ agentId, serverId: localHost.id });
        }}
      /> : null}
    </View>
  );
}
