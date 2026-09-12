const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "yetkilibasvuru.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "{}", "utf8");
}

function loadData() {
    try {
        return JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(data, null, 4),
        "utf8"
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("yetkilibasvuru")
        .setDescription("Yetkili başvuru sistemini yönetir.")
        
        // =====================================================
        // PANEL
        // =====================================================
        .addSubcommand(sub =>
            sub
                .setName("panel")
                .setDescription("Yetkili başvuru panelini oluşturur.")
                .addChannelOption(opt =>
                    opt
                        .setName("kanal")
                        .setDescription("Başvuru panelinin gönderileceği kanal.")
                        .setRequired(true)
                )
                .addChannelOption(opt =>
                    opt
                        .setName("basvurukanal")
                        .setDescription("Başvuruların gönderileceği kanal.")
                        .setRequired(true)
                )
                .addRoleOption(opt =>
                    opt
                        .setName("yetkilirol")
                        .setDescription("Başvuruları değerlendirecek yetkili rolü.")
                        .setRequired(true)
                )
        )

        // =====================================================
        // DURUM
        // =====================================================
        .addSubcommand(sub =>
            sub
                .setName("durum")
                .setDescription("Yetkili başvuru sisteminin durumunu gösterir.")
        )

        // =====================================================
        // KAPAT
        // =====================================================
        .addSubcommand(sub =>
            sub
                .setName("kapat")
                .setDescription("Yetkili başvuru sistemini kapatır.")
        ),

    // =========================================================
    // EXECUTE
    // =========================================================
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: "❌ Bu komut sadece sunucularda kullanılabilir.",
                ephemeral: true
            });
        }

        if (
            !interaction.member.permissions.has(
                PermissionFlagsBits.ManageGuild
            )
        ) {
            return interaction.reply({
                content: "❌ Bu komutu kullanmak için **Sunucuyu Yönet** yetkisine sahip olmalısın.",
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const data = loadData();
        const guildId = interaction.guild.id;

        // =====================================================
        // PANEL KUR
        // =====================================================
        if (subcommand === "panel") {
            const panelChannel = interaction.options.getChannel("kanal");
            const applicationChannel =
                interaction.options.getChannel("basvurukanal");
            const staffRole =
                interaction.options.getRole("yetkilirol");

            if (!panelChannel || !applicationChannel || !staffRole) {
                return interaction.reply({
                    content: "❌ Gerekli seçenekler eksik.",
                    ephemeral: true
                });
            }

            data[guildId] = {
                enabled: true,

                // Yeni sistem
                panelChannelId: panelChannel.id,
                applicationChannelId: applicationChannel.id,

                // Eski sistemle uyumluluk
                channelId: panelChannel.id,

                staffRoleId: staffRole.id,

                applications:
                    data[guildId]?.applications || {}
            };

            saveData(data);

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🌸 Yetkili Başvuru Sistemi")
                .setDescription(
                    "Sunucumuzda yetkili olmak istiyorsan aşağıdaki butona basarak başvuru formunu doldurabilirsin.\n\n" +
                    "📋 **Başvuru Süreci**\n" +
                    "• Butona basarak formu aç.\n" +
                    "• Soruları eksiksiz cevapla.\n" +
                    "• Başvurun yetkili ekibine iletilecektir.\n" +
                    "• Sonuç sana özel mesaj üzerinden bildirilecektir.\n\n" +
                    "⚠️ **Not:** Gereksiz veya troll başvurular değerlendirmeye alınmayabilir."
                )
                .setFooter({
                    text: "Mion • Yetkili Başvuru Sistemi"
                })
                .setTimestamp();

            const button = new ButtonBuilder()
                .setCustomId("yetkili_basvuru_ac")
                .setLabel("Başvuru Yap")
                .setEmoji("📝")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder()
                .addComponents(button);

            try {
                await panelChannel.send({
                    embeds: [embed],
                    components: [row]
                });
            } catch (error) {
                console.error("Panel gönderme hatası:", error);

                return interaction.reply({
                    content:
                        "❌ Panel kanalına mesaj gönderemedim. Botun o kanalda **Mesaj Gönder** ve **Embed Linkleri** izinlerini kontrol et.",
                    ephemeral: true
                });
            }

            return interaction.reply({
                content:
                    `✅ Yetkili başvuru paneli kuruldu!\n\n` +
                    `📋 **Panel:** ${panelChannel}\n` +
                    `📨 **Başvurular:** ${applicationChannel}\n` +
                    `🛡️ **Yetkili Rolü:** ${staffRole}`,
                ephemeral: true
            });
        }

        // =====================================================
        // DURUM
        // =====================================================
        if (subcommand === "durum") {
            const config = data[guildId];

            if (!config || !config.enabled) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x000000)
                            .setTitle("🌸 Yetkili Başvuru Sistemi")
                            .setDescription(
                                "❌ Yetkili başvuru sistemi şu anda **kapalı**."
                            )
                            .setFooter({
                                text: "Mion • Yetkili Başvuru Sistemi"
                            })
                    ],
                    ephemeral: true
                });
            }

            const panelChannelId =
                config.panelChannelId || config.channelId;

            const applicationChannelId =
                config.applicationChannelId;

            const panelChannel = panelChannelId
                ? `<#${panelChannelId}>`
                : "Ayarlanmamış";

            const applicationChannel = applicationChannelId
                ? `<#${applicationChannelId}>`
                : "Ayarlanmamış";

            const staffRole = config.staffRoleId
                ? `<@&${config.staffRoleId}>`
                : "Ayarlanmamış";

            const applicationCount = Object.keys(
                config.applications || {}
            ).length;

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("🌸 Yetkili Başvuru Sistemi")
                .addFields(
                    {
                        name: "📋 Panel Kanalı",
                        value: panelChannel,
                        inline: true
                    },
                    {
                        name: "📨 Başvuru Kanalı",
                        value: applicationChannel,
                        inline: true
                    },
                    {
                        name: "🛡️ Yetkili Rolü",
                        value: staffRole,
                        inline: true
                    },
                    {
                        name: "📊 Toplam Başvuru",
                        value: `${applicationCount}`,
                        inline: true
                    },
                    {
                        name: "🟢 Sistem",
                        value: "Aktif",
                        inline: true
                    }
                )
                .setFooter({
                    text: "Mion • Yetkili Başvuru Sistemi"
                })
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        // =====================================================
        // KAPAT
        // =====================================================
        if (subcommand === "kapat") {
            if (!data[guildId]) {
                data[guildId] = {
                    enabled: false,
                    panelChannelId: null,
                    applicationChannelId: null,
                    channelId: null,
                    staffRoleId: null,
                    applications: {}
                };
            }

            data[guildId].enabled = false;

            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x000000)
                        .setTitle("🔴 Yetkili Başvuru Sistemi")
                        .setDescription(
                            "Yetkili başvuru sistemi başarıyla kapatıldı."
                        )
                        .setFooter({
                            text: "Mion • Yetkili Başvuru Sistemi"
                        })
                        .setTimestamp()
                ]
            });
        }
    },

    // =========================================================
    // BUTTON / MODAL INTERACTION
    // =========================================================
    async handleInteraction(interaction) {
        const data = loadData();
        const guildId = interaction.guild?.id;

        if (!guildId) {
            return interaction.reply({
                content: "❌ Bu işlem sadece sunucularda kullanılabilir.",
                ephemeral: true
            }).catch(() => {});
        }

        const config = data[guildId];

        // =====================================================
        // BAŞVURU BUTONU
        // =====================================================
        if (interaction.isButton() && interaction.customId === "yetkili_basvuru_ac") {

            if (!config || !config.enabled) {
                return interaction.reply({
                    content: "❌ Yetkili başvuru sistemi şu anda kapalı.",
                    ephemeral: true
                });
            }

            const applications = config.applications || {};

            const existingApplication = Object.values(applications).find(
                app =>
                    app.userId === interaction.user.id &&
                    app.status === "pending"
            );

            if (existingApplication) {
                return interaction.reply({
                    content:
                        "❌ Zaten değerlendirme aşamasında olan bir başvurun bulunuyor.",
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId("yetkili_basvuru_modal")
                .setTitle("Yetkili Başvurusu");

            const ageInput = new TextInputBuilder()
                .setCustomId("yas")
                .setLabel("Kaç yaşındasın?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(3);

            const reasonInput = new TextInputBuilder()
                .setCustomId("neden")
                .setLabel("Neden yetkili olmak istiyorsun?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1000);

            const experienceInput = new TextInputBuilder()
                .setCustomId("deneyim")
                .setLabel("Daha önce yetkilik yaptın mı?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1000);

            const contributionInput = new TextInputBuilder()
                .setCustomId("katki")
                .setLabel("Sunucuya nasıl katkı sağlayabilirsin?")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1000);

            const activityInput = new TextInputBuilder()
                .setCustomId("aktiflik")
                .setLabel("Günlük ortalama aktifliğin?")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(100);

            modal.addComponents(
                new ActionRowBuilder().addComponents(ageInput),
                new ActionRowBuilder().addComponents(reasonInput),
                new ActionRowBuilder().addComponents(experienceInput),
                new ActionRowBuilder().addComponents(contributionInput),
                new ActionRowBuilder().addComponents(activityInput)
            );

            return interaction.showModal(modal);
        }

        // =====================================================
        // MODAL
        // =====================================================
        if (
            interaction.isModalSubmit() &&
            interaction.customId === "yetkili_basvuru_modal"
        ) {
            if (!config || !config.enabled) {
                return interaction.reply({
                    content: "❌ Yetkili başvuru sistemi şu anda kapalı.",
                    ephemeral: true
                });
            }

            const applicationChannelId =
                config.applicationChannelId;

            if (!applicationChannelId) {
                return interaction.reply({
                    content:
                        "❌ Başvuru kanalı ayarlanmamış. Yönetici `/yetkilibasvuru panel` komutunu tekrar kullanmalı.",
                    ephemeral: true
                });
            }

            const applicationChannel =
                interaction.guild.channels.cache.get(
                    applicationChannelId
                );

            if (!applicationChannel) {
                return interaction.reply({
                    content:
                        "❌ Başvuru kanalı bulunamadı. Yönetici panel ayarlarını yenilemeli.",
                    ephemeral: true
                });
            }

            const applications = config.applications || {};

            const existingApplication = Object.values(applications).find(
                app =>
                    app.userId === interaction.user.id &&
                    app.status === "pending"
            );

            if (existingApplication) {
                return interaction.reply({
                    content:
                        "❌ Zaten değerlendirme aşamasında olan bir başvurun bulunuyor.",
                    ephemeral: true
                });
            }

            const applicationId =
                `${interaction.user.id}_${Date.now()}`;

            const age =
                interaction.fields.getTextInputValue("yas");

            const reason =
                interaction.fields.getTextInputValue("neden");

            const experience =
                interaction.fields.getTextInputValue("deneyim");

            const contribution =
                interaction.fields.getTextInputValue("katki");

            const activity =
                interaction.fields.getTextInputValue("aktiflik");

            const embed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle("📋 Yeni Yetkili Başvurusu")
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    {
                        name: "👤 Başvuran",
                        value:
                            `${interaction.user}\n` +
                            `\`${interaction.user.tag}\`\n` +
                            `ID: \`${interaction.user.id}\``
                    },
                    {
                        name: "🎂 Yaş",
                        value: age,
                        inline: true
                    },
                    {
                        name: "🧹 Aktiflik",
                        value: activity,
                        inline: true
                    },
                    {
                        name: "💭 Neden Yetkili?",
                        value: reason
                    },
                    {
                        name: "🛡️ Yetkilik Deneyimi",
                        value: experience
                    },
                    {
                        name: "🌸 Sunucuya Katkısı",
                        value: contribution
                    }
                )
                .setFooter({
                    text: `Başvuru ID: ${applicationId}`
                })
                .setTimestamp();

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`yetkili_kabul_${applicationId}`)
                    .setLabel("Kabul Et")
                    .setEmoji("✅")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(`yetkili_red_${applicationId}`)
                    .setLabel("Reddet")
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Danger)
            );

            let applicationMessage;

            try {
                applicationMessage =
                    await applicationChannel.send({
                        content: config.staffRoleId
                            ? `<@&${config.staffRoleId}>`
                            : undefined,
                        embeds: [embed],
                        components: [buttons]
                    });
            } catch (error) {
                console.error(
                    "Başvuru kanalı mesaj gönderme hatası:",
                    error
                );

                return interaction.reply({
                    content:
                        "❌ Başvuru kanalına mesaj gönderemedim. Botun o kanalda mesaj gönderme ve embed izinlerini kontrol et.",
                    ephemeral: true
                });
            }

            if (!config.applications) {
                config.applications = {};
            }

            config.applications[applicationId] = {
                id: applicationId,
                userId: interaction.user.id,
                username: interaction.user.tag,
                createdAt: Date.now(),
                status: "pending",
                reviewerId: null,
                reason: null,

                answers: {
                    age,
                    reason,
                    experience,
                    contribution,
                    activity
                },

                messageId: applicationMessage.id,
                channelId: applicationChannel.id
            };

            saveData(data);

            return interaction.reply({
                content:
                    "✅ Başvurun başarıyla gönderildi!\n" +
                    "Yetkili ekibi başvurunu değerlendirecektir.",
                ephemeral: true
            });
        }

        // =====================================================
        // KABUL
        // =====================================================
        if (
            interaction.isButton() &&
            interaction.customId.startsWith("yetkili_kabul_")
        ) {
            const applicationId =
                interaction.customId.replace(
                    "yetkili_kabul_",
                    ""
                );

            const application =
                config?.applications?.[applicationId];

            if (!application) {
                return interaction.reply({
                    content: "❌ Bu başvuru bulunamadı.",
                    ephemeral: true
                });
            }

            const isStaff =
                interaction.member.roles.cache.has(
                    config.staffRoleId
                );

            const isAdmin =
                interaction.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                );

            if (!isStaff && !isAdmin) {
                return interaction.reply({
                    content:
                        "❌ Bu başvuruyu değerlendirme yetkin yok.",
                    ephemeral: true
                });
            }

            application.status = "accepted";
            application.reviewerId = interaction.user.id;
            application.reason = "Başvuru kabul edildi.";

            saveData(data);

            const member =
                await interaction.guild.members
                    .fetch(application.userId)
                    .catch(() => null);

            if (member && config.staffRoleId) {
                await member.roles
                    .add(config.staffRoleId)
                    .catch(error =>
                        console.error(
                            "Yetkili rolü verilemedi:",
                            error
                        )
                    );
            }

            if (member) {
                await member.send(
                    `🌸 **${interaction.guild.name}** sunucusundaki yetkili başvurun **kabul edildi!**\n\n` +
                    `🛡️ Yetkili rolün verildi. Tebrikler!`
                ).catch(() => {});
            }

            const updatedEmbed = EmbedBuilder.from(
                interaction.message.embeds[0]
            )
                .setColor(0x000000)
                .addFields({
                    name: "✅ Sonuç",
                    value:
                        `Başvuru **kabul edildi**.\n` +
                        `Değerlendiren: ${interaction.user}`
                })
                .setFooter({
                    text: "Mion • Yetkili Başvuru Sistemi"
                });

            return interaction.update({
                embeds: [updatedEmbed],
                components: []
            });
        }

        // =====================================================
        // RED
        // =====================================================
        if (
            interaction.isButton() &&
            interaction.customId.startsWith("yetkili_red_")
        ) {
            const applicationId =
                interaction.customId.replace(
                    "yetkili_red_",
                    ""
                );

            const application =
                config?.applications?.[applicationId];

            if (!application) {
                return interaction.reply({
                    content: "❌ Bu başvuru bulunamadı.",
                    ephemeral: true
                });
            }

            const isStaff =
                interaction.member.roles.cache.has(
                    config.staffRoleId
                );

            const isAdmin =
                interaction.member.permissions.has(
                    PermissionFlagsBits.ManageGuild
                );

            if (!isStaff && !isAdmin) {
                return interaction.reply({
                    content:
                        "❌ Bu başvuruyu değerlendirme yetkin yok.",
                    ephemeral: true
                });
            }

            application.status = "rejected";
            application.reviewerId = interaction.user.id;
            application.reason = "Başvuru reddedildi.";

            saveData(data);

            const member =
                await interaction.guild.members
                    .fetch(application.userId)
                    .catch(() => null);

            if (member) {
                await member.send(
                    `🌸 **${interaction.guild.name}** sunucusundaki yetkili başvurun **reddedildi.**\n\n` +
                    `Başvurun yetkili ekip tarafından değerlendirildi.`
                ).catch(() => {});
            }

            const updatedEmbed = EmbedBuilder.from(
                interaction.message.embeds[0]
            )
                .setColor(0x000000)
                .addFields({
                    name: "❌ Sonuç",
                    value:
                        `Başvuru **reddedildi**.\n` +
                        `Değerlendiren: ${interaction.user}`
                })
                .setFooter({
                    text: "Mion • Yetkili Başvuru Sistemi"
                });

            return interaction.update({
                embeds: [updatedEmbed],
                components: []
            });
        }
    }
};