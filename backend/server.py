from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from backend.models import Project, ProjectCreate, ProjectUpdate, Annotation, AnnotationCreate, AnnotationUpdate, FileUpload
import os
import logging
from pathlib import Path
from typing import List
import base64
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Collections
projects_collection = db.projects
annotations_collection = db.annotations

# Helper function to convert MongoDB document to dict
def serialize_document(doc):
    if doc is None:
        return None
    if "_id" in doc:
        del doc["_id"]
    return doc

# PROJECT ENDPOINTS
@api_router.get("/")
async def root():
    return {"message": "PlanTech Pro API"}

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate):
    project_dict = project_data.dict()
    project_obj = Project(**project_dict)
    
    try:
        result = await projects_collection.insert_one(project_obj.dict())
        logger.info(f"Project created with ID: {project_obj.id}")
        return project_obj
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating project")

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    try:
        projects = await projects_collection.find().to_list(1000)
        return [Project(**serialize_document(project)) for project in projects]
    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching projects")

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    try:
        project = await projects_collection.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return Project(**serialize_document(project))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching project")

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_data: ProjectUpdate):
    try:
        update_data = {k: v for k, v in project_data.dict().items() if v is not None}
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
        
        result = await projects_collection.update_one(
            {"id": project_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        updated_project = await projects_collection.find_one({"id": project_id})
        return Project(**serialize_document(updated_project))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating project: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating project")

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    try:
        # Delete all annotations for this project
        await annotations_collection.delete_many({"project_id": project_id})
        
        # Delete the project
        result = await projects_collection.delete_one({"id": project_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting project")

# ANNOTATION ENDPOINTS
@api_router.post("/annotations", response_model=Annotation)
async def create_annotation(annotation_data: AnnotationCreate):
    try:
        annotation_dict = annotation_data.dict()
        annotation_obj = Annotation(**annotation_dict)
        
        result = await annotations_collection.insert_one(annotation_obj.dict())
        
        # Update project's plan count
        await projects_collection.update_one(
            {"id": annotation_data.project_id},
            {"$inc": {"plan_count": 1}, "$set": {"updated_at": datetime.utcnow()}}
        )
        
        logger.info(f"Annotation created with ID: {annotation_obj.id}")
        return annotation_obj
    except Exception as e:
        logger.error(f"Error creating annotation: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating annotation")

@api_router.get("/annotations/{project_id}", response_model=List[Annotation])
async def get_annotations(project_id: str):
    try:
        annotations = await annotations_collection.find({"project_id": project_id}).to_list(1000)
        return [Annotation(**serialize_document(annotation)) for annotation in annotations]
    except Exception as e:
        logger.error(f"Error fetching annotations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching annotations")

@api_router.put("/annotations/{annotation_id}", response_model=Annotation)
async def update_annotation(annotation_id: str, annotation_data: AnnotationUpdate):
    try:
        update_data = {k: v for k, v in annotation_data.dict().items() if v is not None}
        
        result = await annotations_collection.update_one(
            {"id": annotation_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Annotation not found")
        
        updated_annotation = await annotations_collection.find_one({"id": annotation_id})
        return Annotation(**serialize_document(updated_annotation))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating annotation: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating annotation")

@api_router.delete("/annotations/{annotation_id}")
async def delete_annotation(annotation_id: str):
    try:
        annotation = await annotations_collection.find_one({"id": annotation_id})
        if not annotation:
            raise HTTPException(status_code=404, detail="Annotation not found")
        
        result = await annotations_collection.delete_one({"id": annotation_id})
        
        # Update project's plan count
        await projects_collection.update_one(
            {"id": annotation["project_id"]},
            {"$inc": {"plan_count": -1}, "$set": {"updated_at": datetime.utcnow()}}
        )
        
        return {"message": "Annotation deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting annotation: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting annotation")

@api_router.delete("/annotations/project/{project_id}")
async def delete_all_annotations(project_id: str):
    try:
        result = await annotations_collection.delete_many({"project_id": project_id})
        
        # Reset project's plan count
        await projects_collection.update_one(
            {"id": project_id},
            {"$set": {"plan_count": 0, "updated_at": datetime.utcnow()}}
        )
        
        return {"message": f"Deleted {result.deleted_count} annotations"}
    except Exception as e:
        logger.error(f"Error deleting annotations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error deleting annotations")

# FILE UPLOAD ENDPOINT
@api_router.post("/upload")
async def upload_file(file_data: FileUpload):
    try:
        # Update project with the uploaded file
        result = await projects_collection.update_one(
            {"id": file_data.project_id},
            {"$set": {
                "plan_image": file_data.file_data,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"message": "File uploaded successfully", "file_name": file_data.file_name}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Error uploading file")

# BATCH OPERATIONS
@api_router.post("/annotations/batch/{project_id}")
async def save_annotations_batch(project_id: str, annotations_data: List[AnnotationCreate]):
    try:
        # Delete existing annotations for this project
        await annotations_collection.delete_many({"project_id": project_id})
        
        # Create new annotations
        if annotations_data:
            annotations_to_insert = []
            for annotation_data in annotations_data:
                annotation_dict = annotation_data.dict()
                annotation_obj = Annotation(**annotation_dict)
                annotations_to_insert.append(annotation_obj.dict())
            
            await annotations_collection.insert_many(annotations_to_insert)
        
        # Update project's plan count
        await projects_collection.update_one(
            {"id": project_id},
            {"$set": {"plan_count": len(annotations_data), "updated_at": datetime.utcnow()}}
        )
        
        return {"message": f"Saved {len(annotations_data)} annotations successfully"}
    except Exception as e:
        logger.error(f"Error saving annotations batch: {str(e)}")
        raise HTTPException(status_code=500, detail="Error saving annotations batch")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)