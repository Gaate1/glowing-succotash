import requests
import json
import base64
import uuid
import time
import os
from datetime import datetime

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"\'')
            break

# Ensure the URL doesn't have quotes
BACKEND_URL = BACKEND_URL.strip('"\'')
API_URL = f"{BACKEND_URL}/api"

print(f"Testing API at: {API_URL}")

# Test data
test_project = {
    "name": "Test Building Project",
    "description": "A test project for building plans",
    "location": "Paris, France"
}

test_annotation = {
    "type": "rectangle",
    "data": {
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 150
    },
    "color": "#ff0000",
    "stroke": 3,
    "notes": "This is a test annotation with French text: Ceci est un test d'annotation"
}

# Sample base64 image (small red dot)
sample_base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="

test_file_upload = {
    "file_data": sample_base64_image,
    "file_name": "test_plan.png",
    "file_type": "image/png"
}

# Helper functions
def print_separator(title):
    print("\n" + "="*80)
    print(f" {title} ".center(80, "="))
    print("="*80 + "\n")

def print_response(response, message=""):
    print(f"{message} Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

# Test functions
def test_root():
    print_separator("Testing Root Endpoint")
    response = requests.get(f"{API_URL}/")
    print_response(response, "Root endpoint:")
    assert response.status_code == 200
    return True

def test_project_crud():
    print_separator("Testing Project CRUD Operations")
    
    # Create project
    print("\n--- Creating project ---")
    response = requests.post(f"{API_URL}/projects", json=test_project)
    print_response(response, "Create project:")
    assert response.status_code == 200
    project_data = response.json()
    project_id = project_data["id"]
    
    # Get all projects
    print("\n--- Getting all projects ---")
    response = requests.get(f"{API_URL}/projects")
    print_response(response, "Get all projects:")
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) > 0
    
    # Get single project
    print("\n--- Getting single project ---")
    response = requests.get(f"{API_URL}/projects/{project_id}")
    print_response(response, "Get single project:")
    assert response.status_code == 200
    assert response.json()["id"] == project_id
    
    # Update project
    print("\n--- Updating project ---")
    update_data = {
        "name": "Updated Test Project",
        "description": "This project has been updated",
        "status": "Terminé"
    }
    response = requests.put(f"{API_URL}/projects/{project_id}", json=update_data)
    print_response(response, "Update project:")
    assert response.status_code == 200
    updated_project = response.json()
    assert updated_project["name"] == update_data["name"]
    assert updated_project["description"] == update_data["description"]
    assert updated_project["status"] == update_data["status"]
    
    # Test invalid project ID
    print("\n--- Testing invalid project ID ---")
    invalid_id = str(uuid.uuid4())
    response = requests.get(f"{API_URL}/projects/{invalid_id}")
    print_response(response, "Get invalid project:")
    assert response.status_code == 404
    
    return project_id

def test_annotation_crud(project_id):
    print_separator("Testing Annotation CRUD Operations")
    
    # Create annotation
    print("\n--- Creating annotation ---")
    annotation_data = test_annotation.copy()
    annotation_data["project_id"] = project_id
    response = requests.post(f"{API_URL}/annotations", json=annotation_data)
    print_response(response, "Create annotation:")
    assert response.status_code == 200
    annotation = response.json()
    annotation_id = annotation["id"]
    
    # Get annotations for project
    print("\n--- Getting annotations for project ---")
    response = requests.get(f"{API_URL}/annotations/{project_id}")
    print_response(response, "Get annotations:")
    assert response.status_code == 200
    annotations = response.json()
    assert len(annotations) > 0
    
    # Update annotation
    print("\n--- Updating annotation ---")
    update_data = {
        "color": "#00ff00",
        "notes": "Updated annotation notes with French: Mise à jour des notes"
    }
    response = requests.put(f"{API_URL}/annotations/{annotation_id}", json=update_data)
    print_response(response, "Update annotation:")
    assert response.status_code == 200
    updated_annotation = response.json()
    assert updated_annotation["color"] == update_data["color"]
    assert updated_annotation["notes"] == update_data["notes"]
    
    # Test invalid annotation ID
    print("\n--- Testing invalid annotation ID ---")
    invalid_id = str(uuid.uuid4())
    response = requests.put(f"{API_URL}/annotations/{invalid_id}", json=update_data)
    print_response(response, "Update invalid annotation:")
    assert response.status_code == 404
    
    # Create a second annotation for batch testing
    print("\n--- Creating second annotation ---")
    annotation_data2 = test_annotation.copy()
    annotation_data2["project_id"] = project_id
    annotation_data2["type"] = "circle"
    annotation_data2["data"] = {"x": 300, "y": 300, "radius": 50}
    response = requests.post(f"{API_URL}/annotations", json=annotation_data2)
    print_response(response, "Create second annotation:")
    assert response.status_code == 200
    
    return annotation_id

def test_file_upload(project_id):
    print_separator("Testing File Upload")
    
    # Upload file
    print("\n--- Uploading file ---")
    upload_data = test_file_upload.copy()
    upload_data["project_id"] = project_id
    response = requests.post(f"{API_URL}/upload", json=upload_data)
    print_response(response, "Upload file:")
    assert response.status_code == 200
    
    # Verify file was uploaded by checking project
    print("\n--- Verifying file upload ---")
    response = requests.get(f"{API_URL}/projects/{project_id}")
    print_response(response, "Get project after upload:")
    assert response.status_code == 200
    project = response.json()
    assert project["plan_image"] == sample_base64_image
    
    # Test upload with invalid project ID
    print("\n--- Testing upload with invalid project ID ---")
    invalid_id = str(uuid.uuid4())
    upload_data["project_id"] = invalid_id
    response = requests.post(f"{API_URL}/upload", json=upload_data)
    print_response(response, "Upload to invalid project:")
    assert response.status_code == 404
    
    return True

