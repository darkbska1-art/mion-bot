
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("yazitura")
        .setDescription("Yazı veya tura at."),

    async execute(interaction) {
        const sonuc =
            Math.random() < 0.5
                ? "🪙 YAZI"
                : "🪙 TURA";

        const embed = new EmbedBuilder()
            .setTitle("🪙 Yazı Tura")
            .setDescription(`## ${sonuc}`)
            .setFooter({
                text: `Atan: ${interaction.user.tag}`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};

