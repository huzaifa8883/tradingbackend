import dotenv from 'dotenv'

import connectdb from "./db/index.js";
import { app } from './app.js';

dotenv.config({
    path: "./.env"
})


connectdb()
.then(()=>{
app.listen(8000,()=>{
  console.log(`server is running at ${6000}`)
})
})
.catch((err)=>{
console.log("mongodb connection failed",err)
})


