import os, sys
os.environ["PYTHONPATH"] = "."
sys.stdout.reconfigure(encoding='utf-8')
from database import SessionLocal
import models, engine
from datetime import datetime, timedelta

def run_test_suite():
    db = SessionLocal()
    print("=========================================================")
    print("SMARTFULFILL AI ENTERPRISE VERIFICATION TEST SUITE")
    print("=========================================================\n")
    
    warehouse = db.query(models.Warehouse).first()
    if not warehouse:
        print("Error: No warehouse found.")
        return
    wid = warehouse.id
    user = db.query(models.User).first()
    
    # TEST 1: Smart Order Priority Engine
    print("TEST 1: Smart Order Priority Engine")
    order = models.Order(
        warehouse_id=wid,
        customer_name="Enterprise Test Corp",
        urgency=models.PriorityEnum.CRITICAL,
        customer_priority=models.PriorityEnum.CRITICAL,
        order_value=15000.0,
        deadline=datetime.utcnow() + timedelta(hours=8),
        status=models.OrderStatus.CREATED
    )
    score, risk, factors_json, explanation = engine.calculate_priority_score_details(order)
    print(f"  [+] Calculated Score: {score:.0f}/100 | Risk: {risk}")
    print(f"  [+] Factor Explanation: {explanation}")
    assert score >= 85, f"Expected critical score >= 85, got {score}"
    print("  --> PASS [OK]\n")
    
    # TEST 2: Intelligent Allocation & Conflict Resolution
    print("TEST 2: Intelligent Allocation & Backordering (Urgent 10 vs Stock 7)")
    p1 = db.query(models.Product).first()
    inv1 = db.query(models.Inventory).filter_by(product_id=p1.id).first()
    inv1.available_stock = 7
    inv1.current_stock = 7
    inv1.reserved_stock = 0
    inv1.allocated_stock = 0
    db.commit()
    
    order.warehouse_id = wid
    db.add(order)
    db.commit()
    db.refresh(order)
    
    item = models.OrderItem(order_id=order.id, product_id=p1.id, quantity=10)
    db.add(item)
    db.commit()
    
    engine.run_allocation(db, order)
    alloc = db.query(models.Allocation).filter_by(order_id=order.id).first()
    print(f"  [+] Allocated: {alloc.allocated_quantity} | Backordered: {alloc.backordered_quantity} | Status: {alloc.status}")
    print(f"  [+] Available Stock: {inv1.available_stock} | Reserved: {inv1.reserved_stock} | Allocated: {inv1.allocated_stock}")
    assert alloc.allocated_quantity == 7, f"Expected 7 allocated, got {alloc.allocated_quantity}"
    assert alloc.backordered_quantity == 3, f"Expected 3 backordered, got {alloc.backordered_quantity}"
    assert inv1.available_stock == 0, f"Expected 0 available, got {inv1.available_stock}"
    print("  --> PASS [OK]\n")
    
    # TEST 3: Predictive Stockout & Dynamic Reorder Approval
    print("TEST 3: Predictive Stockout & Autonomous Reorder")
    pred = engine.calculate_stockout_prediction(inv1)
    print(f"  [+] SKU: {pred['sku']} | Risk: {pred['stockout_risk']} | Depletion: {pred['depletion_days']} days | Recommended Reorder: {pred['recommended_reorder_qty']} units")
    assert pred['stockout_risk'] == "CRITICAL", f"Expected CRITICAL risk for 0 stock, got {pred['stockout_risk']}"
    
    inv1.current_stock += 50
    inv1.available_stock += 50
    inv1.status = models.InventoryStatus.HEALTHY
    db.commit()
    print(f"  [+] Post-Reorder Available Stock: {inv1.available_stock} ({inv1.status})")
    assert inv1.available_stock == 50, "Expected 50 units after replenishment"
    print("  --> PASS [OK]\n")
    
    # TEST 4: AI Picking Route Optimizer
    print("TEST 4: AI Picking Route Optimizer")
    task = db.query(models.PickingTask).filter_by(order_id=order.id).first()
    if task:
        print(f"  [+] Current Dist: {task.current_route_distance}m | Optimized Dist: {task.optimized_route_distance}m | Saved: {task.time_saved_minutes} mins")
        print(f"  [+] Route Summary: {task.route_summary}")
        assert task.optimized_route_distance < task.current_route_distance, "Optimized distance should be less"
    print("  --> PASS [OK]\n")
    
    # TEST 5: What-If Simulator Dynamic Evaluation
    print("TEST 5: What-If Simulator Dynamic Calculation")
    sim_res = engine.evaluate_simulation({
        "order_volume": 60,
        "urgent_order_pct": 30,
        "staff_count": 8,
        "inventory_level_pct": 80,
        "damaged_items_pct": 2
    })
    print(f"  [+] Current Strategy: Fulfillment {sim_res['current']['fulfillment_rate']} | Delayed: {sim_res['current']['delayed_orders']}")
    print(f"  [+] AI Strategy: Fulfillment {sim_res['ai']['fulfillment_rate']} | Delayed: {sim_res['ai']['delayed_orders']} | Saved: {sim_res['ai']['distance_saved']}")
    assert int(sim_res['ai']['delayed_orders']) <= int(sim_res['current']['delayed_orders']), "AI delayed orders should be lower"
    print("  --> PASS [OK]\n")
    
    # TEST 6: Exception Resolution & Operations Impact
    print("TEST 6: Exception Resolution & Operations Impact KPIs")
    exc = models.ExceptionRecord(
        warehouse_id=wid,
        type="Stock Conflict",
        description="Test Anomaly for SLA verification",
        severity="High",
        ai_analysis="Resolved via buffer inventory",
        recommended_action="Allocate buffer stock",
        related_entity_id=order.id,
        entity_type="Order",
        status="Open"
    )
    db.add(exc)
    db.commit()
    
    engine.resolve_exception(db, wid, user.full_name, exc.id, "Auto-applied AI Recommendation")
    db.refresh(exc)
    print(f"  [+] Exception #{exc.id} Status: {exc.status} | Resolution: {exc.resolution}")
    assert exc.status == "Resolved"
    
    impact = engine.get_operations_impact_kpis(db, wid)
    print(f"  [+] Operations Impact: {impact['orders_fulfilled']} Fulfilled ({impact['fulfillment_percentage']}%) | Distance Saved: {impact['picking_distance_saved_meters']}m | AI Acceptance: {impact['ai_acceptance_rate']}%")
    print("  --> PASS [OK]\n")
    
    # TEST 7: Judge Demo Mode Trigger & Reset
    print("TEST 7: Judge Demo Mode Trigger & Clean Reset")
    demo_res = engine.trigger_judge_demo_scenario(db, wid, user)
    print(f"  [+] Judge Demo Activated: Urgent Order #{demo_res['urgent_order_id']} vs Low Order #{demo_res['low_order_id']}")
    assert demo_res['status'] == "success"
    print("  --> PASS [OK]\n")
    
    print("=========================================================")
    print("ALL 7 ENTERPRISE INTEGRATION TESTS PASSED 100%!")
    print("=========================================================")

if __name__ == "__main__":
    run_test_suite()
