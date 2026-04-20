
import pool from "./src/lib/db.js";

async function checkSchema() {
  try {
    const [rows] = await pool.query("DESCRIBE users");
    console.log("Users Table Schema:");
    console.table(rows);
    
    const [roleCount] = await pool.query("SELECT jabatan, COUNT(*) as count FROM users GROUP BY jabatan");
    console.log("\nJabatan Distribution:");
    console.table(roleCount);

    process.exit(0);
  } catch (error) {
    console.error("Error checking schema:", error);
    process.exit(1);
  }
}

checkSchema();
