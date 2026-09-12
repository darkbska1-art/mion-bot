const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const os = require("os");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("botbilgi")
        .setDescription("Mion hakkında bilgi gösterir."),

    async execute(interaction, client) {
        const uptime = formatUptime(client.uptime);

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("🤖 Mion Bot Bilgileri")
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .addFields(
                {
                    name: "🤖 Bot",
                    value: `${client.user}`,
                    inline: true
                },
                {
                    name: "🆔 Bot ID",
                    value: `\`${client.user.id}\``,
                    inline: true
                },
                {
                    name: "📡 Sunucular",
                    value: `\`${client.guilds.cache.size}\``,
                    inline: true
                },
                {
                    name: "👥 Kullanıcılar",
                    value: `\`${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}\``,
                    inline: true
                },
                {
                    name: "⚡ Ping",
                    value: `\`${client.ws.ping}ms\``,
                    inline: true
                },
                {
                    name: "⏱️ Uptime",
                    value: `\`${uptime}\``,
                    inline: true
                },
                {
                    name: "🟢 Node.js",
                    value: `\`${process.version}\``,
                    inline: true
                },
                {
                    name: "💻 Platform",
                    value: `\`${os.platform()}\``,
                    inline: true
                },
                {
                    name: "📦 Discord.js",
                    value: `\`${require("discord.js").version}\``,
                    inline: true
                }
            )
            .setTimestamp()
            .setFooter({
                text: "Mion • Bot Bilgileri"
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