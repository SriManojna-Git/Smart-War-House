from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Auth & User Schemas ---
class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    organization_name: str
    warehouse_name: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    organization_id: Optional[int] = None
    warehouse_id: Optional[int] = None
    profile_photo: Optional[str] = None

    class Config:
        orm_mode = True

class WarehouseSetup(BaseModel):
    name: str
    location: str
    capacity: int
    zones_count: int
    operating_hours: str

# --- Business Entities ---
class ProductBase(BaseModel):
    sku: str
    name: str
    category: str
    zone_id: Optional[int] = None
    price: float
    reorder_point: int
    warehouse_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    class Config:
        orm_mode = True

class InventoryBase(BaseModel):
    product_id: int
    current_stock: int
    reserved_stock: int
    available_stock: int
    allocated_stock: int
    incoming_stock: int
    damaged_stock: int
    daily_demand: float
    status: str
    warehouse_id: Optional[int] = None

class Inventory(InventoryBase):
    id: int
    class Config:
        orm_mode = True

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    class Config:
        orm_mode = True

class OrderBase(BaseModel):
    customer_name: str
    deadline: Optional[datetime] = None
    status: str
    urgency: str
    customer_priority: str
    order_value: float
    priority_score: float
    delay_risk_score: str
    priority_factors: Optional[str] = None
    warehouse_id: Optional[int] = None

class OrderCreate(OrderBase):
    items: List[OrderItemBase]

class Order(OrderBase):
    id: int
    created_at: datetime
    items: List[OrderItem] = []
    class Config:
        orm_mode = True

class AllocationBase(BaseModel):
    order_id: int
    product_id: int
    allocated_quantity: int
    backordered_quantity: int
    status: str
    priority: str
    user_id: Optional[int] = None
    warehouse_zone_id: Optional[int] = None
    warehouse_id: Optional[int] = None

class Allocation(AllocationBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class RestockRequest(BaseModel):
    quantity: int
    expected_date: Optional[datetime] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None

class InventoryMovementBase(BaseModel):
    product_id: int
    type: str
    quantity: int
    user: str
    notes: Optional[str] = None
    warehouse_id: Optional[int] = None

class InventoryMovement(InventoryMovementBase):
    id: int
    timestamp: datetime
    class Config:
        orm_mode = True

class AIRecommendationBase(BaseModel):
    entity_type: str
    entity_id: int
    category: Optional[str] = "General"
    decision: Optional[str] = None
    situation: str
    impact: str
    data_considered: Optional[str] = None
    recommendation: str
    reasoning: str
    expected_outcome: str
    confidence: float
    status: str
    warehouse_id: Optional[int] = None

class AIRecommendation(AIRecommendationBase):
    id: int
    created_at: Optional[datetime] = None
    class Config:
        orm_mode = True

class AlertBase(BaseModel):
    severity: str
    message: str
    reason: str
    recommended_action: str
    is_read: bool
    warehouse_id: Optional[int] = None

class Alert(AlertBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class PickingTaskBase(BaseModel):
    order_id: int
    status: str
    estimated_time: float
    assigned_picker: str
    current_route_distance: Optional[float] = 250.0
    optimized_route_distance: Optional[float] = 175.0
    time_saved_minutes: Optional[float] = 4.5
    route_summary: Optional[str] = None
    warehouse_id: Optional[int] = None

class PickingTask(PickingTaskBase):
    id: int
    class Config:
        orm_mode = True

class PackingTaskBase(BaseModel):
    order_id: int
    status: str
    packaging_recommendation: str
    warehouse_id: Optional[int] = None

class PackingTask(PackingTaskBase):
    id: int
    class Config:
        orm_mode = True

class QualityCheckBase(BaseModel):
    order_id: int
    status: str
    issues_found: bool
    warehouse_id: Optional[int] = None

class QualityCheck(QualityCheckBase):
    id: int
    class Config:
        orm_mode = True

class DispatchBase(BaseModel):
    order_id: int
    status: str
    carrier: str
    shipment_id: str
    deadline: Optional[datetime]
    warehouse_id: Optional[int] = None

class Dispatch(DispatchBase):
    id: int
    class Config:
        orm_mode = True

class ExceptionRecordBase(BaseModel):
    type: str
    description: str
    severity: Optional[str] = "High"
    ai_analysis: Optional[str] = None
    recommended_action: Optional[str] = None
    related_entity_id: int
    entity_type: str
    status: str
    resolution: Optional[str] = None
    warehouse_id: Optional[int] = None

class ExceptionRecord(ExceptionRecordBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class AuditLogBase(BaseModel):
    user: str
    action: str
    entity: str
    entity_id: int
    previous_state: str
    new_state: str
    warehouse_id: Optional[int] = None

class AuditLog(AuditLogBase):
    id: int
    timestamp: datetime
    class Config:
        orm_mode = True

# --- Simulation & Impact Schemas ---
class SimulateRequest(BaseModel):
    scenario_id: Optional[int] = 1
    inventory_level_pct: Optional[int] = 100
    order_volume: Optional[int] = 50
    urgent_order_pct: Optional[int] = 25
    staff_count: Optional[int] = 10
    damaged_items_pct: Optional[int] = 3
    picking_capacity: Optional[int] = 100

class ReorderApproval(BaseModel):
    product_id: int
    quantity: int
    recommendation_id: Optional[int] = None
    supplier: Optional[str] = "Primary Supplier"
    notes: Optional[str] = "Auto-approved via AI Reorder Engine"

