
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("zar")
        .setDescription("Zar at.")
        .addIntegerOption(option =>
            option
                .setName("adet")
                .setDescription("Atılacak zar sayısı")
                .setMinValue(1)
                .setMaxValue(10)
        )
        .addIntegerOption(option =>
            option
                .setName("yuz")
                .setDescription("Zarın yüz sayısı")
                .setMinValue(2)
                .setMaxValue(100)
        ),

    async execute(interaction) {
        const adet =
            interaction.options.getInteger("adet") || 1;

        const yuz =
            interaction.options.getInteger("yuz") || 6;

        const zarlar = [];

        for (let i = 0; i < adet; i++) {
            zarlar.push(
                Math.floor(Math.random() * yuz) + 1
            );
        }

        const toplam = zarlar.reduce(
            (a, b) => a + b,
            0
        );

        const embed = new EmbedBuilder()
            .setTitle("🎲 Zar Atıldı!")
            .setDescription(
                zarlar
                    .map(
                        (zar, index) =>
                            `**Zar ${index + 1}:** 🎲 ${zar}`
                    )
                    .join("\n")
            )
            .addFields({
                name: "➕ Toplam",
                value: `${toplam}`,
                inline: true
            })
            .setFooter({
                text: interaction.user.tag
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};

