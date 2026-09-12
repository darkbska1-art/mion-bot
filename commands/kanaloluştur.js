
const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kanaloluştur")
        .setDescription("Yeni bir kanal oluşturur.")
        .addStringOption(option =>
            option
                .setName("isim")
                .setDescription("Kanalın adı")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("tür")
                .setDescription("Kanal türü")
                .setRequired(true)
                .addChoices(
                    { name: "💬 Metin", value: "text" },
                    { name: "🔊 Ses", value: "voice" },
                    { name: "📢 Duyuru", value: "announcement" },
                    { name: "📰 Forum", value: "forum" }
                )
        )
        .addChannelOption(option =>
            option
                .setName("kategori")
                .setDescription("Kanalın bulunacağı kategori")
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {

        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: "❌ Bu komutu kullanmak için **Kanalları Yönet** yetkisine sahip olmalısın.",
                ephemeral: true
            });
        }

        const isim = interaction.options.getString("isim");
        const tür = interaction.options.getString("tür");
        const kategori = interaction.options.getChannel("kategori");

        let channelType;

        switch (tür) {
            case "text":
                channelType = ChannelType.GuildText;
                break;

            case "voice":
                channelType = ChannelType.GuildVoice;
                break;

            case "announcement":
                channelType = ChannelType.GuildAnnouncement;
                break;

            case "forum":
                channelType = ChannelType.GuildForum;
                break;
        }

        try {

            const kanal = await interaction.guild.channels.create({
                name: isim,
                type: channelType,
                parent: kategori?.id || null,
                reason: `${interaction.user.tag} tarafından oluşturuldu.`
            });

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("✅ Kanal Oluşturuldu")
                .setDescription(
                    `**${kanal}** kanalı başarıyla oluşturuldu.`
                )
                .addFields(
                    {
                        name: "📌 Kanal",
                        value: `${kanal}`,
                        inline: true
                    },
                    {
                        name: "👤 Oluşturan",
                        value: `${interaction.user}`,
                        inline: true
                    },
                    {
                        name: "📂 Kategori",
                        value: kategori ? kategori.name : "Yok",
                        inline: true
                    }
                )
                .setTimestamp();

            await interaction.reply({
                embeds: [embed]
            });

        } catch (error) {

            console.error("Kanal oluşturma hatası:", error);

            await interaction.reply({
                content: "❌ Kanal oluşturulurken bir hata oluştu.",
                ephemeral: true
            });
        }
    }
};

