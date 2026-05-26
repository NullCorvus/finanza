const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'finanzas.db');

// Verify SQLite connection and schema
console.log('Verifying SQLite database at:', DB_PATH);
if (!fs.existsSync(DB_PATH)) {
  console.error('Error: Database file does not exist. Run the server first.');
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
  
  console.log('Successfully opened database.');
  
  // Verify credit_lines table exists and has entries
  db.all('SELECT * FROM credit_lines', [], (err, rows) => {
    if (err) {
      console.error('Failed to query credit_lines table:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log(`Found ${rows.length} modular credit lines in database.`);
    rows.forEach(row => {
      console.log(` - [ID ${row.id}] ${row.name}: Tasa ${row.interest_rate_ea}%, Pago carrera ${row.study_payment_pct}%, Plazo ${row.post_grad_term_semesters}S`);
    });
    
    if (rows.length >= 6) {
      console.log('\n✅ Verification PASSED: Database initialized correctly with default modular configurations.');
    } else {
      console.error('\n⚠️ Verification FAILED: Default credit lines count is lower than expected.');
    }
    
    db.close();
  });
});
