#!/usr/bin/env python3
"""
Test script for the FastAPI backend
Run this after starting the server to verify everything works
"""

import requests
import json
import time
from typing import Dict, Any

API_BASE_URL = "http://localhost:8000"
TEST_USER_ID = "test_user_123"


def print_section(title: str):
    """Print a section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def test_health_check() -> bool:
    """Test the health endpoint"""
    print_section("Testing Health Check")
    
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        response.raise_for_status()
        
        data = response.json()
        print(f"✓ Health check passed")
        print(f"  Status: {data['status']}")
        print(f"  Version: {data['version']}")
        print(f"  MongoDB: {'✓' if data['mongodb_connected'] else '✗'}")
        print(f"  OpenAI: {'✓' if data['openai_configured'] else '✗'}")
        
        return data['mongodb_connected'] and data['openai_configured']
    except Exception as e:
        print(f"✗ Health check failed: {str(e)}")
        return False


def test_create_note() -> str:
    """Test creating a note"""
    print_section("Testing Note Creation")
    
    note_data = {
        "title": "Test Note - Python Integration",
        "content": "This is a test note to verify the FastAPI backend is working correctly. It includes embedding generation with OpenAI.",
        "user_id": TEST_USER_ID,
        "tags": ["test", "backend", "python"]
    }
    
    try:
        print(f"Creating note: {note_data['title']}")
        response = requests.post(
            f"{API_BASE_URL}/api/notes",
            json=note_data,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        
        created_note = response.json()
        note_id = created_note['_id']
        
        print(f"✓ Note created successfully")
        print(f"  ID: {note_id}")
        print(f"  Title: {created_note['title']}")
        print(f"  Created: {created_note['created_at']}")
        
        return note_id
    except requests.exceptions.HTTPError as e:
        print(f"✗ Failed to create note: {e.response.status_code}")
        print(f"  Error: {e.response.json()}")
        return None
    except Exception as e:
        print(f"✗ Failed to create note: {str(e)}")
        return None


def test_create_multiple_notes() -> list:
    """Create multiple test notes for search testing"""
    print_section("Creating Multiple Notes")
    
    notes = [
        {
            "title": "Machine Learning Basics",
            "content": "Introduction to machine learning concepts including supervised and unsupervised learning.",
            "tags": ["ml", "ai", "education"]
        },
        {
            "title": "FastAPI Tutorial",
            "content": "Learn how to build REST APIs with FastAPI, including async operations and Pydantic validation.",
            "tags": ["python", "fastapi", "backend"]
        },
        {
            "title": "MongoDB Vector Search",
            "content": "Guide to implementing vector search in MongoDB Atlas for RAG applications.",
            "tags": ["mongodb", "vector-search", "database"]
        },
        {
            "title": "OpenAI Embeddings",
            "content": "Using OpenAI's text-embedding-3-small model to generate semantic embeddings for text.",
            "tags": ["openai", "embeddings", "nlp"]
        }
    ]
    
    created_ids = []
    
    for note_data in notes:
        note_data["user_id"] = TEST_USER_ID
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/notes",
                json=note_data
            )
            response.raise_for_status()
            created_note = response.json()
            created_ids.append(created_note['_id'])
            print(f"✓ Created: {note_data['title']}")
            time.sleep(0.5)  # Rate limiting
        except Exception as e:
            print(f"✗ Failed: {note_data['title']} - {str(e)}")
    
    print(f"\nCreated {len(created_ids)} notes")
    return created_ids


def test_list_notes() -> bool:
    """Test listing user's notes"""
    print_section("Testing List Notes")
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/notes/{TEST_USER_ID}")
        response.raise_for_status()
        
        notes = response.json()
        print(f"✓ Found {len(notes)} notes for user {TEST_USER_ID}")
        
        for i, note in enumerate(notes[:3], 1):
            print(f"\n  {i}. {note['title']}")
            print(f"     Tags: {', '.join(note['tags'])}")
            print(f"     Created: {note['created_at']}")
        
        if len(notes) > 3:
            print(f"\n  ... and {len(notes) - 3} more")
        
        return True
    except Exception as e:
        print(f"✗ Failed to list notes: {str(e)}")
        return False


def test_vector_search() -> bool:
    """Test vector search"""
    print_section("Testing Vector Search")
    
    # Wait a moment for index to process
    print("Waiting 2 seconds for vector index...")
    time.sleep(2)
    
    search_queries = [
        "machine learning and artificial intelligence",
        "building APIs with Python",
        "database vector operations"
    ]
    
    success = True
    
    for query in search_queries:
        print(f"\nQuery: '{query}'")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/search",
                json={
                    "query": query,
                    "user_id": TEST_USER_ID,
                    "limit": 3
                }
            )
            response.raise_for_status()
            
            results = response.json()
            print(f"✓ Found {results['count']} results")
            
            for i, result in enumerate(results['results'], 1):
                note = result['note']
                score = result['score']
                print(f"\n  {i}. {note['title']}")
                print(f"     Score: {score:.4f}")
                print(f"     Content: {note['content'][:80]}...")
        except Exception as e:
            print(f"✗ Search failed: {str(e)}")
            success = False
    
    return success


def test_validation() -> bool:
    """Test input validation"""
    print_section("Testing Validation (422 Errors)")
    
    invalid_notes = [
        {"title": "", "content": "test", "user_id": TEST_USER_ID},
        {"title": "test", "content": "", "user_id": TEST_USER_ID},
        {"title": "   ", "content": "   ", "user_id": TEST_USER_ID},
    ]
    
    all_rejected = True
    
    for i, note_data in enumerate(invalid_notes, 1):
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/notes",
                json=note_data
            )
            
            if response.status_code == 422:
                error = response.json()
                print(f"✓ Test {i}: Correctly rejected with 422")
                print(f"  Detail: {error.get('detail', 'N/A')}")
            else:
                print(f"✗ Test {i}: Expected 422, got {response.status_code}")
                all_rejected = False
        except Exception as e:
            print(f"✗ Test {i}: Unexpected error: {str(e)}")
            all_rejected = False
    
    return all_rejected


def main():
    """Run all tests"""
    print(f"\n{'#'*60}")
    print("#  FastAPI Backend Test Suite")
    print(f"#  API: {API_BASE_URL}")
    print(f"#  User: {TEST_USER_ID}")
    print(f"{'#'*60}")
    
    # Test health
    if not test_health_check():
        print("\n⚠️  Health check failed. Make sure:")
        print("  1. Backend is running (uvicorn app.main:app --reload)")
        print("  2. MongoDB is connected")
        print("  3. OpenAI API key is configured")
        return
    
    # Test validation
    test_validation()
    
    # Create notes
    note_id = test_create_note()
    if note_id:
        test_create_multiple_notes()
    
    # List notes
    test_list_notes()
    
    # Test search
    print("\n⚠️  Note: Vector search requires a vector index in MongoDB Atlas")
    print("   If search fails, wait 5-10 minutes for index to build")
    test_vector_search()
    
    print_section("Test Suite Complete")
    print("✓ All tests finished")
    print("\nNext steps:")
    print("  1. Check /docs for interactive API documentation")
    print("  2. Integrate with React Native app")
    print("  3. Monitor /health endpoint")


if __name__ == "__main__":
    main()
