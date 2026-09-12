const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("banner")
        .setDescription("Bir kullanıcının profil bannerını gösterir.")
        .addUserOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Bannerını görmek istediğin kullanıcı.")
                .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser("kullanıcı") || interaction.user;

        const fetchedUser = await user.fetch();
        const banner = fetchedUser.bannerURL({
            extension: "png",
            size: 4096,
            forceStatic: false
        });

        if (!banner) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setDescription(`❌ **${user.username}** kullanıcısının bir bannerı bulunmuyor.`)
                ],
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle(`🎨 ${user.username} • Banner`)
            .setImage(banner)
            .setDescription(`[Bannerı yeni sekmede aç](${banner})`)
            .setFooter({
                text: `Mion • ${user.tag}`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};