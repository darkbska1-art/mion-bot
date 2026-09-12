
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const espriler = [
    "Bilgisayar neden doktora gitmiş? Çünkü virüs kapmış. 💻😂",
    "Matematik kitabı neden üzgünmüş? Çünkü çok problemi varmış. 📚😂",
    "Elektrikçi neden çok mutluydu? Çünkü hayatında akım vardı. ⚡😂",
    "Klavye neden kavga etmiş? Çünkü tuşuna basılmış. ⌨️😂",
    "Telefon neden gözlük takmış? Çünkü ekranı bulanıkmış. 📱😂",
    "Programcı neden denize girmiş? Çünkü bug bulmuş. 🐛😂",
    "Kalem neden toplantıya gitmiş? Çünkü önemli bir noktası varmış. ✏️😂"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("espri")
        .setDescription("Rastgele bir espri gösterir."),

    async execute(interaction) {
        const espri =
            espriler[
                Math.floor(Math.random() * espriler.length)
            ];

        const embed = new EmbedBuilder()
            .setTitle("😂 Mion Espri Makinesi")
            .setDescription(espri)
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};

