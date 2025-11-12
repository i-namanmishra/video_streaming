import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config();

connectDB().then(()=>{
    app.listen(process.env.PORT || 5000, () => {
        console.log(`🚀 Server is running on port ${process.env.PORT || 5000}`);
    });
    }).catch((error)=>{
        console.error("Failed to start server:", error);
    });

