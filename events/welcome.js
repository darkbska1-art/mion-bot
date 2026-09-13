const {
    AttachmentBuilder,
    EmbedBuilder,
    PermissionsBitField
} = require("discord.js");

const {
    createCanvas,
    loadImage
} = require("@napi-rs/canvas");

const fs = require("fs");
const path = require("path");

// ============================================================
// MION • MAKIMA WELCOME SYSTEM
// Ultra Advanced Edition
// ============================================================

// ------------------------------------------------------------
// KLASÖRLER
// ------------------------------------------------------------

const ROOT = path.join(__dirname, "..");

const DATA_FOLDER = path.join(
    ROOT,
    "data"
);

const IMAGE_FOLDER = path.join(
    ROOT,
    "images"
);

const DATA_FILE = path.join(
    DATA_FOLDER,
    "welcome.json"
);

// ------------------------------------------------------------
// KLASÖRLERİ OLUŞTUR
// ------------------------------------------------------------

for (const folder of [
    DATA_FOLDER,
    IMAGE_FOLDER
]) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(
            folder,
            {
                recursive: true
            }
        );
    }
}

// ============================================================
// MAKIMA GÖRSELLERİ
// ============================================================

const imageCandidates = [
    path.join(ROOT, "images"),
    path.join(process.cwd(), "images"),
    path.join(__dirname, "..", "images"),
    path.join(__dirname, "images")
];

function findImage(fileName) {

    for (const folder of imageCandidates) {

        const fullPath =
            path.join(
                folder,
                fileName
            );

        if (
            fs.existsSync(fullPath) &&
            fs.statSync(fullPath).isFile()
        ) {

            console.log(
                `✓ [Makima] Görsel bulundu: ${fullPath}`
            );

            return fullPath;
        }
    }

    console.error(
        `❌ [Makima] Görsel bulunamadı: ${fileName}`
    );

    console.error(
        "Aranan klasörler:"
    );

    for (const folder of imageCandidates) {

        console.error(
            `   → ${folder}`
        );
    }

    return null;
}

const welcomeBackground =
    findImage(
        "makima-welcome.png"
    );

const goodbyeBackground =
    findImage(
        "makima-goodbye.png"
    );

// ============================================================
// GÖRSEL CACHE
// ============================================================

const imageCache =
    new Map();

async function getCachedImage(file) {

    if (!file) {
        return null;
    }

    if (imageCache.has(file)) {
        return imageCache.get(file);
    }

    try {

        const image =
            await loadImage(file);

        imageCache.set(
            file,
            image
        );

        return image;

    } catch (error) {

        console.error(
            `❌ [Makima] Görsel cache yükleme hatası: ${file}`
        );

        console.error(error);

        return null;
    }
}

// ============================================================
// VERİTABANI
// ============================================================

function getData() {

    if (!fs.existsSync(DATA_FILE)) {
        return {};
    }

    try {

        const raw =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );

        if (!raw.trim()) {
            return {};
        }

        return JSON.parse(raw);

    } catch (error) {

        console.error(
            "❌ [Makima] welcome.json okunamadı."
        );

        console.error(error);

        return {};
    }
}

// ============================================================
// GÜVENLİ VERİ OKUMA
// ============================================================

function getGuildSettings(guildId) {

    const data =
        getData();

    const settings =
        data[guildId];

    if (!settings) {
        return null;
    }

    return {
        enabled:
            settings.enabled !== false,

        channel:
            settings.channel || null,

        welcome:
            settings.welcome !== false,

        goodbye:
            settings.goodbye !== false,

        mention:
            settings.mention !== false
    };
}

// ============================================================
// HESAP YAŞI
// ============================================================

function getAccountAge(user) {

    if (!user?.createdTimestamp) {
        return "Bilinmiyor";
    }

    const diff =
        Date.now() -
        user.createdTimestamp;

    const days =
        Math.floor(
            diff /
            (1000 * 60 * 60 * 24)
        );

    if (days <= 0) {
        return "Bugün oluşturuldu";
    }

    if (days === 1) {
        return "1 gün önce";
    }

    if (days < 30) {
        return `${days} gün önce`;
    }

    const months =
        Math.floor(
            days / 30
        );

    if (months < 12) {
        return `${months} ay önce`;
    }

    const years =
        Math.floor(
            months / 12
        );

    const remainingMonths =
        months % 12;

    if (remainingMonths === 0) {
        return `${years} yıl önce`;
    }

    return `${years} yıl ${remainingMonths} ay önce`;
}

