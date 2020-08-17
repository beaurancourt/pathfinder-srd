const pg = require('pg');
const pgClient = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});
const fs = require('fs');

const mongo = require('mongodb')
const MongoClient = mongo.MongoClient;

;(async () => {
  await pgClient.connect();
  const tableName = "actions";
  const client = await MongoClient.connect(process.env.MONGODB_URI, { useNewUrlParser: true });
  const db = client.db("heroku_d8hk9vs8");
  const table = db.collection(tableName);
  const entities = await table.find().toArray();
  for (var i = 0; i < entities.length; i++) {
    await pgClient.query("insert into actions (info) values ($1)", [JSON.stringify(entities[i])]);
  }
  await pgClient.end();
  client.close();
})()
