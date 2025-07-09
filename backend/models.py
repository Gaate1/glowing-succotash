from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    location: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "En cours"
    plan_count: int = 0
    plan_image: Optional[str] = None  # base64 encoded image

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    location: Optional[str] = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    plan_count: Optional[int] = None
    plan_image: Optional[str] = None

class Annotation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    type: str  # line, rectangle, circle, text, freehand
    data: Dict[str, Any]  # flexible data structure for different annotation types
    color: str = "#3b82f6"
    stroke: int = 2
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AnnotationCreate(BaseModel):
    project_id: str
    type: str
    data: Dict[str, Any]
    color: str = "#3b82f6"
    stroke: int = 2
    notes: Optional[str] = ""

class AnnotationUpdate(BaseModel):
    type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    color: Optional[str] = None
    stroke: Optional[int] = None
    notes: Optional[str] = None

class FileUpload(BaseModel):
    project_id: str
    file_data: str  # base64 encoded file
    file_name: str
    file_type: str