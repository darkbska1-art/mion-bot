
const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sans")
        .setDescription("Bugünkü rastgele şans yüzdesini gösterir.")
        .addUserOption(option =>
            option
                .setName("üye")
                .setDescription("Şansına bakılacak kişi")
        ),

    async execute(interaction) {
        const user =
            interaction.options.getUser("üye") ||
            interaction.user;

        const sans =
            Math.floor(Math.random() * 101);

        let yorum;

        if (sans >= 90) {
            yorum = "🍀 Bugün senin günün!";
        } else if (sans >= 70) {
            yorum = "✨ Şansın oldukça iyi.";
        } else if (sans >= 40) {
            yorum = "🙂 Fena değil.";
        } else if (sans >= 20) {
            yorum = "😅 Bugün biraz dikkat.";
        } else {
            yorum = "💀 Şansını yarına sakla.";
        }

        const embed = new EmbedBuilder()
            .setTitle("🍀 Şans Ölçer")
            .setDescription(
                `${user}\n\n# %${sans}\n\n${yorum}`
            )
            .setThumbnail(
                user.displayAvatarURL({ size: 256 })
            )
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};

