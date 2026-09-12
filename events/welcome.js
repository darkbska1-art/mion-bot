
const {
    AttachmentBuilder,
    EmbedBuilder
} = require("discord.js");

const {
    createCanvas,
    loadImage
} = require("@napi-rs/canvas");

const fs = require("fs");
const path = require("path");

// =====================================================
// DOSYALAR
// =====================================================

const dataFile = path.join(
    __dirname,
    "..",
    "data",
    "welcome.json"
);

const imagesFolder = path.join(
    __dirname,
    "..",
    "images"
);

// HOŞ GELDİN MAKIMA
const welcomeBackground = path.join(
    imagesFolder,
    "makima-welcome.png"
);

// GÖRÜŞÜRÜZ MAKIMA
const goodbyeBackground = path.join(
    imagesFolder,
    "makima-goodbye.png"
);

// =====================================================
// DATA
// =====================================================

function getData() {
    try {
        if (!fs.existsSync(dataFile)) {
            return {};
        }

        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );

    } catch (error) {

        console.error(
            `[Welcome Data] ${error.message}`
        );

        return {};
    }
}

// =====================================================
// HESAP YAŞI
// =====================================================

function getAccountAge(timestamp) {

    const days = Math.floor(
        (Date.now() - timestamp) /
        86400000
    );

    if (days >= 365) {

        const years =
            Math.floor(days / 365);

        return `${years} yıl`;
    }

    if (days >= 30) {

        const months =
            Math.floor(days / 30);

        return `${months} ay`;
    }

    if (days <= 0) {
        return "Bugün";
    }

    return `${days} gün`;
}

// =====================================================
// METİN SIĞDIRMA
// =====================================================

function fitText(
    ctx,
    text,
    maxWidth
) {

    const original =
        String(text);

    let result =
        original;

    while (
        ctx.measureText(result).width >
        maxWidth &&
        result.length > 1
    ) {

        result =
            result.slice(0, -1);
    }

    if (
        result !== original
    ) {

        return (
            result.slice(0, -3) +
            "..."
        );
    }

    return result;
}

// =====================================================
// YUVARLAK KÖŞELİ ALAN
// =====================================================

function roundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
) {

    ctx.beginPath();

    ctx.moveTo(
        x + radius,
        y
    );

    ctx.lineTo(
        x + width - radius,
        y
    );

    ctx.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + radius
    );

    ctx.lineTo(
        x + width,
        y + height - radius
    );

    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );

    ctx.lineTo(
        x + radius,
        y + height
    );

    ctx.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );

    ctx.lineTo(
        x,
        y + radius
    );

    ctx.quadraticCurveTo(
        x,
        y,
        x + radius,
        y
    );

    ctx.closePath();
}

// =====================================================
// DAİRESEL AVATAR
// =====================================================

function drawCircleImage(
    ctx,
    image,
    x,
    y,
    radius
) {

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.closePath();

    ctx.clip();

    ctx.drawImage(
        image,
        x - radius,
        y - radius,
        radius * 2,
        radius * 2
    );

    ctx.restore();
}

// =====================================================
// ARKA PLAN
// =====================================================

async function drawBackground(
    ctx,
    file,
    width,
    height,
    type
) {

    // =================================================
    // MAKIMA GÖRSELİ VARSA
    // =================================================

    if (
        fs.existsSync(file)
    ) {

        try {

            const background =
                await loadImage(file);

            ctx.drawImage(
                background,
                0,
                0,
                width,
                height
            );

            // Görselin üzerine hafif karartma
            ctx.fillStyle =
                "rgba(0,0,0,0.12)";

            ctx.fillRect(
                0,
                0,
                width,
                height
            );

            return;

        } catch (error) {

            console.error(
                `[Makima BG] ${error.message}`
            );
        }
    }

    // =================================================
    // YEDEK KIRMIZI ARKA PLAN
    // =================================================

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            width,
            height
        );

    if (type === "welcome") {

        gradient.addColorStop(
            0,
            "#250000"
        );

        gradient.addColorStop(
            0.5,
            "#8b0000"
        );

        gradient.addColorStop(
            1,
            "#120000"
        );

    } else {

        gradient.addColorStop(
            0,
            "#100000"
        );

        gradient.addColorStop(
            0.5,
            "#550000"
        );

        gradient.addColorStop(
            1,
            "#080000"
        );
    }

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );
}

// =====================================================
// GÖRSEL OLUŞTUR
// =====================================================