// ============================================================
// TARİH
// ============================================================

function formatDate(timestamp) {

    try {

        return new Intl.DateTimeFormat(
            "tr-TR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        ).format(
            new Date(timestamp)
        );

    } catch {

        return "Bilinmiyor";
    }
}

// ============================================================
// METİN SIĞDIRMA
// ============================================================

function fitText(
    ctx,
    text,
    maxWidth,
    startSize,
    minSize
) {

    let size =
        startSize;

    while (
        size > minSize
    ) {

        ctx.font =
            `800 ${size}px Arial`;

        if (
            ctx.measureText(text).width <=
            maxWidth
        ) {
            break;
        }

        size--;
    }

    return size;
}

// ============================================================
// YUVARLAK KÖŞE
// ============================================================

function roundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
) {

    const r =
        Math.min(
            radius,
            width / 2,
            height / 2
        );

    ctx.beginPath();

    ctx.moveTo(
        x + r,
        y
    );

    ctx.arcTo(
        x + width,
        y,
        x + width,
        y + height,
        r
    );

    ctx.arcTo(
        x + width,
        y + height,
        x,
        y + height,
        r
    );

    ctx.arcTo(
        x,
        y + height,
        x,
        y,
        r
    );

    ctx.arcTo(
        x,
        y,
        x + width,
        y,
        r
    );

    ctx.closePath();
}

// ============================================================
// CIRCLE IMAGE
// ============================================================

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

// ============================================================
// COVER IMAGE
// ============================================================

function drawCover(
    ctx,
    image,
    x,
    y,
    width,
    height
) {

    const imageRatio =
        image.width /
        image.height;

    const boxRatio =
        width /
        height;

    let drawWidth;
    let drawHeight;
    let offsetX;
    let offsetY;

    if (
        imageRatio > boxRatio
    ) {

        drawHeight =
            height;

        drawWidth =
            height *
            imageRatio;

        offsetX =
            x +
            (width - drawWidth) / 2;

        offsetY =
            y;

    } else {

        drawWidth =
            width;

        drawHeight =
            width /
            imageRatio;

        offsetX =
            x;

        offsetY =
            y +
            (height - drawHeight) / 2;
    }

    ctx.drawImage(
        image,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
    );
}

// ============================================================
// ARKA PLAN
// ============================================================

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
        "#030303"
    );

    gradient.addColorStop(
        0.45,
        "#190000"
    );

    gradient.addColorStop(
        1,
        "#000000"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        1200,
        500
    );

    // Kırmızı ışık
    const glow =
        ctx.createRadialGradient(
            950,
            250,
            10,
            950,
            250,
            450
        );

    glow.addColorStop(
        0,
        "rgba(180,0,0,0.30)"
    );

    glow.addColorStop(
        1,
        "rgba(180,0,0,0)"
    );

    ctx.fillStyle =
        glow;

    ctx.fillRect(
        0,
        0,
        1200,
        500
    );

    ctx.font =
        "900 30px Arial";

    ctx.fillStyle =
        "rgba(255,255,255,0.18)";

    ctx.fillText(
        type === "welcome"
            ? "MAKIMA • WELCOME"
            : "MAKIMA • GOODBYE",
        850,
        455
    );
}

async function drawBackground(
    ctx,
    file,
    type
) {

    const image =
        await getCachedImage(
            file
        );

    if (!image) {

        drawFallback(
            ctx,
            type
        );

        return;
    }

    drawCover(
        ctx,
        image,
        0,
        0,
        1200,
        500
    );

    // ========================================================
    // OVERLAY
    // ========================================================

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            1200,
            0
        );

    gradient.addColorStop(
        0,
        "rgba(0,0,0,0.94)"
    );

    gradient.addColorStop(
        0.40,
        "rgba(0,0,0,0.72)"
    );

    gradient.addColorStop(
        0.70,
        "rgba(0,0,0,0.38)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0.15)"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        1200,
        500
    );

    // ========================================================
    // KIRMIZI ATMOSFER
    // ========================================================

    const glow =
        ctx.createRadialGradient(
            930,
            240,
            10,
            930,
            240,
            420
        );

    glow.addColorStop(
        0,
        "rgba(180,0,0,0.22)"
    );

    glow.addColorStop(
        1,
        "rgba(180,0,0,0)"
    );

    ctx.fillStyle =
        glow;

    ctx.fillRect(
        0,
        0,
        1200,
        500
    );
}

// ============================================================
// ÜYE SIRASI
// ============================================================

