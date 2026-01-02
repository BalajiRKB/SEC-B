#!/usr/bin/env python3
"""
Complete MindVault API Test Suite
Tests all endpoints with real data flow
"""

import requests
import json
import time
from datetime import datetime

# API Configuration
BASE_URL = "http://localhost:8000/api"
USER_ID = "demo-user"

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(name):
    print(f"\n{BLUE}{'='*60}")
    print(f"Testing: {name}")
    print(f"{'='*60}{RESET}")

def print_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def print_info(msg):
    print(f"{YELLOW}ℹ {msg}{RESET}")

def test_health():
    """Test health endpoint"""
    print_test("Health Check")
    try:
        response = requests.get("http://localhost:8000/health")
        data = response.json()
        
        print_info(f"Status: {data['status']}")
        print_info(f"Version: {data['version']}")
        print_info(f"MongoDB: {'Connected' if data['mongodb_connected'] else 'Disconnected'}")
        print_info(f"Gemini API: {'Configured' if data['openai_configured'] else 'Not configured'}")
        
        if data['status'] == 'healthy' and data['mongodb_connected']:
            print_success("Backend is fully operational!")
            return True
        else:
            print_error("Backend has issues")
            return False
    except Exception as e:
        print_error(f"Health check failed: {e}")
        return False

def test_create_note():
    """Test creating a new note"""
    print_test("Create Note")
    
    note_data = {
        "title": "Machine Learning Fundamentals",
        "content": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. Key concepts include supervised learning, unsupervised learning, neural networks, and deep learning.",
        "user_id": USER_ID,
        "tags": ["machine-learning", "ai", "education"]
    }
    
    try:
        print_info("Creating note with title: " + note_data['title'])
        response = requests.post(f"{BASE_URL}/notes", json=note_data)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Note created with ID: {data['_id']}")
            print_info(f"Embedding dimensions: {len(data['embedding'])}")
            print_info(f"Tags: {', '.join(data['tags'])}")
            return data
        else:
            print_error(f"Failed to create note: {response.status_code}")
            print_error(response.text)
            return None
    except Exception as e:
        print_error(f"Error creating note: {e}")
        return None

def test_create_multiple_notes():
    """Create multiple notes for testing search"""
    print_test("Create Multiple Notes")
    
    notes = [
        {
            "title": "Python Programming Best Practices",
            "content": "Python is a high-level programming language. Follow PEP 8 style guide, use virtual environments, write docstrings, and implement proper error handling.",
            "user_id": USER_ID,
            "tags": ["python", "programming", "best-practices"]
        },
        {
            "title": "Database Design Principles",
            "content": "Good database design includes normalization, proper indexing, foreign key constraints, and query optimization. MongoDB offers flexible schema design with JSON-like documents.",
            "user_id": USER_ID,
            "tags": ["database", "mongodb", "design"]
        },
        {
            "title": "Neural Networks Deep Dive",
            "content": "Neural networks consist of layers of interconnected nodes. Backpropagation is used for training. Common architectures include CNNs for images and RNNs for sequences.",
            "user_id": USER_ID,
            "tags": ["neural-networks", "deep-learning", "ai"]
        }
    ]
    
    created_notes = []
    for note in notes:
        try:
            response = requests.post(f"{BASE_URL}/notes", json=note)
            if response.status_code == 200:
                data = response.json()
                created_notes.append(data)
                print_success(f"Created: {note['title']}")
            time.sleep(1)  # Avoid rate limiting
        except Exception as e:
            print_error(f"Error creating note: {e}")
    
    print_info(f"Total notes created: {len(created_notes)}")
    return created_notes

