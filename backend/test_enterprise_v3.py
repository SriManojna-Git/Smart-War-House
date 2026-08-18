import os, sys
os.environ["PYTHONPATH"] = "."
sys.stdout.reconfigure(encoding='utf-8')
from database import SessionLocal
import models, engine
from datetime import datetime, timedelta

def run_test_v3():
    db = SessionLocal()
    print("=========================================================")
    print("SMARTFULFILL AI ENTERPRISE V3 VERIFICATION TEST SUITE")
    print("=========================================================\n")
    
    warehouse = db.query(models.Warehouse).first()
    assert warehouse, "Warehouse not found"
    wid = warehouse.id
    user = db.query(models.User).first()
    
    # -------------------------------------------------------------
    # SCENARIO 1: Urgent Order (10) vs Stock (7) vs Normal Order (5)
    # -------------------------------------------------------------
    print("SCENARIO 1: Urgent (10) vs Available (7) vs Normal (5)")
    p1 = db.query(models.Product).first()
    inv1 = db.query(models.Inventory).filter_by(product_id=p1.id).first()
    inv1.available_stock = 7
    inv1.current_stock = 7
    inv1.reserved_stock = 0
    inv1.allocated_stock = 0
    db.commit()
    
    # 1. Create Urgent Order (10 units)
    urgent_order = models.Order(
        warehouse_id=wid,
        customer_name="Urgent VIP Client",
        urgency=models.PriorityEnum.CRITICAL,
        customer_priority=models.PriorityEnum.CRITICAL,
        order_value=9500.0,
        deadline=datetime.utcnow() + timedelta(minutes=45), # Critical deadline
        status=models.OrderStatus.CREATED
    )
    db.add(urgent_order)
    db.commit()
    db.refresh(urgent_order)
    
    item1 = models.OrderItem(order_id=urgent_order.id, product_id=p1.id, quantity=10)
    db.add(item1)
    db.commit()
    
    # Check SLA calculation
    sla_info = engine.calculate_order_sla(urgent_order)
    print(f"  [+] 1. SLA Risk Calculated: {sla_info['sla_status']} ({sla_info['remaining_label']})")
    assert sla_info['sla_status'] == "CRITICAL", f"Expected CRITICAL, got {sla_info['sla_status']}"
    
    # 2. Check Allocation & Conflict Detection
    rec = engine.check_inventory_and_generate_recommendation(db, urgent_order)
    print(f"  [+] 2. Conflict Detected & AI Decision: {rec.decision} ({rec.confidence}% Confidence)")
    assert "Allocate 7 units" in rec.decision
    
    # 3. User Approves Recommendation
    rec.status = "Applied"
    engine.run_allocation(db, urgent_order)
    engine.create_audit_log(db, wid, user.full_name, "Execute AI Decision", "AIRecommendation", rec.id, "Pending", "Applied")
    db.commit()
    
    db.refresh(inv1)
    alloc = db.query(models.Allocation).filter_by(order_id=urgent_order.id).first()
    print(f"  [+] 4. Inventory Updated: Available={inv1.available_stock}, Reserved={inv1.reserved_stock}, Allocated={inv1.allocated_stock}")
    print(f"  [+] 5. Allocation Record: Allocated={alloc.allocated_quantity}, Backordered={alloc.backordered_quantity}")
    assert inv1.available_stock == 0
    assert alloc.allocated_quantity == 7
    assert alloc.backordered_quantity == 3
    
    # 4. Check Decision History & Audit Log
    history = db.query(models.AIRecommendation).filter_by(id=rec.id).first()
    audit = db.query(models.AuditLog).filter_by(entity="AIRecommendation", entity_id=rec.id).first()
    print(f"  [+] 6. AI Decision History Status: {history.status}")
    print(f"  [+] 7. Audit Log Lifecycle: Action '{audit.action}' by {audit.user}")
    assert history.status == "Applied"
    assert audit.action == "Execute AI Decision"
    
    # 5. Check Before / After Impact
    impact = engine.calculate_before_after_impact(db, wid, "Order", urgent_order.id)
    print(f"  [+] 8. Before/After Impact Generated: {len(impact['metrics'])} metrics verified")
    assert len(impact['metrics']) >= 4
    print("  --> PASS [OK]\n")
    
    # -------------------------------------------------------------
    # SCENARIO 2: Warehouse Zone Heatmap
    # -------------------------------------------------------------
    print("SCENARIO 2: Warehouse Zone Heatmap Aggregation")
    heatmap = engine.get_zone_heatmap_data(db, wid)
    print(f"  [+] Zones Detected: {len(heatmap['zones'])} zones | Congestion Index: {heatmap['congestion_index']}")
    for z in heatmap['zones']:
        print(f"      - {z['zone']}: Status={z['status']}, Queue={z['picking_queue']}, AvgTime={z['avg_processing_time_mins']}m")
    assert len(heatmap['zones']) >= 3
    print("  --> PASS [OK]\n")
    
    # -------------------------------------------------------------
    # SCENARIO 3: AI Order Recovery Suggestion & Execution
    # -------------------------------------------------------------
    print("SCENARIO 3: AI Order Recovery Engine")
    recovery = engine.generate_order_recovery_suggestion(db, urgent_order)
    print(f"  [+] Problem: {recovery['problem']}")
    print(f"  [+] Recommendation: {recovery['recommended_recovery']}")
    print(f"  [+] Expected Impact: {recovery['expected_impact']}")
    
    recov_res = engine.execute_order_recovery(db, wid, urgent_order.id, recovery['action_type'], user.full_name)
    print(f"  [+] Recovery Executed: {recov_res['message']}")
    assert recov_res['status'] == "success"
    print("  --> PASS [OK]\n")
    
    # -------------------------------------------------------------
    # SCENARIO 4: Report Export Engine (CSV)
    # -------------------------------------------------------------
    print("SCENARIO 4: Report Export Generation")
    for r_type in ["inventory", "orders", "allocations", "exceptions", "analytics"]:
        csv_out = engine.generate_csv_report(db, wid, r_type)
        line_count = len(csv_out.strip().split("\n"))
        print(f"  [+] Report '{r_type}.csv': {line_count} lines generated")
        assert line_count > 3
    print("  --> PASS [OK]\n")
    
    print("=========================================================")
    print("ALL ENTERPRISE V3 FEATURES PASSED 100%!")
    print("=========================================================")

if __name__ == "__main__":
    run_test_v3()
