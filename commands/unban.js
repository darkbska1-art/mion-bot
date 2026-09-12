const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Yasaklı bir kullanıcının yasağını kaldırır.")
        .addStringOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Kullanıcının Discord ID'si")
                .setRequired(true)
                .setMinLength(17)
                .setMaxLength(20)
        )
        .addStringOption(option =>
            option
                .setName("sebep")
                .setDescription("Yasağın kaldırılma sebebi")
                .setMaxLength(500)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const userId =
            interaction.options.getString("kullanıcı").trim();

        const reason =
            interaction.options.getString("sebep") ||
            "Sebep belirtilmedi.";

        // ID kontrolü
        if (!/^\d{17,20}$/.test(userId)) {
            return interaction.reply({
                content: "❌ Geçerli bir Discord kullanıcı ID'si gir.",
                ephemeral: true
            });
        }

        try {
            const banInfo = await interaction.guild.bans
                .fetch(userId)
                .catch(() => null);

            if (!banInfo) {
                return interaction.reply({
                    content:
                        "❌ Bu kullanıcı sunucunun yasaklılar listesinde bulunamadı.",
                    ephemeral: true
                });
            }

            await interaction.guild.bans.remove(
                userId,
                `${reason} | Yetkili: ${interaction.user.tag}`
            );

            const embed = new EmbedBuilder()
                .setTitle("🔓 Yasak Kaldırıldı")
                .setDescription(
                    `**${banInfo.user.tag}** kullanıcısının yasağı kaldırıldı.`
                )
                .addFields(
                    {
                        name: "👤 Kullanıcı",
                        value: `${banInfo.user.tag} (\`${userId}\`)`,
                        inline: true
                    },
                    {
                        name: "🛡️ Yetkili",
                        value: `${interaction.user}`,
                        inline: true
                    },
                    {
                        name: "📝 Sebep",
                        value: reason
                    }
                )
                .setThumbnail(
                    banInfo.user.displayAvatarURL({ size: 256 })
                )
                .setTimestamp()
                .setFooter({
                    text: "Mion Moderasyon"
                });

            await interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("❌ Unban hatası:", error);

            await interaction.reply({
                content:
                    "❌ Kullanıcının yasağı kaldırılamadı. Botun **Ban Members** yetkisini kontrol et.",
                ephemeral: true
            });
        }
    }
};