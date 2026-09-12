
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sec")
        .setDescription("Verdiğin seçeneklerden rastgele birini seçer.")
        .addStringOption(option =>
            option
                .setName("seçenekler")
                .setDescription("Seçenekleri virgülle ayır.")
                .setRequired(true)
                .setMaxLength(1000)
        ),

    async execute(interaction) {
        const input =
            interaction.options.getString("seçenekler");

        const options = input
            .split(",")
            .map(x => x.trim())
            .filter(Boolean);

        if (options.length < 2) {
            return interaction.reply({
                content:
                    "❌ En az **2 seçenek** girmelisin.\nÖrnek: `/sec seçenekler:Elma, Armut, Muz`",
                ephemeral: true
            });
        }

        const selected =
            options[Math.floor(Math.random() * options.length)];

        const embed = new EmbedBuilder()
            .setTitle("🎯 Rastgele Seçim")
            .setDescription(
                `🎯 Benim seçimim:\n\n## ${selected}`
            )
            .addFields({
                name: "📋 Seçenekler",
                value: options
                    .map((x, i) => `${i + 1}. ${x}`)
                    .join("\n")
                    .slice(0, 1024)
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};

