const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Bir kullanıcının avatarını gösterir.")
        .addUserOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Avatarını görmek istediğin kullanıcı.")
                .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser("kullanıcı") || interaction.user;

        const avatar = user.displayAvatarURL({
            extension: "png",
            size: 4096,
            forceStatic: false
        });

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle(`🖼️ ${user.username} • Avatar`)
            .setImage(avatar)
            .setDescription(`[Avatarı yeni sekmede aç](${avatar})`)
            .setFooter({
                text: `Mion • ${user.tag}`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};