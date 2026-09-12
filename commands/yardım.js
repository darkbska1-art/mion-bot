
const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

// =====================================================
// KATEGORİLER
// =====================================================

const CATEGORIES = {

    ayarlanabilir: {
        label: "Ayarlanabilir Sistemler",
        emoji: "⚙️",
        description: "Sunucunda açıp kapatabileceğin ve ayarlayabileceğin sistemler.",
        commands: [
            { name: "/sayaç", description: "Sunucunun sayaç sistemini ayarlar." },
            { name: "/sayaç aç/kapat", description: "Sunucunun sayaç sistemini açar veya kapatır." },
            { name: "/hoşgeldin-ayarla hoşgeldin kanal", description: "Sunucunun hoşgeldin kanalını ayarlar." },
            { name: "/hoşgeldin-ayarla görüşürüz kanal", description: "Sunucunun görüşürüz kanalını ayarlar." },
            { name: "/otorol", description: "Otomatik rol sistemini ayarlar." },
            { name: "/otorol-sıfırla", description: "Otomatik rol sistemini sıfırlar." },
            { name: "/otorol-kapat", description: "Otomatik rol sistemini kapatır." },
            { name: "/seviyesistem aç", description: "Seviye sistemini açar." },
            { name: "/seviyesistem kapat", description: "Seviye sistemini kapatır." },
            { name: "/seviyesistem sıfırla", description: "Seviye sistemini sıfırlar." },
            { name: "/seviyesistem kanal", description: "Seviye sistemi kanalını ayarlar." },
            { name: "/siralama", description: "Sunucudaki kullanıcıların seviye sıralamasını gösterir." },
            { name: "/secrutiy", description: "Sunucunun güvenlik durumunu kontrol eder." },
            { name: "/secrutiy aç/kapat", description: "Sunucunun güvenlik sistemini açar veya kapatır." },
            { name: "/log", description: "Sunucunun log kanalını ayarlar." },
            { name: "/log sıfırla", description: "Sunucunun log kanalını sıfırlar." },
            { name: "/log kapat", description: "Sunucunun log kanalını kapatır." },
            { name: "/log test", description: "Sunucunun log kanalını test eder." },
            { name: "/yetkilibascuru durum", description: "Yetkili başvuru sisteminin durumunu gösterir." },
            { name: "/yetkilibasvuru kapat", description: "Yetkili başvuru sistemini kapatır." },
            { name: "/yetkilibasvurupanel", description: "Yetkili başvuru panelini oluşturur." },
            { name: "/ticket-kur", description: "Ticket sistemini kurar." },
            { name: "/ticket-ayarla", description: "Ticket panelini düzenler." }
        ]
    },

    moderasyon: {
        label: "Moderasyon",
        emoji: "🛡️",
        description: "Sunucu moderasyonu ve yönetimi için komutlar.",
        commands: [
            { name: "/mute", description: "Bir kullanıcıya mute rolü verir." },
            { name: "/unmute", description: "Bir kullanıcının mute rolünü kaldırır." },
            { name: "/timeout", description: "Bir kullanıcıya timeout uygular." },
            { name: "/untimeout", description: "Bir kullanıcının timeoutunu kaldırır." },
            { name: "/clear", description: "Mesajları toplu olarak siler." },
            { name: "/rolver", description: "Bir kullanıcıya rol verir." },
            { name: "/rolal", description: "Bir kullanıcıdan rol alır." },
            { name: "/toplurolver", description: "Herkese rol verir." },
            { name: "/toplurolal", description: "Herkesten rol alır." },
            { name: "/nuke", description: "Bir kanalı silip tekrar oluşturur." },
            { name: "/slowmode", description: "Bir kanalda yavaş modu ayarlar." },
            { name: "/ban", description: "Bir üyeyi sunucudan yasaklar." },
            { name: "/unban", description: "Yasaklı bir kullanıcının yasağını kaldırır." },
            { name: "/warn", description: "Bir kullanıcıyı uyarır." },
            { name: "/warns", description: "Bir kullanıcının uyarılarını gösterir." },
            { name: "/warn-sil", description: "Bir kullanıcının uyarısını siler." },
            { name: "/kick", description: "Bir üyeyi sunucudan atar." }
        ]
    },

    eglence: {
        label: "Eğlence",
        emoji: "🎮",
        description: "Sunucunda eğlenmek için kullanabileceğin komutlar.",
        commands: [
            { name: "/8ball", description: "Sorularına gizemli cevaplar verir." },
            { name: "/zar", description: "Zar atar." },
            { name: "/yazitura", description: "Yazı veya tura atar." },
            { name: "/sec", description: "Seçenekler arasından seçim yapar." },
            { name: "/tasmakas", description: "Taş, kağıt, makas oynarsın." },
            { name: "/sans", description: "Şansını test edersin." },
            { name: "/espri", description: "Rastgele bir espri gösterir." },
            { name: "/sayitahmin", description: "Sayı tahmin oyunu oynarsın." },
            { name: "/ascii", description: "Metni ASCII formatında gösterir." },
            { name: "/ship", description: "İki kullanıcıyı birleştirip ship yüzdesi gösterir." },
            { name: "/avatar", description: "Bir kullanıcının avatarını gösterir." },
            { name: "/banner", description: "Bir kullanıcının bannerını gösterir." }
        ]
    },

    ekonomi: {
        label: "Ekonomi",
        emoji: "💰",
        description: "Mion ekonomi sistemindeki tüm komutlar.",
        commands: [
            { name: "/ekonomi bakiye", description: "Bakiyeni görüntülersin." },
            { name: "/ekonomi günlük", description: "Günlük ödülünü alırsın." },
            { name: "/ekonomi çalış", description: "Çalışarak Mion kazanırsın." },
            { name: "/ekonomi meslek", description: "Meslek sistemini kullanırsın." },
            { name: "/ekonomi transfer", description: "Başka bir kullanıcıya para gönderirsin." },
            { name: "/ekonomi zenginler", description: "En zengin kullanıcıları görüntülersin." },
            { name: "/ekonomi envanter", description: "Envanterini görüntülersin." },
            { name: "/ekonomi market", description: "Ekonomi marketini görüntülersin." },
            { name: "/ekonomi satınal", description: "Marketten eşya satın alırsın." },
            { name: "/ekonomi sat", description: "Eşyalarını satarsın." },
            { name: "/ekonomi para-ver", description: "Bir kullanıcıya para verirsin." },
            { name: "/ekonomi para-al", description: "Bir kullanıcıdan para alırsın." },
            { name: "/ekonomi banka", description: "Banka hesabını görüntülersin." },
            { name: "/ekonomi yatır", description: "Bankaya para yatırırsın." },
            { name: "/ekonomi çek", description: "Bankadan para çekersin." },
            { name: "/ekonomi faiz", description: "Banka faiz durumunu görüntülersin." },
            { name: "/ekonomi kasa", description: "Kasalarını görüntülersin." },
            { name: "/ekonomi kasa-aç", description: "Sahip olduğun kasayı açarsın." },
            { name: "/ekonomi soygun", description: "Ekonomi soygun sistemini kullanırsın." },
            { name: "/ekonomi görevler", description: "Mevcut görevlerini görüntülersin." },
            { name: "/ekonomi görev", description: "Görevlerini kontrol edersin." },
            { name: "/ekonomi görev-sıfırla", description: "Görev ilerlemeni sıfırlarsın." }
        ]
    },

    sistem: {
        label: "Sistem",
        emoji: "🧩",
        description: "Mion'un genel sistem ve sunucu özellikleri.",
        commands: [
            { name: "/botbilgi", description: "Mion botunun istatistiklerini gösterir." },
            { name: "/sunucubilgi", description: "Sunucu hakkında bilgi verir." },
            { name: "/kullanıcı", description: "Bir kullanıcı hakkında bilgi verir." },
            { name: "/namaz", description: "Namaz vakitlerini gösterir." },
            { name: "/uptime", description: "Mion'un uptime süresini gösterir." },
            { name: "/ping", description: "Mion'un ping süresini gösterir." }
        ]
    }

};


