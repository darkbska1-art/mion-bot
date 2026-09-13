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

const dataFolder = path.join(__dirname, "..", "data");
const dataFile = path.join(dataFolder, "welcome.json");

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
}

// =====================================================
// MAKIMA GÖRSELLERİNİ BUL
// =====================================================

const imageCandidates = [
    path.join(process.cwd(), "images"),
    path.join(__dirname, "..", "images"),
    path.join(__dirname, "images")
];

function findImage(fileName) {

    for (const folder of imageCandidates) {

        const fullPath = path.join(folder, fileName);

        if (fs.existsSync(fullPath)) {

            console.log(
                `✓ Makima görseli bulundu: ${fullPath}`
            );

            return fullPath;
        }
    }

    console.error(
        `❌ Makima görseli bulunamadı: ${fileName}`
    );

    console.error("Aranan klasörler:");

    for (const folder of imageCandidates) {
        console.error(`   → ${folder}`);
    }

    return null;
}

// BURASI ÖNEMLİ
const welcomeBackground =
    findImage("makima-welcome.png");

const goodbyeBackground =
    findImage("makima-goodbye.png");

// =====================================================
// VERİ OKUMA
// =====================================================

function getData() {

    if (!fs.existsSync(dataFile)) {
        return {};
    }

    try {

        return JSON.parse(
            fs.readFileSync(dataFile, "utf8")
        );

    } catch (error) {

        console.error(
            "❌ welcome.json okunamadı:",
            error
        );

        return {};
    }
}

// =====================================================
// HESAPLAMA
// =====================================================

function getAccountAge(user) {

    const created = user.createdTimestamp;

    const diff =
        Date.now() - created;

    const days =
        Math.floor(
            diff / (1000 * 60 * 60 * 24)
        );

    if (days < 1) {
        return "Bugün oluşturuldu";
    }

    if (days === 1) {
        return "1 gün önce oluşturuldu";
    }

    if (days < 30) {
        return `${days} gün önce oluşturuldu`;
    }

    const months =
        Math.floor(days / 30);

    if (months < 12) {
        return `${months} ay önce oluşturuldu`;
    }

    const years =
        Math.floor(months / 12);

    return `${years} yıl önce oluşturuldu`;
}

// =====================================================
// METİN SIĞDIRMA
// =====================================================

