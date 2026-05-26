const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'finanzas.db');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', DB_PATH);
    initializeDatabase();
  }
});

// Initialize database tables and insert sample ICETEX credit lines if empty
function initializeDatabase() {
  db.serialize(() => {
    // Create credit_lines table
    db.run(`
      CREATE TABLE IF NOT EXISTS credit_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        interest_rate_ea REAL NOT NULL,
        study_payment_pct REAL NOT NULL,
        post_grad_term_semesters INTEGER NOT NULL,
        grace_period_months INTEGER DEFAULT 0
      )
    `);

    // Create saved_simulations table
    db.run(`
      CREATE TABLE IF NOT EXISTS saved_simulations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        disbursement_per_sem REAL NOT NULL,
        study_semesters INTEGER NOT NULL,
        post_grad_semesters INTEGER NOT NULL,
        interest_rate_ea REAL NOT NULL,
        study_payment_pct REAL NOT NULL,
        grace_period_months INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if credit_lines is empty, if so, insert defaults
    db.get('SELECT COUNT(*) as count FROM credit_lines', (err, row) => {
      if (err) {
        console.error('Error checking credit_lines count:', err.message);
        return;
      }

      if (row.count === 0) {
        const insertStmt = db.prepare(`
          INSERT INTO credit_lines (name, description, interest_rate_ea, study_payment_pct, post_grad_term_semesters, grace_period_months)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const defaults = [
          [
            'ICETEX Tú Eliges 0%',
            'Pagas el 0% durante la carrera y el 100% después de graduarte. El plazo de pago es el doble del tiempo de estudio.',
            14.56, // 14.56% EA
            0,     // 0% during study
            8,     // 8 semesters postgrad (assuming 4 semesters of study)
            0
          ],
          [
            'ICETEX Tú Eliges 10%',
            'Pagas el 10% durante la carrera y el 90% restante al graduarte. El plazo de pago es el doble de la duración de los estudios.',
            14.56,
            10,
            8,
            0
          ],
          [
            'ICETEX Tú Eliges 25%',
            'Pagas el 25% semestre a semestre y el 75% al graduarte. El plazo es de igual duración que la etapa de estudios.',
            14.56,
            25,
            4,
            0
          ],
          [
            'ICETEX Tú Eliges 30% (Recomendado)',
            'Pagas el 30% mientras estudias y el 70% diferido a un plazo de 1.5 veces los semestres financiados.',
            14.56,
            30,
            6,
            0
          ],
          [
            'ICETEX Tú Eliges 50%',
            'Pagas el 50% mientras estudias y el 50% restante al graduarte. El plazo de pago es igual a la etapa de estudios.',
            14.56,
            50,
            4,
            0
          ],
          [
            'ICETEX Tú Eliges 100%',
            'Pagas el 100% en el transcurso del semestre y no acumulas deuda para después de graduarte.',
            14.56,
            100,
            0,
            0
          ]
        ];

        defaults.forEach((line) => {
          insertStmt.run(line, (err) => {
            if (err) console.error('Error inserting default credit line:', err.message);
          });
        });

        insertStmt.finalize(() => {
          console.log('Default ICETEX credit lines successfully populated.');
        });
      }
    });
  });
}

// --- API ENDPOINTS ---

// 1. Credit Lines (Modular Configurations)

// GET all credit lines
app.get('/api/credit-lines', (req, res) => {
  db.all('SELECT * FROM credit_lines ORDER BY id ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST create a new credit line
app.post('/api/credit-lines', (req, res) => {
  const { name, description, interest_rate_ea, study_payment_pct, post_grad_term_semesters, grace_period_months } = req.body;
  
  if (!name || interest_rate_ea === undefined || study_payment_pct === undefined || post_grad_term_semesters === undefined) {
    return res.status(400).json({ error: 'Missing required fields (name, interest_rate_ea, study_payment_pct, post_grad_term_semesters)' });
  }

  const query = `
    INSERT INTO credit_lines (name, description, interest_rate_ea, study_payment_pct, post_grad_term_semesters, grace_period_months)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [name, description, interest_rate_ea, study_payment_pct, post_grad_term_semesters, grace_period_months || 0], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'A credit line with this name already exists.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      name,
      description,
      interest_rate_ea,
      study_payment_pct,
      post_grad_term_semesters,
      grace_period_months: grace_period_months || 0
    });
  });
});

// PUT update a credit line
app.put('/api/credit-lines/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, interest_rate_ea, study_payment_pct, post_grad_term_semesters, grace_period_months } = req.body;

  if (!name || interest_rate_ea === undefined || study_payment_pct === undefined || post_grad_term_semesters === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    UPDATE credit_lines
    SET name = ?, description = ?, interest_rate_ea = ?, study_payment_pct = ?, post_grad_term_semesters = ?, grace_period_months = ?
    WHERE id = ?
  `;

  db.run(query, [name, description, interest_rate_ea, study_payment_pct, post_grad_term_semesters, grace_period_months || 0, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'A credit line with this name already exists.' });
      }
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Credit line not found.' });
    }
    res.json({ id: Number(id), name, description, interest_rate_ea, study_payment_pct, post_grad_term_semesters, grace_period_months });
  });
});

// DELETE a credit line
app.delete('/api/credit-lines/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM credit_lines WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Credit line not found.' });
    }
    res.json({ message: 'Credit line successfully deleted.', id: Number(id) });
  });
});


// 2. Saved Simulations

// GET all saved simulations
app.get('/api/simulations', (req, res) => {
  db.all('SELECT * FROM saved_simulations ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// POST save a simulation
app.post('/api/simulations', (req, res) => {
  const { name, disbursement_per_sem, study_semesters, post_grad_semesters, interest_rate_ea, study_payment_pct, grace_period_months } = req.body;

  if (!name || disbursement_per_sem === undefined || study_semesters === undefined || post_grad_semesters === undefined || interest_rate_ea === undefined || study_payment_pct === undefined) {
    return res.status(400).json({ error: 'Missing required simulation fields.' });
  }

  const query = `
    INSERT INTO saved_simulations (name, disbursement_per_sem, study_semesters, post_grad_semesters, interest_rate_ea, study_payment_pct, grace_period_months)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    name, disbursement_per_sem, study_semesters, post_grad_semesters, interest_rate_ea, study_payment_pct, grace_period_months || 0
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      name,
      disbursement_per_sem,
      study_semesters,
      post_grad_semesters,
      interest_rate_ea,
      study_payment_pct,
      grace_period_months: grace_period_months || 0,
      created_at: new Date().toISOString()
    });
  });
});

// DELETE a saved simulation
app.delete('/api/simulations/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM saved_simulations WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Simulation not found.' });
    }
    res.json({ message: 'Simulation successfully deleted.', id: Number(id) });
  });
});


// Catch-all route to serve static index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