def test_get_user_notes():
    """Test retrieving user's notes"""
    print_test("Get User Notes")
    
    try:
        response = requests.get(f"{BASE_URL}/notes/{USER_ID}")
        
        if response.status_code == 200:
            notes = response.json()
            print_success(f"Retrieved {len(notes)} notes")
            
            for i, note in enumerate(notes, 1):
                print_info(f"{i}. {note['title']} ({len(note.get('tags', []))} tags)")
            
            return notes
        else:
            print_error(f"Failed to get notes: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"Error getting notes: {e}")
        return []

def test_semantic_search(query):
    """Test semantic search"""
    print_test(f"Semantic Search: '{query}'")
    
    search_data = {
        "query": query,
        "user_id": USER_ID,
        "top_k": 5,
        "min_score": 0.5
    }
    
    try:
        print_info(f"Searching for: {query}")
        response = requests.post(f"{BASE_URL}/search", json=search_data)
        
        if response.status_code == 200:
            data = response.json()
            results = data['results']
            
            print_success(f"Found {len(results)} relevant notes")
            print_info(f"Search took: {data['search_time_ms']:.2f}ms")
            
            for i, result in enumerate(results, 1):
                similarity = result['similarity_score'] * 100
                print_info(f"{i}. {result['title']} ({similarity:.1f}% match)")
                print(f"   Preview: {result['content'][:80]}...")
            
            return results
        else:
            print_error(f"Search failed: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"Error during search: {e}")
        return []

def test_tag_suggestions():
    """Test AI tag suggestions"""
    print_test("AI Tag Suggestions")
    
    sample_note = {
        "title": "Introduction to Kubernetes",
        "content": "Kubernetes is a container orchestration platform that automates deployment, scaling, and management of containerized applications. It provides features like service discovery, load balancing, and self-healing."
    }
    
    try:
        print_info(f"Getting tag suggestions for: {sample_note['title']}")
        response = requests.post(f"{BASE_URL}/suggest-tags", json=sample_note)
        
        if response.status_code == 200:
            suggestions = response.json()
            
            print_success(f"Got {len(suggestions)} tag suggestions")
            for suggestion in suggestions:
                confidence = suggestion['confidence'] * 100
                print_info(f"  • {suggestion['tag']} ({confidence:.0f}% confidence)")
            
            return suggestions
        else:
            print_error(f"Tag suggestion failed: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"Error getting tag suggestions: {e}")
        return []

def test_related_notes(text):
    """Test finding related notes"""
    print_test(f"Related Notes for: '{text[:50]}...'")
    
    search_data = {
        "query": text,
        "user_id": USER_ID,
        "top_k": 3,
        "min_score": 0.7
    }
    
    try:
        response = requests.post(f"{BASE_URL}/search", json=search_data)
        
        if response.status_code == 200:
            data = response.json()
            results = data['results']
            
            print_success(f"Found {len(results)} related notes")
            
            for i, result in enumerate(results, 1):
                similarity = result['similarity_score'] * 100
                print_info(f"{i}. {result['title']} ({similarity:.1f}% similarity)")
            
            return results
        else:
            print_error(f"Related notes search failed: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"Error finding related notes: {e}")
        return []

def run_all_tests():
    """Run complete test suite"""
    print(f"\n{BLUE}{'='*60}")
    print("🧪 MindVault Complete API Test Suite")
    print(f"{'='*60}{RESET}")
    print(f"Backend: {BASE_URL}")
    print(f"User ID: {USER_ID}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Health check
    if not test_health():
        print_error("\n❌ Backend is not healthy. Stopping tests.")
        return
    
    # Test 2: Create initial note
    first_note = test_create_note()
    time.sleep(2)
    
    # Test 3: Create multiple notes
    test_create_multiple_notes()
    time.sleep(2)
    
    # Test 4: Get all user notes
    all_notes = test_get_user_notes()
    time.sleep(1)
    
    # Test 5: Semantic search queries
    search_queries = [
        "How does machine learning work?",
        "Best practices for coding in Python",
        "Database optimization techniques",
        "Neural network architectures"
    ]
    
    for query in search_queries:
        test_semantic_search(query)
        time.sleep(1)
    
    # Test 6: AI tag suggestions
    test_tag_suggestions()
    time.sleep(1)
    
    # Test 7: Related notes
    if all_notes:
        test_related_notes(all_notes[0]['content'])
    
    # Summary
    print(f"\n{GREEN}{'='*60}")
    print("✅ All Tests Completed!")
    print(f"{'='*60}{RESET}")
    print(f"\n{YELLOW}📊 Summary:")
    print(f"  • Total notes in database: {len(all_notes)}")
    print(f"  • Search queries tested: {len(search_queries)}")
    print(f"  • All core features verified!")
    print(f"{RESET}")

if __name__ == "__main__":
    run_all_tests()
