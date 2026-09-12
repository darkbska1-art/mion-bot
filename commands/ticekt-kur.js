const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "tickets.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
        recursive: true
    });
}

function loadData() {
    try {
        if (!fs.existsSync(dataFile)) {
            fs.writeFileSync(
                dataFile,
                JSON.stringify({}, null, 4),
                "utf8"
            );
        }

        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );

    } catch (error) {

        console.error(
            "❌ Ticket verisi okunamadı:",
            error
        );

        return {};
    }
}

function saveData(data) {

    fs.writeFileSync(
        dataFile,
        JSON.stringify(
            data,
            null,
            4
        ),
        "utf8"
    );
}

module.exports = {

    // =====================================================
    // SLASH COMMAND
    // =====================================================

    data: new SlashCommandBuilder()
        .setName("ticket-kur")
        .setDescription(
            "Sunucuya ticket sistemi kurar."
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )

        // =================================================
        // KATEGORİ
        // =================================================

        .addChannelOption(option =>
            option
                .setName("kategori")
                .setDescription(
                    "Ticket kanallarının oluşturulacağı kategori."
                )
                .addChannelTypes(
                    ChannelType.GuildCategory
                )
                .setRequired(true)
        )

        // =================================================
        // YETKİLİ ROLÜ
        // =================================================

        .addRoleOption(option =>
            option
                .setName("yetkili")
                .setDescription(
                    "Ticket açıldığında erişimi olacak yetkili rolü."
                )
                .setRequired(true)
        )

        // =================================================
        // LOG KANALI
        // =================================================

        .addChannelOption(option =>
            option
                .setName("log")
                .setDescription(
                    "Ticket loglarının gönderileceği kanal."
                )
                .addChannelTypes(
                    ChannelType.GuildText
                )
                .setRequired(true)
        )

        // =================================================
        // BAŞLIK
        // =================================================

        .addStringOption(option =>
            option
                .setName("baslik")
                .setDescription(
                    "Ticket panelinin başlığı."
                )
                .setMaxLength(256)
                .setRequired(false)
        )

        // =================================================
        // AÇIKLAMA
        // =================================================

        .addStringOption(option =>
            option
                .setName("aciklama")
                .setDescription(
                    "Ticket panelinin açıklaması."
                )
                .setMaxLength(4000)
                .setRequired(false)
        )

        // =================================================
        // RENK
        // =================================================

        .addStringOption(option =>
            option
                .setName("renk")
                .setDescription(
                    "Embed rengi. Örnek: #FF69B4"
                )
                .setMaxLength(7)
                .setRequired(false)
        )

        // =================================================
        // TEK BUTON
        // =================================================

        .addStringOption(option =>
            option
                .setName("buton")
                .setDescription(
                    "Ticket açma butonunun yazısı."
                )
                .setMaxLength(80)
                .setRequired(false)
        ),

    // =====================================================
    // EXECUTE
    // =====================================================

    async execute(interaction) {

        // =================================================
        // SEÇENEKLER
        // =================================================

        const kategori =
            interaction.options.getChannel(
                "kategori"
            );

        const yetkili =
            interaction.options.getRole(
                "yetkili"
            );

        const log =
            interaction.options.getChannel(
                "log"
            );

        const baslik =
            interaction.options.getString(
                "baslik"
            ) ||
            "🎫 Destek Merkezi";

        const aciklama =
            interaction.options.getString(
                "aciklama"
            ) ||
            "Yardıma ihtiyacın varsa aşağıdaki butona tıklayarak ticket oluşturabilirsin.";

        const renk =
            interaction.options.getString(
                "renk"
            ) ||
            "#FF69B4";

        const buton =
            interaction.options.getString(
                "buton"
            ) ||
            "Ticket Oluştur";

        // =================================================
        // RENK KONTROLÜ
        // =================================================

        if (
            !/^#[0-9A-Fa-f]{6}$/.test(
                renk
            )
        ) {

            return interaction.reply({
                content:
                    "❌ Renk geçersiz!\n\n" +
                    "Örnek: `#FF69B4`",
                ephemeral: true
            });
        }

        // =================================================
        // EMBED
        // =================================================

        const embed =
            new EmbedBuilder()
                .setColor(renk)
                .setTitle(baslik)
                .setDescription(aciklama)
                .setTimestamp();

        // =================================================
        // TEK BUTON
        // =================================================

        const button =
            new ButtonBuilder()
                .setCustomId(
                    "ticket_create"
                )
                .setLabel(
                    buton
                )
                .setStyle(
                    ButtonStyle.Primary
                )
                .setEmoji("🎫");

        const row =
            new ActionRowBuilder()
                .addComponents(
                    button
                );

        // =================================================
        // PANEL GÖNDER
        // =================================================

        const panel =
            await interaction.channel.send({
                embeds: [
                    embed
                ],
                components: [
                    row
                ]
            });

        // =================================================
        // VERİLERİ AL
        // =================================================

        const data =
            loadData();

        const oldData =
            data[interaction.guild.id] || {};

        // =================================================
        // SUNUCU VERİLERİ
        // =================================================

        data[interaction.guild.id] = {

            enabled: true,

            categoryId:
                kategori.id,

            supportRoleId:
                yetkili.id,

            logChannelId:
                log.id,

            panelChannelId:
                interaction.channel.id,

            panelMessageId:
                panel.id,

            title:
                baslik,

            description:
                aciklama,

            color:
                renk,

            buttonLabel:
                buton,

            nextNumber:
                oldData.nextNumber || 1,

            tickets:
                oldData.tickets || {}

        };

        // =================================================
        // KAYDET
        // =================================================

        saveData(
            data
        );

        // =================================================
        // BAŞARI EMBED
        // =================================================

        const success =
            new EmbedBuilder()
                .setColor("#57F287")
                .setTitle(
                    "✅ Ticket Sistemi Kuruldu"
                )
                .setDescription(
                    "Ticket paneli başarıyla oluşturuldu."
                )
                .addFields(

                    {
                        name: "🗂️ Kategori",
                        value:
                            `${kategori}`,
                        inline: true
                    },

                    {
                        name: "👥 Yetkili",
                        value:
                            `${yetkili}`,
                        inline: true
                    },

                    {
                        name: "📋 Log",
                        value:
                            `${log}`,
                        inline: true
                    },

                    {
                        name: "🎫 Buton",
                        value:
                            buton,
                        inline: true
                    }

                )
                .setFooter({
                    text:
                        "Mion Ticket System"
                })
                .setTimestamp();

        // =================================================
        // BAŞARI MESAJI
        // =================================================

        await interaction.reply({
            embeds: [
                success
            ],
            ephemeral: true
        });
    }
};