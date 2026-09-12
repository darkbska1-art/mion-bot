
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rololuştur")
        .setDescription("Yeni bir rol oluşturur.")
        .addStringOption(option =>
            option
                .setName("isim")
                .setDescription("Rolün adı")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("renk")
                .setDescription("Rol rengi (#5865F2 veya RED gibi)")
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName("görüntüle")
                .setDescription("Rol üyeleri ayrı gösterilsin mi?")
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName("bahset")
                .setDescription("Herkes bu rolden bahsedebilsin mi?")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {

        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: "❌ Bu komutu kullanmak için **Rolleri Yönet** yetkisine sahip olmalısın.",
                ephemeral: true
            });
        }

        const isim = interaction.options.getString("isim");
        const renk = interaction.options.getString("renk") || "#000000";
        const görüntüle = interaction.options.getBoolean("görüntüle") ?? false;
        const bahset = interaction.options.getBoolean("bahset") ?? false;

        try {

            const rol = await interaction.guild.roles.create({
                name: isim,
                color: renk,
                hoist: görüntüle,
                mentionable: bahset,
                reason: `${interaction.user.tag} tarafından oluşturuldu.`
            });

            const embed = new EmbedBuilder()
                .setColor(rol.color || 0x000000)
                .setTitle("✅ Rol Oluşturuldu")
                .setDescription(
                    `${rol} rolü başarıyla oluşturuldu.`
                )
                .addFields(
                    {
                        name: "🏷️ Rol",
                        value: `${rol}`,
                        inline: true
                    },
                    {
                        name: "🎨 Renk",
                        value: renk,
                        inline: true
                    },
                    {
                        name: "👤 Oluşturan",
                        value: `${interaction.user}`,
                        inline: true
                    },
                    {
                        name: "👁️ Ayrı Göster",
                        value: görüntüle ? "Evet" : "Hayır",
                        inline: true
                    },
                    {
                        name: "🔔 Bahsedilebilir",
                        value: bahset ? "Evet" : "Hayır",
                        inline: true
                    }
                )
                .setTimestamp();

            await interaction.reply({
                embeds: [embed]
            });

        } catch (error) {

            console.error("Rol oluşturma hatası:", error);

            await interaction.reply({
                content: "❌ Rol oluşturulurken bir hata oluştu. Renk kodunu kontrol et.",
                ephemeral: true
            });
        }
    }
};
