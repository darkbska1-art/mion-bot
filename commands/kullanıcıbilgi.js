
const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

// =====================================================
// KOMUT
// =====================================================

const data = new SlashCommandBuilder()
    .setName("kullanici-bilgi")
    .setDescription("Bir kullanıcı hakkında detaylı bilgi gösterir.")
    .addUserOption(option =>
        option
            .setName("kullanici")
            .setDescription("Bilgilerini görmek istediğin kullanıcı.")
            .setRequired(false)
    );

// =====================================================
// TARİH
// =====================================================

function tarih(date) {
    if (!date) return "Bilinmiyor";

    return `<t:${Math.floor(date.getTime() / 1000)}:F>`;
}

function tarihKisa(date) {
    if (!date) return "Bilinmiyor";

    return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
}

// =====================================================
// HESAP YAŞI
// =====================================================

function hesapYasi(date) {
    if (!date) return "Bilinmiyor";

    const fark = Date.now() - date.getTime();
    const gun = Math.floor(fark / 86400000);

    if (gun >= 365) {
        return `${Math.floor(gun / 365)} yıl`;
    }

    if (gun >= 30) {
        return `${Math.floor(gun / 30)} ay`;
    }

    return `${Math.max(gun, 1)} gün`;
}

// =====================================================
// ROZETLER
// =====================================================

function rozetleriGetir(flags) {
    if (!flags) {
        return "Özel rozet yok.";
    }

    const rozetler = [];

    if (flags.has("Staff")) {
        rozetler.push("🛡️ Discord Çalışanı");
    }

    if (flags.has("Partner")) {
        rozetler.push("🤝 Discord Partneri");
    }

    if (flags.has("Hypesquad")) {
        rozetler.push("🏠 HypeSquad");
    }

    if (flags.has("BugHunterLevel1")) {
        rozetler.push("🐛 Bug Hunter");
    }

    if (flags.has("BugHunterLevel2")) {
        rozetler.push("🐛 Bug Hunter Level 2");
    }

    if (flags.has("HypeSquadOnlineHouse1")) {
        rozetler.push("🏠 HypeSquad Bravery");
    }

    if (flags.has("HypeSquadOnlineHouse2")) {
        rozetler.push("🏠 HypeSquad Brilliance");
    }

    if (flags.has("HypeSquadOnlineHouse3")) {
        rozetler.push("🏠 HypeSquad Balance");
    }

    if (flags.has("PremiumEarlySupporter")) {
        rozetler.push("💎 Erken Destekçi");
    }

    if (flags.has("VerifiedDeveloper")) {
        rozetler.push("🔧 Doğrulanmış Geliştirici");
    }

    if (flags.has("ActiveDeveloper")) {
        rozetler.push("⚡ Aktif Geliştirici");
    }

    if (flags.has("CertifiedModerator")) {
        rozetler.push("🛡️ Sertifikalı Moderatör");
    }

    if (rozetler.length === 0) {
        return "Özel rozet yok.";
    }

    return rozetler.join("\n");
}

// =====================================================
// KULLANICI DURUMU
// =====================================================

function durumGetir(presence) {
    if (!presence) {
        return "⚫ Çevrimdışı";
    }

    switch (presence.status) {
        case "online":
            return "🟢 Çevrimiçi";

        case "idle":
            return "🌙 Boşta";

        case "dnd":
            return "⛔ Rahatsız Etmeyin";

        default:
            return "⚫ Çevrimdışı";
    }
}

// =====================================================
// AKTİVİTE
// =====================================================

