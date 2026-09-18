import sql from "mssql";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  server: process.env.DB_SERVER,

  database: process.env.DB_DATABASE,

  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export async function connectDB() {
  try {
    await sql.connect(config);

    console.log("✅ SQL Server Connected");
  } catch (err) {
    console.error("❌ Database Error");
    console.error(err);
  }
}

export { sql };