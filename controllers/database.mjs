import dotenv from "dotenv"
const result = dotenv.config()

import { MongoClient } from "mongodb";
const uri = `mongodb+srv://${process.env.SA_USERNAME}:${process.env.SA_PASS}@pustak-main.h6gghsg.mongodb.net/?retryWrites=true&w=majority&appName=pustak-main
`
const client = new MongoClient(uri);
let connect;
try {
  connect = await client.connect();
} catch (e) {
  console.error(e);
}
let database = connect.db("pustak-main");

export const userCollection = database.collection("pustak-users");
export const libraryCollection = database.collection("pustak-libraries");
export default database;