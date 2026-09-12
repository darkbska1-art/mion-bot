const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sunucubilgi")
        .setDescription("Sunucu hakkında bilgi gösterir."),

    async execute(interaction) {
        const guild = interaction.guild;

        const owner = await guild.fetchOwner();

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle(`🏠 ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
            .addFields(
                {
                    name: "🆔 Sunucu ID",
                    value: `\`${guild.id}\``,
                    inline: true
                },
                {
                    name: "👑 Sunucu Sahibi",
                    value: `${owner.user}`,
                    inline: true
                },
                {
                    name: "👥 Üye Sayısı",
                    value: `\`${guild.memberCount}\``,
                    inline: true
                },
                {
                    name: "💬 Kanal Sayısı",
                    value: `\`${guild.channels.cache.size}\``,
                    inline: true
                },
                {
                    name: "🎭 Rol Sayısı",
                    value: `\`${guild.roles.cache.size}\``,
                    inline: true
                },
                {
                    name: "😀 Emoji Sayısı",
                    value: `\`${guild.emojis.cache.size}\``,
                    inline: true
                },
                {
                    name: "📅 Oluşturulma Tarihi",
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({
                text: `Mion • ${guild.name}`
            });

        await interaction.reply({
            embeds: [embed]
        });
    }
};