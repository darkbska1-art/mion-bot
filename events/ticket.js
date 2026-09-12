const {
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const dataDir =
    path.join(__dirname, "..", "data");

const dataFile =
    path.join(dataDir, "tickets.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {
        recursive: true
    });
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify({}, null, 4),
        "utf8"
    );
}

function loadData() {

    try {

        return JSON.parse(
            fs.readFileSync(
                dataFile,
                "utf8"
            )
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

    register(client) {

        client.on(
            "interactionCreate",
            async interaction => {

                // =================================================
                // SADECE BUTON
                // =================================================

                if (
                    !interaction.isButton()
                ) {
                    return;
                }

                // =================================================
                // TICKET AÇ
                // =================================================

                if (
                    interaction.customId ===
                    "ticket_create"
                ) {

                    await createTicket(
                        interaction
                    );

                    return;
                }

                // =================================================
                // TICKET KAPAT
                // =================================================

                if (
                    interaction.customId.startsWith(
                        "ticket_close:"
                    )
                ) {

                    await closeTicket(
                        interaction
                    );

                    return;
                }

            }
        );
    }
};


// =============================================================
// TICKET OLUŞTUR
// =============================================================

async function createTicket(
    interaction
) {

    try {

        if (!interaction.guild) {
            return;
        }

        const data =
            loadData();

        const settings =
            data[interaction.guild.id];

        // =====================================================
        // SİSTEM KONTROLÜ
        // =====================================================

        if (
            !settings ||
            !settings.enabled
        ) {

            return interaction.reply({
                content:
                    "❌ Ticket sistemi aktif değil.",
                ephemeral: true
            });
        }

        // =====================================================
        // MEVCUT TICKET KONTROLÜ
        // =====================================================

        const existingTicket =
            Object.entries(
                settings.tickets || {}
            ).find(
                ([channelId, ticket]) =>
                    ticket.userId ===
                    interaction.user.id &&
                    ticket.open === true
            );

        if (existingTicket) {

            const channel =
                interaction.guild.channels.cache.get(
                    existingTicket[0]
                );

            if (channel) {

                return interaction.reply({
                    content:
                        `❌ Zaten açık bir ticket'ın var: ${channel}`,
                    ephemeral: true
                });

            } else {

                delete settings.tickets[
                    existingTicket[0]
                ];

                saveData(data);
            }
        }

        // =====================================================
        // KATEGORİ
        // =====================================================

        const category =
            interaction.guild.channels.cache.get(
                settings.categoryId
            );

        if (
            !category ||
            category.type !==
            ChannelType.GuildCategory
        ) {

            return interaction.reply({
                content:
                    "❌ Ticket kategorisi bulunamadı.",
                ephemeral: true
            });
        }

        // =====================================================
        // YETKİLİ ROL
        // =====================================================

        const supportRole =
            interaction.guild.roles.cache.get(
                settings.supportRoleId
            );

        if (!supportRole) {

            return interaction.reply({
                content:
                    "❌ Ticket yetkili rolü bulunamadı.",
                ephemeral: true
            });
        }

        // =====================================================
        // TICKET NUMARASI
        // =====================================================

        const ticketNumber =
            settings.nextNumber || 1;

        const channelName =
            `ticket-${ticketNumber}`;

        // =====================================================
        // KANAL OLUŞTUR
        // =====================================================

        const ticketChannel =
            await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,

                permissionOverwrites: [

                    {
                        id:
                            interaction.guild.id,

                        deny: [
                            PermissionFlagsBits.ViewChannel
                        ]
                    },

                    {
                        id:
                            interaction.user.id,

                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles
                        ]
                    },

                    {
                        id:
                            supportRole.id,

                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageMessages,
                            PermissionFlagsBits.AttachFiles
                        ]
                    },

                    {
                        id:
                            interaction.client.user.id,

                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageMessages
                        ]
                    }
                ]
            });

        // =====================================================
        // TICKET KAYDI
        // =====================================================

        if (!settings.tickets) {
            settings.tickets = {};
        }

        settings.tickets[
            ticketChannel.id
        ] = {

            userId:
                interaction.user.id,

            userTag:
                interaction.user.tag,

            number:
                ticketNumber,

            createdAt:
                Date.now(),

            open:
                true
        };

        settings.nextNumber =
            ticketNumber + 1;

        saveData(data);

        // =====================================================
        // KAPAT BUTONU
        // =====================================================

        const closeButton =
            new ButtonBuilder()
                .setCustomId(
                    `ticket_close:${ticketChannel.id}`
                )
                .setLabel(
                    "Ticket Kapat"
                )
                .setStyle(
                    ButtonStyle.Danger
                )
                .setEmoji("🔒");

        const row =
            new ActionRowBuilder()
                .addComponents(
                    closeButton
                );

        // =====================================================
        // TICKET EMBED
        // =====================================================

        const embed =
            new EmbedBuilder()
                .setColor(
                    settings.color ||
                    "#FF69B4"
                )
                .setTitle(
                    `🎫 Ticket #${ticketNumber}`
                )
                .setDescription(
                    `Hoş geldin ${interaction.user}!\n\n` +
                    `Yetkili ekibimiz en kısa sürede seninle ilgilenecektir.\n\n` +
                    `Ticket'ı kapatmak için aşağıdaki butonu kullanabilirsin.`
                )
                .addFields(

                    {
                        name: "👤 Kullanıcı",
                        value:
                            `${interaction.user}`,
                        inline: true
                    },

                    {
                        name: "🔢 Ticket",
                        value:
                            `#${ticketNumber}`,
                        inline: true
                    },

                    {
                        name: "👥 Yetkili",
                        value:
                            `${supportRole}`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({
                    text:
                        "Mion Ticket System"
                });

        // =====================================================
        // TICKET MESAJI
        // =====================================================

        await ticketChannel.send({

            content:
                `${interaction.user} ${supportRole}`,

            embeds: [
                embed
            ],

            components: [
                row
            ]
        });

        // =====================================================
        // KULLANICIYA BİLDİR
        // =====================================================

        return interaction.reply({
            content:
                `✅ Ticket'ın oluşturuldu: ${ticketChannel}`,
            ephemeral: true
        });

    } catch (error) {

        console.error(
            "❌ Ticket oluşturma hatası:",
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            return interaction.followUp({
                content:
                    "❌ Ticket oluşturulurken bir hata oluştu.",
                ephemeral: true
            });

        }

        return interaction.reply({
            content:
                "❌ Ticket oluşturulurken bir hata oluştu.",
            ephemeral: true
        });
    }
}


