//adapted from https://github.com/andrew/base62.js/blob/master/base62.js
var base62 = {};
base62.chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
base62.encode = function(i) {
    if (i === 0) {return '0';}
    var s = '';
    while (i > 0) {
        s = this.chars[i % 62] + s;
        i = Math.floor(i/62)
    }
    return s;
};

base62.pad = function(encoded, padTo) {
    while(encoded.length < padTo) {
        encoded = '0' + encoded;
    }
    return encoded;
};

base62.decode2 = function(s) {
    var i = 0;
    var j = 0;
    while (j < s.length) {
        i += base62.chars.indexOf(s[s.length - j - 1]) * Math.pow(62, j);
        j++;
    }
    return i;
};

base62.decode = function(a, b, c, d) {
    for (
            b = c = (
                a === (/\W|_|^$/.test(a += "") || a)
                ) - 1;
            d = a.charCodeAt(c++);
        )
    b = b * 62 + d - [, 48, 29, 87][d >> 5];
    return b;
};
