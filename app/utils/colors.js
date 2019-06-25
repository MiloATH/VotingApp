module.exports = {
    colors: [
        "#f6e550",
        "#ff6c00",
        "#00c64a",
        "#00b67f",
        "#00ffff",
        "#0098a0",
        "#00cdff",
        "#0084bd",
        "#e800ff",
        "#ff79dd",
        "#e10074",
        "#ff0049"
    ],
    //From https://www.sitepoint.com/javascript-generate-lighter-darker-color/
    colorLuminance: function(hex, lum) {

        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#",
            c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
        }

        return rgb;
    },
    HIGHLIGHT_LUMINANCE: .2
};