function getMemberPosition(
    member
) {

    try {

        const members =
            [...member.guild.members.cache.values()]
                .sort(
                    (a, b) =>
                        a.joinedTimestamp -
                        b.joinedTimestamp
                );

        const index =
            members.findIndex(
                m =>
                    m.id ===
                    member.id
            );

        if (index === -1) {
            return "?";
        }

        return index + 1;

    } catch {

        return "?";
    }
}

// ============================================================
// PARLAMA
// ============================================================

function drawGlowLine(
    ctx,
    x,
    y,
    width
) {

    const gradient =
        ctx.createLinearGradient(
            x,
            y,
            x + width,
            y
        );

    gradient.addColorStop(
        0,
        "rgba(120,0,0,0)"
    );

    gradient.addColorStop(
        0.5,
        "rgba(220,0,0,0.95)"
    );

    gradient.addColorStop(
        1,
        "rgba(120,0,0,0)"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        x,
        y,
        width,
        3
    );
}

// ============================================================
// ANA GÖRSEL
// ============================================================

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

    // --------------------------------------------------------
    // ARKA PLAN
    // --------------------------------------------------------

    const background =
        type === "welcome"
            ? welcomeBackground
            : goodbyeBackground;

    await drawBackground(
        ctx,
        background,
        type
    );

    // --------------------------------------------------------
    // SOL PANEL
    // --------------------------------------------------------

    const panel =
        ctx.createLinearGradient(
            0,
            0,
            720,
            0
        );

    panel.addColorStop(
        0,
        "rgba(0,0,0,0.96)"
    );

    panel.addColorStop(
        0.65,
        "rgba(0,0,0,0.78)"
    );

    panel.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.fillStyle =
        panel;

    ctx.fillRect(
        0,
        0,
        750,
        500
    );

    // --------------------------------------------------------
    // SOL KIRMIZI ŞERİT
    // --------------------------------------------------------

    ctx.fillStyle =
        "#b00000";

    ctx.fillRect(
        0,
        0,
        7,
        500
    );

    // --------------------------------------------------------
    // AVATAR HALO
    // --------------------------------------------------------

    const halo =
        ctx.createRadialGradient(
            115,
            125,
            20,
            115,
            125,
            100
        );

    halo.addColorStop(
        0,
        "rgba(190,0,0,0.42)"
    );

    halo.addColorStop(
        1,
        "rgba(190,0,0,0)"
    );

    ctx.fillStyle =
        halo;

    ctx.fillRect(
        0,
        15,
        230,
        220
    );

    // --------------------------------------------------------
    // AVATAR
    // --------------------------------------------------------

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

        ctx.beginPath();

        ctx.arc(
            115,
            125,
            75,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#a80000";

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            115,
            125,
            69,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#050505";

        ctx.fill();

        await drawCircleImage(
            ctx,
            avatar,
            115,
            125,
            64
        );

        // Avatar çevresi
        ctx.beginPath();

        ctx.arc(
            115,
            125,
            72,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "rgba(255,0,0,0.8)";

        ctx.lineWidth =
            2;

        ctx.stroke();

    } catch (error) {

        console.error(
            "❌ [Makima] Avatar yüklenemedi:",
            error.message
        );
    }

    // --------------------------------------------------------
    // BAŞLIK
    // --------------------------------------------------------

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
        100
    );

    // --------------------------------------------------------
    // KIRMIZI ÇİZGİ
    // --------------------------------------------------------

    drawGlowLine(
        ctx,
        210,
        118,
        190
    );

    // --------------------------------------------------------
    // USERNAME
    // --------------------------------------------------------

    const username =
        member.user.username;

    const usernameSize =
        fitText(
            ctx,
            username,
            440,
            34,
            18
        );

    ctx.font =
        `800 ${usernameSize}px Arial`;

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        username,
        210,
        165
    );

    // --------------------------------------------------------
    // SERVER
    // --------------------------------------------------------

    const serverName =
        member.guild.name;

    const serverSize =
        fitText(
            ctx,
            serverName,
            450,
            21,
            14
        );

    ctx.font =
        `600 ${serverSize}px Arial`;

    ctx.fillStyle =
        "#bcbcbc";

    ctx.fillText(
        serverName,
        210,
        198
    );

    // --------------------------------------------------------
    // BİLGİ PANELİ
    // --------------------------------------------------------

    roundRect(
        ctx,
        50,
        265,
        590,
        165,
        22
    );

    const infoGradient =
        ctx.createLinearGradient(
            50,
            265,
            640,
            430
        );

    infoGradient.addColorStop(
        0,
        "rgba(10,10,10,0.92)"
    );

    infoGradient.addColorStop(
        1,
        "rgba(0,0,0,0.58)"
    );

    ctx.fillStyle =
        infoGradient;

    ctx.fill();

    ctx.strokeStyle =
        "rgba(170,0,0,0.45)";

    ctx.lineWidth =
        1;

    ctx.stroke();

    // --------------------------------------------------------
    // BİLGİ 1
    // --------------------------------------------------------

    ctx.font =
        "700 14px Arial";

    ctx.fillStyle =
        "#888888";

    ctx.fillText(
        "SUNUCUDAKİ ÜYE",
        80,
        300
    );

    ctx.font =
        "900 27px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        `${member.guild.memberCount}`,
        80,
        330
    );

    // --------------------------------------------------------
    // BİLGİ 2
    // --------------------------------------------------------

    ctx.font =
        "700 14px Arial";

    ctx.fillStyle =
        "#888888";

    ctx.fillText(
        "SUNUCUYA KATILMA SIRASI",
        250,
        300
    );

    ctx.font =
        "900 27px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        `#${getMemberPosition(member)}`,
        250,
        330
    );

    // --------------------------------------------------------
    // BİLGİ 3
    // --------------------------------------------------------

    ctx.font =
        "700 14px Arial";

    ctx.fillStyle =
        "#888888";

    ctx.fillText(
        "HESAP YAŞI",
        460,
        300
    );

    ctx.font =
        "700 17px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        getAccountAge(
            member.user
        ),
        460,
        330
    );

    // --------------------------------------------------------
    // ID
    // --------------------------------------------------------

    ctx.font =
        "700 14px Arial";

    ctx.fillStyle =
        "#888888";

    ctx.fillText(
        "KULLANICI ID",
        80,
        370
    );

    ctx.font =
        "600 16px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        member.id,
        80,
        395
    );

    // --------------------------------------------------------
    // HESAP OLUŞTURULMA
    // --------------------------------------------------------

    ctx.font =
        "700 14px Arial";

    ctx.fillStyle =
        "#888888";

    ctx.fillText(
        "HESAP OLUŞTURULDU",
        360,
        370
    );

    ctx.font =
        "600 16px Arial";

    ctx.fillStyle =
        "#ffffff";

    ctx.fillText(
        formatDate(
            member.user.createdTimestamp
        ),
        360,
        395
    );

    // --------------------------------------------------------
    // ALT ÇİZGİ
    // --------------------------------------------------------

    drawGlowLine(
        ctx,
        50,
        455,
        380
    );

    // --------------------------------------------------------
    // MARKA
    // --------------------------------------------------------

    ctx.save();

    ctx.translate(
        1140,
        440
    );

    ctx.rotate(
        -Math.PI / 2
    );

    ctx.font =
        "900 17px Arial";

    ctx.fillStyle =
        "rgba(255,255,255,0.35)";

    ctx.fillText(
        "MION • MAKIMA SYSTEM",
        0,
        0
    );

    ctx.restore();

    // --------------------------------------------------------
    // DURUM YAZISI
    // --------------------------------------------------------

    ctx.font =
        "700 13px Arial";

    ctx.fillStyle =
        "rgba(255,255,255,0.35)";

    ctx.fillText(
        type === "welcome"
            ? "WELCOME PROTOCOL"
            : "GOODBYE PROTOCOL",
        830,
        470
    );

    // --------------------------------------------------------
    // PNG
    // --------------------------------------------------------

    return canvas.toBuffer(
        "image/png"
    );
}

