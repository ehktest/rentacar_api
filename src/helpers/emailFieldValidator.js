"use strict";

const CustomError = require("../errors/customError");

module.exports = (email) => {
  if (
    email.match(/@/g)?.length != 1 || // match ile null donebilecegi icin optional chaining
    !/^[_.a-z0-9]{4,}@[a-z0-9.]{4,}$/.test(email)
  )
    throw new CustomError("Invalid email pattern", 400);

  let [username, domainSubdomainTLD] = email.split("@");
  let errors = [];

  // Username kontrolleri
  if (/^[_.]/.test(username))
    errors.push("Username can't start with an underscore or a dot.");
  if (/[_.]$/.test(username))
    errors.push("Username can't end with an underscore or a dot.");
  if (/[_.]{2,}/.test(username))
    errors.push("Username can't contain consecutive underscores or dots.");
  if (!username.match(/[a-z]/g))
    errors.push("Username must contain at least 1 lowercase letter.");
  if (!/[a-z0-9_.]{4,}/.test(username))
    errors.push(
      "Username must contain at least 4 characters. Only lowercase letters, digits, dots and underscores are allowed."
    );

  // Domain ve TLD kontrolleri
  if (domainSubdomainTLD.match(/\./g)?.length > 2)
    errors.push("Subdomain-Domain-TLD is not valid.");
  if (!/^[a-z0-9]+\./.test(domainSubdomainTLD))
    errors.push("Domain/Subdomain is not valid.");
  if (
    domainSubdomainTLD.match(/\./g)?.length === 2 &&
    !/\.[a-z0-9]+\./.test(domainSubdomainTLD)
  )
    errors.push("Domain is not valid.");
  if (
    domainSubdomainTLD.match(/\./g)?.length < 1 ||
    domainSubdomainTLD.endsWith(".") ||
    !/\.[a-z]{1,3}$/.test(domainSubdomainTLD)
  )
    errors.push("TLD is not valid.");

  if (errors.length) {
    throw new CustomError(errors.join(" "), 400);
  }
  return true;
};
