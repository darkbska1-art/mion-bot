
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const secenekler = ["taş", "kağıt", "makas"];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tasmakas")
        .setDescription("Taş, kağıt, makas oyna.")
        .addStringOption(option =>
            option
                .setName("seçim")
                .setDescription("Seçimini yap.")
                .setRequired(true)
                .addChoices(
                    { name: "🪨 Taş", value: "taş" },
                    { name: "📄 Kağıt", value: "kağıt" },
                    { name: "✂️ Makas", value: "makas" }
                )
        ),

    async execute(interaction) {
        const oyuncu =
            interaction.options.getString("seçim");

        const bot =
            secenekler[
                Math.floor(Math.random() * secenekler.length)
            ];

        let sonuc;

        if (oyuncu === bot) {
            sonuc = "🤝 Berabere!";
        } else if (
            (oyuncu === "taş" && bot === "makas") ||
            (oyuncu === "kağıt" && bot === "taş") ||
            (oyuncu === "makas" && bot === "kağıt")
        ) {
            sonuc = "🏆 Kazandın!";
        } else {
            sonuc = "😢 Kaybettin!";
        }

        const embed = new EmbedBuilder()
            .setTitle("🪨 Taş • 📄 Kağıt • ✂️ Makas")
            .addFields(
                {
                    name: "👤 Sen",
                    value: oyuncu,
                    inline: true
                },
                {
                    name: "🤖 Mion",
                    value: bot,
                    inline: true
                },
                {
                    name: "🏁 Sonuç",
                    value: sonuc
                }
            )
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};

