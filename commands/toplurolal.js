const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("toplurolal")
        .setDescription("Sunucudaki tüm üyelerden rolü alır.")
        .addRoleOption(option =>
            option
                .setName("rol")
                .setDescription("Alınacak rol.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const role = interaction.options.getRole("rol");

        if (role.managed) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setDescription("❌ Bu rol Discord tarafından yönetiliyor.")
                ],
                ephemeral: true
            });
        }

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setDescription("❌ Bu rol benim en yüksek rolümden yukarıda veya eşit.")
                ],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        await interaction.guild.members.fetch();

        let alindi = 0;
        let atlanan = 0;

        for (const member of interaction.guild.members.cache.values()) {
            if (member.user.bot) continue;

            if (!member.roles.cache.has(role.id)) {
                atlanan++;
                continue;
            }

            try {
                await member.roles.remove(role);
                alindi++;
            } catch {
                atlanan++;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("🎭 Toplu Rol Alındı")
            .addFields(
                { name: "Rol", value: `${role}`, inline: true },
                { name: "Alınan", value: `${alindi}`, inline: true },
                { name: "Atlanan", value: `${atlanan}`, inline: true }
            )
            .setFooter({ text: `Yetkili: ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};