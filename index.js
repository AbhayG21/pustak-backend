import express from "express"
import jwt from "jsonwebtoken"
import bodyParser from "body-parser"
import superAdminDecoder from "./middleware/superAdminDecoder.mjs"
import tokenVerifier from "./middleware/tokenVerifier.mjs"
import roles from "./constants/roles.mjs"
import libAdminRoute from "./routes/libraryAdmin.mjs"
import librarianRoute from "./routes/librarian.mjs"
import libraryRoute from "./routes/library.mjs"
import bookRoute from "./routes/book.mjs"
import bcrypt, { hash } from "bcrypt"
import database from "./controllers/database.mjs"
import { userCollection } from "./controllers/database.mjs"

const app = express();
const port = process.env.PORT
const salt = 10
app.use(bodyParser.json());

app.get("/super-admin",superAdminDecoder,(req,res)=>{
    const token = req.token;
    res.status(201).json({message:"Token:",token:token})
});

app.post("/auth/login",(req,res)=>{
    try{
    const email = req.body.email;
    const pass = req.body.password;

    if(!email || !pass){
        throw new Error();
    }

    userCollection.findOne({email:email}).then((e)=>{
        if(e){
            let hashPass = e.password;
            let verifyPass = bcrypt.compareSync(pass,hashPass);
            if(verifyPass){
                let payLoad = {
                    id:e.id,
                    role:e.role
                };
                let secret = process.env.SECRET_JWT;
                let options = {expiresIn:"24h"};

                const token = jwt.sign(payLoad,secret,options);
                delete e.password
                delete e._id
                res.status(200).json({ message: "OK",role: e.role, token: token, user: e, id: e.id });
            }else {
                res.status(400).json({ message: "Bad Request index" });
              }
        }else {
            res.status(404).json({ message: "Not found" });
        }
    });
}catch{
    res.status(400).json({ message: "Bad Request index2" });
    }
})

app.post("/verify", (req, res) => {
    try {
      const token = req.headers["authorization"].split(" ")[1];
      const secret = process.env.SECRET_JWT;
      const tokenPayload = jwt.verify(token, secret);
      console.log(tokenPayload)
      if (tokenPayload) {
        userCollection.findOne({id:tokenPayload.id}).then((e)=>{
          if(e){
            res.status(200).json({ message: "OK" });
          }else{
            res.status(404).json({message:"User not found"});
          }
        });
      } else {
        res.status(401).json({ message: "Please login again" });
      }
    } catch {
      res.status(400).json({ message: "Bad Request" });
    }
  });

app.post("/member-create",(req,res) =>{
    try{const keys = [
      "id",
      "role",
      "name",
      "email",
      "phone",
      "password"
    ]
    const keyBody = Object.keys(req.body);
    keys.forEach((e)=>{
      if(keyBody.indexOf(e) == -1){
              throw new Error();
      }
  })

  const body = req.body
  const password = body.password
  bcrypt.hash(password,salt).then((hashPass)=>{
    

    userCollection.findOne({id:body.id}).then((e)=>{
      if(e){
        res.status(409).json({message:"Email already exists"})
      }
      else{
        const payload = {
          ...req.body,
           password:hashPass
         };
        userCollection.insertOne(payload).then((e)=>{
          res.status(201).json({message:"member created"})
        })
        .catch((error)=>{
          res.status(400).json({message:"Bad request member"})
        })
      }
    })
  })}catch{
    res.status(400).json({message:"Bad request member 2"})
  }


});

app.use("/library-admin", tokenVerifier([roles.SA]));
app.use("/library-admin", libAdminRoute);

app.use("/library", libraryRoute);

app.use("/librarian", librarianRoute);

app.use("/book", tokenVerifier([roles.LB]));
app.use("/book", bookRoute);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

