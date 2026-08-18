import sys
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
from datetime import datetime, timedelta

client = TestClient(app)
db = SessionLocal()

def reset_db():
    import seed
    seed.reset_db()
    seed.seed_data()
    print("DB reset for audit.")

def audit_scenarios():
    print("--- STARTING SCENARIO AUDIT ---")
    
    # 1. Urgent order needs 10 units but only 7 are available.
    # We will manually create a product with 7 units and an urgent order needing 10.
    prod = models.Product(sku="AUDIT-1", name="Audit Prod 1", category="Test", price=100.0, reorder_point=5)
    db.add(prod)
    db.commit()
    
    inv = models.Inventory(product_id=prod.id, current_stock=7, available_stock=7, status=models.InventoryStatus.HEALTHY)
    db.add(inv)
    db.commit()
    
    urgent_order = models.Order(
        customer_name="Urgent VIP", 
        urgency=models.PriorityEnum.CRITICAL,
        customer_priority=models.PriorityEnum.CRITICAL,
        deadline=datetime.utcnow() + timedelta(hours=10)
    )
    db.add(urgent_order)
    db.commit()
    
    item1 = models.OrderItem(order_id=urgent_order.id, product_id=prod.id, quantity=10)
    db.add(item1)
    db.commit()
    
    # Trigger prioritize and allocate
    client.post(f"/api/orders/{urgent_order.id}/prioritize")
    client.post(f"/api/orders/{urgent_order.id}/allocate")
    
    # 2. Lower-priority order competes for the same stock.
    low_order = models.Order(
        customer_name="Low Priority User",
        urgency=models.PriorityEnum.LOW,
        customer_priority=models.PriorityEnum.LOW,
        deadline=datetime.utcnow() + timedelta(days=14)
    )
    db.add(low_order)
    db.commit()
    item2 = models.OrderItem(order_id=low_order.id, product_id=prod.id, quantity=3)
    db.add(item2)
    db.commit()
    
    client.post(f"/api/orders/{low_order.id}/prioritize")
    client.post(f"/api/orders/{low_order.id}/allocate")
    
    # Run the engine to generate bottlenecks, reorders, SLAs
    client.post("/api/admin/run-engine")
    
    # 4. Damaged or missing item exception
    # Need a QC task
    client.post(f"/api/qc/1/complete", json={"passed": False, "issue_description": "Damaged Item"})

    # Check Recommendations
    recs = client.get("/api/recommendations").json()
    
    print(f"Total Recommendations Generated: {len(recs)}")
    for r in recs:
        print(f"[{r['entity_type']}] Situation: {r['situation']}")

if __name__ == "__main__":
    reset_db()
    audit_scenarios()
