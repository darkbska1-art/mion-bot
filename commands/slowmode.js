
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Kanalın yavaş modunu ayarlar.")
        .addIntegerOption(option =>
            option
                .setName("saniye")
                .setDescription("Yavaş mod süresi (0-21600 saniye)")
                .setMinValue(0)
                .setMaxValue(21600)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: "❌ Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısın.",
                ephemeral: true
            });
        }

        const saniye = interaction.options.getInteger("saniye");

        try {
            await interaction.channel.setRateLimitPerUser(
                saniye,
                `Slowmode ${interaction.user.tag} tarafından ayarlandı.`
            );

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("🐌 Slowmode Güncellendi")
                .setDescription(
                    saniye === 0
                        ? "Bu kanalda slowmode **kapatıldı**."
                        : `Bu kanalda slowmode **${saniye} saniye** olarak ayarlandı.`
                )
                .setFooter({
                    text: `Ayarlayan: ${interaction.user.tag}`
                })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("Slowmode hatası:", error);

            await interaction.reply({
                content: "❌ Slowmode ayarlanırken bir hata oluştu.",
                ephemeral: true
            });
        }
    }
};

