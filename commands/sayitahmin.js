
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sayitahmin")
        .setDescription("1 ile 100 arasında sayı tahmin et.")
        .addIntegerOption(option =>
            option
                .setName("tahmin")
                .setDescription("Tahminin")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        ),

    async execute(interaction) {
        const tahmin =
            interaction.options.getInteger("tahmin");

        const sayi =
            Math.floor(Math.random() * 100) + 1;

        let sonuc;

        if (tahmin === sayi) {
            sonuc = `🎉 Bildin! Sayı **${sayi}** idi!`;
        } else if (tahmin < sayi) {
            sonuc =
                `📈 Bilemedin! Benim sayım **${sayi}** idi.\n` +
                "💡 Daha yüksek bir sayı seçmeliydin.";
        } else {
            sonuc =
                `📉 Bilemedin! Benim sayım **${sayi}** idi.\n` +
                "💡 Daha düşük bir sayı seçmeliydin.";
        }

        const embed = new EmbedBuilder()
            .setTitle("🔢 Sayı Tahmin")
            .setDescription(sonuc)
            .addFields({
                name: "🎯 Senin Tahminin",
                value: `${tahmin}`,
                inline: true
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};
