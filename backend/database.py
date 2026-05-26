import sqlite3
import os

DB_PATH = "simulador.db"

def init_db():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Table for global configuration
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS config_global (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            vacation_income INTEGER,
            junior_salary INTEGER,
            icetex_credit INTEGER,
            icetex_active BOOLEAN,
            subsidy_active BOOLEAN,
            fds_option INTEGER,
            semestre_inicio INTEGER,
            semestre_fin INTEGER,
            post_grad_term INTEGER
        )
    ''')

    # Table for monthly expenses
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gastos (
            id TEXT PRIMARY KEY,
            label TEXT,
            min_val INTEGER,
            max_val INTEGER,
            step INTEGER,
            current_value INTEGER
        )
    ''')

    # Seed global config
    cursor.execute('''
        INSERT INTO config_global (id, vacation_income, junior_salary, icetex_credit, icetex_active, subsidy_active, fds_option, semestre_inicio, semestre_fin, post_grad_term)
        VALUES (1, 1750905, 2500000, 1000000, 1, 0, 0, 6, 9, 36)
    ''')

    # Seed expenses
    expenses = [
        ('alim', '🍽 Alimentación', 50000, 1000000, 10000, 400000),
        ('transp', '🚌 Transporte', 0, 500000, 10000, 0),
        ('arriendo', '🏠 Arriendo/vivienda', 0, 1500000, 50000, 0),
        ('serv', '💡 Servicios/internet', 0, 300000, 10000, 100000),
        ('mat', '📚 Materiales/U', 0, 300000, 10000, 50000),
        ('otros', '🛍 Otros', 0, 500000, 10000, 50000)
    ]
    cursor.executemany('''
        INSERT INTO gastos (id, label, min_val, max_val, step, current_value)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', expenses)

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

if __name__ == "__main__":
    init_db()
