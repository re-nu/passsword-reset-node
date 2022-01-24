import express from 'express';
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const app=express();

const PORT=process.env.PORT;

app.use(express.json());

const MONGO_URL=process.env.MONGO_URL;

async function createConnection() {
    const client=new MongoClient(MONGO_URL);
    await client.connect();
    console.log("MongoDB connected")
    return client;
}

const client=await createConnection();

app.get("/",(request,response)=>{
    response.send("welcom to password reset app")
})

app.post("/account/signup",async(request,response)=>{
    const {email,password}=request.body;
    console.log("bode info",email,password)

    // check if user is already present, if user is not found it will return null 
    const userPresent= await getUserByEmail(email)
    
    // if already present , then userPresent is not null i.e if will be true
    if(userPresent){
        response.send({message:"user already exists"})
        // break,exit from futher code
        return;
    }
    //get hassed password 
    const hashedPassword=await genPassword(password) 
     const result=await client.db("b28wd").collection("password-reset").insertOne({email:email,password:hashedPassword})
     response.send(result)
})

app.post("/account/login",async(request,response)=>{
    const {email,password}=request.body

    // check is email is present 
    const userPresent= await getUserByEmail(email)

    if(!userPresent){
       response.send({message:"invalid user"})
       return
    }
    //  get the stored/saved password
    const storedPassword=userPresent.password
    // comape saved password and entered password, caomapre will return true if matches else return false
    const isPasswordMatch=await bcrypt.compare(password,storedPassword)

    if(isPasswordMatch){
        response.send({message:"successfuly login"})
    }

    else{
        response.send({message:"invalis password"})
    }
})

app.patch("/resetPassword/:email",async(request,response)=>{
   const email=request.params
   const {password}=request.body
   console.log(password)
   
    // convert password to hassed password and then update
    const hashedPassword=await genPassword(password)
    // update the password
    const updatePassword=await updatePasswordByEmail(email, hashedPassword)
    response.send(updatePassword)
})

async function updatePasswordByEmail(email, hashedPassword) {
    return await client.db("b28wd").collection("password-reset").updateOne(email, { $set: { password: hashedPassword } });
}

async function getUserByEmail(email) {
    return await client.db("b28wd").collection("password-reset").findOne({ email: email });
}

async function genPassword(password) {
    const No_of_Rounds=10                  //no of random rounds
    // add random no.of rounds to add after password
    const salt=await bcrypt.genSalt(No_of_Rounds) 
    // convert password into hashed
    const hashedPassword=await bcrypt.hash(password,salt)
    console.log("hassedpassword is :",hashedPassword)
    return hashedPassword
}

app.listen(PORT,()=>console.log("App started in :",PORT))