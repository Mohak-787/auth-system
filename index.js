import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import "dotenv/config";

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server is running at PORT: ", PORT);
    });
  })
  .catch((error) => {
    console.error("Failed to connect DB: ", error);
  });