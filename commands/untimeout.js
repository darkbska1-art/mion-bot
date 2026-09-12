
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("untimeout")
        .setDescription("Bir kullanıcının timeoutunu kaldırır.")
        .addUserOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Timeoutu kaldırılacak kullanıcı.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                content: "❌ Bu komut için **Üyeleri Yönet** yetkisine sahip olmalısın.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser("kullanıcı");

        const member = await interaction.guild.members
            .fetch(user.id)
            .catch(() => null);

        if (!member) {
            return interaction.reply({
                content: "❌ Bu kullanıcı sunucuda bulunamadı.",
                ephemeral: true
            });
        }

        if (!member.communicationDisabledUntilTimestamp) {
            return interaction.reply({
                content: "❌ Bu kullanıcının aktif bir timeoutu yok.",
                ephemeral: true
            });
        }

        if (!member.moderatable) {
            return interaction.reply({
                content: "❌ Bu kullanıcının timeoutunu kaldıramıyorum.",
                ephemeral: true
            });
        }

        try {
            await member.timeout(null, `Timeout kaldırıldı: ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("🔓 Timeout Kaldırıldı")
                .setDescription(`${user} kullanıcısının timeoutu kaldırıldı.`)
                .setFooter({
                    text: `Yetkili: ${interaction.user.tag}`
                })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("Untimeout hatası:", error);

            await interaction.reply({
                content: "❌ Timeout kaldırılırken bir hata oluştu.",
                ephemeral: true
            });
        }
    }
};

