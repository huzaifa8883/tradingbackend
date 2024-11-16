import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
const app = express()

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
    origin: allowedOrigin,
    credentials: true
}));

app.use(express.json({limit:"16kb"}))

app.use(express.urlencoded({
    extended:true,
    limit:"16kb"

}))
app.use(express.static("public"))
app.use(cookieParser())


import userroutes from './routes/user.routes.js'
app.use("/api/auth",userroutes)
export {app}