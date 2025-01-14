import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
// import withdraw from "../models/withdraw.js"
const app = express()


app.use(cookieParser())



const corsOptions = {
    origin: process.env.FRONTEND_URL, // Your frontend's URL
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,  // Allow credentials (cookies, tokens)
  };
  
  app.use(cors(corsOptions));
  

  
  app.use(cors(corsOptions));
  
app.use(express.json({limit:"16kb"}))

app.use(express.urlencoded({
    extended:true,
    limit:"16kb"

}))
app.use(express.static("public"))

app.get('/debug', (req, res) => {
    res.json({ status: 'Running', time: new Date().toISOString() });
});
app.get('/', (req, res) => {
    res.send('API is running!');
});


import userroutes from './routes/user.routes.js'
app.use("/api/auth",userroutes)
export {app}