function fitText(
    ctx,
    text,
    maxWidth,
    startSize,
    minSize
) {

    let size = startSize;

    while (
        size > minSize &&
        ctx.measureText(text).width > maxWidth
    ) {

        size--;

        ctx.font =
            `700 ${size}px Arial`;
    }

    return size;
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

async function drawCircleImage(
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
// COVER
// =====================================================

function drawCover(
    ctx,
    image,
    x,
    y,
    width,
    height
) {

    const imageRatio =
        image.width / image.height;

    const boxRatio =
        width / height;

    let drawWidth;
    let drawHeight;
    let offsetX;
    let offsetY;

    if (imageRatio > boxRatio) {

        drawHeight = height;

        drawWidth =
            height * imageRatio;

        offsetX =
            x + (width - drawWidth) / 2;

        offsetY = y;

    } else {

        drawWidth = width;

        drawHeight =
            width / imageRatio;

        offsetX = x;

        offsetY =
            y + (height - drawHeight) / 2;
    }

    ctx.drawImage(
        image,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
    );
}

// =====================================================
// ARKA PLAN
// =====================================================

async function drawBackground(
    ctx,
    file,
    type
) {

    if (!file) {

        console.error(
            `[Makima] ${type} görseli bulunamadı!`
        );

        drawFallback(
            ctx,
            type
        );

        return;
    }

    try {

        const background =
            await loadImage(file);

        drawCover(
            ctx,
            background,
            0,
            0,
            1200,
            500
        );

        // Koyu overlay
        const gradient =
            ctx.createLinearGradient(
                0,
                0,
                1200,
                0
            );

        gradient.addColorStop(
            0,
            "rgba(0,0,0,0.88)"
        );

        gradient.addColorStop(
            0.55,
            "rgba(0,0,0,0.55)"
        );

        gradient.addColorStop(
            1,
            "rgba(0,0,0,0.18)"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
            0,
            0,
            1200,
            500
        );

    } catch (error) {

        console.error(
            `[Makima] Görsel yüklenemedi: ${file}`
        );

        console.error(error);

        drawFallback(
            ctx,
            type
        );
    }
}

// =====================================================
// FALLBACK
// =====================================================

function drawFallback(
    ctx,
    type
) {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            1200,
            500
        );

    gradient.addColorStop(
        0,
        "#080808"
    );

    gradient.addColorStop(
        0.5,
        "#240000"
    );

    gradient.addColorStop(
        1,
        "#050505"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        1200,
        500
    );

    ctx.fillStyle =
        "rgba(150,0,0,0.20)";

    ctx.fillRect(
        0,
        0,
        1200,
        500
    );

    ctx.font =
        "700 24px Arial";

    ctx.fillStyle =
        "rgba(255,255,255,0.15)";

    ctx.fillText(
        type === "welcome"
            ? "MAKIMA • WELCOME"
            : "MAKIMA • GOODBYE",
        850,
        460
    );
}

// =====================================================
// ANA GÖRSEL OLUŞTURMA
// =====================================================

async function createImage(
    member,
    type
) {

    const canvas =
        createCanvas(
            1200,
            500
        );

    const ctx =
        canvas.getContext("2d");

    // -------------------------------------------------
    // DOĞRU GÖRSEL
    // -------------------------------------------------

    const background =
        type === "welcome"
            ? welcomeBackground
            : goodbyeBackground;

    await drawBackground(
        ctx,
        background,
        type
    );

    // -------------------------------------------------
    // SOL PANEL
    // -------------------------------------------------

    const panelGradient =
        ctx.createLinearGradient(
            0,
            0,
            650,
            0
        );

    panelGradient.addColorStop(
        0,
        "rgba(0,0,0,0.94)"
    );

    panelGradient.addColorStop(
        0.75,
        "rgba(0,0,0,0.70)"
    );

    panelGradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.fillStyle =
        panelGradient;

    ctx.fillRect(
        0,
        0,
        700,
        500
    );

    // -------------------------------------------------
    // KIRMIZI ÇİZGİ
    // -------------------------------------------------

    ctx.fillStyle =
        "#9e0000";

    ctx.fillRect(
        0,
        0,
        7,
        500
    );

    // -------------------------------------------------
    // AVATAR
    // -------------------------------------------------

    try {

        const avatarURL =
            member.user.displayAvatarURL({
                extension: "png",
                size: 256
            });

        const avatar =
            await loadImage(
                avatarURL
            );

        // Avatar dış halkası
        ctx.beginPath();

        ctx.arc(
            115,
            125,
            72,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#9e0000";

        ctx.fill();

        await drawCircleImage(
            ctx,
            avatar,
            115,
            125,
            64
        );

    } catch (error) {

        console.error(
            "❌ Avatar yüklenemedi:",
            error
        );
    }

    // -------------------------------------------------
    // BAŞLIK
    // -------------------------------------------------

    const title =
        type === "welcome"
            ? "HOŞ GELDİN"
            : "GÖRÜŞÜRÜZ";

    ctx.font =
        "900 46px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        title,
        210,
        105
    );

    // -------------------------------------------------
    // KIRMIZI ALT ÇİZGİ
    // -------------------------------------------------

    ctx.fillStyle =
        "#9e0000";

    ctx.fillRect(
        210,
        120,
        155,
        4
    );

    // -------------------------------------------------
    // KULLANICI ADI
    // -------------------------------------------------

    const username =
        member.user.username;

    const usernameSize =
        fitText(
            ctx,
            username,
            430,
            34,
            20
        );

    ctx.font =
        `700 ${usernameSize}px Arial`;

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        username,
        210,
        165
    );

    // -------------------------------------------------
    // SUNUCU
    // -------------------------------------------------

    ctx.font =
        "600 20px Arial";

    ctx.fillStyle =
        "#bbbbbb";

    ctx.fillText(
        member.guild.name,
        210,
        198
    );

    // -------------------------------------------------
    // BİLGİ PANELİ
    // -------------------------------------------------

    roundRect(
        ctx,
        50,
        270,
        560,
        150,
        20
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.62)";

    ctx.fill();

    // -------------------------------------------------
    // ÜYE SAYISI
    // -------------------------------------------------

    ctx.font =
        "700 18px Arial";

    ctx.fillStyle =
        "#999999";

    ctx.fillText(
        "SUNUCUDAKİ ÜYE",
        80,
        310
    );

    ctx.font =
        "800 28px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        `${member.guild.memberCount}`,
        80,
        345
    );

    // -------------------------------------------------
    // HESAP YAŞI
    // -------------------------------------------------

    ctx.font =
        "700 18px Arial";

    ctx.fillStyle =
        "#999999";

    ctx.fillText(
        "HESAP YAŞI",
        280,
        310
    );

    ctx.font =
        "700 19px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        getAccountAge(member.user),
        280,
        345
    );

    // -------------------------------------------------
    // ÜYE ID
    // -------------------------------------------------

    ctx.font =
        "700 18px Arial";

    ctx.fillStyle =
        "#999999";

    ctx.fillText(
        "KULLANICI ID",
        80,
        385
    );

    ctx.font =
        "600 17px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        member.id,
        80,
        407
    );

    // -------------------------------------------------
    // MAKIMA YAZISI
    // -------------------------------------------------

    ctx.save();

    ctx.translate(
        1130,
        430
    );

    ctx.rotate(
        -Math.PI / 2
    );

    ctx.font =
        "900 18px Arial";

    ctx.fillStyle =
        "rgba(255,255,255,0.35)";

    ctx.fillText(
        "MION • MAKIMA SYSTEM",
        0,
        0
    );

    ctx.restore();

    // -------------------------------------------------
    // ALT KIRMIZI DETAY
    // -------------------------------------------------

    ctx.fillStyle =
        "#9e0000";

    ctx.fillRect(
        50,
        450,
        300,
        3
    );

    // -------------------------------------------------
    // PNG
    // -------------------------------------------------

    return canvas.toBuffer(
        "image/png"
    );
}

