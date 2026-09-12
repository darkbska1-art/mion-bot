const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("uptime")
        .setDescription("Mion'un ne kadar süredir açık olduğunu gösterir."),

    async execute(interaction, client) {
        const uptime = formatUptime(client.uptime);

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("⏱️ Mion Uptime")
            .setDescription(
                `🟢 Mion **${uptime}** süredir kesintisiz çalışıyor.`
            )
            .addFields(
                {
                    name: "📡 Ping",
                    value: `\`${client.ws.ping}ms\``,
                    inline: true
                },
                {
                    name: "🕐 Başlangıç",
                    value: `<t:${Math.floor((Date.now() - client.uptime) / 1000)}:F>`,
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({
                text: "Mion • Uptime"
            });

        await interaction.reply({
            embeds: [embed]
        });
    }
};

function formatUptime(ms) {
    if (!ms) return "0 saniye";

    const totalSeconds = Math.floor(ms / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];

    if (days) parts.push(`${days} gün`);
    if (hours) parts.push(`${hours} saat`);
    if (minutes) parts.push(`${minutes} dakika`);
    if (seconds || parts.length === 0) parts.push(`${seconds} saniye`);

    return parts.join(" ");
}