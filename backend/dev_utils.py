from db import get_connection, hash_password   

def create_demo_user_if_not_exists():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT user_id FROM users WHERE email = %s
    """, ("demo@example.com",))

    row = cur.fetchone()
    if row:
        user_id = row[0]
    else:
        hashed_pw = hash_password("demo-password")  

        cur.execute("""
            INSERT INTO users (name, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING user_id
        """, ("Demo User", "demo@example.com", hashed_pw))
        
        user_id = cur.fetchone()[0]
        conn.commit()

    cur.close()
    conn.close()
    return user_id
