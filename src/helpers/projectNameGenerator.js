"use strict";

const pascalCaseToUppercase = (name) => {
  const formattedString = name
    .replaceAll("API", "")
    .replace(/([A-Z])/g, (match, p1, offset) => {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
      // replace(pattern, replacement)
      // replace 'te pattern argumanina girilen regex'teki capturing group'lar replacement argumani olarak girilen callback'te match ile offset argumanlari arasinda yakalanir.
      // Eğer buyuk harf stringin basindaysa, ondan once bosluk eklemesin
      return offset === 0 ? p1 : " " + p1;
    });

  return formattedString.toUpperCase() + " API";
};

module.exports = {
  pascalCaseToUppercase,
  projectName: pascalCaseToUppercase(process.env.DATABASE_NAME),
};