// =============================================================
// TICKET KAPAT
// =============================================================

async function closeTicket(
    interaction
) {

    try {

        if (!interaction.guild) {
            return;
        }

        const data =
            loadData();

        const settings =
            data[interaction.guild.id];

        if (
            !settings ||
            !settings.tickets
        ) {

            return interaction.reply({
                content:
                    "❌ Ticket verisi bulunamadı.",
                ephemeral: true
            });
        }

        const ticket =
            settings.tickets[
                interaction.channel.id
            ];

        if (!ticket) {

            return interaction.reply({
                content:
                    "❌ Bu kanal bir ticket değil.",
                ephemeral: true
            });
        }

        // =====================================================
        // YETKİLİ KONTROLÜ
        // =====================================================

        const supportRole =
            interaction.guild.roles.cache.get(
                settings.supportRoleId
            );

        const isOwner =
            ticket.userId ===
            interaction.user.id;

        const isStaff =
            supportRole &&
            interaction.member.roles.cache.has(
                supportRole.id
            );

        const isAdmin =
            interaction.member.permissions.has(
                PermissionFlagsBits.ManageGuild
            );

        if (
            !isOwner &&
            !isStaff &&
            !isAdmin
        ) {

            return interaction.reply({
                content:
                    "❌ Bu ticket'ı kapatma yetkin yok.",
                ephemeral: true
            });
        }

        // =====================================================
        // KAPANIYOR
        // =====================================================

        await interaction.reply({
            content:
                "🔒 Ticket kapatılıyor...",
            ephemeral: true
        });

        ticket.open =
            false;

        ticket.closedAt =
            Date.now();

        ticket.closedBy =
            interaction.user.id;

        // =====================================================
        // LOG
        // =====================================================

        const logChannel =
            interaction.guild.channels.cache.get(
                settings.logChannelId
            );

        if (logChannel) {

            const logEmbed =
                new EmbedBuilder()
                    .setColor(
                        "#ED4245"
                    )
                    .setTitle(
                        "🔒 Ticket Kapatıldı"
                    )
                    .addFields(

                        {
                            name: "🎫 Ticket",
                            value:
                                `#${ticket.number}`,
                            inline: true
                        },

                        {
                            name: "👤 Sahibi",
                            value:
                                `<@${ticket.userId}>`,
                            inline: true
                        },

                        {
                            name: "🛡️ Kapatan",
                            value:
                                `${interaction.user}`,
                            inline: true
                        },

                        {
                            name: "📁 Kanal",
                            value:
                                `#${interaction.channel.name}`,
                            inline: true
                        },

                        {
                            name: "🕐 Açılış",
                            value:
                                `<t:${Math.floor(ticket.createdAt / 1000)}:F>`,
                            inline: true
                        },

                        {
                            name: "🕐 Kapanış",
                            value:
                                `<t:${Math.floor(ticket.closedAt / 1000)}:F>`,
                            inline: true
                        }
                    )
                    .setTimestamp()
                    .setFooter({
                        text:
                            "Mion Ticket System"
                    });

            await logChannel.send({
                embeds: [
                    logEmbed
                ]
            }).catch(() => {});
        }

        // =====================================================
        // VERİYİ KAYDET
        // =====================================================

        saveData(data);

        // =====================================================
        // KANALI SİL
        // =====================================================

        setTimeout(
            async () => {

                await interaction.channel
                    .delete(
                        "Ticket kapatıldı"
                    )
                    .catch(error => {

                        console.error(
                            "❌ Ticket kanalı silinemedi:",
                            error
                        );

                    });

            },
            3000
        );

    } catch (error) {

        console.error(
            "❌ Ticket kapatma hatası:",
            error
        );
    }
}