const querystring = require('querystring');
import { utf8Length } from "./helper/inputCheck";
import { getToken } from "./helper/getToken";
import ky from "ky";
type option = {
  to: string;
  client?: string;
  from: string;
  services?: { google_free: boolean };
  priority?: string[];
};

const translate = async (text: string, opts: option) => {
  opts = JSON.parse(JSON.stringify(opts));
  let result = {
    text: "",
    raw: "",
    from: {
      language: {
        didYouMean: false,
        iso: "",
      },
      text: {
        autoCorrected: false,
        value: "",
        didYouMean: false,
      },
    },
    proxy: "",
    agent: "",
    service: { google_free: true },
  };

  let errors = [
    "The language «[lang]» is not supported",
    "Text must not exceed 5000 bytes",
    "The server returned an empty response",
    "Could not get token from google",
    "Text translation request failed",
  ];

  let bytes = utf8Length(text);
  opts.client = opts.client || "t";
  opts.services = opts.services || { google_free: true };
  opts.priority = Object.keys(opts.services);

  let priority = opts.priority[0];

  if (bytes > 5000) {
    let chars = Math.ceil(text.length / Math.ceil(bytes / 4700)) + 100;
    let plain = " " + text + " ";
    let texts: string[] = [];
    let j = 0;
    [".", ",", " "].forEach(separator => {
      if (!plain) return;
      let split = plain.split(separator);
      for (let i = 0, l = split.length; i < l; i++) {
        if (!texts[j]) texts[j] = [];
        if ((texts[j].join(separator) + split[i]).length < chars) {
          texts[j].push(split[i]);
          plain = split.slice(i + 1).join(separator);
        } else {
          if (!texts[j].length) break;
          texts[j].push("");
          texts[++j] = [];
          if ((texts[j].join(separator) + split[i]).length < chars) {
            texts[j].push(split[i]);
            plain = split.slice(i + 1).join(separator);
          } else {
            break;
          }
        }
      }
      texts = texts
        .map(function (t) {
          if (!t) return;
          if (typeof t === "object") {
            return t.join(separator).trim();
          } else if (typeof t === "string") {
            return t.trim();
          }
        })
        .filter(Boolean);
    });
    if (!texts || !texts.length) return Promise.reject({ [priority]: errors[1] });
    return texts.reduce((p, item) => {
      return p.then(prev => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            translate(item, opts)
              .then(t => {
                if (!t || !t.text) return reject(errors[2]);
                t.text = prev && prev.text ? prev.text + " " + t.text : t.text;
                return resolve(t);
              })
              .catch(e => reject(e));
          }, 1000);
        });
      });
    }, Promise.resolve());
  }

  let translate = {};
  const translate_string = () => {
    return new Promise(async (resolve, reject) => {
      let t = getToken(text, opts);

      if (!t) return reject({ google_free: errors[3] });

      let url =
        "https://translate.google.com/translate_a/single?" +
          querystring.stringify({
          [t.name]: t.value,
          client: opts.client,
          sl: opts.from,
          tl: opts.to,
          hl: opts.to,
          dt: ["at", "bd", "ex", "ld", "md", "qca", "rw", "rm", "ss", "t"],
          ie: "UTF-8",
          oe: "UTF-8",
          otf: 1,
          ssel: 0,
          tsel: 0,
          kc: 7,
          q: text,
        });

      try {
        await ky(url)
          .json()
          .then(function (response) {
            // handle success
            return (translate.body = response);
          })
          .catch(function (error) {
            // handle error
            console.log(error);
          })
          .finally(function () {
            // always executed
          });
      } catch (e) {
        return reject({ google_free: errors[4] });
      }
      console.log(translate);
      result.raw = opts.raw ? JSON.stringify(translate.body) : "";
      let body = translate.body;
      body[0].forEach(obj => {
        if (obj[0]) {
          result.text += obj[0];
        }
      });

      if (body[2] === body[8][0][0]) {
        result.from.language.iso = body[2];
      } else {
        result.from.language.didYouMean = true;
        result.from.language.iso = body[8][0][0];
      }

      if (body[7] && body[7][0]) {
        let str = body[7][0];

        str = str.replace(/<b><i>/g, "[");
        str = str.replace(/<\/i><\/b>/g, "]");

        result.from.text.value = str;

        if (body[7][5] === true) {
          result.from.text.autoCorrected = true;
        } else {
          result.from.text.didYouMean = true;
        }
      }

      return result.text ? resolve(result) : reject({ google_free: errors[2] });
    });
  };
  return translate_string();
};

export default translate;
