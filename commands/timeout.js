
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Bir kullanıcıya timeout uygular.")
        .addUserOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Timeout uygulanacak kullanıcı.")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("süre")
                .setDescription("Timeout süresi (dakika).")
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("sebep")
                .setDescription("Timeout sebebi.")
                .setMaxLength(1000)
                .setRequired(false)
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
        const sure = interaction.options.getInteger("süre");
        const sebep =
            interaction.options.getString("sebep") ||
            "Sebep belirtilmedi.";

        const member = await interaction.guild.members
            .fetch(user.id)
            .catch(() => null);

        if (!member) {
            return interaction.reply({
                content: "❌ Bu kullanıcı sunucuda bulunamadı.",
                ephemeral: true
            });
        }

        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ Kendine timeout uygulayamazsın.",
                ephemeral: true
            });
        }

        if (!member.moderatable) {
            return interaction.reply({
                content: "❌ Bu kullanıcıya timeout uygulayamıyorum. Botun rolünü kontrol et.",
                ephemeral: true
            });
        }

        const duration = sure * 60 * 1000;

        try {
            await member.timeout(duration, sebep);

            const embed = new EmbedBuilder()
                .setColor("#000000")
                .setTitle("⏱️ Timeout Uygulandı")
                .addFields(
                    {
                        name: "👤 Kullanıcı",
                        value: `${user}`,
                        inline: true
                    },
                    {
                        name: "⏳ Süre",
                        value: `${sure} dakika`,
                        inline: true
                    },
                    {
                        name: "📝 Sebep",
                        value: sebep,
                        inline: false
                    }
                )
                .setFooter({
                    text: `Yetkili: ${interaction.user.tag}`
                })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("Timeout hatası:", error);

            await interaction.reply({
                content: "❌ Timeout uygulanırken bir hata oluştu.",
                ephemeral: true
            });
        }
    }
};