function aktiviteGetir(presence) {
    if (!presence || !presence.activities?.length) {
        return "Aktivite yok.";
    }

    const aktiviteler = [];

    for (const activity of presence.activities) {
        if (activity.type === 0) {
            aktiviteler.push(`🎮 Oynuyor: **${activity.name}**`);
        } else if (activity.type === 1) {
            aktiviteler.push(`📡 Yayında: **${activity.name}**`);
        } else if (activity.type === 2) {
            aktiviteler.push(`🎧 Dinliyor: **${activity.name}**`);
        } else if (activity.type === 3) {
            aktiviteler.push(`📺 İzliyor: **${activity.name}**`);
        } else if (activity.type === 4) {
            aktiviteler.push(`💬 ${activity.state || activity.name}`);
        } else if (activity.type === 5) {
            aktiviteler.push(`🏆 Yarışıyor: **${activity.name}**`);
        }
    }

    return aktiviteler.length
        ? aktiviteler.join("\n")
        : "Aktivite yok.";
}

// =====================================================
// ROLLER
// =====================================================

function rollerGetir(member) {
    if (!member) {
        return "Sunucu üyesi değil.";
    }

    const roller = member.roles.cache
        .filter(role => role.id !== member.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(role => `<@&${role.id}>`);

    if (!roller.length) {
        return "Rol yok.";
    }

    const metin = roller.join(", ");

    if (metin.length > 900) {
        return `${metin.slice(0, 890)}...`;
    }

    return metin;
}

// =====================================================
// İZİNLER
// =====================================================

function izinleriGetir(member) {
    if (!member) {
        return "Sunucu üyesi değil.";
    }

    if (member.permissions.has("Administrator")) {
        return "👑 Yönetici";
    }

    const izinler = [];

    if (member.permissions.has("ManageGuild")) {
        izinler.push("⚙️ Sunucuyu Yönet");
    }

    if (member.permissions.has("ManageChannels")) {
        izinler.push("📁 Kanalları Yönet");
    }

    if (member.permissions.has("ManageRoles")) {
        izinler.push("🎭 Rolleri Yönet");
    }

    if (member.permissions.has("ManageMessages")) {
        izinler.push("🧹 Mesajları Yönet");
    }

    if (member.permissions.has("KickMembers")) {
        izinler.push("👢 Üyeleri At");
    }

    if (member.permissions.has("BanMembers")) {
        izinler.push("🔨 Üyeleri Yasakla");
    }

    if (member.permissions.has("ModerateMembers")) {
        izinler.push("🔇 Üyeleri Zaman Aşımına Uğrat");
    }

    if (member.permissions.has("MentionEveryone")) {
        izinler.push("@everyone Etiketleme");
    }

    if (!izinler.length) {
        return "Özel yetki yok.";
    }

    return izinler.join("\n");
}

// =====================================================
// NICKNAME
// =====================================================

function isimGetir(user, member) {
    if (!member?.nickname) {
        return user.username;
    }

    return member.nickname;
}

// =====================================================
// EMBED
// =====================================================

function embedOlustur(user, member, guild) {
    const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setTitle("👤 Kullanıcı Bilgileri")
        .setThumbnail(user.displayAvatarURL({
            extension: "png",
            size: 512
        }))
        .setTimestamp();

    // -------------------------------------------------
    // TEMEL BİLGİLER
    // -------------------------------------------------

    embed.addFields({
        name: "📋 Temel Bilgiler",
        value: [
            `**Kullanıcı:** ${user}`,
            `**Kullanıcı Adı:** \`${user.username}\``,
            `**Görünen Ad:** \`${user.globalName || user.username}\``,
            `**Sunucu İsmi:** \`${isimGetir(user, member)}\``,
            `**ID:** \`${user.id}\``,
            `**Bot:** ${user.bot ? "Evet 🤖" : "Hayır 👤"}`
        ].join("\n"),
        inline: false
    });

    // -------------------------------------------------
    // TARİHLER
    // -------------------------------------------------

    embed.addFields({
        name: "📅 Tarihler",
        value: [
            `**Hesap Oluşturma:** ${tarih(user.createdAt)}`,
            `**Hesap Yaşı:** ${hesapYasi(user.createdAt)}`,
            `**Sunucuya Katılma:** ${member ? tarih(member.joinedAt) : "Sunucu üyesi değil"}`,
            `**Katılalı:** ${member?.joinedAt ? tarihKisa(member.joinedAt) : "Bilinmiyor"}`
        ].join("\n"),
        inline: false
    });

    // -------------------------------------------------
    // DURUM
    // -------------------------------------------------

    const presence = guild.presences.cache.get(user.id);

    embed.addFields({
        name: "🟢 Durum",
        value: [
            `**Durum:** ${durumGetir(presence)}`,
            `**Aktivite:** ${aktiviteGetir(presence)}`
        ].join("\n"),
        inline: false
    });

    // -------------------------------------------------
    // ROLLER
    // -------------------------------------------------

    embed.addFields({
        name: "🎭 Roller",
        value: rollerGetir(member),
        inline: false
    });

    // -------------------------------------------------
    // YETKİLER
    // -------------------------------------------------

    embed.addFields({
        name: "🛡️ Önemli Yetkiler",
        value: izinleriGetir(member),
        inline: false
    });

    // -------------------------------------------------
    // ROZETLER
    // -------------------------------------------------

    embed.addFields({
        name: "🏅 Discord Rozetleri",
        value: rozetleriGetir(user.flags),
        inline: false
    });

    // -------------------------------------------------
    // AVATAR
    // -------------------------------------------------

    const avatarURL = user.displayAvatarURL({
        extension: "png",
        size: 1024,
        forceStatic: false
    });

    embed.addFields({
        name: "🖼️ Avatar",
        value: `[Avatarı Görüntüle](${avatarURL})`,
        inline: true
    });

    // -------------------------------------------------
    // BANNER
    // -------------------------------------------------

    if (user.banner) {
        const bannerURL = user.bannerURL({
            extension: "png",
            size: 1024
        });

        embed.addFields({
            name: "🎨 Banner",
            value: `[Bannerı Görüntüle](${bannerURL})`,
            inline: true
        });
    } else {
        embed.addFields({
            name: "🎨 Banner",
            value: "Banner bulunmuyor.",
            inline: true
        });
    }

    // -------------------------------------------------
    // SUNUCU
    // -------------------------------------------------

    if (guild) {
        embed.setFooter({
            text: `${guild.name} • Mion Kullanıcı Bilgi`
        });
    }

    return embed;
}

// =====================================================
// BUTONLAR
// =====================================================

function butonlarOlustur(user) {
    const avatarURL = user.displayAvatarURL({
        extension: "png",
        size: 1024
    });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel("Avatar")
            .setEmoji("🖼️")
            .setStyle(ButtonStyle.Link)
            .setURL(avatarURL)
    );

    if (user.banner) {
        const bannerURL = user.bannerURL({
            extension: "png",
            size: 1024
        });

        row.addComponents(
            new ButtonBuilder()
                .setLabel("Banner")
                .setEmoji("🎨")
                .setStyle(ButtonStyle.Link)
                .setURL(bannerURL)
        );
    }

    return row;
}

// =====================================================
// EXECUTE
// =====================================================

async function execute(interaction) {
    try {
        const secilenKullanici =
            interaction.options.getUser("kullanici") ||
            interaction.user;

        // Banner bilgisi için fetch
        const user = await secilenKullanici.fetch();

        let member = null;

        try {
            member = await interaction.guild.members
                .fetch(user.id);
        } catch {
            member = null;
        }

        const embed = embedOlustur(
            user,
            member,
            interaction.guild
        );

        const row = butonlarOlustur(user);

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });

    } catch (error) {
        console.error("Kullanıcı bilgi hatası:", error);

        const mesaj = {
            content: "❌ Kullanıcı bilgileri alınırken bir hata oluştu.",
            ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(mesaj).catch(() => {});
        } else {
            await interaction.reply(mesaj).catch(() => {});
        }
    }
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    data,
    execute
};
