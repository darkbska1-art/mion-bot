
const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

// =====================================================
// AYARLAR
// =====================================================

const TIMEZONE = "Europe/Istanbul";
const API_METHOD = 13;

// =====================================================
// NAMAZ VAKİTLERİNİ AL
// =====================================================

async function getPrayerTimes(city, date = null) {

    const targetDate =
        date ||
        new Intl.DateTimeFormat("en-CA", {
            timeZone: TIMEZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());

    const url =
        "https://api.aladhan.com/v1/timingsByCity" +
        `/${targetDate}` +
        `?city=${encodeURIComponent(city)}` +
        "&country=Turkey" +
        `&method=${API_METHOD}` +
        "&school=1"

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Namaz API HTTP ${response.status}`
        );
    }

    const json = await response.json();

    if (
        json.code !== 200 ||
        !json.data ||
        !json.data.timings
    ) {
        return null;
    }

    return json.data;
}

// =====================================================
// SAATİ DAKİKAYA ÇEVİR
// =====================================================

function timeToMinutes(time) {

    const match =
        String(time)
            .match(/^(\d{1,2}):(\d{2})/);

    if (!match) {
        return null;
    }

    return (
        Number(match[1]) * 60 +
        Number(match[2])
    );
}

// =====================================================
// TÜRKİYE TARİHİ
// =====================================================

function getTurkeyDate() {

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: TIMEZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).format(new Date());
}

// =====================================================
// TÜRKİYE SAATİ
// =====================================================

function getTurkeyTime() {

    const parts =
        new Intl.DateTimeFormat(
            "en-GB",
            {
                timeZone: TIMEZONE,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hourCycle: "h23"
            }
        ).formatToParts(new Date());

    const get =
        type =>
            Number(
                parts.find(
                    x => x.type === type
                )?.value || 0
            );

    return {
        hour: get("hour"),
        minute: get("minute"),
        second: get("second")
    };
}

// =====================================================
// KALAN SÜRE
// =====================================================

function getRemaining(targetTime) {

    const now = getTurkeyTime();

    let nowSeconds =
        now.hour * 3600 +
        now.minute * 60 +
        now.second;

    let targetSeconds =
        targetTime.hour * 3600 +
        targetTime.minute * 60;

    if (targetSeconds <= nowSeconds) {
        targetSeconds += 24 * 60 * 60;
    }

    let diff =
        targetSeconds - nowSeconds;

    const hours =
        Math.floor(diff / 3600);

    diff %= 3600;

    const minutes =
        Math.floor(diff / 60);

    const seconds =
        diff % 60;

    if (hours > 0) {
        return `${hours} saat ${minutes} dakika`;
    }

    if (minutes > 0) {
        return `${minutes} dakika ${seconds} saniye`;
    }

    return `${seconds} saniye`;
}

// =====================================================
// SIRADAKİ NAMAZ
// =====================================================

function getNextPrayer(timings) {

    const prayers = [
        {
            key: "Fajr",
            name: "İmsak",
            emoji: "🌙"
        },
        {
            key: "Sunrise",
            name: "Güneş",
            emoji: "🌅"
        },
        {
            key: "Dhuhr",
            name: "Öğle",
            emoji: "☀️"
        },
        {
            key: "Asr",
            name: "İkindi",
            emoji: "🌤️"
        },
        {
            key: "Maghrib",
            name: "Akşam",
            emoji: "🌇"
        },
        {
            key: "Isha",
            name: "Yatsı",
            emoji: "🌙"
        }
    ];

    const now = getTurkeyTime();

    const nowMinutes =
        now.hour * 60 +
        now.minute;

    for (const prayer of prayers) {

        const minutes =
            timeToMinutes(
                timings[prayer.key]
            );

        if (
            minutes !== null &&
            minutes > nowMinutes
        ) {

            const hour =
                Math.floor(minutes / 60);

            const minute =
                minutes % 60;

            return {
                ...prayer,
                time: timings[prayer.key],
                hour,
                minute
            };
        }
    }

    // Günün bütün vakitleri geçtiyse
    // sıradaki vakit yarının İmsağıdır.

    const imsak =
        timeToMinutes(
            timings.Fajr
        );

    return {
        key: "Fajr",
        name: "İmsak",
        emoji: "🌙",
        time: timings.Fajr,
        hour: Math.floor(imsak / 60),
        minute: imsak % 60,
        tomorrow: true
    };
}

// =====================================================
// EMBED
// =====================================================

function createEmbed(data, city) {

    const timings = data.timings;

    const next =
        getNextPrayer(timings);

    const remaining =
        getRemaining({
            hour: next.hour,
            minute: next.minute
        });

    const now =
        getTurkeyTime();

    const nowMinutes =
        now.hour * 60 +
        now.minute;

    const prayerList = [
        {
            key: "Fajr",
            name: "İmsak",
            emoji: "🌙"
        },
        {
            key: "Sunrise",
            name: "Güneş",
            emoji: "🌅"
        },
        {
            key: "Dhuhr",
            name: "Öğle",
            emoji: "☀️"
        },
        {
            key: "Asr",
            name: "İkindi",
            emoji: "🌤️"
        },
        {
            key: "Maghrib",
            name: "Akşam",
            emoji: "🌇"
        },
        {
            key: "Isha",
            name: "Yatsı",
            emoji: "🌙"
        }
    ];

    const fields =
        prayerList.map(prayer => {

            const time =
                timings[prayer.key];

            const minutes =
                timeToMinutes(time);

            const passed =
                minutes !== null &&
                minutes <= nowMinutes;

            return {
                name:
                    `${prayer.emoji} ${prayer.name}`,
                value:
                    `**${time}**` +
                    (
                        passed
                            ? "  ✓"
                            : ""
                    ),
                inline: true
            };
        });

    return new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🕌 ${city} Namaz Vakitleri`)
        .setDescription(
            `📅 **${data.date.readable}**\n` +
            `🇹🇷 Türkiye saati • Europe/Istanbul\n\n` +
            `🔜 **Sıradaki:** ` +
            `${next.emoji} **${next.name}** — **${next.time}**\n` +
            `⏳ **Kalan:** ${remaining}`
        )
        .addFields(fields)
        .addFields({
            name: "📍 Konum",
            value:
                `**${city} / Türkiye**`,
            inline: true
        })
        .addFields({
            name: "🧭 Hesaplama",
            value:
                "Diyanet yöntemi",
            inline: true
        })
        .setFooter({
            text:
                "Namaz Vakitleri • Yenilemek için 🔄"
        })
        .setTimestamp();
}