// ============================================================
// MESAJ GÖNDERME
// ============================================================

async function sendWelcomeMessage(
    member,
    type,
    settings
) {

    const channel =
        member.guild.channels.cache.get(
            settings.channel
        );

    if (!channel) {

        console.error(
            `❌ [Makima] Kanal bulunamadı: ${settings.channel}`
        );

        return;
    }

    // --------------------------------------------------------
    // BOT KANALA YAZABİLİYOR MU?
    // --------------------------------------------------------

    const botMember =
        member.guild.members.me;

    if (!botMember) {

        console.error(
            "❌ [Makima] Bot üyesi bulunamadı."
        );

        return;
    }

    const permissions =
        channel.permissionsFor(
            botMember
        );

    if (
        !permissions ||
        !permissions.has(
            PermissionsBitField.Flags.SendMessages
        )
    ) {

        console.error(
            `❌ [Makima] Botun ${channel.name} kanalına mesaj gönderme yetkisi yok.`
        );

        return;
    }

    if (
        !permissions.has(
            PermissionsBitField.Flags.AttachFiles
        )
    ) {

        console.error(
            `❌ [Makima] Botun ${channel.name} kanalına dosya gönderme yetkisi yok.`
        );

        return;
    }

    // --------------------------------------------------------
    // GÖRSEL
    // --------------------------------------------------------

    const buffer =
        await createImage(
            member,
            type
        );

    const fileName =
        type === "welcome"
            ? "makima-welcome.png"
            : "makima-goodbye.png";

    const attachment =
        new AttachmentBuilder(
            buffer,
            {
                name: fileName
            }
        );

    // --------------------------------------------------------
    // EMBED
    // --------------------------------------------------------

    const embed =
        new EmbedBuilder()
            .setColor("#9e0000")
            .setImage(
                `attachment://${fileName}`
            )
            .setFooter({
                text:
                    `${member.guild.name} • Mion Makima System`
            })
            .setTimestamp();

    // --------------------------------------------------------
    // MESAJ
    // --------------------------------------------------------

    let content;

    if (
        type === "welcome"
    ) {

        content =
            settings.mention !== false
                ? `👋 Hoş geldin ${member}!`
                : `👋 Hoş geldin **${member.user.username}**!`;

    } else {

        content =
            `👋 **${member.user.username}** sunucudan ayrıldı.`;
    }

    await channel.send({
        content,
        embeds: [embed],
        files: [attachment],
        allowedMentions:
            type === "welcome" &&
            settings.mention !== false
                ? {
                    users: [
                        member.id
                    ]
                }
                : {
                    parse: []
                }
    });

    console.log(
        `✓ [Makima] ${type} mesajı gönderildi → ${member.user.tag} / ${member.guild.name}`
    );
}

