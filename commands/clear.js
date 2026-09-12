
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Kanaldaki mesajları toplu olarak siler.")
        .addIntegerOption(option =>
            option
                .setName("miktar")
                .setDescription("Silinecek mesaj sayısı (1-100)")
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: "❌ Bu komutu kullanmak için **Mesajları Yönet** yetkisine sahip olmalısın.",
                ephemeral: true
            });
        }

        const miktar = interaction.options.getInteger("miktar");

        await interaction.deferReply({ ephemeral: true });

        try {
            const messages = await interaction.channel.bulkDelete(miktar, true);

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("🧹 Mesajlar Temizlendi")
                .setDescription(
                    `Başarıyla **${messages.size}** mesaj silindi.`
                )
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("Clear hatası:", error);

            await interaction.editReply({
                content: "❌ Mesajlar silinirken bir hata oluştu."
            });
        }
    }
};

