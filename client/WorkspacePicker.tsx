import { SettingsCard, SettingsSelect } from "@getpaseo/plugin/client/ui";
import { View } from "react-native";
import { useHostWorkspaces, type BotHost } from "./data";

export function WorkspacePicker({ host, botName, value, onChange }: {
  host: BotHost;
  botName: string;
  value: string | null;
  onChange(value: string | null): void;
}) {
  const workspaces = useHostWorkspaces(host);
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      <SettingsCard>
        <SettingsSelect
          label="Workspace"
          value={value ?? ""}
          disabled={workspaces.isLoading || !host.api}
          options={[
            { label: `${botName}'s workspace`, value: "" },
            ...(workspaces.data ?? []).map((workspace) => ({ label: workspace.label, value: workspace.id })),
          ]}
          onValueChange={(next) => onChange(next || null)}
        />
      </SettingsCard>
    </View>
  );
}
