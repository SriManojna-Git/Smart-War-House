import sqlite3

conn = sqlite3.connect('smartfulfill.db')
cursor = conn.cursor()

def add_column(table, column, definition):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        print(f"Added {column} to {table}")
    except sqlite3.OperationalError as e:
        print(f"Column {column} might already exist in {table} or error: {e}")

# Inventory
add_column('inventory', 'allocated_stock', 'INTEGER DEFAULT 0')
add_column('inventory', 'damaged_stock', 'INTEGER DEFAULT 0')

# Allocations
add_column('allocations', 'backordered_quantity', 'INTEGER DEFAULT 0')
add_column('allocations', 'status', 'VARCHAR DEFAULT "Pending"')
add_column('allocations', 'priority', 'VARCHAR DEFAULT "Medium"')
add_column('allocations', 'user_id', 'INTEGER')
add_column('allocations', 'warehouse_zone_id', 'INTEGER')

conn.commit()
conn.close()