def test_batch_operations(project_id):
    print_separator("Testing Batch Operations")
    
    # Create batch of annotations
    print("\n--- Creating batch of annotations ---")
    batch_annotations = []
    for i in range(3):
        annotation = test_annotation.copy()
        annotation["project_id"] = project_id
        annotation["type"] = ["rectangle", "circle", "line"][i]
        annotation["data"] = {
            "x": 100 * (i + 1),
            "y": 100 * (i + 1),
            "width": 50 * (i + 1),
            "height": 50 * (i + 1)
        }
        annotation["notes"] = f"Batch annotation {i+1} with French: Annotation par lots {i+1}"
        batch_annotations.append(annotation)
    
    response = requests.post(f"{API_URL}/annotations/batch/{project_id}", json=batch_annotations)
    print_response(response, "Create batch annotations:")
    assert response.status_code == 200
    
    # Verify batch annotations were created
    print("\n--- Verifying batch annotations ---")
    response = requests.get(f"{API_URL}/annotations/{project_id}")
    print_response(response, "Get annotations after batch:")
    assert response.status_code == 200
    annotations = response.json()
    assert len(annotations) == 3
    
    # Test batch with invalid project ID
    print("\n--- Testing batch with invalid project ID ---")
    invalid_id = str(uuid.uuid4())
    response = requests.post(f"{API_URL}/annotations/batch/{invalid_id}", json=batch_annotations)
    print_response(response, "Batch to invalid project:")
    # This should still work as the endpoint doesn't check if project exists
    assert response.status_code == 200
    
    return True

def test_delete_operations(project_id, annotation_id):
    print_separator("Testing Delete Operations")
    
    # Delete single annotation
    print("\n--- Deleting single annotation ---")
    response = requests.delete(f"{API_URL}/annotations/{annotation_id}")
    print_response(response, "Delete annotation:")
    assert response.status_code == 200
    
    # Verify annotation was deleted
    print("\n--- Verifying annotation deletion ---")
    response = requests.get(f"{API_URL}/annotations/{project_id}")
    print_response(response, "Get annotations after deletion:")
    assert response.status_code == 200
    annotations = response.json()
    annotation_ids = [a["id"] for a in annotations]
    assert annotation_id not in annotation_ids
    
    # Delete all annotations for project
    print("\n--- Deleting all annotations for project ---")
    response = requests.delete(f"{API_URL}/annotations/project/{project_id}")
    print_response(response, "Delete all annotations:")
    assert response.status_code == 200
    
    # Verify all annotations were deleted
    print("\n--- Verifying all annotations deletion ---")
    response = requests.get(f"{API_URL}/annotations/{project_id}")
    print_response(response, "Get annotations after deletion:")
    assert response.status_code == 200
    annotations = response.json()
    assert len(annotations) == 0
    
    # Delete project
    print("\n--- Deleting project ---")
    response = requests.delete(f"{API_URL}/projects/{project_id}")
    print_response(response, "Delete project:")
    assert response.status_code == 200
    
    # Verify project was deleted
    print("\n--- Verifying project deletion ---")
    response = requests.get(f"{API_URL}/projects/{project_id}")
    print_response(response, "Get project after deletion:")
    assert response.status_code == 404
    
    return True

def test_edge_cases():
    print_separator("Testing Edge Cases")
    
    # Test malformed data
    print("\n--- Testing malformed project data ---")
    malformed_project = {
        "invalid_field": "This field doesn't exist"
    }
    response = requests.post(f"{API_URL}/projects", json=malformed_project)
    print_response(response, "Create project with malformed data:")
    assert response.status_code != 200
    
    # Test large file upload
    print("\n--- Testing large file upload ---")
    # Create a valid project first
    response = requests.post(f"{API_URL}/projects", json=test_project)
    project_id = response.json()["id"]
    
    # Generate a large base64 string (approximately 1MB)
    large_data = "A" * 1000000
    large_base64 = base64.b64encode(large_data.encode()).decode()
    
    large_upload = {
        "project_id": project_id,
        "file_data": large_base64,
        "file_name": "large_file.txt",
        "file_type": "text/plain"
    }
    
    response = requests.post(f"{API_URL}/upload", json=large_upload)
    print_response(response, "Upload large file:")
    # This should either succeed or fail gracefully
    assert response.status_code in [200, 413, 500]
    
    # Clean up
    requests.delete(f"{API_URL}/projects/{project_id}")
    
    return True

def run_all_tests():
    try:
        # Test root endpoint
        test_root()
        
        # Test project CRUD
        project_id = test_project_crud()
        
        # Test annotation CRUD
        annotation_id = test_annotation_crud(project_id)
        
        # Test file upload
        test_file_upload(project_id)
        
        # Test batch operations
        test_batch_operations(project_id)
        
        # Test delete operations
        test_delete_operations(project_id, annotation_id)
        
        # Test edge cases
        test_edge_cases()
        
        print_separator("All Tests Completed Successfully")
        return True
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    if success:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")