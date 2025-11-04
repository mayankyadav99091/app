from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'campus_catalyst_secret_key_change_in_production')
JWT_ALGORITHM = 'HS256'

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ AUTH MODELS ============
class LoginRequest(BaseModel):
    email: EmailStr

class LoginResponse(BaseModel):
    token: str
    email: str
    role: str
    name: str

# ============ MESS MODELS ============
class MenuItem(BaseModel):
    name: str
    items: List[str]

class MessMenu(BaseModel):
    model_config = ConfigDict(extra="ignore")
    date: str
    breakfast: List[str]
    lunch: List[str]
    snacks: List[str]
    dinner: List[str]

class MessFeedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    meal_type: Literal['breakfast', 'lunch', 'snacks', 'dinner']
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessFeedbackCreate(BaseModel):
    meal_type: Literal['breakfast', 'lunch', 'snacks', 'dinner']
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None

# ============ SPORTS MODELS ============
class SportsEquipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: Literal['Available', 'Issued', 'Under Maintenance']
    issued_to: Optional[str] = None
    issued_at: Optional[datetime] = None

class BookEquipmentRequest(BaseModel):
    equipment_id: str

class UpdateEquipmentStatusRequest(BaseModel):
    status: Literal['Available', 'Issued', 'Under Maintenance']
    issued_to: Optional[str] = None

# ============ LOST & FOUND MODELS ============
class LostFoundItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: Literal['lost', 'found']
    item_name: str
    description: str
    location: str
    contact_email: str
    contact_name: str
    imageBase64: Optional[str] = None
    mimeType: Optional[str] = None
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: Literal['active', 'resolved'] = 'active'

class LostFoundCreate(BaseModel):
    type: Literal['lost', 'found']
    item_name: str
    description: str
    location: str
    contact_name: str
    imageBase64: Optional[str] = None
    mimeType: Optional[str] = None

