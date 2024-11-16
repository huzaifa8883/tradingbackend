import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
const app = express()

app.use(cors({
    origin: 'https://7stardigitizing.com', // Allow requests from React app running on port 5173
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