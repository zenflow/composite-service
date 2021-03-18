const { promisify } = require("util");
const { createServer } = require("http");
const { once } = require("events");

const delay = promisify(setTimeout);

const getEnvAsInt = key => {
  const string = process.env[key];
  return string ? Number.parseInt(string, 10) : null;
};

delay(getEnvAsInt("START_DELAY"))
  .then(() => {
    const server = createServer((req, res) => {
      if (req.url.endsWith("?crash")) {
        console.log("Crashing");
        res.write("crashing");
        res.end();
        process.exit(1);
      } else {
        res.write(process.env.RESPONSE_TEXT || "");
        res.end();
      }
    });
    server.listen(process.env.PORT);
    return once(server, "listening");
  })
  .then(() => console.log("Started 🚀"));

process.on("SIGINT", () => {
  delay(getEnvAsInt("STOP_DELAY")).then(() => process.exit(1));
});