# ============ COMPLAINT MODELS ============
class Complaint(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    location: str
    category: Literal['waste', 'maintenance', 'other']
    contact_email: str
    imageBase64: Optional[str] = None
    mimeType: Optional[str] = None
    status: Literal['Pending', 'In Progress', 'Resolved'] = 'Pending'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ComplaintCreate(BaseModel):
    title: str
    description: str
    location: str
    category: Literal['waste', 'maintenance', 'other']
    imageBase64: Optional[str] = None
    mimeType: Optional[str] = None

class ComplaintStatusUpdate(BaseModel):
    status: Literal['Pending', 'In Progress', 'Resolved']

# ============ HELPER FUNCTIONS ============
def verify_token(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Invalid authorization header')
    
    token = authorization.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

def verify_admin(authorization: Optional[str]) -> dict:
    payload = verify_token(authorization)
    if payload.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    return payload

# ============ AUTH ROUTES ============
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    email = request.email.lower()
    
    # Validate IIIT email
    if not re.match(r'^[a-zA-Z0-9._%+-]+@iiit[a-z]*\.ac\.in$', email):
        raise HTTPException(status_code=400, detail='Only IIIT email addresses are allowed')
    
    # Determine role
    role = 'admin' if email == 'admin@iiitd.ac.in' else 'student'
    
    # Extract name from email
    name = email.split('@')[0].replace('.', ' ').title()
    
    # Generate JWT token (expires in 7 days)
    payload = {
        'email': email,
        'role': role,
        'name': name,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return LoginResponse(token=token, email=email, role=role, name=name)

# ============ MESS ROUTES ============
@api_router.get("/mess/menu", response_model=MessMenu)
async def get_mess_menu():
    # Return today's menu
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    # Static demo menu (in production, this would be from database)
    menu = MessMenu(
        date=today,
        breakfast=['Idli Sambhar', 'Vada', 'Chutney', 'Tea/Coffee'],
        lunch=['Rajma Chawal', 'Roti', 'Salad', 'Curd'],
        snacks=['Samosa', 'Tea', 'Biscuits'],
        dinner=['Paneer Butter Masala', 'Roti', 'Dal', 'Rice', 'Salad']
    )
    
    return menu

@api_router.post("/mess/feedback")
async def submit_mess_feedback(feedback: MessFeedbackCreate, authorization: str = Header(None)):
    user = verify_token(authorization)
    
    feedback_obj = MessFeedback(
        email=user['email'],
        meal_type=feedback.meal_type,
        rating=feedback.rating,
        comment=feedback.comment
    )
    
    doc = feedback_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.mess_feedback.insert_one(doc)
    
    return {'message': 'Feedback submitted successfully'}

@api_router.get("/mess/ratings")
async def get_mess_ratings():
    # Get today's ratings
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    feedbacks = await db.mess_feedback.find({}, {"_id": 0}).to_list(1000)
    
    # Calculate average ratings by meal type
    ratings = {'breakfast': [], 'lunch': [], 'snacks': [], 'dinner': []}
    
    for fb in feedbacks:
        if 'meal_type' in fb and 'rating' in fb:
            ratings[fb['meal_type']].append(fb['rating'])
    
    averages = {}
    for meal_type, rating_list in ratings.items():
        if rating_list:
            averages[meal_type] = round(sum(rating_list) / len(rating_list), 1)
        else:
            averages[meal_type] = 0
    
    return averages

# ============ SPORTS ROUTES ============
@api_router.get("/sports/equipment", response_model=List[SportsEquipment])
async def get_sports_equipment():
    equipment = await db.sports_equipment.find({}, {"_id": 0}).to_list(1000)
    
    # If empty, initialize with demo data
    if not equipment:
        demo_equipment = [
            {'id': str(uuid.uuid4()), 'name': 'Badminton Racket #1', 'status': 'Available', 'issued_to': None, 'issued_at': None},
            {'id': str(uuid.uuid4()), 'name': 'Badminton Racket #2', 'status': 'Available', 'issued_to': None, 'issued_at': None},
            {'id': str(uuid.uuid4()), 'name': 'TT Bat #1', 'status': 'Available', 'issued_to': None, 'issued_at': None},
            {'id': str(uuid.uuid4()), 'name': 'TT Bat #2', 'status': 'Issued', 'issued_to': 'student@iiitd.ac.in', 'issued_at': datetime.now(timezone.utc).isoformat()},
            {'id': str(uuid.uuid4()), 'name': 'Football', 'status': 'Available', 'issued_to': None, 'issued_at': None},
            {'id': str(uuid.uuid4()), 'name': 'Cricket Bat', 'status': 'Under Maintenance', 'issued_to': None, 'issued_at': None},
            {'id': str(uuid.uuid4()), 'name': 'Tennis Racket', 'status': 'Available', 'issued_to': None, 'issued_at': None},
        ]
        await db.sports_equipment.insert_many(demo_equipment)
        equipment = demo_equipment
    
    # Convert ISO timestamps back to datetime if needed
    for eq in equipment:
        if eq.get('issued_at') and isinstance(eq['issued_at'], str):
            eq['issued_at'] = datetime.fromisoformat(eq['issued_at'])
    
    return equipment

@api_router.post("/sports/book")
async def book_equipment(request: BookEquipmentRequest, authorization: str = Header(None)):
    user = verify_token(authorization)
    
    equipment = await db.sports_equipment.find_one({'id': request.equipment_id}, {"_id": 0})
    if not equipment:
        raise HTTPException(status_code=404, detail='Equipment not found')
    
    if equipment['status'] != 'Available':
        raise HTTPException(status_code=400, detail='Equipment not available')
    
    # Update status
    await db.sports_equipment.update_one(
        {'id': request.equipment_id},
        {'$set': {
            'status': 'Issued',
            'issued_to': user['email'],
            'issued_at': datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {'message': 'Equipment booked successfully'}

@api_router.put("/sports/equipment/{equipment_id}/status")
async def update_equipment_status(
    equipment_id: str,
    request: UpdateEquipmentStatusRequest,
    authorization: str = Header(None)
):
    verify_admin(authorization)
    
    equipment = await db.sports_equipment.find_one({'id': equipment_id}, {"_id": 0})
    if not equipment:
        raise HTTPException(status_code=404, detail='Equipment not found')
    
    update_data = {'status': request.status}
    
    if request.status == 'Available':
        update_data['issued_to'] = None
        update_data['issued_at'] = None
    elif request.status == 'Issued' and request.issued_to:
        update_data['issued_to'] = request.issued_to
        update_data['issued_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.sports_equipment.update_one(
        {'id': equipment_id},
        {'$set': update_data}
    )
    
    return {'message': 'Equipment status updated successfully'}

# ============ LOST & FOUND ROUTES ============
@api_router.get("/lost-found/items", response_model=List[LostFoundItem])
async def get_lost_found_items(type: Optional[str] = None, search: Optional[str] = None):
    query = {'status': 'active'}
    
    if type and type in ['lost', 'found']:
        query['type'] = type
    
    items = await db.lost_found.find(query, {"_id": 0}).to_list(1000)
    
    # Convert ISO timestamps
    for item in items:
        if isinstance(item.get('date'), str):
            item['date'] = datetime.fromisoformat(item['date'])
    
    # Apply search filter
    if search:
        search_lower = search.lower()
        items = [item for item in items if search_lower in item['item_name'].lower() or search_lower in item['description'].lower()]
    
    # Sort by date (newest first)
    items.sort(key=lambda x: x['date'], reverse=True)
    
    return items

@api_router.post("/lost-found/item")
async def create_lost_found_item(item: LostFoundCreate, authorization: str = Header(None)):
    user = verify_token(authorization)
    
    item_obj = LostFoundItem(
        type=item.type,
        item_name=item.item_name,
        description=item.description,
        location=item.location,
        contact_email=user['email'],
        contact_name=item.contact_name,
        imageBase64=item.imageBase64,
        mimeType=item.mimeType
    )
    
    doc = item_obj.model_dump()
    doc['date'] = doc['date'].isoformat()
    
    await db.lost_found.insert_one(doc)
    
    return {'message': f'{item.type.capitalize()} item posted successfully', 'id': item_obj.id}

# ============ COMPLAINT ROUTES ============
@api_router.get("/complaints", response_model=List[Complaint])
async def get_complaints(status: Optional[str] = None):
    query = {}
    if status and status in ['Pending', 'In Progress', 'Resolved']:
        query['status'] = status
    
    complaints = await db.complaints.find(query, {"_id": 0}).to_list(1000)
    
    # Convert ISO timestamps
    for complaint in complaints:
        if isinstance(complaint.get('created_at'), str):
            complaint['created_at'] = datetime.fromisoformat(complaint['created_at'])
        if isinstance(complaint.get('updated_at'), str):
            complaint['updated_at'] = datetime.fromisoformat(complaint['updated_at'])
    
    # Sort by created_at (newest first)
    complaints.sort(key=lambda x: x['created_at'], reverse=True)
    
    return complaints

@api_router.post("/complaints")
async def create_complaint(complaint: ComplaintCreate, authorization: str = Header(None)):
    user = verify_token(authorization)
    
    complaint_obj = Complaint(
        title=complaint.title,
        description=complaint.description,
        location=complaint.location,
        category=complaint.category,
        contact_email=user['email'],
        imageBase64=complaint.imageBase64,
        mimeType=complaint.mimeType
    )
    
    doc = complaint_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.complaints.insert_one(doc)
    
    return {'message': 'Complaint submitted successfully', 'id': complaint_obj.id}

@api_router.put("/complaints/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    request: ComplaintStatusUpdate,
    authorization: str = Header(None)
):
    verify_admin(authorization)
    
    complaint = await db.complaints.find_one({'id': complaint_id}, {"_id": 0})
    if not complaint:
        raise HTTPException(status_code=404, detail='Complaint not found')
    
    await db.complaints.update_one(
        {'id': complaint_id},
        {'$set': {
            'status': request.status,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {'message': 'Complaint status updated successfully'}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()