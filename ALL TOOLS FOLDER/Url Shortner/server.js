const createApp = require("./app");
require("dotenv").config();

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LinkShrink running at http://localhost:${PORT}`);
  console.log(
    `Shortener API: ${process.env.SHORTENER_API_URL || "is.gd (default)"}`
  );
});
