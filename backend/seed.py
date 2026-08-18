from database import SessionLocal, engine, Base
import models, auth
from datetime import datetime, timedelta
import random

def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # 0. Create Demo Organization, Warehouse, and User
    org = models.Organization(name="Demo Organization")
    db.add(org)
    db.commit()
    
    warehouse = models.Warehouse(
        organization_id=org.id,
        name="Demo Warehouse Main",
        location="New York, NY",
        capacity=10000,
        zones_count=5,
        operating_hours="24/7"
    )
    db.add(warehouse)
    db.commit()
    
    demo_user = models.User(
        full_name="Demo Admin",
        organization_id=org.id,
        warehouse_id=warehouse.id,
        username="demo@smartfulfill.ai",
        email="demo@smartfulfill.ai",
        hashed_password=auth.get_password_hash("demo"),
        role="ADMIN"
    )
    db.add(demo_user)
    db.commit()
    
    wid = warehouse.id

    # 1. Create Warehouse Zones
    zones = [
        models.WarehouseZone(warehouse_id=wid, name="Zone A", description="High-Velocity Items (Electronics)"),
        models.WarehouseZone(warehouse_id=wid, name="Zone B", description="Medium-Velocity Items (Apparel)"),
        models.WarehouseZone(warehouse_id=wid, name="Zone C", description="Low-Velocity Items (Furniture)"),
        models.WarehouseZone(warehouse_id=wid, name="Zone D", description="Cold Storage"),
        models.WarehouseZone(warehouse_id=wid, name="Zone E", description="Hazardous Materials")
    ]
    db.add_all(zones)
    db.commit()
    
    # 2. Create Products & Inventory
    categories = ["Electronics", "Apparel", "Home & Garden", "Sports", "Beauty"]
    products = []
    inventories = []
    
    for i in range(1, 101):
        zone_id = random.choice(zones).id
        category = random.choice(categories)
        product = models.Product(
            warehouse_id=wid,
            sku=f"SKU-{i:04d}",
            name=f"{category} Product {i}",
            category=category,
            zone_id=zone_id,
            price=round(random.uniform(10.0, 500.0), 2),
            reorder_point=random.randint(10, 50)
        )
        products.append(product)
        db.add(product)
    
    db.commit() # Commit to get IDs
    
    for product in products:
        stock_scenario = random.choices(
            ["high", "healthy", "low", "out"],
            weights=[0.3, 0.4, 0.2, 0.1]
        )[0]
        
        current_stock = 0
        status = models.InventoryStatus.HEALTHY
        
        if stock_scenario == "high":
            current_stock = random.randint(100, 300)
        elif stock_scenario == "healthy":
            current_stock = random.randint(50, 100)
        elif stock_scenario == "low":
            current_stock = random.randint(1, product.reorder_point)
            status = models.InventoryStatus.LOW
        else:
            current_stock = 0
            status = models.InventoryStatus.OUT_OF_STOCK
            
        inventory = models.Inventory(
            warehouse_id=wid,
            product_id=product.id,
            current_stock=current_stock,
            available_stock=current_stock,
            reserved_stock=0,
            incoming_stock=random.randint(0, 50) if stock_scenario in ["low", "out"] else 0,
            daily_demand=round(random.uniform(0.5, 10.0), 1),
            status=status
        )
        inventories.append(inventory)
        db.add(inventory)
        
    db.commit()

    # 3. Create Orders
    customers = ["Acme Corp", "Global Tech", "Stark Industries", "Wayne Enterprises", "Umbrella Corp", "Individual"]
    urgencies = [models.PriorityEnum.LOW, models.PriorityEnum.MEDIUM, models.PriorityEnum.HIGH, models.PriorityEnum.CRITICAL]
    
    for i in range(1, 51):
        urgency = random.choices(urgencies, weights=[0.4, 0.3, 0.2, 0.1])[0]
        order = models.Order(
            warehouse_id=wid,
            customer_name=random.choice(customers),
            deadline=datetime.utcnow() + timedelta(days=random.randint(-1, 14)),
            status=models.OrderStatus.CREATED,
            urgency=urgency,
            customer_priority=random.choice(urgencies),
            order_value=round(random.uniform(50.0, 5000.0), 2)
        )
        db.add(order)
        db.commit()
        
        num_items = random.randint(1, 5)
        for _ in range(num_items):
            product = random.choice(products)
            item = models.OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=random.randint(1, 15)
            )
            db.add(item)
    
    db.commit()
    
    for product in products:
        for days_ago in range(30):
            dh = models.DemandHistory(
                warehouse_id=wid,
                product_id=product.id,
                date=datetime.utcnow() - timedelta(days=days_ago),
                quantity_sold=random.randint(0, int(product.inventory.daily_demand * 2))
            )
            db.add(dh)
            
    db.commit()
    print("Database seeded successfully with realistic data for Demo Warehouse!")
    db.close()

if __name__ == "__main__":
    reset_db()
    seed_data()
