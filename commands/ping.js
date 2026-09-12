const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const os = require("os");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Botun gecikme ve sistem durumunu gösterir."),

    async execute(interaction) {

        // İlk yanıt süresini ölç
        const start = Date.now();

        await interaction.reply({
            content: "🏓 Ping ölçülüyor...",
            ephemeral: true
        });

        const responseTime = Date.now() - start;

        // Discord WebSocket ping
        const websocketPing = interaction.client.ws.ping;

        // RAM
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        const ramUsed = (usedMemory / 1024 / 1024 / 1024).toFixed(2);
        const ramTotal = (totalMemory / 1024 / 1024 / 1024).toFixed(2);

        // Bot process RAM
        const processMemory = process.memoryUsage().rss;
        const processRam = (processMemory / 1024 / 1024).toFixed(2);

        // CPU
        const cpu = os.cpus();
        const cpuModel = cpu[0]?.model || "Bilinmiyor";
        const cpuCount = cpu.length;

        // Uptime
        const uptimeSeconds = Math.floor(process.uptime());

        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;

        const uptime =
            `${days}g ${hours}s ${minutes}dk ${seconds}sn`;

        // Ping durumunu belirle
        let status;
        let emoji;

        if (websocketPing < 100) {
            status = "Mükemmel";
            emoji = "🟢";
        } else if (websocketPing < 200) {
            status = "İyi";
            emoji = "🟢";
        } else if (websocketPing < 350) {
            status = "Orta";
            emoji = "🟡";
        } else {
            status = "Yüksek";
            emoji = "🔴";
        }

        const embed = new EmbedBuilder()
            .setAuthor({
                name: `${interaction.client.user.username} • Sistem Durumu`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTitle("🏓 Pong!")
            .setDescription(
                `${emoji} **Bağlantı durumu:** ${status}`
            )
            .addFields(
                {
                    name: "⚡ Gecikme",
                    value:
                        `> **Bot Yanıtı:** \`${responseTime}ms\`\n` +
                        `> **WebSocket:** \`${websocketPing}ms\``,
                    inline: true
                },
                {
                    name: "🧠 Bellek",
                    value:
                        `> **Bot:** \`${processRam} MB\`\n` +
                        `> **Sistem:** \`${ramUsed} / ${ramTotal} GB\``,
                    inline: true
                },
                {
                    name: "💻 Sistem",
                    value:
                        `> **CPU:** \`${cpuCount} çekirdek\`\n` +
                        `> **Platform:** \`${os.platform()}\``,
                    inline: true
                },
                {
                    name: "⏱️ Uptime",
                    value: `> \`${uptime}\``,
                    inline: true
                },
                {
                    name: "🤖 Discord.js",
                    value:
                        `> \`${require("discord.js").version}\``,
                    inline: true
                },
                {
                    name: "🟢 Durum",
                    value:
                        `> ${emoji} **${status}**`,
                    inline: true
                }
            )
            .setFooter({
                text: `İsteyen: ${interaction.user.username}`
            })
            .setTimestamp();

        await interaction.editReply({
            content: "",
            embeds: [embed]
        });
    }
};