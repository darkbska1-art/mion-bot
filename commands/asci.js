
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ascii")
        .setDescription("Metnini Discord'da ASCII kutusuna dönüştürür.")
        .addStringOption(option =>
            option
                .setName("metin")
                .setDescription("ASCII olarak gösterilecek metin")
                .setRequired(true)
                .setMaxLength(500)
        ),

    async execute(interaction) {
        const metin =
            interaction.options.getString("metin");

        const temiz =
            metin.replace(/`/g, "'");

        const output =
            `\`\`\`\n${temiz}\n\`\`\``;

        if (output.length > 2000) {
            return interaction.reply({
                content:
                    "❌ Metin Discord mesaj sınırını aşıyor.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("🔤 ASCII")
            .setDescription(output)
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};