async function createImage(
    member,
    type
) {

    const width = 1200;
    const height = 500;

    const canvas =
        createCanvas(
            width,
            height
        );

    const ctx =
        canvas.getContext("2d");

    // =================================================
    // MAKIMA ARKA PLAN
    // =================================================

    const background =
        type === "welcome"
            ? welcomeBackground
            : goodbyeBackground;

    await drawBackground(
        ctx,
        background,
        width,
        height,
        type
    );

    // =================================================
    // BİLGİ PANELİ
    // =================================================

    roundRect(
        ctx,
        575,
        145,
        560,
        300,
        28
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.70)";

    ctx.fill();

    ctx.strokeStyle =
        "rgba(255,35,35,0.85)";

    ctx.lineWidth = 2;

    ctx.stroke();

    // =================================================
    // ÜST BAŞLIK
    // =================================================

    ctx.textAlign =
        "left";

    ctx.font =
        "bold 17px Sans";

    ctx.fillStyle =
        "#ff5252";

    ctx.fillText(
        type === "welcome"
            ? "WELCOME TO THE SERVER"
            : "MEMBER LEFT THE SERVER",
        610,
        180
    );

    // =================================================
    // AVATAR
    // =================================================

    let avatar = null;

    try {

        avatar =
            await loadImage(
                member.user.displayAvatarURL({
                    extension: "png",
                    size: 512,
                    forceStatic: true
                })
            );

    } catch (error) {

        console.error(
            `[Avatar] ${error.message}`
        );
    }

    const avatarX = 485;
    const avatarY = 300;
    const avatarRadius = 86;

    // Kırmızı avatar glow

    ctx.beginPath();

    ctx.arc(
        avatarX,
        avatarY,
        avatarRadius + 13,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(220,0,0,0.40)";

    ctx.fill();

    ctx.strokeStyle =
        "#ff3030";

    ctx.lineWidth = 4;

    ctx.stroke();

    // Avatar

    if (avatar) {

        drawCircleImage(
            ctx,
            avatar,
            avatarX,
            avatarY,
            avatarRadius
        );
    }

    // =================================================
    // KULLANICI ADI
    // =================================================

    const displayName =
        member.user.globalName ||
        member.user.username;

    ctx.font =
        "bold 34px Sans";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        fitText(
            ctx,
            displayName,
            440
        ),
        610,
        225
    );

    // =================================================
    // ALT MESAJ
    // =================================================

    ctx.font =
        "19px Sans";

    ctx.fillStyle =
        "#ffb0b0";

    ctx.fillText(
        type === "welcome"
            ? "Aramıza katıldığın için mutluyuz."
            : "Sunucumuzdan ayrıldı. Görüşürüz!",
        610,
        257
    );

    // =================================================
    // ÜYE SAYISI PANELİ
    // =================================================

    roundRect(
        ctx,
        610,
        285,
        220,
        62,
        14
    );

    ctx.fillStyle =
        "rgba(170,0,0,0.32)";

    ctx.fill();

    ctx.strokeStyle =
        "rgba(255,60,60,0.35)";

    ctx.lineWidth = 1;

    ctx.stroke();

    ctx.font =
        "bold 21px Sans";

    ctx.fillStyle =
        "#ffffff";

    const memberCount =
        member.guild.memberCount
            .toLocaleString("tr-TR");

    ctx.fillText(
        type === "welcome"
            ? `#${memberCount} Üye`
            : `${memberCount} Üye Kaldı`,
        630,
        323
    );

    // =================================================
    // HESAP YAŞI PANELİ
    // =================================================

    roundRect(
        ctx,
        850,
        285,
        245,
        62,
        14
    );

    ctx.fillStyle =
        "rgba(170,0,0,0.32)";

    ctx.fill();

    ctx.strokeStyle =
        "rgba(255,60,60,0.35)";

    ctx.stroke();

    ctx.font =
        "bold 20px Sans";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        getAccountAge(
            member.user.createdTimestamp
        ),
        870,
        316
    );

    ctx.font =
        "14px Sans";

    ctx.fillStyle =
        "#ffaaaa";

    ctx.fillText(
        "Hesap yaşı",
        870,
        338
    );

    // =================================================
    // SUNUCU ADI
    // =================================================

    ctx.font =
        "bold 18px Sans";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        fitText(
            ctx,
            member.guild.name,
            480
        ),
        610,
        390
    );

    // =================================================
    // FOOTER
    // =================================================

    ctx.font =
        "15px Sans";

    ctx.fillStyle =
        "#ff8c8c";

    ctx.fillText(
        type === "welcome"
            ? "Mion • Makima • Hoş geldin ❤️"
            : "Mion • Makima • Görüşürüz ❤️",
        610,
        418
    );

    // =================================================
    // PNG
    // =================================================

    return canvas.toBuffer(
        "image/png"
    );
}

// =====================================================
// EVENTLER
// =====================================================

