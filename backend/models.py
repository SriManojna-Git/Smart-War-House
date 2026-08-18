from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from database import Base

class PriorityEnum(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class OrderStatus(str, enum.Enum):
    CREATED = "Created"
    PRIORITIZED = "Prioritized"
    INVENTORY_CHECKED = "Inventory Checked"
    ALLOCATED = "Allocated"
    PARTIALLY_ALLOCATED = "Partially Allocated"
    BACKORDERED = "Backordered"
    PICKING = "Picking"
    PACKING = "Packing"
    QC = "Quality Check"
    READY = "Ready"
    DISPATCHED = "Dispatched"
    DELIVERED = "Delivered"

class InventoryStatus(str, enum.Enum):
    HEALTHY = "Healthy"
    WATCH = "Watch"
    LOW = "Low"
    CRITICAL = "Critical"
    OUT_OF_STOCK = "Out of Stock"

class AlertSeverity(str, enum.Enum):
    INFO = "Info"
    WARNING = "Warning"
    CRITICAL = "Critical"

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    name = Column(String)
    location = Column(String)
    capacity = Column(Integer)
    zones_count = Column(Integer, default=1)
    operating_hours = Column(String)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="VIEWER")
    profile_photo = Column(String, nullable=True)

class WarehouseZone(Base):
    __tablename__ = "warehouse_zones"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    name = Column(String, unique=True) # A, B, C, D, E
    description = Column(String)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    sku = Column(String, unique=True, index=True)
    name = Column(String)
    category = Column(String)
    zone_id = Column(Integer, ForeignKey("warehouse_zones.id"))
    price = Column(Float)
    reorder_point = Column(Integer, default=20)
    
    zone = relationship("WarehouseZone")
    inventory = relationship("Inventory", back_populates="product", uselist=False)

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    current_stock = Column(Integer, default=0)
    reserved_stock = Column(Integer, default=0)
    available_stock = Column(Integer, default=0)
    allocated_stock = Column(Integer, default=0)
    incoming_stock = Column(Integer, default=0)
    damaged_stock = Column(Integer, default=0)
    daily_demand = Column(Float, default=1.0)
    status = Column(String, default=InventoryStatus.HEALTHY)
    
    product = relationship("Product", back_populates="inventory")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    customer_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    deadline = Column(DateTime)
    status = Column(String, default=OrderStatus.CREATED)
    urgency = Column(String, default=PriorityEnum.MEDIUM)
    customer_priority = Column(String, default=PriorityEnum.MEDIUM)
    order_value = Column(Float, default=0.0)
    priority_score = Column(Float, default=0.0)
    delay_risk_score = Column(String, default=PriorityEnum.LOW)
    priority_factors = Column(String, nullable=True) # JSON of factor breakdown & reason
    
    items = relationship("OrderItem", back_populates="order")
    allocations = relationship("Allocation", back_populates="order")
    tasks = relationship("PickingTask", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class Allocation(Base):
    __tablename__ = "allocations"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    allocated_quantity = Column(Integer, default=0)
    backordered_quantity = Column(Integer, default=0)
    status = Column(String, default="Pending")
    priority = Column(String, default="Medium")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    warehouse_zone_id = Column(Integer, ForeignKey("warehouse_zones.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order", back_populates="allocations")
    product = relationship("Product")

class PickingTask(Base):
    __tablename__ = "picking_tasks"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    status = Column(String, default="Pending")
    estimated_time = Column(Float)
    assigned_picker = Column(String)
    current_route_distance = Column(Float, default=250.0)
    optimized_route_distance = Column(Float, default=175.0)
    time_saved_minutes = Column(Float, default=4.5)
    route_summary = Column(String, nullable=True)
    
    order = relationship("Order", back_populates="tasks")

class PackingTask(Base):
    __tablename__ = "packing_tasks"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    status = Column(String, default="Waiting")
    packaging_recommendation = Column(String)

class QualityCheck(Base):
    __tablename__ = "quality_checks"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    status = Column(String, default="Pending")
    issues_found = Column(Boolean, default=False)

class Dispatch(Base):
    __tablename__ = "dispatches"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    status = Column(String, default="Pending")
    carrier = Column(String)
    shipment_id = Column(String)
    deadline = Column(DateTime)

class ExceptionRecord(Base):
    __tablename__ = "exceptions"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    type = Column(String) # Damaged Item, Missing Item, Stock Mismatch, etc.
    description = Column(String)
    severity = Column(String, default="High")
    ai_analysis = Column(String, nullable=True)
    recommended_action = Column(String, nullable=True)
    related_entity_id = Column(Integer) # Order ID or Product ID
    entity_type = Column(String)
    status = Column(String, default="Open")
    created_at = Column(DateTime, default=datetime.utcnow)
    resolution = Column(String)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    severity = Column(String, default=AlertSeverity.INFO)
    message = Column(String)
    reason = Column(String)
    recommended_action = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    entity_type = Column(String) # Order, Inventory, Warehouse, Route, Exception
    entity_id = Column(Integer)
    category = Column(String, default="General") # Allocation, Stockout, Bottleneck, Routing, Exception
    decision = Column(String, nullable=True) # Explicit Decision header
    situation = Column(String)
    impact = Column(String)
    data_considered = Column(String, nullable=True) # List/Summary of input factors
    recommendation = Column(String)
    reasoning = Column(String)
    expected_outcome = Column(String)
    confidence = Column(Float)
    status = Column(String, default="Pending") # Applied, Dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

class DemandHistory(Base):
    __tablename__ = "demand_history"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    date = Column(DateTime, default=datetime.utcnow)
    quantity_sold = Column(Integer)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = Column(String)
    action = Column(String)
    entity = Column(String)
    entity_id = Column(Integer)
    previous_state = Column(String)
    new_state = Column(String)

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    type = Column(String) # Restocked, Allocated, Released, Picked, Dispatched, Damaged, Manual Adjustment
    quantity = Column(Integer)
    user = Column(String)
    notes = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

# =========================================================================
# ENTERPRISE WMS EXPANSION MODELS
# =========================================================================

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    name = Column(String)
    company = Column(String)
    email = Column(String)
    phone = Column(String)
    category = Column(String)
    rating = Column(Float, default=4.8)
    lead_time_days = Column(Integer, default=7)
    delivery_performance = Column(Float, default=96.5)
    status = Column(String, default="Active") # Active, Preferred, On Review
    address = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    po_number = Column(String, unique=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    order_date = Column(DateTime, default=datetime.utcnow)
    expected_delivery = Column(DateTime)
    total_amount = Column(Float, default=0.0)
    status = Column(String, default="Created") # Draft, Created, Approved, Ordered, Partially Received, Received, Closed
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    received_quantity = Column(Integer, default=0)
    unit_price = Column(Float)
    total_price = Column(Float)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")

class ProductBatch(Base):
    __tablename__ = "product_batches"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"), index=True)
    batch_number = Column(String, index=True)
    mfg_date = Column(DateTime)
    expiry_date = Column(DateTime)
    quantity = Column(Integer, default=0)
    location_code = Column(String)
    status = Column(String, default="Valid") # Valid, Near Expiry, Expired
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product")

class StorageLocation(Base):
    __tablename__ = "storage_locations"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    zone_name = Column(String) # Zone A, Zone B, Zone C, Zone D, Zone E
    rack_code = Column(String) # R01, R02...
    shelf_level = Column(String) # S1, S2, S3...
    bin_code = Column(String) # B01, B02...
    location_code = Column(String, unique=True, index=True) # Z-A-R01-S1-B01
    capacity_units = Column(Integer, default=100)
    occupied_units = Column(Integer, default=0)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    status = Column(String, default="Available") # Available, Full, Maintenance

    product = relationship("Product")

class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    shipment_number = Column(String, unique=True, index=True)
    type = Column(String) # Inbound, Outbound
    carrier = Column(String) # DHL Express, FedEx Logistics, Freight Master
    tracking_number = Column(String)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    origin = Column(String)
    destination = Column(String)
    expected_date = Column(DateTime)
    actual_date = Column(DateTime, nullable=True)
    status = Column(String, default="In Transit") # Scheduled, In Transit, Customs, Out for Delivery, Received, Delivered
    items_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class StockTransfer(Base):
    __tablename__ = "stock_transfers"
    id = Column(Integer, primary_key=True, index=True)
    transfer_number = Column(String, unique=True, index=True)
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    destination_warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    request_date = Column(DateTime, default=datetime.utcnow)
    completion_date = Column(DateTime, nullable=True)
    status = Column(String, default="Requested") # Requested, Approved, In Transit, Received, Completed
    requested_by = Column(String)
    notes = Column(String, nullable=True)

    product = relationship("Product")

class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity_change = Column(Integer) # +20 or -5
    reason = Column(String) # Damaged, Lost, Expired, Incorrect Count, Returned, Manual Correction
    adjusted_by = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    notes = Column(String, nullable=True)
    batch_id = Column(Integer, ForeignKey("product_batches.id"), nullable=True)

    product = relationship("Product")


