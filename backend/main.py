from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
import json
from datetime import datetime, timedelta

import models, schemas, engine, auth
from database import engine as db_engine, get_db

models.Base.metadata.create_all(bind=db_engine)

app = FastAPI(title="SmartFulfill AI Enterprise Warehouse Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "SmartFulfill AI Enterprise Platform Live"}

# --- Authentication ---
@app.post("/api/auth/register", response_model=schemas.UserBase)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    org = models.Organization(name=user.organization_name)
    db.add(org)
    db.commit()
    db.refresh(org)
    
    warehouse = models.Warehouse(
        organization_id=org.id,
        name=user.warehouse_name,
        location="Default Location",
        capacity=1000,
        zones_count=1,
        operating_hours="9 AM - 5 PM"
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        username=user.email,
        hashed_password=hashed_password,
        organization_id=org.id,
        warehouse_id=warehouse.id,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserBase)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# --- Dashboard & Command Center ---
@app.get("/api/dashboard/kpi")
def get_kpis(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    wid = current_user.warehouse_id
    total_orders = db.query(models.Order).filter(models.Order.warehouse_id == wid).count()
    pending_orders = db.query(models.Order).filter(models.Order.warehouse_id == wid, models.Order.status != models.OrderStatus.DELIVERED).count()
    orders_at_risk = db.query(models.Order).filter(models.Order.warehouse_id == wid, models.Order.delay_risk_score.in_([models.PriorityEnum.HIGH, models.PriorityEnum.CRITICAL])).count()
    critical_exceptions = db.query(models.ExceptionRecord).filter(models.ExceptionRecord.warehouse_id == wid, models.ExceptionRecord.status == "Open").count()
    
    # Calculate real stockout risks
    inventories = db.query(models.Inventory).filter(models.Inventory.warehouse_id == wid).all()
    stockout_risks = [engine.calculate_stockout_prediction(inv) for inv in inventories if engine.calculate_stockout_prediction(inv)["stockout_risk"] in ["HIGH", "CRITICAL"]]
    
    # Critical Actions Required
    pending_recs = db.query(models.AIRecommendation).filter(models.AIRecommendation.warehouse_id == wid, models.AIRecommendation.status == "Pending").all()
    critical_actions = []
    for r in pending_recs[:4]:
        critical_actions.append({
            "id": r.id,
            "category": r.category or "Action Required",
            "title": r.decision or r.recommendation,
            "situation": r.situation,
            "impact": r.impact,
            "confidence": r.confidence
        })
        
    # Fulfillment rate
    delivered_orders = db.query(models.Order).filter(models.Order.warehouse_id == wid, models.Order.status.in_([models.OrderStatus.DELIVERED, models.OrderStatus.DISPATCHED, models.OrderStatus.READY])).count()
    fulfillment_rate = round((delivered_orders / max(1, total_orders)) * 100, 1) if total_orders > 0 else 94.2
    
    # Calculate intelligence score
    intelligence_score = 92
    if critical_exceptions > 2: intelligence_score -= 8
    if len(stockout_risks) > 2: intelligence_score -= 10
    if orders_at_risk > 3: intelligence_score -= 6
    intelligence_score = max(50, intelligence_score)
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "orders_at_risk": orders_at_risk,
        "fulfillment_rate": fulfillment_rate,
        "critical_exceptions": critical_exceptions,
        "low_stock_items": len(stockout_risks),
        "warehouse_intelligence_score": intelligence_score,
        "critical_actions_count": len(pending_recs),
        "critical_actions": critical_actions
    }

@app.get("/api/warehouse/zones-heatmap")
def get_zones_heatmap(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.get_zone_heatmap_data(db, current_user.warehouse_id)

@app.get("/api/dashboard/impact-kpis")
def get_impact_kpis(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.get_operations_impact_kpis(db, current_user.warehouse_id)

# --- Inventory & Predictive Stockout ---
@app.get("/api/inventory", response_model=List[schemas.Inventory])
def get_inventory(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER", "INVENTORY_MANAGER", "VIEWER"]))):
    return db.query(models.Inventory).filter(models.Inventory.warehouse_id == current_user.warehouse_id).all()

@app.get("/api/inventory/predictions")
def get_inventory_predictions(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER", "INVENTORY_MANAGER", "VIEWER"]))):
    inventories = db.query(models.Inventory).filter(models.Inventory.warehouse_id == current_user.warehouse_id).all()
    return [engine.calculate_stockout_prediction(inv) for inv in inventories]

@app.post("/api/inventory/{product_id}/restock")
def restock_inventory(product_id: int, request: schemas.RestockRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER", "INVENTORY_MANAGER"]))):
    inventory = db.query(models.Inventory).filter(models.Inventory.product_id == product_id, models.Inventory.warehouse_id == current_user.warehouse_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    inventory.current_stock += request.quantity
    inventory.available_stock += request.quantity
    
    if inventory.available_stock >= (inventory.product.reorder_point if inventory.product else 20):
        inventory.status = models.InventoryStatus.HEALTHY
        
    movement = models.InventoryMovement(
        warehouse_id=current_user.warehouse_id,
        product_id=product_id,
        type="Restocked",
        quantity=request.quantity,
        user=current_user.full_name,
        notes=f"Supplier: {request.supplier or 'Primary Supplier'} | {request.notes or 'Restock Inbound'}"
    )
    db.add(movement)
    
    engine.create_audit_log(db, current_user.warehouse_id, current_user.full_name, "Restock Received", "Inventory", inventory.id, "Depleted", f"+{request.quantity} Units Restocked")
    db.commit()
    return {"message": "Restocked successfully", "new_available": inventory.available_stock}

# --- Allocation & Tracking ---
@app.get("/api/allocations")
def get_allocations(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER", "INVENTORY_MANAGER", "VIEWER"]))):
    allocations = db.query(models.Allocation).filter(models.Allocation.warehouse_id == current_user.warehouse_id).order_by(models.Allocation.created_at.desc()).all()
    result = []
    for alloc in allocations:
        product = db.query(models.Product).filter(models.Product.id == alloc.product_id).first()
        zone = db.query(models.WarehouseZone).filter(models.WarehouseZone.id == alloc.warehouse_zone_id).first() if alloc.warehouse_zone_id else (product.zone if product else None)
        user = db.query(models.User).filter(models.User.id == alloc.user_id).first() if alloc.user_id else None
        
        result.append({
            "id": alloc.id,
            "order_id": alloc.order_id,
            "sku": product.sku if product else "Unknown",
            "product_name": product.name if product else "Unknown",
            "allocated_quantity": alloc.allocated_quantity,
            "backordered_quantity": alloc.backordered_quantity or 0,
            "priority": alloc.priority or "Medium",
            "status": alloc.status or "Allocated",
            "warehouse_zone": zone.name if zone else "Zone A",
            "user": user.full_name if user else "AI Smart Allocation",
            "timestamp": alloc.created_at
        })
    return result

@app.get("/api/orders")
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    orders = db.query(models.Order).filter(models.Order.warehouse_id == current_user.warehouse_id).order_by(models.Order.priority_score.desc()).all()
    result = []
    for o in orders:
        if not o.priority_factors:
            score, risk, factors_json, _ = engine.calculate_priority_score_details(o)
            o.priority_score = score
            o.delay_risk_score = risk
            o.priority_factors = factors_json
            
        sla_info = engine.calculate_order_sla(o)
        o_dict = {
            "id": o.id,
            "warehouse_id": o.warehouse_id,
            "customer_name": o.customer_name,
            "created_at": o.created_at,
            "deadline": o.deadline,
            "status": o.status,
            "urgency": o.urgency,
            "customer_priority": o.customer_priority,
            "order_value": o.order_value,
            "priority_score": o.priority_score,
            "delay_risk_score": o.delay_risk_score,
            "priority_factors": o.priority_factors,
            "sla_status": sla_info["sla_status"],
            "remaining_label": sla_info["remaining_label"],
            "is_at_risk": sla_info["is_at_risk"]
        }
        result.append(o_dict)
        
    db.commit()
    return result

@app.get("/api/orders/{order_id}/recovery")
def get_order_recovery(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == order_id, models.Order.warehouse_id == current_user.warehouse_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return engine.generate_order_recovery_suggestion(db, order)

class OrderRecoveryAction(BaseModel):
    action_type: str

@app.post("/api/orders/{order_id}/apply-recovery")
def apply_order_recovery(order_id: int, body: OrderRecoveryAction, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER"]))):
    return engine.execute_order_recovery(db, current_user.warehouse_id, order_id, body.action_type, current_user.full_name)

@app.get("/api/orders/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == order_id, models.Order.warehouse_id == current_user.warehouse_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.get("/api/orders/{order_id}/timeline")
def get_order_timeline(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == order_id, models.Order.warehouse_id == current_user.warehouse_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    logs = db.query(models.AuditLog).filter(
        models.AuditLog.warehouse_id == current_user.warehouse_id,
        models.AuditLog.entity == "Order",
        models.AuditLog.entity_id == order.id
    ).order_by(models.AuditLog.timestamp.asc()).all()
    
    stages = [
        {"stage": "Order Created", "status": "Completed", "timestamp": order.created_at, "user": "Customer System"},
        {"stage": "Priority Determined", "status": "Completed" if order.priority_score > 0 else "Pending", "timestamp": order.created_at, "user": "AI Priority Engine", "detail": f"Score {order.priority_score:.0f}/100 ({order.urgency})"},
        {"stage": "Inventory Checked", "status": "Completed" if order.status != models.OrderStatus.CREATED else "Pending", "timestamp": order.created_at, "user": "Inventory Service"},
        {"stage": "Allocation Decision", "status": "Completed" if order.status not in [models.OrderStatus.CREATED, models.OrderStatus.PRIORITIZED] else "Pending", "timestamp": order.created_at, "user": "AI Smart Allocation"},
        {"stage": "Picking", "status": "Completed" if order.status in [models.OrderStatus.PACKING, models.OrderStatus.READY, models.OrderStatus.DISPATCHED, models.OrderStatus.DELIVERED] else ("In Progress" if order.status == models.OrderStatus.PICKING else "Pending"), "timestamp": None, "user": "Picker"},
        {"stage": "Packing", "status": "Completed" if order.status in [models.OrderStatus.READY, models.OrderStatus.DISPATCHED, models.OrderStatus.DELIVERED] else ("In Progress" if order.status == models.OrderStatus.PACKING else "Pending"), "timestamp": None, "user": "Packer"},
        {"stage": "Quality Check", "status": "Completed" if order.status in [models.OrderStatus.READY, models.OrderStatus.DISPATCHED, models.OrderStatus.DELIVERED] else "Pending", "timestamp": None, "user": "QC Inspector"},
        {"stage": "Dispatch", "status": "Completed" if order.status == models.OrderStatus.DELIVERED else ("In Progress" if order.status == models.OrderStatus.DISPATCHED else "Pending"), "timestamp": None, "user": "Carrier Logistics"}
    ]
    
    factors = []
    if order.priority_factors:
        try:
            factors = json.loads(order.priority_factors)
        except:
            pass
            
    return {
        "order": {
            "id": order.id,
            "customer_name": order.customer_name,
            "urgency": order.urgency,
            "order_value": order.order_value,
            "status": order.status,
            "priority_score": order.priority_score,
            "delay_risk": order.delay_risk_score,
            "created_at": order.created_at
        },
        "stages": stages,
        "audit_logs": [{"action": l.action, "user": l.user, "timestamp": l.timestamp, "previous": l.previous_state, "new": l.new_state} for l in logs],
        "priority_factors": factors
    }

@app.post("/api/orders/{order_id}/allocate")
def allocate_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER", "INVENTORY_MANAGER"]))):
    order = db.query(models.Order).filter(models.Order.id == order_id, models.Order.warehouse_id == current_user.warehouse_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    engine.check_inventory_and_generate_recommendation(db, order)
    success = engine.run_allocation(db, order)
    if success:
        return {"message": "Order fully allocated", "status": "allocated"}
    else:
        return {"message": "Order partially allocated / backordered based on available inventory", "status": "partial"}

# --- Workflow Operations ---
@app.get("/api/picking", response_model=List[schemas.PickingTask])
def get_picking_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.PickingTask).filter(models.PickingTask.warehouse_id == current_user.warehouse_id).all()

@app.post("/api/picking/{task_id}/complete")
def complete_picking(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER", "PICKER"]))):
    task = db.query(models.PickingTask).filter(models.PickingTask.id == task_id, models.PickingTask.warehouse_id == current_user.warehouse_id).first()
    if not task:
        raise HTTPException(status_code=404)
    task.status = "Completed"
    order = db.query(models.Order).filter(models.Order.id == task.order_id).first()
    if order:
        order.status = models.OrderStatus.PICKING
        engine.create_audit_log(db, current_user.warehouse_id, current_user.full_name, "Pick Items Complete", "Order", order.id, "Allocated", "Picking")
        
        pt = models.PackingTask(warehouse_id=current_user.warehouse_id, order_id=order.id, status="Waiting", packaging_recommendation="Standard Box M")
        db.add(pt)
    db.commit()
    return {"message": "Picking completed"}

@app.get("/api/packing", response_model=List[schemas.PackingTask])
def get_packing_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.PackingTask).filter(models.PackingTask.warehouse_id == current_user.warehouse_id).all()

@app.post("/api/packing/{task_id}/complete")
def complete_packing(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER", "PICKER"]))):
    task = db.query(models.PackingTask).filter(models.PackingTask.id == task_id, models.PackingTask.warehouse_id == current_user.warehouse_id).first()
    if not task:
        raise HTTPException(status_code=404)
    task.status = "Completed"
    order = db.query(models.Order).filter(models.Order.id == task.order_id).first()
    if order:
        order.status = models.OrderStatus.PACKING
        engine.create_audit_log(db, current_user.warehouse_id, current_user.full_name, "Pack Items Complete", "Order", order.id, "Picking", "Packing")
        
        qc = models.QualityCheck(warehouse_id=current_user.warehouse_id, order_id=order.id, status="Pending", issues_found=False)
        db.add(qc)
    db.commit()
    return {"message": "Packing completed"}

@app.get("/api/qc", response_model=List[schemas.QualityCheck])
def get_qc_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.QualityCheck).filter(models.QualityCheck.warehouse_id == current_user.warehouse_id).all()

class QCResult(BaseModel):
    passed: bool
    issue_description: str = ""

@app.post("/api/qc/{task_id}/complete")
def complete_qc(task_id: int, result: QCResult, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER", "PICKER"]))):
    task = db.query(models.QualityCheck).filter(models.QualityCheck.id == task_id, models.QualityCheck.warehouse_id == current_user.warehouse_id).first()
    if not task:
        raise HTTPException(status_code=404)
        
    order = db.query(models.Order).filter(models.Order.id == task.order_id).first()
    if result.passed:
        task.status = "Passed"
        if order:
            order.status = models.OrderStatus.READY
            engine.create_audit_log(db, current_user.warehouse_id, current_user.full_name, "QC Passed", "Order", order.id, "Packing", "Ready")
            disp = models.Dispatch(warehouse_id=current_user.warehouse_id, order_id=order.id, status="Pending", carrier="Standard Logistics", shipment_id=f"TRK-{order.id}99")
            db.add(disp)
    else:
        task.status = "Failed"
        task.issues_found = True
        if order:
            exc = models.ExceptionRecord(
                warehouse_id=current_user.warehouse_id,
                type="QC Failure",
                description=result.issue_description or "Product inspection defect found.",
                severity="High",
                ai_analysis="Damaged item detected during stage QC. Recommend pulling buffer replacement unit.",
                recommended_action="Auto-allocate replacement unit from reserved buffer stock immediately.",
                related_entity_id=order.id,
                entity_type="Order",
                status="Open"
            )
            db.add(exc)
            engine.create_audit_log(db, current_user.warehouse_id, current_user.full_name, "QC Exception Logged", "Order", order.id, "Packing", "QC Failed")
    db.commit()
    return {"message": "QC processed"}

@app.get("/api/dispatch", response_model=List[schemas.Dispatch])
def get_dispatch_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Dispatch).filter(models.Dispatch.warehouse_id == current_user.warehouse_id).all()

@app.post("/api/dispatch/{task_id}/complete")
def complete_dispatch(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER", "PICKER"]))):
    task = db.query(models.Dispatch).filter(models.Dispatch.id == task_id, models.Dispatch.warehouse_id == current_user.warehouse_id).first()
    if not task:
        raise HTTPException(status_code=404)
    task.status = "Dispatched"
    order = db.query(models.Order).filter(models.Order.id == task.order_id).first()
    if order:
        order.status = models.OrderStatus.DISPATCHED
        engine.create_audit_log(db, current_user.warehouse_id, current_user.full_name, "Dispatch Complete", "Order", order.id, "Ready", "Dispatched")
        for item in order.items:
            inventory = db.query(models.Inventory).filter(models.Inventory.product_id == item.product_id).first()
            if inventory:
                inventory.current_stock = max(0, inventory.current_stock - item.quantity)
                inventory.reserved_stock = max(0, inventory.reserved_stock - item.quantity)
    db.commit()
    return {"message": "Dispatched"}

# --- Exceptions Command Center ---
@app.get("/api/exceptions", response_model=List[schemas.ExceptionRecord])
def get_exceptions(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.ExceptionRecord).filter(models.ExceptionRecord.warehouse_id == current_user.warehouse_id).order_by(models.ExceptionRecord.created_at.desc()).all()

class ExceptionResolution(BaseModel):
    resolution: str

@app.post("/api/exceptions/{exc_id}/resolve")
def resolve_exception_route(exc_id: int, body: ExceptionResolution, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER"]))):
    engine.resolve_exception(db, current_user.warehouse_id, current_user.full_name, exc_id, body.resolution)
    return {"message": "Exception Resolved Successfully"}

# --- Explainable AI Decisions ---
@app.get("/api/recommendations", response_model=List[schemas.AIRecommendation])
def get_recommendations(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.AIRecommendation).filter(models.AIRecommendation.warehouse_id == current_user.warehouse_id, models.AIRecommendation.status == "Pending").order_by(models.AIRecommendation.created_at.desc()).all()

@app.get("/api/recommendations/history")
def get_recommendations_history(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    recs = db.query(models.AIRecommendation).filter(models.AIRecommendation.warehouse_id == current_user.warehouse_id).order_by(models.AIRecommendation.created_at.desc()).all()
    result = []
    for r in recs:
        result.append({
            "id": r.id,
            "created_at": r.created_at,
            "category": r.category or "General",
            "decision": r.decision or r.recommendation,
            "situation": r.situation,
            "impact": r.impact,
            "confidence": r.confidence or 94.0,
            "status": r.status,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "user_action": "Approved" if r.status == "Applied" else ("Dismissed" if r.status == "Dismissed" else "Pending Review"),
            "result": "Execution Complete — SLA Protected" if r.status == "Applied" else ("Rejected by Operator" if r.status == "Dismissed" else "Awaiting Approval"),
            "reasoning": r.reasoning
        })
    return result

@app.post("/api/recommendations/{rec_id}/apply")
def apply_recommendation(rec_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER"]))):
    rec = db.query(models.AIRecommendation).filter(models.AIRecommendation.id == rec_id, models.AIRecommendation.warehouse_id == current_user.warehouse_id).first()
    if not rec:
        raise HTTPException(status_code=404)
    rec.status = "Applied"
    engine.create_audit_log(db, current_user.warehouse_id, current_user.full_name, "Execute AI Decision", "AIRecommendation", rec.id, "Pending", "Applied")
    
    if rec.entity_type == "Order":
        order = db.query(models.Order).filter(models.Order.id == rec.entity_id).first()
        if order:
            engine.run_allocation(db, order)
    elif rec.entity_type == "Inventory":
        inv = db.query(models.Inventory).filter(models.Inventory.id == rec.entity_id).first()
        if inv:
            inv.current_stock += 50
            inv.available_stock += 50
            inv.status = models.InventoryStatus.HEALTHY
            mov = models.InventoryMovement(
                warehouse_id=current_user.warehouse_id,
                product_id=inv.product_id,
                type="Restocked",
                quantity=50,
                user="AI Smart Reorder",
                notes="Replenishment applied via approved recommendation"
            )
            db.add(mov)
            
    impact = engine.calculate_before_after_impact(db, current_user.warehouse_id, rec.entity_type, rec.entity_id)
    db.commit()
    return {
        "message": "AI Recommendation Executed and Applied",
        "before_after_impact": impact
    }

# --- Report Exports ---
from fastapi.responses import PlainTextResponse
@app.get("/api/reports/{report_type}/export", response_class=PlainTextResponse)
def export_report(report_type: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER", "INVENTORY_MANAGER"]))):
    csv_content = engine.generate_csv_report(db, current_user.warehouse_id, report_type)
    return PlainTextResponse(content=csv_content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=smartfulfill_{report_type}_report.csv"})


@app.post("/api/recommendations/{rec_id}/dismiss")
def dismiss_recommendation(rec_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER"]))):
    rec = db.query(models.AIRecommendation).filter(models.AIRecommendation.id == rec_id, models.AIRecommendation.warehouse_id == current_user.warehouse_id).first()
    if not rec:
        raise HTTPException(status_code=404)
    rec.status = "Dismissed"
    engine.create_audit_log(db, current_user.warehouse_id, current_user.full_name, "Dismiss AI Decision", "AIRecommendation", rec.id, "Pending", "Dismissed")
    db.commit()
    return {"message": "Recommendation dismissed"}

@app.post("/api/recommendations/reorder/approve")
def approve_reorder(payload: schemas.ReorderApproval, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER", "INVENTORY_MANAGER"]))):
    inv = db.query(models.Inventory).filter(models.Inventory.product_id == payload.product_id, models.Inventory.warehouse_id == current_user.warehouse_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory not found")
        
    inv.current_stock += payload.quantity
    inv.available_stock += payload.quantity
    inv.status = models.InventoryStatus.HEALTHY
    
    mov = models.InventoryMovement(
        warehouse_id=current_user.warehouse_id,
        product_id=payload.product_id,
        type="Restocked",
        quantity=payload.quantity,
        user=current_user.full_name,
        notes=f"{payload.notes} | Supplier: {payload.supplier}"
    )
    db.add(mov)
    
    if payload.recommendation_id:
        rec = db.query(models.AIRecommendation).filter(models.AIRecommendation.id == payload.recommendation_id).first()
        if rec: rec.status = "Applied"
        
    engine.create_audit_log(db, current_user.warehouse_id, current_user.full_name, "Approve Reorder", "Inventory", inv.id, "Depleted", f"+{payload.quantity} Units Inbound")
    db.commit()
    return {"message": f"Successfully approved and received {payload.quantity} units for {inv.product.sku if inv.product else 'SKU'}!"}

# --- Dynamic What-If Simulator ---
@app.post("/api/simulator/evaluate")
def evaluate_simulator(req: schemas.SimulateRequest):
    return engine.evaluate_simulation(req.dict())

@app.get("/api/simulator/run/{scenario_id}")
def run_simulator(scenario_id: int):
    return engine.run_simulation(scenario_id)

# --- Judge Demo Mode Endpoints ---
@app.post("/api/demo/trigger")
def trigger_judge_demo(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.trigger_judge_demo_scenario(db, current_user.warehouse_id, current_user)

@app.post("/api/demo/reset")
def reset_judge_demo(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.reset_demo_state(db, current_user.warehouse_id)

# --- Alerts & Audit Logs ---
@app.get("/api/alerts", response_model=List[schemas.Alert])
def get_alerts(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Alert).filter(models.Alert.warehouse_id == current_user.warehouse_id, models.Alert.is_read == False).order_by(models.Alert.created_at.desc()).all()

@app.post("/api/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id, models.Alert.warehouse_id == current_user.warehouse_id).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"message": "Alert marked as read"}

@app.get("/api/audit-logs", response_model=List[schemas.AuditLog])
def get_audit_logs(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN", "WAREHOUSE_MANAGER"]))):
    return db.query(models.AuditLog).filter(models.AuditLog.warehouse_id == current_user.warehouse_id).order_by(models.AuditLog.timestamp.desc()).limit(150).all()

# --- Admin Engine Trigger ---
@app.post("/api/admin/run-engine")
def trigger_decision_engine(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles(["ADMIN"]))):
    engine.forecast_inventory_health(db, current_user.warehouse_id)
    engine.detect_bottlenecks(db, current_user.warehouse_id)
    db.commit()
    return {"message": "Enterprise Decision Engine Ran Successfully"}

# =========================================================================
# 20-MODULE WMS REST API ENDPOINTS
# =========================================================================

# --- 1. Procurement & Supplier Management ---
@app.get("/api/procurement/suppliers")
def get_suppliers(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Supplier).filter(models.Supplier.warehouse_id == current_user.warehouse_id).all()

@app.post("/api/procurement/suppliers")
def create_supplier(body: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    sup = models.Supplier(warehouse_id=current_user.warehouse_id, **body)
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return sup

@app.get("/api/procurement/suppliers/{supplier_id}")
def get_supplier(supplier_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    sup = db.query(models.Supplier).filter(models.Supplier.id == supplier_id, models.Supplier.warehouse_id == current_user.warehouse_id).first()
    if not sup: raise HTTPException(status_code=404, detail="Supplier not found")
    pos = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.supplier_id == sup.id).all()
    return {"supplier": sup, "purchase_orders": pos}

# --- 2. Purchase Orders ---
@app.get("/api/procurement/purchase-orders")
def get_purchase_orders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    pos = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.warehouse_id == current_user.warehouse_id).order_by(models.PurchaseOrder.order_date.desc()).all()
    res = []
    for po in pos:
        res.append({
            "id": po.id,
            "po_number": po.po_number,
            "supplier_id": po.supplier_id,
            "supplier_name": po.supplier.name if po.supplier else "Unknown Supplier",
            "order_date": po.order_date,
            "expected_delivery": po.expected_delivery,
            "total_amount": po.total_amount,
            "status": po.status,
            "notes": po.notes,
            "items": [{"id": it.id, "product_id": it.product_id, "product_name": it.product.name if it.product else "SKU", "quantity": it.quantity, "received_quantity": it.received_quantity, "unit_price": it.unit_price, "total_price": it.total_price} for it in po.items]
        })
    return res

class CreatePORequest(BaseModel):
    supplier_id: int
    expected_delivery_days: int = 7
    notes: Optional[str] = None
    items: List[dict] # [{product_id, quantity, unit_price}]

@app.post("/api/procurement/purchase-orders")
def create_purchase_order(body: CreatePORequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    now = datetime.utcnow()
    po_num = f"PO-2026-{db.query(models.PurchaseOrder).count() + 1001}"
    tot = sum([it.get("quantity", 1) * it.get("unit_price", 10.0) for it in body.items])
    
    po = models.PurchaseOrder(
        warehouse_id=current_user.warehouse_id,
        po_number=po_num,
        supplier_id=body.supplier_id,
        order_date=now,
        expected_delivery=now + timedelta(days=body.expected_delivery_days),
        total_amount=tot,
        status="Created",
        notes=body.notes
    )
    db.add(po)
    db.commit()
    db.refresh(po)
    
    for it in body.items:
        poi = models.PurchaseOrderItem(
            po_id=po.id,
            product_id=it["product_id"],
            quantity=it["quantity"],
            unit_price=it["unit_price"],
            total_price=it["quantity"] * it["unit_price"]
        )
        db.add(poi)
    db.commit()
    return {"message": f"PO {po_num} created", "po_id": po.id}

@app.post("/api/procurement/purchase-orders/{po_id}/status")
def update_po_status(po_id: int, body: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    po = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == po_id, models.PurchaseOrder.warehouse_id == current_user.warehouse_id).first()
    if not po: raise HTTPException(status_code=404)
    new_status = body.get("status", po.status)
    po.status = new_status
    
    if new_status in ["Received", "Closed"]:
        for it in po.items:
            it.received_quantity = it.quantity
            inv = db.query(models.Inventory).filter(models.Inventory.product_id == it.product_id).first()
            if inv:
                inv.current_stock += it.quantity
                inv.available_stock += it.quantity
                inv.status = models.InventoryStatus.HEALTHY
                mov = models.InventoryMovement(
                    warehouse_id=current_user.warehouse_id,
                    product_id=it.product_id,
                    type="Restocked",
                    quantity=it.quantity,
                    user=current_user.full_name,
                    notes=f"Goods received from {po.po_number}"
                )
                db.add(mov)
    db.commit()
    return {"message": f"PO status updated to {new_status}"}

# --- 3. Smart Reorder Suggestions & Reorder-to-PO ---
@app.get("/api/procurement/reorder-suggestions")
def get_reorder_suggestions(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.get_smart_reorder_suggestions(db, current_user.warehouse_id)

class ConvertReorderRequest(BaseModel):
    product_id: int
    supplier_id: int
    quantity: int

@app.post("/api/procurement/reorder-to-po")
def convert_to_po(body: ConvertReorderRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.convert_reorder_to_po(db, current_user.warehouse_id, body.product_id, body.supplier_id, body.quantity, current_user.full_name)

# --- 4. Batches & Expiry Management ---
@app.get("/api/inventory/batches")
def get_batches(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    batches = db.query(models.ProductBatch).filter(models.ProductBatch.warehouse_id == current_user.warehouse_id).all()
    res = []
    for b in batches:
        res.append({
            "id": b.id,
            "batch_number": b.batch_number,
            "product_id": b.product_id,
            "product_name": b.product.name if b.product else "Unknown",
            "sku": b.product.sku if b.product else "SKU",
            "mfg_date": b.mfg_date.strftime("%Y-%m-%d"),
            "expiry_date": b.expiry_date.strftime("%Y-%m-%d"),
            "quantity": b.quantity,
            "location_code": b.location_code,
            "status": b.status
        })
    return res

# --- 5. Storage Locations & Interactive 2D Heatmap ---
@app.get("/api/warehouse/locations")
def get_storage_locations(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.StorageLocation).filter(models.StorageLocation.warehouse_id == current_user.warehouse_id).all()

@app.get("/api/warehouse/interactive-heatmap")
def get_interactive_heatmap_data(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.get_interactive_heatmap(db, current_user.warehouse_id)

# --- 6. Barcode / QR Scanner Telemetry ---
@app.get("/api/inventory/scan/{barcode}")
def scan_barcode(barcode: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.lookup_barcode_telemetry(db, current_user.warehouse_id, barcode)

# --- 7. Shipments (Inbound & Outbound) ---
@app.get("/api/shipments")
def get_shipments(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Shipment).filter(models.Shipment.warehouse_id == current_user.warehouse_id).order_by(models.Shipment.created_at.desc()).all()

@app.post("/api/shipments/{id}/status")
def update_shipment_status(id: int, body: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    s = db.query(models.Shipment).filter(models.Shipment.id == id, models.Shipment.warehouse_id == current_user.warehouse_id).first()
    if s:
        s.status = body.get("status", s.status)
        db.commit()
    return {"message": "Shipment updated"}

# --- 8. Inter-Warehouse Stock Transfers ---
@app.get("/api/transfers")
def get_transfers(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    transfers = db.query(models.StockTransfer).all()
    res = []
    for t in transfers:
        res.append({
            "id": t.id,
            "transfer_number": t.transfer_number,
            "product_id": t.product_id,
            "product_name": t.product.name if t.product else "Component",
            "sku": t.product.sku if t.product else "SKU",
            "quantity": t.quantity,
            "request_date": t.request_date.strftime("%Y-%m-%d"),
            "status": t.status,
            "requested_by": t.requested_by,
            "notes": t.notes
        })
    return res

class CreateTransferRequest(BaseModel):
    product_id: int
    quantity: int
    notes: Optional[str] = None

@app.post("/api/transfers")
def create_transfer(body: CreateTransferRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tr_num = f"TRF-2026-{db.query(models.StockTransfer).count() + 101}"
    tr = models.StockTransfer(
        transfer_number=tr_num,
        source_warehouse_id=current_user.warehouse_id,
        destination_warehouse_id=current_user.warehouse_id,
        product_id=body.product_id,
        quantity=body.quantity,
        status="Requested",
        requested_by=current_user.full_name,
        notes=body.notes
    )
    db.add(tr)
    db.commit()
    return {"message": f"Transfer {tr_num} requested successfully"}

@app.post("/api/transfers/{id}/status")
def update_transfer_status(id: int, body: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tr = db.query(models.StockTransfer).filter(models.StockTransfer.id == id).first()
    if tr:
        tr.status = body.get("status", tr.status)
        db.commit()
    return {"message": "Transfer status updated"}

# --- 9. Stock Adjustments & Damage Logs ---
@app.get("/api/inventory/adjustments")
def get_adjustments(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    adjs = db.query(models.StockAdjustment).filter(models.StockAdjustment.warehouse_id == current_user.warehouse_id).order_by(models.StockAdjustment.date.desc()).all()
    res = []
    for a in adjs:
        res.append({
            "id": a.id,
            "product_id": a.product_id,
            "product_name": a.product.name if a.product else "Component",
            "sku": a.product.sku if a.product else "SKU",
            "quantity_change": a.quantity_change,
            "reason": a.reason,
            "adjusted_by": a.adjusted_by,
            "date": a.date.strftime("%Y-%m-%d %H:%M"),
            "notes": a.notes
        })
    return res

class CreateAdjustmentRequest(BaseModel):
    product_id: int
    quantity_change: int
    reason: str
    notes: Optional[str] = None

@app.post("/api/inventory/adjustments")
def create_adjustment(body: CreateAdjustmentRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    adj = models.StockAdjustment(
        warehouse_id=current_user.warehouse_id,
        product_id=body.product_id,
        quantity_change=body.quantity_change,
        reason=body.reason,
        adjusted_by=current_user.full_name,
        notes=body.notes
    )
    db.add(adj)
    
    # Update inventory
    inv = db.query(models.Inventory).filter(models.Inventory.product_id == body.product_id).first()
    if inv:
        inv.current_stock += body.quantity_change
        inv.available_stock += body.quantity_change
        if body.reason == "Damaged" and body.quantity_change < 0:
            inv.damaged_stock = (inv.damaged_stock or 0) + abs(body.quantity_change)
            
    mov = models.InventoryMovement(
        warehouse_id=current_user.warehouse_id,
        product_id=body.product_id,
        type="Manual Adjustment" if body.reason != "Damaged" else "Damaged",
        quantity=body.quantity_change,
        user=current_user.full_name,
        notes=f"Adjustment: {body.reason} ({body.notes or ''})"
    )
    db.add(mov)
    db.commit()
    return {"message": "Stock adjusted and logged in audit history."}

# --- 10. Advanced Analytics (Forecast, Valuation, Turnover, Dead Stock, Optimization) ---
@app.get("/api/analytics/forecast")
def get_forecast(period_days: int = 30, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.get_demand_forecast(db, current_user.warehouse_id, period_days)

@app.get("/api/analytics/valuation")
def get_valuation(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.get_inventory_valuation(db, current_user.warehouse_id)

@app.get("/api/analytics/turnover")
def get_turnover(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.get_inventory_turnover(db, current_user.warehouse_id)

@app.get("/api/analytics/dead-stock")
def get_dead_stock(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.get_dead_stock_and_movement_analysis(db, current_user.warehouse_id)

@app.get("/api/analytics/optimization")
def get_optimization(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return engine.get_ai_inventory_optimization(db, current_user.warehouse_id)

# --- 11. Global Fast Search & Filter ---
@app.get("/api/search/global")
def global_search(query: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    q = query.strip()
    if not q: return {"products": [], "orders": [], "suppliers": [], "purchase_orders": []}
    
    products = db.query(models.Product).filter(
        (models.Product.sku.ilike(f"%{q}%")) | (models.Product.name.ilike(f"%{q}%")) | (models.Product.category.ilike(f"%{q}%"))
    ).limit(8).all()
    
    orders = db.query(models.Order).filter(
        (models.Order.customer_name.ilike(f"%{q}%")) | (models.Order.id == (int(q) if q.isdigit() else -1))
    ).limit(8).all()
    
    suppliers = db.query(models.Supplier).filter(
        (models.Supplier.name.ilike(f"%{q}%")) | (models.Supplier.company.ilike(f"%{q}%"))
    ).limit(6).all()
    
    pos = db.query(models.PurchaseOrder).filter(
        (models.PurchaseOrder.po_number.ilike(f"%{q}%"))
    ).limit(6).all()
    
    return {
        "products": [{"id": p.id, "sku": p.sku, "name": p.name, "category": p.category, "price": p.price, "stock": p.inventory.available_stock if p.inventory else 0} for p in products],
        "orders": [{"id": o.id, "customer": o.customer_name, "value": o.order_value, "status": o.status, "urgency": o.urgency} for o in orders],
        "suppliers": [{"id": s.id, "name": s.name, "company": s.company, "rating": s.rating} for s in suppliers],
        "purchase_orders": [{"id": po.id, "po_number": po.po_number, "total_amount": po.total_amount, "status": po.status} for po in pos]
    }

# --- SPA Catch-All Route for Frontend ---
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    dist_path = os.path.join("..", "frontend", "dist")
    file_path = os.path.join(dist_path, full_path)
    
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    index_path = os.path.join(dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    return {"message": "Frontend not built. Please run npm run build in frontend directory."}