// ============================================================
// HATA KORUMASI
// ============================================================

function handleError(
    type,
    error
) {

    console.error(
        `❌ [Makima] ${type} sistemi hata verdi.`
    );

    console.error(error);
}

// ============================================================
// EVENT KAYDI
// ============================================================

module.exports = {

    register(client) {

        if (
            client.__MION_MAKIMA_SYSTEM__
        ) {

            console.warn(
                "⚠️ [Makima] Sistem zaten kayıtlı. İkinci kez yüklenmedi."
            );

            return;
        }

        client.__MION_MAKIMA_SYSTEM__ =
            true;

        // ====================================================
        // GUILD MEMBER ADD
        // ====================================================

        client.on(
            "guildMemberAdd",
            async member => {

                try {

                    if (
                        !member.guild
                    ) {
                        return;
                    }

                    const settings =
                        getGuildSettings(
                            member.guild.id
                        );

                    if (
                        !settings ||
                        !settings.enabled ||
                        !settings.welcome ||
                        !settings.channel
                    ) {
                        return;
                    }

                    await sendWelcomeMessage(
                        member,
                        "welcome",
                        settings
                    );

                } catch (error) {

                    handleError(
                        "Hoş geldin",
                        error
                    );
                }
            }
        );

        // ====================================================
        // GUILD MEMBER REMOVE
        // ====================================================

        client.on(
            "guildMemberRemove",
            async member => {

                try {

                    if (
                        !member.guild
                    ) {
                        return;
                    }

                    const settings =
                        getGuildSettings(
                            member.guild.id
                        );

                    if (
                        !settings ||
                        !settings.enabled ||
                        !settings.goodbye ||
                        !settings.channel
                    ) {
                        return;
                    }

                    await sendWelcomeMessage(
                        member,
                        "goodbye",
                        settings
                    );

                } catch (error) {

                    handleError(
                        "Görüşürüz",
                        error
                    );
                }
            }
        );

        console.log(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );

        console.log(
            "✓ MION • MAKIMA WELCOME SYSTEM AKTİF"
        );

        console.log(
            `✓ Welcome Image: ${
                welcomeBackground
                    ? "HAZIR"
                    : "YOK"
            }`
        );

        console.log(
            `✓ Goodbye Image: ${
                goodbyeBackground
                    ? "HAZIR"
                    : "YOK"
            }`
        );

        console.log(
            "✓ Hoş geldin eventi hazır."
        );

        console.log(
            "✓ Görüşürüz eventi hazır."
        );

        console.log(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );
    }
};