// =====================================================
// BUTON
// =====================================================

function createButtons() {

    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setCustomId("namaz_yenile")
                .setLabel("Yenile")
                .setEmoji("🔄")
                .setStyle(
                    ButtonStyle.Primary
                )
        );
}

// =====================================================
// KOMUT
// =====================================================

module.exports = {

    data:
        new SlashCommandBuilder()
            .setName("namaz")
            .setDescription(
                "🕌 Güncel namaz vakitlerini gösterir."
            )
            .addStringOption(option =>
                option
                    .setName("şehir")
                    .setDescription(
                        "Türkiye'deki şehir"
                    )
                    .setRequired(true)
            ),

    async execute(interaction) {

        const city =
            interaction.options
                .getString("şehir")
                .trim();

        await interaction.deferReply();

        try {

            let data =
                await getPrayerTimes(city);

            if (!data) {

                return interaction.editReply({
                    content:
                        `❌ **${city}** için namaz vakitleri bulunamadı.\n\n` +
                        `Örnek: \`/namaz şehir:Mersin\``,
                    embeds: [],
                    components: []
                });
            }

            await interaction.editReply({
                embeds: [
                    createEmbed(
                        data,
                        city
                    )
                ],
                components: [
                    createButtons()
                ]
            });

            const message =
                await interaction.fetchReply();

            const collector =
                message.createMessageComponentCollector({
                    time: 10 * 60 * 1000
                });

            collector.on(
                "collect",
                async button => {

                    if (
                        button.user.id !==
                        interaction.user.id
                    ) {

                        return button.reply({
                            content:
                                "❌ Bu paneli sadece komutu kullanan kişi yenileyebilir.",
                            ephemeral: true
                        });
                    }

                    await button.deferUpdate();

                    try {

                        data =
                            await getPrayerTimes(
                                city
                            );

                        await interaction.editReply({
                            embeds: [
                                createEmbed(
                                    data,
                                    city
                                )
                            ],
                            components: [
                                createButtons()
                            ]
                        });

                    } catch (error) {

                        console.error(
                            "❌ Namaz yenileme hatası:",
                            error
                        );

                    }
                }
            );

            collector.on(
                "end",
                async () => {

                    const disabled =
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(
                                        "namaz_sure_doldu"
                                    )
                                    .setLabel(
                                        "Süre Doldu"
                                    )
                                    .setEmoji("⏱️")
                                    .setStyle(
                                        ButtonStyle.Secondary
                                    )
                                    .setDisabled(true)
                            );

                    try {

                        await interaction.editReply({
                            components: [
                                disabled
                            ]
                        });

                    } catch {}
                }
            );

        } catch (error) {

            console.error(
                "❌ Namaz komutu hatası:",
                error
            );

            await interaction.editReply({
                content:
                    "❌ Namaz vakitleri alınırken bir hata oluştu. Lütfen biraz sonra tekrar dene.",
                embeds: [],
                components: []
            });
        }
    }
};

