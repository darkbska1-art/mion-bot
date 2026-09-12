const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../data");
const file = path.join(dataDir, "levels.json");


// =====================================================
// DATA
// =====================================================

function ensureData() {

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, {
            recursive: true
        });
    }

    if (!fs.existsSync(file)) {
        fs.writeFileSync(
            file,
            "{}",
            "utf8"
        );
    }
}

function loadData() {

    ensureData();

    try {

        return JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );

    } catch {

        return {};

    }
}

function saveData(data) {

    ensureData();

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            4
        ),
        "utf8"
    );
}


// =====================================================
// COMMAND
// =====================================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName("seviyesistem")

        .setDescription(
            "Seviye sistemini yönetir."
        )

        // =============================================
        // AÇ
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("ac")
                .setDescription(
                    "Seviye sistemini açar."
                )
        )

        // =============================================
        // KAPAT
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("kapat")
                .setDescription(
                    "Seviye sistemini kapatır."
                )
        )

        // =============================================
        // KANAL
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("kanal")
                .setDescription(
                    "Level-up mesajlarının gönderileceği kanalı ayarlar."
                )
                .addChannelOption(option =>
                    option
                        .setName("kanal")
                        .setDescription(
                            "Level-up mesajlarının gönderileceği kanal."
                        )
                        .addChannelTypes(
                            ChannelType.GuildText,
                            ChannelType.GuildAnnouncement
                        )
                        .setRequired(true)
                )
        )

        // =============================================
        // SIFIRLA
        // =============================================

        .addSubcommand(sub =>
            sub
                .setName("sifirla")
                .setDescription(
                    "Sunucudaki tüm seviye verilerini sıfırlar."
                )
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),


    // =================================================
    // EXECUTE
    // =================================================

    async execute(interaction) {

        const data = loadData();

        const guildId =
            interaction.guild.id;


        // =================================================
        // SUNUCU VERİSİ
        // =================================================

        if (!data[guildId]) {

            data[guildId] = {
                enabled: false,
                levelChannel: null,
                announce: true,
                users: {}
            };

            saveData(data);
        }


        const guildData =
            data[guildId];


        // Eski dosyalarda announce yoksa
        if (
            typeof guildData.announce !== "boolean"
        ) {
            guildData.announce = true;
        }


        if (!guildData.users) {
            guildData.users = {};
        }


        const subcommand =
            interaction.options.getSubcommand();


        // =================================================
        // AÇ
        // =================================================

        if (subcommand === "ac") {

            if (guildData.enabled === true) {

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x000000)
                            .setTitle("🟢 Seviye Sistemi Zaten Açık")
                            .setDescription(
                                "Seviye sistemi bu sunucuda zaten aktif."
                            )
                            .setTimestamp()
                    ],
                    ephemeral: true
                });
            }


            guildData.enabled = true;

            saveData(data);


            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🟢 Seviye Sistemi Açıldı")
                        .setDescription(
                            "Seviye sistemi başarıyla aktif edildi.\n\n" +
                            "💬 Mesaj gönderen üyeler XP kazanmaya başlayacak."
                        )
                        .setFooter({
                            text: "Mion • Seviye Sistemi"
                        })
                        .setTimestamp()
                ]
            });
        }


        // =================================================
        // KAPAT
        // =================================================

        if (subcommand === "kapat") {

            if (guildData.enabled !== true) {

                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x000000)
                            .setTitle("🔴 Seviye Sistemi Zaten Kapalı")
                            .setDescription(
                                "Seviye sistemi bu sunucuda zaten kapalı."
                            )
                            .setTimestamp()
                    ],
                    ephemeral: true
                });
            }


            guildData.enabled = false;

            saveData(data);


            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🔴 Seviye Sistemi Kapatıldı")
                        .setDescription(
                            "Seviye sistemi devre dışı bırakıldı.\n\n" +
                            "📊 Mevcut XP ve seviye verileri korunuyor."
                        )
                        .setFooter({
                            text: "Mion • Seviye Sistemi"
                        })
                        .setTimestamp()
                ]
            });
        }


        // =================================================
        // KANAL
        // =================================================

        if (subcommand === "kanal") {

            const channel =
                interaction.options.getChannel("kanal");


            if (!channel) {

                return interaction.reply({
                    content:
                        "❌ Kanal bulunamadı.",
                    ephemeral: true
                });
            }


            if (!channel.isTextBased()) {

                return interaction.reply({
                    content:
                        "❌ Bu kanal mesaj göndermeye uygun değil.",
                    ephemeral: true
                });
            }


            // Botun kanala mesaj atıp atamadığını kontrol et
            const botMember =
                interaction.guild.members.me;


            if (botMember) {

                const permissions =
                    channel.permissionsFor(botMember);


                if (
                    !permissions ||
                    !permissions.has(
                        PermissionFlagsBits.SendMessages
                    )
                ) {

                    return interaction.reply({
                        content:
                            `❌ Botun ${channel} kanalında **Mesaj Gönder** yetkisi yok.`,
                        ephemeral: true
                    });
                }
            }


            guildData.levelChannel =
                channel.id;


            saveData(data);


            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("📢 Level Kanalı Ayarlandı")
                        .setDescription(
                            `Level atlama mesajları artık ${channel} kanalına gönderilecek.`
                        )
                        .addFields({
                            name: "📌 Kanal",
                            value: `${channel}`,
                            inline: true
                        })
                        .setFooter({
                            text: "Mion • Seviye Sistemi"
                        })
                        .setTimestamp()
                ]
            });
        }


        // =================================================
        // SIFIRLA
        // =================================================

        if (subcommand === "sifirla") {

            guildData.users = {};

            saveData(data);


            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("♻️ Seviye Verileri Sıfırlandı")
                        .setDescription(
                            "Bu sunucudaki tüm seviye ve XP verileri silindi."
                        )
                        .addFields({
                            name: "📊 Sistem Durumu",
                            value:
                                guildData.enabled
                                    ? "🟢 Açık"
                                    : "🔴 Kapalı",
                            inline: true
                        })
                        .setFooter({
                            text: "Mion • Seviye Sistemi"
                        })
                        .setTimestamp()
                ]
            });
        }

    }
};