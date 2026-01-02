#!/usr/bin/env python3
"""
MindVault Backend Test Script
Tests all endpoints and verifies embeddings are working
"""

import requests
import json
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def print_header(text: str):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_success(text: str):
    """Print success message"""
    print(f"✅ {text}")

def print_error(text: str):
    """Print error message"""
    print(f"❌ {text}")

def print_info(text: str):
    """Print info message"""
    print(f"ℹ️  {text}")

def test_health() -> bool:
    """Test health endpoint"""
    print_header("Testing Health Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success("Backend is healthy!")
            print(f"   Status: {data.get('status')}")
            print(f"   MongoDB Connected: {data.get('mongodb_connected')}")
            print(f"   Gemini Configured: {data.get('gemini_configured')}")
            return True
        else:
            print_error(f"Health check failed with status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed to connect to backend: {e}")
        print_info("Make sure the backend is running: uvicorn app.main:app --reload")
        return False

def test_create_note() -> Dict[str, Any]:
    """Test note creation with embedding"""
    print_header("Testing Note Creation")
    
    test_note = {
        "title": "Sunset at the Beach",
        "content": "Watched a beautiful sunset at the beach yesterday. The orange and pink sky reflected on the calm water. Very peaceful and calming experience.",
        "user_id": "demo-user",
        "tags": ["nature", "relaxation"]
    }
    
    try:
        print_info(f"Creating note: '{test_note['title']}'")
        response = requests.post(
            f"{API_URL}/notes",
            json=test_note,
            timeout=30  # Embedding generation can take a moment
        )
        
        if response.status_code == 201:
            data = response.json()
            print_success("Note created successfully!")
            print(f"   Note ID: {data.get('_id')}")
            print(f"   Title: {data.get('title')}")
            print(f"   Tags: {data.get('tags')}")
            print(f"   Has Embedding: {'embedding' in data}")
            if 'embedding' in data and data['embedding']:
                print(f"   Embedding Dimensions: {len(data['embedding'])}")
            return data
        else:
            error = response.json()
            print_error(f"Failed to create note: {error.get('detail')}")
            return None
    except Exception as e:
        print_error(f"Error creating note: {e}")
        return None

def test_semantic_search(note_id: str = None) -> bool:
    """Test semantic search"""
    print_header("Testing Semantic Search")
    
    # Test with a different phrase that's semantically similar
    search_query = {
        "query": "peaceful evening by the water",  # Similar to "sunset at beach"
        "user_id": "demo-user",
        "limit": 5,
        "min_score": 0.65
    }
    
    try:
        print_info(f"Searching for: '{search_query['query']}'")
        response = requests.post(
            f"{API_URL}/search",
            json=search_query,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Search completed! Found {data.get('total', 0)} results")
            
            for i, result in enumerate(data.get('results', []), 1):
                note = result.get('note', {})
                score = result.get('score', 0)
                print(f"\n   Result {i}:")
                print(f"   Title: {note.get('title')}")
                print(f"   Similarity Score: {score*100:.1f}%")
                print(f"   Content Preview: {note.get('content', '')[:50]}...")
                
                if note_id and note.get('_id') == note_id:
                    print_success("   ↑ This is the note we just created!")
            
            return len(data.get('results', [])) > 0
        else:
            error = response.json()
            print_error(f"Search failed: {error.get('detail')}")
            return False
    except Exception as e:
        print_error(f"Error during search: {e}")
        return False

def test_tag_suggestions() -> bool:
    """Test AI tag suggestions"""
    print_header("Testing AI Tag Suggestions")
    
    test_input = {
        "title": "Morning Workout Routine",
        "content": "Started my day with a 30-minute jog, then did some yoga stretches. Felt energized and ready for the day."
    }
    
    try:
        print_info(f"Getting tag suggestions for: '{test_input['title']}'")
        response = requests.post(
            f"{API_URL}/suggest-tags",
            json=test_input,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            suggestions = data.get('suggestions', [])
            print_success(f"Received {len(suggestions)} tag suggestions:")
            
            for suggestion in suggestions:
                tag = suggestion.get('tag')
                confidence = suggestion.get('confidence', 0)
                print(f"   #{tag} ({confidence*100:.0f}% confidence)")
            
            return len(suggestions) > 0
        else:
            print_error("Tag suggestions failed")
            return False
    except Exception as e:
        print_error(f"Error getting tag suggestions: {e}")
        return False

def test_list_notes() -> bool:
    """Test listing user notes"""
    print_header("Testing List Notes")
    
    try:
        print_info("Fetching all notes for demo-user")
        response = requests.get(
            f"{API_URL}/notes/demo-user",
            timeout=10
        )
        
        if response.status_code == 200:
            notes = response.json()
            count = len(notes)
            print_success(f"Found {count} notes for demo-user")
            
            if count > 0:
                print("\n   Recent notes:")
                for note in notes[:3]:
                    print(f"   • {note.get('title', 'Untitled')}")
            
            return True
        else:
            print_error("Failed to list notes")
            return False
    except Exception as e:
        print_error(f"Error listing notes: {e}")
        return False

def run_all_tests():
    """Run all tests in sequence"""
    print("\n")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║        MindVault Backend Test Suite                       ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    results = {
        "Health Check": False,
        "Note Creation": False,
        "Semantic Search": False,
        "Tag Suggestions": False,
        "List Notes": False
    }
    
    # Test 1: Health
    results["Health Check"] = test_health()
    if not results["Health Check"]:
        print_error("\nBackend is not running! Cannot continue tests.")
        print_info("Start backend with: uvicorn app.main:app --reload")
        sys.exit(1)
    
    # Test 2: Create note
    created_note = test_create_note()
    results["Note Creation"] = created_note is not None
    note_id = created_note.get('_id') if created_note else None
    
    # Test 3: Search
    results["Semantic Search"] = test_semantic_search(note_id)
    
    # Test 4: Tag suggestions
    results["Tag Suggestions"] = test_tag_suggestions()
    
    # Test 5: List notes
    results["List Notes"] = test_list_notes()
    
    # Summary
    print_header("Test Results Summary")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASSED" if passed_test else "❌ FAILED"
        print(f"   {test_name}: {status}")
    
    print(f"\n   Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! MindVault backend is working perfectly!")
        print("\nNext steps:")
        print("1. Open the React Native app")
        print("2. Navigate to MindVault")
        print("3. Try creating notes and searching!")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        print("\nTroubleshooting:")
        print("1. Verify MongoDB Atlas connection")
        print("2. Check Gemini API key in .env")
        print("3. Ensure vector index is created (768 dimensions)")
        print("4. Review backend logs for errors")
    
    return passed == total

if __name__ == "__main__":
    try:
        success = run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
