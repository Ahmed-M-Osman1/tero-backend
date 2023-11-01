import language from "./language";

/**
 * Returns false if the desiredLang is present in Google Translate and lang key otherwise
 * @param desiredLang – the ISO 639-1 code or the name of the desired language
 * @returns {boolean}
 */

export function getCode(desiredLang: string) {
  if (!desiredLang) {
    return false;
  }
  desiredLang = desiredLang.toLowerCase();

  if (language[desiredLang as keyof typeof language]) {
    return desiredLang;
  }

  let keys = Object.keys(language).filter(function (key) {
    if ("string" !== typeof language[key as keyof typeof language]) {
      return false;
    }
    return language[key as keyof typeof language].toLowerCase() === desiredLang;
  });

  return keys[0] || false;
}

/**
 * Returns true if the desiredLang is supported by Google Translate and false otherwise
 * @param desiredLang – the ISO 639-1 code or the name of the desired language
 * @returns {boolean}
 */
export function isSupported(desiredLang: string) {
  return Boolean(getCode(desiredLang));
}

/**
 * Returns utf8 length
 * @param str – string
 * @returns {number}
 */
export function utf8Length(str: string) {
  str = str.trim();
  const utf8 = [];
  for (var i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f),
      );
    }
  }
  return utf8.length;
}
