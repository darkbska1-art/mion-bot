const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rolver")
        .setDescription("Bir kullanıcıya rol verir.")
        .addUserOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Rol verilecek kullanıcı.")
                .setRequired(true)
        )
        .addRoleOption(option =>
            option
                .setName("rol")
                .setDescription("Verilecek rol.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const user = interaction.options.getUser("kullanıcı");
        const role = interaction.options.getRole("rol");

        const member = await interaction.guild.members.fetch(user.id);

        if (role.managed) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setDescription("❌ Bu rol Discord tarafından yönetiliyor ve verilemez.")
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

        if (member.roles.cache.has(role.id)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setDescription(`⚠️ ${member} zaten ${role} rolüne sahip.`)
                ],
                ephemeral: true
            });
        }

        await member.roles.add(role);

        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle("🎭 Rol Verildi")
            .addFields(
                { name: "Kullanıcı", value: `${member}`, inline: true },
                { name: "Rol", value: `${role}`, inline: true },
                { name: "Yetkili", value: `${interaction.user}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};