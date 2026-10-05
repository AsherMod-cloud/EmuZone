/**
 * ============================================================
 * EmuZone Markdown Parser
 * ------------------------------------------------------------
 * Version : 1.0.0
 * Author  : AsherMod
 *
 * Lightweight Markdown parser khusus untuk Description.
 * Tidak menggunakan library eksternal.
 *
 * Supported:
 *  # Heading
 *  ## Heading
 *  ### Heading
 *  **Bold**
 *  *Italic*
 *  ~~Strike~~
 *  `Inline Code`
 *  > Quote
 *  - List
 *  1. Number List
 *  ---
 *  [Text](https://...)
 *  https://...
 * ============================================================
 */

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function inlineMarkdown(text) {

    text = escapeHtml(text);

    // simpan inline code dulu
    const codes = [];
    text = text.replace(/`([^`]+?)`/g, (_, code) => {
        codes.push(`<code>${code}</code>`);
        return `@@CODE${codes.length - 1}@@`;
    });

    // markdown link
    text = text.replace(
        /\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );

    // auto url
    text = text.replace(
        /(^|[\s>])(https?:\/\/[^\s<]+)/g,
        '$1<a href="$2" target="_blank" rel="noopener">$2</a>'
    );

    // bold
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // italic
    text = text.replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, "$1<em>$2</em>");

    // strike
    text = text.replace(/~~(.+?)~~/g, "<del>$1</del>");

    // restore code
    text = text.replace(/@@CODE(\d+)@@/g, (_, i) => codes[i]);

    return text;
}

function renderMarkdown(raw) {

    if (!raw) return "";

    const lines = raw.replace(/\r\n/g, "\n").split("\n");

    let html = "";
    let paragraph = [];

    function flushParagraph() {

        if (!paragraph.length) return;

        html += `<p>${inlineMarkdown(paragraph.join(" "))}</p>`;

        paragraph = [];

    }

    let i = 0;

    while (i < lines.length) {

        const line = lines[i];
        const trimmed = line.trim();

        // kosong
        if (!trimmed) {

            flushParagraph();

            i++;
            continue;

        }

        // horizontal rule
        if (/^---+$/.test(trimmed)) {

            flushParagraph();

            html += "<hr>";

            i++;
            continue;

        }

        // heading
        const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);

        if (heading) {

            flushParagraph();

            const level = heading[1].length;

            const tag =
                level === 1 ? "h3" :
                level === 2 ? "h4" :
                "h5";

            html += `<${tag}>${inlineMarkdown(heading[2])}</${tag}>`;

            i++;
            continue;

        }

        // quote
        if (trimmed.startsWith(">")) {

            flushParagraph();

            const quote = [];

            while (
                i < lines.length &&
                lines[i].trim().startsWith(">")
            ) {

                quote.push(
                    lines[i]
                        .trim()
                        .replace(/^>\s?/, "")
                );

                i++;

            }

            html += `<blockquote>${inlineMarkdown(quote.join("<br>"))}</blockquote>`;

            continue;

        }

        // unordered list
        if (/^[-*]\s+/.test(trimmed)) {

            flushParagraph();

            html += "<ul>";

            while (
                i < lines.length &&
                /^[-*]\s+/.test(lines[i].trim())
            ) {

                html += `<li>${inlineMarkdown(
                    lines[i]
                        .trim()
                        .replace(/^[-*]\s+/, "")
                )}</li>`;

                i++;

            }

            html += "</ul>";

            continue;

        }

        // ordered list
        if (/^\d+\.\s+/.test(trimmed)) {

            flushParagraph();

            html += "<ol>";

            while (
                i < lines.length &&
                /^\d+\.\s+/.test(lines[i].trim())
            ) {

                html += `<li>${inlineMarkdown(
                    lines[i]
                        .trim()
                        .replace(/^\d+\.\s+/, "")
                )}</li>`;

                i++;

            }

            html += "</ol>";

            continue;

        }

        // paragraf
        paragraph.push(line);

        i++;

    }

    flushParagraph();

    return html;

}