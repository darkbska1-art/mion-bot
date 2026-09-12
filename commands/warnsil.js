const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataFile =
    path.join(__dirname, "..", "data", "warns.json");

function loadWarns() {
    try {
        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );
    } catch {
        return {};
    }
}

function saveWarns(data) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(data, null, 4),
        "utf8"
    );
}

module.exports = {

    data: new SlashCommandBuilder()
        .setName("warnsil")
        .setDescription("Bir kullanıcının uyarısını siler.")
        .addUserOption(option =>
            option
                .setName("kullanıcı")
                .setDescription("Uyarısı silinecek kullanıcı")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("Silinecek uyarının ID'si")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {

        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Bu komut sadece sunucularda kullanılabilir.",
                ephemeral: true
            });
        }

        if (
            !interaction.member.permissions.has(
                PermissionFlagsBits.ModerateMembers
            )
        ) {
            return interaction.reply({
                content: "❌ Bu komutu kullanmak için **Üyeleri Yönet** yetkisine sahip olmalısın.",
                ephemeral: true
            });
        }

        const user =
            interaction.options.getUser("kullanıcı");

        const warnId =
            interaction.options.getString("id");

        const data = loadWarns();

        const warnings =
            data?.[interaction.guild.id]?.[user.id];

        if (!warnings || warnings.length === 0) {
            return interaction.reply({
                content: `❌ ${user} kullanıcısının herhangi bir uyarısı bulunmuyor.`,
                ephemeral: true
            });
        }

        const index =
            warnings.findIndex(
                warn =>
                    warn.id.toLowerCase() ===
                    warnId.toLowerCase()
            );

        if (index === -1) {
            return interaction.reply({
                content:
                    `❌ \`${warnId}\` ID'li uyarı bulunamadı.\n\n` +
                    `Uyarı ID'lerini görmek için \`/warns\` kullan.`,
                ephemeral: true
            });
        }

        const removedWarn =
            warnings[index];

        warnings.splice(index, 1);

        saveWarns(data);

        const embed =
            new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🗑️ Uyarı Silindi")
                .setDescription(
                    `${user} kullanıcısının uyarısı başarıyla silindi.`
                )
                .addFields(
                    {
                        name: "🆔 Uyarı ID",
                        value: `\`${removedWarn.id}\``,
                        inline: true
                    },
                    {
                        name: "📝 Sebep",
                        value: removedWarn.reason,
                        inline: true
                    },
                    {
                        name: "📊 Kalan Uyarı",
                        value: `${warnings.length}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({
                    text: `Mion • ${interaction.user.tag}`
                });

        return interaction.reply({
            embeds: [embed]
        });
    }
};