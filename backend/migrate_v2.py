import sqlite3

conn = sqlite3.connect('smartfulfill.db')
cursor = conn.cursor()

def add_col(t, c, d):
    try:
        cursor.execute(f'ALTER TABLE {t} ADD COLUMN {c} {d}')
        print(f'Added {c} to {t}')
    except Exception as e:
        print(f'Skipping {c} on {t}: {e}')

add_col('orders', 'priority_factors', 'TEXT')
add_col('picking_tasks', 'current_route_distance', 'FLOAT DEFAULT 250.0')
add_col('picking_tasks', 'optimized_route_distance', 'FLOAT DEFAULT 175.0')
add_col('picking_tasks', 'time_saved_minutes', 'FLOAT DEFAULT 4.5')
add_col('picking_tasks', 'route_summary', 'TEXT')
add_col('exceptions', 'severity', 'VARCHAR DEFAULT "High"')
add_col('exceptions', 'ai_analysis', 'TEXT')
add_col('exceptions', 'recommended_action', 'TEXT')
add_col('ai_recommendations', 'category', 'VARCHAR DEFAULT "General"')
add_col('ai_recommendations', 'decision', 'TEXT')
add_col('ai_recommendations', 'data_considered', 'TEXT')
add_col('ai_recommendations', 'created_at', 'DATETIME')

conn.commit()
conn.close()
print("Migration completed successfully.")
