from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import sqlite3

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "simulador.db"

class Gasto(BaseModel):
    id: str
    label: str
    min_val: int
    max_val: int
    step: int
    current_value: int

class GlobalConfig(BaseModel):
    vacation_income: int
    junior_salary: int
    icetex_credit: int
    icetex_active: bool
    subsidy_active: bool
    fds_option: int
    semestre_inicio: int
    semestre_fin: int
    post_grad_term: int

class FullConfig(BaseModel):
    global_config: GlobalConfig
    gastos: List[Gasto]

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/config", response_model=FullConfig)
async def get_config():
    conn = get_db_connection()
    try:
        global_row = conn.execute("SELECT * FROM config_global WHERE id = 1").fetchone()
        gastos_rows = conn.execute("SELECT * FROM gastos").fetchall()

        return {
            "global_config": {
                "vacation_income": global_row["vacation_income"],
                "junior_salary": global_row["junior_salary"],
                "icetex_credit": global_row["icetex_credit"],
                "icetex_active": bool(global_row["icetex_active"]),
                "subsidy_active": bool(global_row["subsidy_active"]),
                "fds_option": global_row["fds_option"],
                "semestre_inicio": global_row["semestre_inicio"],
                "semestre_fin": global_row["semestre_fin"],
                "post_grad_term": global_row["post_grad_term"]
            },
            "gastos": [dict(row) for row in gastos_rows]
        }
    finally:
        conn.close()

@app.post("/api/config/save")
async def save_config(config: FullConfig):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Update global config
        cursor.execute('''
            UPDATE config_global SET
            vacation_income = ?,
            junior_salary = ?,
            icetex_credit = ?,
            icetex_active = ?,
            subsidy_active = ?,
            fds_option = ?,
            semestre_inicio = ?,
            semestre_fin = ?,
            post_grad_term = ?
            WHERE id = 1
        ''', (
            config.global_config.vacation_income,
            config.global_config.junior_salary,
            config.global_config.icetex_credit,
            config.global_config.icetex_active,
            config.global_config.subsidy_active,
            config.global_config.fds_option,
            config.global_config.semestre_inicio,
            config.global_config.semestre_fin,
            config.global_config.post_grad_term
        ))

        # Update expenses
        for gasto in config.gastos:
            cursor.execute('''
                UPDATE gastos SET current_value = ? WHERE id = ?
            ''', (gasto.current_value, gasto.id))

        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
