import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use( cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }));  // jo bhi data form se request me aata hai
app.use(express.urlencoded({ extended: true , limit: "16kb" })); // jo bhi data URL se aata hai

app.use(express.static("public")) // store the file in static folder such as "public"

app.use(cookieParser()) // using cookie-parser 


// router import
import registerRouter from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users",registerRouter)


export { app }