// =====================================================
// SAYFA AYARI
// =====================================================

const COMMANDS_PER_PAGE = 5;


// =====================================================
// ANA SAYFA
// =====================================================

function createHomeEmbed() {

    return new EmbedBuilder()

        .setColor(0x000000)

        .setTitle("🌸 Mion Yardım Merkezi")

        .setDescription(
            "Mion'un yardım merkezine hoş geldin!\n\n" +
            "Aşağıdaki menüden bir kategori seçerek komutları görüntüleyebilirsin.\n\n" +

            "### 📚 Kategoriler\n\n" +

            "⚙️ **Ayarlanabilir Sistemler**\n" +
            "Sunucuna özel ayarlanabilen sistemler.\n\n" +

            "🛡️ **Moderasyon**\n" +
            "Sunucu yönetimi ve moderasyon komutları.\n\n" +

            "🎮 **Eğlence**\n" +
            "Eğlence ve oyun komutları.\n\n" +

            "💰 **Ekonomi**\n" +
            "Mion ekonomi sistemi ve alt komutları.\n\n" +

            "🧩 **Sistem**\n" +
            "Genel Mion sistemleri ve sunucu özellikleri."
        )

        .setFooter({
            text: "Mion • Yardım Sistemi"
        })

        .setTimestamp();

}


