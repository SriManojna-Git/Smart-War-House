import os
os.environ["PYTHONPATH"] = "."
from database import SessionLocal
import models, engine
from datetime import datetime

db = SessionLocal()

# 1. Setup Data
warehouse = db.query(models.Warehouse).first()
wid = warehouse.id

# Product 1
p1 = db.query(models.Product).first()
inv = db.query(models.Inventory).filter_by(product_id=p1.id).first()

# Set available stock to 7
inv.available_stock = 7
inv.current_stock = 7
inv.reserved_stock = 0
inv.allocated_stock = 0
db.commit()

# Create Urgent Order of 10
order = models.Order(
    warehouse_id=wid,
    customer_name="Test Urgent",
    urgency=models.PriorityEnum.CRITICAL,
    customer_priority=models.PriorityEnum.HIGH,
    status=models.OrderStatus.CREATED
)
db.add(order)
db.commit()
db.refresh(order)

item = models.OrderItem(
    order_id=order.id,
    product_id=p1.id,
    quantity=10
)
db.add(item)
db.commit()

# Run allocation
print("--- ALLOCATING ORDER ---")
res = engine.run_allocation(db, order)
db.commit()

# Check Results
alloc = db.query(models.Allocation).filter_by(order_id=order.id).first()
print(f"Allocated: {alloc.allocated_quantity} | Backordered: {alloc.backordered_quantity} | Status: {alloc.status}")
print(f"Inventory Available: {inv.available_stock} | Reserved: {inv.reserved_stock} | Allocated: {inv.allocated_stock}")

mov = db.query(models.InventoryMovement).filter_by(product_id=p1.id).order_by(models.InventoryMovement.id.desc()).first()
print(f"Movement Type: {mov.type} | Qty: {mov.quantity} | Notes: {mov.notes}")

# Restock of 20
print("--- RESTOCKING ---")
inv.current_stock += 20
inv.available_stock += 20
mov_restock = models.InventoryMovement(
    warehouse_id=wid,
    product_id=p1.id,
    type="Restocked",
    quantity=20,
    user="Test Script",
    notes="Test restock"
)
db.add(mov_restock)
db.commit()

print(f"Post-Restock Available: {inv.available_stock}")
