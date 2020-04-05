import { Manager as LavacordManager, LavalinkNodeOptions, DiscordPacket, ManagerOptions } from "lavacord";
import { Client as ErisClient } from "eris";

export class Manager extends LavacordManager {
    public constructor(readonly client: ErisClient, nodes: LavalinkNodeOptions[], options?: ManagerOptions) {
        super(nodes, options || {});
        this.send = packet => {
            const guild = this.client.guilds.get(packet.d.guild_id);
            if (!guild) return;
            return guild.shard.sendWS(packet.op, packet.d);
        };

        client
            .once("ready", () => {
                this.user = client.user.id;
                this.shards = client.shards.size || 1;
            })
            .on("rawWS", async (packet: DiscordPacket) => {
                switch (packet.t) {
                    case "VOICE_SERVER_UPDATE":
                        await this.voiceServerUpdate(packet.d);
                        break;
                    case "VOICE_STATE_UPDATE":
                        await this.voiceStateUpdate(packet.d);
                        break;
                    case "GUILD_CREATE":
                        for (const state of packet.d.voice_states) await this.voiceStateUpdate({ ...state, guild_id: packet.d.id });
                        break;
                }
            });

    }

}