// =====================================================
// KATEGORİ EMBED
// =====================================================

function createCategoryEmbed(categoryKey, page) {

    const category = CATEGORIES[categoryKey];

    if (!category) {
        return createHomeEmbed();
    }

    const commands = category.commands;

    const totalPages = Math.max(
        1,
        Math.ceil(
            commands.length / COMMANDS_PER_PAGE
        )
    );

    page = Math.max(
        0,
        Math.min(
            page,
            totalPages - 1
        )
    );

    const start =
        page * COMMANDS_PER_PAGE;

    const currentCommands =
        commands.slice(
            start,
            start + COMMANDS_PER_PAGE
        );

    const embed = new EmbedBuilder()

        .setColor(0x000000)

        .setTitle(
            `${category.emoji} ${category.label}`
        )

        .setDescription(
            `${category.description}\n\n` +
            `**Toplam Komut:** ${commands.length}`
        )

        .setFooter({
            text:
                `Mion • Sayfa ${page + 1}/${totalPages}`
        })

        .setTimestamp();


    if (currentCommands.length === 0) {

        embed.addFields({

            name: "📭 Henüz Komut Eklenmedi",

            value:
                "Bu kategoriye henüz komut eklenmemiş."

        });

    } else {

        for (const command of currentCommands) {

            embed.addFields({

                name: `\`${command.name}\``,

                value:
                    command.description,

                inline: false

            });

        }

    }

    return embed;

}


// =====================================================
// SELECT MENU
// =====================================================

function createSelectMenu(
    ownerId,
    selectedCategory = null
) {

    const menu =
        new StringSelectMenuBuilder()

            .setCustomId(
                `yardim_select:${ownerId}`
            )

            .setPlaceholder(
                "📚 Bir kategori seç..."
            )

            .addOptions(

                Object.entries(
                    CATEGORIES
                ).map(
                    ([key, category]) => ({

                        label:
                            category.label,

                        description:
                            category.description.slice(
                                0,
                                100
                            ),

                        value: key,

                        emoji:
                            category.emoji,

                        default:
                            key === selectedCategory

                    })
                )

            );


    return new ActionRowBuilder()
        .addComponents(menu);

}


// =====================================================
// NAVİGASYON
// =====================================================

function createNavigation(
    ownerId,
    categoryKey,
    page
) {

    const category =
        CATEGORIES[categoryKey];

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                category.commands.length /
                COMMANDS_PER_PAGE
            )
        );


    const previousButton =
        new ButtonBuilder()

            .setCustomId(
                `yardim_prev:${ownerId}:${categoryKey}:${page}`
            )

            .setLabel("Geri")

            .setEmoji("◀️")

            .setStyle(
                ButtonStyle.Secondary
            )

            .setDisabled(
                page <= 0
            );


    const homeButton =
        new ButtonBuilder()

            .setCustomId(
                `yardim_home:${ownerId}`
            )

            .setLabel("Ana Sayfa")

            .setEmoji("🏠")

            .setStyle(
                ButtonStyle.Secondary
            );


    const nextButton =
        new ButtonBuilder()

            .setCustomId(
                `yardim_next:${ownerId}:${categoryKey}:${page}`
            )

            .setLabel("İleri")

            .setEmoji("▶️")

            .setStyle(
                ButtonStyle.Secondary
            )

            .setDisabled(
                page >= totalPages - 1
            );


    return new ActionRowBuilder()
        .addComponents(
            previousButton,
            homeButton,
            nextButton
        );

}


