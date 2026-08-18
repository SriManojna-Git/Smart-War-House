import os, sys
os.environ["PYTHONPATH"] = "."
sys.stdout.reconfigure(encoding='utf-8')
from database import engine as db_engine, SessionLocal, Base
import models
from datetime import datetime, timedelta
import random

def migrate_and_seed_v3():
    print("Creating enterprise WMS tables in smartfulfill.db...")
    Base.metadata.create_all(bind=db_engine)
    
    db = SessionLocal()
    warehouse = db.query(models.Warehouse).first()
    if not warehouse:
        print("No warehouse found!")
        return
    wid = warehouse.id
    products = db.query(models.Product).filter(models.Product.warehouse_id == wid).all()
    
    # 1. Seed Suppliers
    if db.query(models.Supplier).count() == 0:
        print("Seeding Suppliers...")
        suppliers_data = [
            {"name": "Apex Global Components", "company": "Apex Global Inc.", "email": "procurement@apexglobal.com", "phone": "+1-800-555-0199", "category": "Electronics & Sensors", "rating": 4.9, "lead_time_days": 5, "delivery_performance": 98.4, "status": "Preferred", "address": "104 Tech Parkway, San Jose, CA"},
            {"name": "Nordic Industrial Logistics", "company": "Nordic Ind. AB", "email": "sales@nordicindustrial.com", "phone": "+46-8-555-1234", "category": "Mechanical & Fasteners", "rating": 4.7, "lead_time_days": 8, "delivery_performance": 96.1, "status": "Active", "address": "Hamngatan 12, Stockholm, Sweden"},
            {"name": "Pacific Precision Materials", "company": "Pacific Materials Corp", "email": "orders@pacificprecision.com", "phone": "+65-6789-0123", "category": "Packaging & Raw Stock", "rating": 4.6, "lead_time_days": 10, "delivery_performance": 94.8, "status": "Active", "address": "8 Marina View, Singapore"},
            {"name": "Titanium Heavy Supplies", "company": "Titanium LLC", "email": "contact@titaniumheavy.com", "phone": "+1-312-555-7890", "category": "Robotics & AGV Parts", "rating": 4.8, "lead_time_days": 6, "delivery_performance": 97.2, "status": "Preferred", "address": "400 W Madison St, Chicago, IL"}
        ]
        for s in suppliers_data:
            sup = models.Supplier(warehouse_id=wid, **s)
            db.add(sup)
        db.commit()
    
    suppliers = db.query(models.Supplier).filter(models.Supplier.warehouse_id == wid).all()
    
    # 2. Seed Storage Locations (Bin Hierarchy)
    if db.query(models.StorageLocation).count() == 0:
        print("Seeding Storage Locations & Bins...")
        zones = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"]
        loc_index = 0
        for z in zones:
            for r in range(1, 4): # Rack 1..3
                for s in range(1, 4): # Shelf 1..3
                    for b in range(1, 4): # Bin 1..3
                        loc_code = f"Z-{z[-1]}-R{r:02d}-S{s}-B{b:02d}"
                        p = products[loc_index % len(products)] if products else None
                        loc_index += 1
                        loc = models.StorageLocation(
                            warehouse_id=wid,
                            zone_name=z,
                            rack_code=f"R{r:02d}",
                            shelf_level=f"S{s}",
                            bin_code=f"B{b:02d}",
                            location_code=loc_code,
                            capacity_units=150,
                            occupied_units=random.randint(40, 130),
                            product_id=p.id if p else None,
                            status="Available" if random.random() > 0.1 else "Full"
                        )
                        db.add(loc)
        db.commit()
        
    # 3. Seed Product Batches & Expiry
    if db.query(models.ProductBatch).count() == 0:
        print("Seeding Product Batches & Expiry Dates...")
        now = datetime.utcnow()
        batch_seq = 100
        for p in products:
            # Create 1 Valid, 1 Near Expiry, 1 Expired for variety
            batches = [
                {"batch_number": f"BAT-2026-{batch_seq}", "mfg_date": now - timedelta(days=60), "expiry_date": now + timedelta(days=240), "qty": 80, "status": "Valid"},
                {"batch_number": f"BAT-2026-{batch_seq+1}", "mfg_date": now - timedelta(days=120), "expiry_date": now + timedelta(days=15), "qty": 25, "status": "Near Expiry"},
                {"batch_number": f"BAT-2026-{batch_seq+2}", "mfg_date": now - timedelta(days=200), "expiry_date": now - timedelta(days=10), "qty": 12, "status": "Expired"}
            ]
            batch_seq += 3
            for b in batches:
                pb = models.ProductBatch(
                    warehouse_id=wid,
                    product_id=p.id,
                    batch_number=b["batch_number"],
                    mfg_date=b["mfg_date"],
                    expiry_date=b["expiry_date"],
                    quantity=b["qty"],
                    location_code=f"Z-A-R01-S1-B01",
                    status=b["status"]
                )
                db.add(pb)
        db.commit()
        
    # 4. Seed Purchase Orders
    if db.query(models.PurchaseOrder).count() == 0 and suppliers:
        print("Seeding Purchase Orders...")
        now = datetime.utcnow()
        po_statuses = ["Draft", "Created", "Approved", "Ordered", "Partially Received", "Received", "Closed"]
        for i, st in enumerate(po_statuses):
            po_num = f"PO-2026-{1000 + i}"
            sup = suppliers[i % len(suppliers)]
            p = products[i % len(products)] if products else None
            unit_p = p.price * 0.6 if p else 45.0
            qty = random.randint(50, 200)
            tot = qty * unit_p
            
            po = models.PurchaseOrder(
                warehouse_id=wid,
                po_number=po_num,
                supplier_id=sup.id,
                order_date=now - timedelta(days=i*2),
                expected_delivery=now + timedelta(days=5 - i),
                total_amount=tot,
                status=st,
                notes=f"Procurement cycle for {p.name if p else 'Core Stock'}"
            )
            db.add(po)
            db.commit()
            db.refresh(po)
            
            item = models.PurchaseOrderItem(
                po_id=po.id,
                product_id=p.id if p else 1,
                quantity=qty,
                received_quantity=qty if st in ["Received", "Closed"] else (qty // 2 if st == "Partially Received" else 0),
                unit_price=unit_p,
                total_price=tot
            )
            db.add(item)
        db.commit()
        
    # 5. Seed Shipments (Inbound & Outbound)
    if db.query(models.Shipment).count() == 0:
        print("Seeding Shipments...")
        now = datetime.utcnow()
        shipments_data = [
            {"shipment_number": "SHP-INB-9841", "type": "Inbound", "carrier": "DHL Freight Express", "tracking_number": "DHL-984102941", "origin": "Apex Global Port, CA", "destination": "Main Warehouse Dock A", "status": "In Transit", "expected_date": now + timedelta(days=2)},
            {"shipment_number": "SHP-INB-9842", "type": "Inbound", "carrier": "FedEx Logistics Hub", "tracking_number": "FDX-774910284", "origin": "Nordic Ind Hub, Stockholm", "destination": "Main Warehouse Dock B", "status": "Customs", "expected_date": now + timedelta(days=4)},
            {"shipment_number": "SHP-OUT-5510", "type": "Outbound", "carrier": "UPS Worldwide", "tracking_number": "1Z9999999999999999", "origin": "Main Warehouse Bay 4", "destination": "Amazon Fulfillment Center West", "status": "Out for Delivery", "expected_date": now + timedelta(hours=8)},
            {"shipment_number": "SHP-OUT-5511", "type": "Outbound", "carrier": "Freight Master AGV", "tracking_number": "FM-330194821", "origin": "Main Warehouse Bay 1", "destination": "Regional Logistics Center East", "status": "Delivered", "expected_date": now - timedelta(days=1), "actual_date": now - timedelta(days=1)}
        ]
        for sh in shipments_data:
            s = models.Shipment(warehouse_id=wid, **sh)
            db.add(s)
        db.commit()
        
    # 6. Seed Stock Transfers
    if db.query(models.StockTransfer).count() == 0:
        print("Seeding Stock Transfers...")
        now = datetime.utcnow()
        transfers_data = [
            {"transfer_number": "TRF-2026-001", "source_warehouse_id": wid, "destination_warehouse_id": wid, "product_id": products[0].id if products else 1, "quantity": 30, "status": "In Transit", "requested_by": "Senior Operations Lead", "notes": "Rebalancing buffer stock to East Wing"},
            {"transfer_number": "TRF-2026-002", "source_warehouse_id": wid, "destination_warehouse_id": wid, "product_id": products[1].id if len(products) > 1 else 1, "quantity": 50, "status": "Completed", "requested_by": "AI Automated Rebalance", "notes": "Completed automated inter-zone replenishment"}
        ]
        for tr in transfers_data:
            t = models.StockTransfer(**tr)
            db.add(t)
        db.commit()
        
    # 7. Seed Stock Adjustments & Damage History
    if db.query(models.StockAdjustment).count() == 0:
        print("Seeding Stock Adjustments & Damage Records...")
        now = datetime.utcnow()
        adjustments_data = [
            {"product_id": products[0].id if products else 1, "quantity_change": -3, "reason": "Damaged", "adjusted_by": "QC Inspector #4", "notes": "Cracked packaging found during receiving inspection"},
            {"product_id": products[1].id if len(products) > 1 else 1, "quantity_change": 5, "reason": "Manual Correction", "adjusted_by": "Inventory Lead", "notes": "Cycle count reconciliation found unrecorded buffer unit"}
        ]
        for adj in adjustments_data:
            a = models.StockAdjustment(warehouse_id=wid, **adj)
            db.add(a)
        db.commit()
        
    print("Database migration & V3 enterprise seeding completed successfully!")

if __name__ == "__main__":
    migrate_and_seed_v3()
