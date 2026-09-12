
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const cevaplar = [
    "🎱 Kesinlikle evet!",
    "🎱 Evet, büyük ihtimalle.",
    "🎱 Buna güvenebilirsin.",
    "🎱 Görünüşe göre evet.",
    "🎱 Şimdilik evet.",
    "🎱 Kararsızım...",
    "🎱 Tekrar sor.",
    "🎱 Pek sanmıyorum.",
    "🎱 Büyük ihtimalle hayır.",
    "🎱 Hayır.",
    "🎱 Kesinlikle hayır!"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("8ball")
        .setDescription("Sihirli 8 topuna soru sor.")
        .addStringOption(option =>
            option
                .setName("soru")
                .setDescription("Soracağın soru")
                .setRequired(true)
                .setMaxLength(500)
        ),

    async execute(interaction) {
        const soru = interaction.options.getString("soru");
        const cevap =
            cevaplar[Math.floor(Math.random() * cevaplar.length)];

        const embed = new EmbedBuilder()
            .setTitle("🎱 Magic 8-Ball")
            .addFields(
                {
                    name: "❓ Soru",
                    value: soru
                },
                {
                    name: "🔮 Cevap",
                    value: cevap
                }
            )
            .setFooter({
                text: `Soruyu soran: ${interaction.user.tag}`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};