// =====================================================
// PANEL
// =====================================================

function createPanel(
    ownerId,
    categoryKey = null,
    page = 0
) {

    if (!categoryKey) {

        return {

            embeds: [
                createHomeEmbed()
            ],

            components: [
                createSelectMenu(ownerId)
            ]

        };

    }


    return {

        embeds: [

            createCategoryEmbed(
                categoryKey,
                page
            )

        ],

        components: [

            createSelectMenu(
                ownerId,
                categoryKey
            ),

            createNavigation(
                ownerId,
                categoryKey,
                page
            )

        ]

    };

}


// =====================================================
// SLASH COMMAND
// =====================================================

const data =
    new SlashCommandBuilder()

        .setName("yardim")

        .setDescription(
            "Mion yardım menüsünü açar."
        );


// =====================================================
// EXECUTE
// =====================================================

async function execute(interaction) {

    await interaction.reply(

        createPanel(
            interaction.user.id
        )

    );

}


// =====================================================
// HANDLER
// =====================================================

async function handleInteraction(interaction) {

    // Sadece buton ve select menu
    // interaction'larını kabul et.

    if (
        !interaction.isButton() &&
        !interaction.isStringSelectMenu()
    ) {
        return false;
    }


    // customId güvenli kontrol

    if (
        !interaction.customId ||
        !interaction.customId.startsWith("yardim_")
    ) {
        return false;
    }


    // =================================================
    // ID BİLGİSİ
    // =================================================

    const parts =
        interaction.customId.split(":");

    const ownerId =
        parts[1] || null;


    // =================================================
    // KULLANICI KONTROLÜ
    // =================================================

    if (
        ownerId &&
        interaction.user.id !== ownerId
    ) {

        await interaction.reply({

            content:
                "❌ Bu yardım menüsünü sadece komutu kullanan kişi kontrol edebilir.",

            ephemeral: true

        });

        return true;

    }


    // =================================================
    // KATEGORİ SEÇ
    // =================================================

    if (
        interaction.isStringSelectMenu() &&
        interaction.customId.startsWith(
            "yardim_select:"
        )
    ) {

        const selectedCategory =
            interaction.values[0];

        if (!CATEGORIES[selectedCategory]) {

            return true;

        }

        await interaction.update(

            createPanel(
                ownerId,
                selectedCategory,
                0
            )

        );

        return true;

    }


    // =================================================
    // ANA SAYFA
    // =================================================

    if (
        interaction.isButton() &&
        interaction.customId.startsWith(
            "yardim_home:"
        )
    ) {

        await interaction.update(

            createPanel(
                ownerId
            )

        );

        return true;

    }


    // =================================================
    // GERİ
    // =================================================

    if (
        interaction.isButton() &&
        interaction.customId.startsWith(
            "yardim_prev:"
        )
    ) {

        const categoryKey =
            parts[2];

        const currentPage =
            Number(parts[3]);

        if (!CATEGORIES[categoryKey]) {

            return true;

        }

        const newPage =
            Math.max(
                0,
                currentPage - 1
            );


        await interaction.update(

            createPanel(
                ownerId,
                categoryKey,
                newPage
            )

        );

        return true;

    }


    // =================================================
    // İLERİ
    // =================================================

    if (
        interaction.isButton() &&
        interaction.customId.startsWith(
            "yardim_next:"
        )
    ) {

        const categoryKey =
            parts[2];

        const currentPage =
            Number(parts[3]);

        const category =
            CATEGORIES[categoryKey];

        if (!category) {

            return true;

        }


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    category.commands.length /
                    COMMANDS_PER_PAGE
                )
            );


        const newPage =
            Math.min(
                totalPages - 1,
                currentPage + 1
            );


        await interaction.update(

            createPanel(
                ownerId,
                categoryKey,
                newPage
            )

        );

        return true;

    }


    return false;

}


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    data,
    execute,
    handleInteraction
};
