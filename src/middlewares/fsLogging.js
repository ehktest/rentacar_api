// yarn add date-fns
const { format } = require("date-fns");

const {
  logFolderCreate,
  fs,
  fsPromises,
  path,
} = require("../helpers/logFolderCreate");

const logEvents = async (
  message,
  logName,
  { continuous = undefined, prefix = true }
) => {
  const dateTime = `${format(new Date(), "yyyy.MM.dd  HH:mm:ss")}`;
  const logItem = `${prefix ? dateTime + " -- " : ""}${message}${
    !continuous ? "\n" : ""
  }`;

  try {
    logFolderCreate();

    // fsPromises.appendFile(path, data[, options])
    await fsPromises.appendFile(
      path.join(__dirname, "..", "..", "logs", logName),
      logItem
    );
    // await fs.createWriteStream(path.join(__dirname, "..", "..", "logs", logName), {
    //   flags: "a+",
    // }).write(logItem);
  } catch (err) {
    console.log(err);
  }
};

// logger'lar response tamamlandiktan hemen sonra calismalidir ki authentication verilerine de erisebilsin
const logger = (req, res, next) => {
  // genellikle bir web uygulamasına yapılan HTTP isteklerinde, tarayıcılar çapraz kaynak istekleri (CORS istekleri) sırasında otomatik olarak "Origin" başlığını ekler. same-origin icin eklenmeyeceginden localhost belirlenebilir.
  const origin = req.headers.origin ?? "localhost";
  const now = new Date();
  const today = format(new Date(), "yyyy-MM-dd");
  logEvents(
    `METHOD -> ${req.method}\t| ORIGIN -> ${origin}\t| URL -> ${req.url}\t| `,
    `REQUESTS_${today}.txt`,
    {
      continuous: true,
    }
  );
  console.log(`${req.method} ${req.path}`);
  res.on("finish", () => {
    logEvents(
      `USER_EMAIL -> ${req.userEmail}\t| USER_TOKEN -> ${req.headers.authorization}`,
      `REQUESTS_${today}.txt`,
      {
        prefix: false,
      }
    );
  });
  next();
};

module.exports = { logger, logEvents, fs, fsPromises, path };