module.exports = {

    register(client) {

        // =================================================
        // HOŞ GELDİN
        // =================================================

        client.on(
            "guildMemberAdd",
            async member => {

                const db =
                    getData();

                const ayar =
                    db[member.guild.id];

                if (!ayar) {
                    return;
                }

                if (
                    !ayar.welcomeEnabled
                ) {
                    return;
                }

                if (
                    !ayar.welcomeChannel
                ) {
                    return;
                }

                const channel =
                    member.guild.channels.cache.get(
                        ayar.welcomeChannel
                    );

                if (!channel) {
                    return;
                }

                try {

                    // =================================================
                    // MAKIMA HOŞ GELDİN GÖRSELİ
                    // =================================================

                    const image =
                        await createImage(
                            member,
                            "welcome"
                        );

                    const attachment =
                        new AttachmentBuilder(
                            image,
                            {
                                name:
                                    "makima-welcome-generated.png"
                            }
                        );

                    // =================================================
                    // EMBED
                    // =================================================

                    const embed =
                        new EmbedBuilder()
                            .setColor(
                                0xE31C23
                            )
                            .setTitle(
                                "❤️ Hoş Geldin!"
                            )
                            .setDescription(
                                `Aramıza hoş geldin ${member}!\n` +
                                `**${member.guild.name}** ailesine katıldın.`
                            )
                            .setThumbnail(
                                member.user.displayAvatarURL({
                                    size: 256
                                })
                            )
                            .setImage(
                                "attachment://makima-welcome-generated.png"
                            )
                            .addFields(
                                {
                                    name:
                                        "👤 Kullanıcı",
                                    value:
                                        `${member}\n` +
                                        `\`${member.user.username}\``,
                                    inline: true
                                },
                                {
                                    name:
                                        "👥 Üye Sayısı",
                                    value:
                                        member.guild.memberCount
                                            .toLocaleString("tr-TR"),
                                    inline: true
                                },
                                {
                                    name:
                                        "📅 Hesap Yaşı",
                                    value:
                                        getAccountAge(
                                            member.user.createdTimestamp
                                        ),
                                    inline: true
                                }
                            )
                            .setFooter({
                                text:
                                    "Mion • Makima • Hoş geldin ❤️"
                            })
                            .setTimestamp();

                    // =================================================
                    // MESAJ
                    // =================================================

                    await channel.send({
                        content:
                            `${member}`,
                        embeds: [
                            embed
                        ],
                        files: [
                            attachment
                        ]
                    });

                    console.log(
                        `✓ Hoş geldin: ${member.user.tag} → ${member.guild.name}`
                    );

                } catch (error) {

                    console.error(
                        `[Hoş Geldin] ${error.stack || error.message}`
                    );
                }
            }
        );

        // =================================================
        // GÖRÜŞÜRÜZ
        // =================================================

        client.on(
            "guildMemberRemove",
            async member => {

                const db =
                    getData();

                const ayar =
                    db[member.guild.id];

                if (!ayar) {
                    return;
                }

                if (
                    !ayar.leaveEnabled
                ) {
                    return;
                }

                if (
                    !ayar.leaveChannel
                ) {
                    return;
                }

                const channel =
                    member.guild.channels.cache.get(
                        ayar.leaveChannel
                    );

                if (!channel) {
                    return;
                }

                try {

                    // =================================================
                    // MAKIMA GÖRÜŞÜRÜZ GÖRSELİ
                    // =================================================

                    const image =
                        await createImage(
                            member,
                            "goodbye"
                        );

                    const attachment =
                        new AttachmentBuilder(
                            image,
                            {
                                name:
                                    "makima-goodbye-generated.png"
                            }
                        );

                    // =================================================
                    // EMBED
                    // =================================================

                    const embed =
                        new EmbedBuilder()
                            .setColor(
                                0xE31C23
                            )
                            .setTitle(
                                "🚪 Görüşürüz!"
                            )
                            .setDescription(
                                `**${member.user.username}** sunucumuzdan ayrıldı.\n` +
                                `**${member.guild.name}** ailesine tekrar bekleriz. ❤️`
                            )
                            .setThumbnail(
                                member.user.displayAvatarURL({
                                    size: 256
                                })
                            )
                            .setImage(
                                "attachment://makima-goodbye-generated.png"
                            )
                            .addFields(
                                {
                                    name:
                                        "👤 Kullanıcı",
                                    value:
                                        `\`${member.user.username}\`\n` +
                                        `ID: \`${member.id}\``,
                                    inline: true
                                },
                                {
                                    name:
                                        "👥 Kalan Üye",
                                    value:
                                        member.guild.memberCount
                                            .toLocaleString("tr-TR"),
                                    inline: true
                                },
                                {
                                    name:
                                        "📅 Hesap Yaşı",
                                    value:
                                        getAccountAge(
                                            member.user.createdTimestamp
                                        ),
                                    inline: true
                                }
                            )
                            .setFooter({
                                text:
                                    "Mion • Makima • Görüşürüz ❤️"
                            })
                            .setTimestamp();

                    // =================================================
                    // MESAJ
                    // =================================================

                    await channel.send({
                        embeds: [
                            embed
                        ],
                        files: [
                            attachment
                        ]
                    });

                    console.log(
                        `✓ Görüşürüz: ${member.user.tag} → ${member.guild.name}`
                    );

                } catch (error) {

                    console.error(
                        `[Görüşürüz] ${error.stack || error.message}`
                    );
                }
            }
        );

        // =================================================
        // SISTEM AKTIF
        // =================================================

        console.log(
            "✓ Mion • Makima hoş geldin / görüşürüz sistemi aktif."
        );
    }
};