// =====================================================
// EVENT SİSTEMİ
// =====================================================

module.exports = {

    register(client) {

        // =================================================
        // ÜYE KATILDI
        // =================================================

        client.on(
            "guildMemberAdd",
            async member => {

                try {

                    const data =
                        getData();

                    const guildData =
                        data[member.guild.id];

                    if (
                        !guildData ||
                        !guildData.enabled ||
                        !guildData.channel
                    ) {
                        return;
                    }

                    const channel =
                        member.guild.channels.cache.get(
                            guildData.channel
                        );

                    if (!channel) {
                        return;
                    }

                    const buffer =
                        await createImage(
                            member,
                            "welcome"
                        );

                    const attachment =
                        new AttachmentBuilder(
                            buffer,
                            {
                                name:
                                    "makima-welcome.png"
                            }
                        );

                    const embed =
                        new EmbedBuilder()
                            .setColor("#9e0000")
                            .setImage(
                                "attachment://makima-welcome.png"
                            )
                            .setFooter({
                                text:
                                    `${member.guild.name} • Mion`
                            })
                            .setTimestamp();

                    await channel.send({
                        content:
                            `👋 Hoş geldin ${member}!`,
                        embeds: [embed],
                        files: [attachment]
                    });

                    console.log(
                        `✓ ${member.user.tag} sunucuya katıldı.`
                    );

                } catch (error) {

                    console.error(
                        "❌ Hoş geldin sistemi hatası:",
                        error
                    );
                }
            }
        );

        // =================================================
        // ÜYE AYRILDI
        // =================================================

        client.on(
            "guildMemberRemove",
            async member => {

                try {

                    const data =
                        getData();

                    const guildData =
                        data[member.guild.id];

                    if (
                        !guildData ||
                        !guildData.enabled ||
                        !guildData.channel
                    ) {
                        return;
                    }

                    const channel =
                        member.guild.channels.cache.get(
                            guildData.channel
                        );

                    if (!channel) {
                        return;
                    }

                    const buffer =
                        await createImage(
                            member,
                            "goodbye"
                        );

                    const attachment =
                        new AttachmentBuilder(
                            buffer,
                            {
                                name:
                                    "makima-goodbye.png"
                            }
                        );

                    const embed =
                        new EmbedBuilder()
                            .setColor("#9e0000")
                            .setImage(
                                "attachment://makima-goodbye.png"
                            )
                            .setFooter({
                                text:
                                    `${member.guild.name} • Mion`
                            })
                            .setTimestamp();

                    await channel.send({
                        content:
                            `👋 ${member.user.username} sunucudan ayrıldı.`,
                        embeds: [embed],
                        files: [attachment]
                    });

                    console.log(
                        `✓ ${member.user.tag} sunucudan ayrıldı.`
                    );

                } catch (error) {

                    console.error(
                        "❌ Görüşürüz sistemi hatası:",
                        error
                    );
                }
            }
        );

        console.log(
            "✓ Makima hoş geldin/görüşürüz sistemi aktif."
        );
    }
};