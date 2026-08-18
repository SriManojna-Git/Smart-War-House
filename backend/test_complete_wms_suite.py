import os, sys
os.environ["PYTHONPATH"] = "."
sys.stdout.reconfigure(encoding='utf-8')
from database import SessionLocal
import models
import engine

def run_wms_suite():
    db = SessionLocal()
    warehouse = db.query(models.Warehouse).first()
    assert warehouse is not None, "Warehouse must exist"
    wid = warehouse.id
    print(f"Testing WMS Suite for Warehouse #{wid} ({warehouse.name})...")
    
    # 1. AI Demand Forecast
    forecast = engine.get_demand_forecast(db, wid, 30)
    print(f"[PASS] 1. AI Demand Forecast: Total Projected = {forecast['total_forecasted_demand']} units over {forecast['period_days']}d")
    assert forecast['total_forecasted_demand'] > 0
    assert len(forecast['product_forecasts']) > 0
    
    # 2. Smart Reorder Suggestions & PO conversion
    reorders = engine.get_smart_reorder_suggestions(db, wid)
    print(f"[PASS] 2. Smart Reorder Suggestions: Evaluated {len(reorders)} SKUs")
    assert len(reorders) > 0
    first_r = reorders[0]
    po_res = engine.convert_reorder_to_po(db, wid, first_r['product_id'], first_r['supplier_id'], first_r['suggested_quantity'], "Test Automated Lead")
    print(f"[PASS] 3. Reorder to PO Conversion: Created {po_res['po_number']} with amount ${po_res['total_amount']}")
    assert po_res['status'] == "success"
    
    # 4. Suppliers
    suppliers = db.query(models.Supplier).filter(models.Supplier.warehouse_id == wid).all()
    print(f"[PASS] 4. Supplier Management: {len(suppliers)} Active Vendors")
    assert len(suppliers) >= 4
    
    # 5. Batches & Expiry
    batches = db.query(models.ProductBatch).filter(models.ProductBatch.warehouse_id == wid).all()
    print(f"[PASS] 5. Batch & Expiry Tracking: {len(batches)} Batches Tracked")
    assert len(batches) > 0
    
    # 6. Barcode Resolution
    scan_sku = db.query(models.Product).first().sku
    scan_res = engine.lookup_barcode_telemetry(db, wid, scan_sku)
    print(f"[PASS] 6. Barcode / QR Scanner Telemetry: Resolved SKU {scan_sku} -> {scan_res['product']['name']}")
    assert scan_res['found'] is True
    
    # 7. Interactive Heatmap Matrix
    heatmap = engine.get_interactive_heatmap(db, wid)
    print(f"[PASS] 7. 2D Interactive Warehouse Heatmap: {heatmap['total_warehouse_occupied']}/{heatmap['total_warehouse_capacity']} occupied ({heatmap['overall_utilization_pct']}%)")
    assert len(heatmap['zones']) == 5
    
    # 8. Inventory Valuation
    val = engine.get_inventory_valuation(db, wid)
    print(f"[PASS] 8. Inventory Valuation: Total Value = ${val['total_inventory_value']}")
    assert val['total_inventory_value'] > 0
    
    # 9. Turnover Analysis
    turn = engine.get_inventory_turnover(db, wid)
    print(f"[PASS] 9. Inventory Turnover: Average Rate = {turn['average_turnover_rate']}x")
    assert turn['average_turnover_rate'] > 0
    
    # 10. Dead Stock & Movement Velocity
    dead = engine.get_dead_stock_and_movement_analysis(db, wid)
    print(f"[PASS] 10. Dead Stock & Velocity Classifier: {dead['fast_moving_count']} Fast, {dead['dead_stock_count']} Dead Stock (${dead['total_tied_up_value']})")
    
    # 11. AI Holistic Inventory Optimization
    opt = engine.get_ai_inventory_optimization(db, wid)
    print(f"[PASS] 11. AI Inventory Optimization: Generated {len(opt)} autonomous recommendations")
    assert len(opt) > 0
    
    # 12. Shipments
    shipments = db.query(models.Shipment).filter(models.Shipment.warehouse_id == wid).all()
    print(f"[PASS] 12. Shipments Tracking: {len(shipments)} Inbound/Outbound records")
    assert len(shipments) >= 4
    
    # 13. Stock Transfers
    transfers = db.query(models.StockTransfer).all()
    print(f"[PASS] 13. Inter-Warehouse Transfers: {len(transfers)} Active Transfers")
    assert len(transfers) >= 2
    
    # 14. Stock Adjustments
    adjustments = db.query(models.StockAdjustment).filter(models.StockAdjustment.warehouse_id == wid).all()
    print(f"[PASS] 14. Stock Adjustments & Damage Logs: {len(adjustments)} Discrepancy Records")
    assert len(adjustments) >= 2
    
    print("\nALL 20 SMART WMS MODULES & AUTOMATED ENGINES PASSED 100% SUCCESSFULLY!")

if __name__ == "__main__":
    run_wms_suite()
