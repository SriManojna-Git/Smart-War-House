import sys
import json
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal

client = TestClient(app)
db = SessionLocal()

def test_api():
    print("Running QA Tests for SmartFulfill API...")

    # 1. Test Dashboard
    print("Testing /api/dashboard/kpi...")
    resp = client.get("/api/dashboard/kpi")
    assert resp.status_code == 200, f"Dashboard failed: {resp.text}"
    print(f"Dashboard KPIs: {resp.json()}")

    # 2. Test Inventory
    print("Testing /api/inventory...")
    resp = client.get("/api/inventory")
    assert resp.status_code == 200, f"Inventory failed: {resp.text}"
    inv_data = resp.json()
    assert len(inv_data) > 0, "No inventory found"
    print(f"Inventory count: {len(inv_data)}")

    # 3. Test Orders
    print("Testing /api/orders...")
    resp = client.get("/api/orders")
    assert resp.status_code == 200, f"Orders failed: {resp.text}"
    orders = resp.json()
    assert len(orders) > 0, "No orders found"
    
    # Find an order that can be fully allocated
    order_id = orders[0]["id"]
    for o in orders:
        can_allocate = True
        for item in o["items"]:
            # Check inventory
            inv_resp = client.get("/api/inventory")
            inv_data = inv_resp.json()
            inv_item = next((i for i in inv_data if i["product_id"] == item["product_id"]), None)
            if not inv_item or inv_item["available_stock"] < item["quantity"]:
                can_allocate = False
                break
        if can_allocate:
            order_id = o["id"]
            break

    print(f"Selected Order ID: {order_id} for workflow tests")

    # 4. Test Prioritize Order
    print(f"Testing /api/orders/{order_id}/prioritize...")
    resp = client.post(f"/api/orders/{order_id}/prioritize")
    assert resp.status_code == 200, f"Prioritize failed: {resp.text}"
    print(f"Prioritize result: {resp.json()}")

    # 5. Test Allocate Order
    print(f"Testing /api/orders/{order_id}/allocate...")
    resp = client.post(f"/api/orders/{order_id}/allocate")
    assert resp.status_code == 200, f"Allocate failed: {resp.text}"
    alloc_status = resp.json()
    print(f"Allocate result: {alloc_status}")
    
    # 6. Test Picking (if allocation created tasks)
    print("Testing /api/picking...")
    resp = client.get("/api/picking")
    assert resp.status_code == 200
    picking_tasks = resp.json()
    
    if picking_tasks:
        task_id = picking_tasks[0]["id"]
        print(f"Completing Picking Task {task_id}...")
        resp = client.post(f"/api/picking/{task_id}/complete")
        assert resp.status_code == 200, f"Complete Picking failed: {resp.text}"
        
        # 7. Test Packing
        resp = client.get("/api/packing")
        packing_tasks = resp.json()
        if packing_tasks:
            pack_id = packing_tasks[0]["id"]
            print(f"Completing Packing Task {pack_id}...")
            resp = client.post(f"/api/packing/{pack_id}/complete")
            assert resp.status_code == 200
            
            # 8. Test QC
            resp = client.get("/api/qc")
            qc_tasks = resp.json()
            if qc_tasks:
                qc_id = qc_tasks[0]["id"]
                # Fail QC to test Exception generation
                print(f"Failing QC Task {qc_id} to test exceptions...")
                resp = client.post(f"/api/qc/{qc_id}/complete", json={"passed": False, "issue_description": "Item damaged in transit"})
                assert resp.status_code == 200
                
                # We need a new order to test dispatch/delivery since the first one failed QC
                # Let's skip to exceptions
    
    # 9. Test Dispatch (if any are pending)
    resp = client.get("/api/dispatch")
    dispatch_tasks = resp.json()
    if dispatch_tasks:
        disp_id = dispatch_tasks[0]["id"]
        print(f"Completing Dispatch Task {disp_id}...")
        resp = client.post(f"/api/dispatch/{disp_id}/complete")
        assert resp.status_code == 200
        
        print(f"Testing Delivery for Task {disp_id}...")
        resp = client.post(f"/api/dispatch/{disp_id}/deliver")
        assert resp.status_code == 200
    
    # 10. Test Exceptions
    print("Testing /api/exceptions...")
    resp = client.get("/api/exceptions")
    assert resp.status_code == 200
    
    # 11. Test Admin Run Engine (triggers bottlenecks and reorder logic)
    print("Testing /api/admin/run-engine...")
    resp = client.post("/api/admin/run-engine")
    assert resp.status_code == 200

    # 12. Test Recommendations
    print("Testing /api/recommendations...")
    resp = client.get("/api/recommendations")
    assert resp.status_code == 200
    recs = resp.json()
    print(f"Found {len(recs)} intelligent recommendations.")
    if recs:
        rec_id = recs[0]["id"]
        print(f"Applying Recommendation {rec_id}...")
        resp = client.post(f"/api/recommendations/{rec_id}/apply")
        assert resp.status_code == 200
        
    # 13. Test Alerts
    print("Testing /api/alerts...")
    resp = client.get("/api/alerts")
    assert resp.status_code == 200

    print("ALL TESTS PASSED!")

if __name__ == "__main__":
    test_api()
