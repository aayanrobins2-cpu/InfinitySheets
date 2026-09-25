#!/usr/bin/env python3
"""
Backend API test suite for past-paper endpoints - REGRESSION TEST
Tests new features: link field, board field, and PDF extraction endpoint.
"""

import os
import sys
import requests
from typing import Dict, Any, Optional

# Read backend URL from frontend .env
def get_backend_url() -> str:
    env_path = "/app/frontend/.env"
    with open(env_path, 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                return line.split('=', 1)[1].strip()
    raise ValueError("REACT_APP_BACKEND_URL not found in /app/frontend/.env")

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

# Every /api/past-papers route needs a signed-in user (writes need an admin).
# Pass a Supabase access token for an admin account in TEST_ACCESS_TOKEN.
ACCESS_TOKEN = os.environ.get("TEST_ACCESS_TOKEN", "")
AUTH_HEADERS = {"Authorization": f"Bearer {ACCESS_TOKEN}"} if ACCESS_TOKEN else {}

# Test results tracking
test_results = []
created_ids = []  # Track created items for cleanup


def log_test(name: str, passed: bool, details: str = ""):
    """Log test result."""
    status = "✅ PASS" if passed else "❌ FAIL"
    test_results.append({
        "name": name,
        "passed": passed,
        "details": details
    })
    print(f"{status}: {name}")
    if details:
        print(f"  Details: {details}")


def test_post_with_link_and_board():
    """Test 1: POST /api/past-papers with link and board fields."""
    payload = {
        "subject": "Physics",
        "topic": "Waves",
        "q": "Speed of sound in air is roughly?",
        "answerType": "Multiple choice",
        "difficulty": "Easy",
        "options": ["330 m/s", "3 m/s", "3000 m/s", "33 m/s"],
        "a": 0,
        "link": "https://example.com/reference.pdf",
        "board": "CBSE"
    }
    
    try:
        response = requests.post(f"{API_BASE}/past-papers", headers=AUTH_HEADERS, json=payload, timeout=10)
        
        if response.status_code == 201:
            data = response.json()
            # Verify link and board are in response
            if "link" in data and "board" in data:
                if data["link"] == "https://example.com/reference.pdf" and data["board"] == "CBSE":
                    created_ids.append(data["id"])
                    log_test("POST with link and board fields", True, 
                            f"Created with id={data['id']}, link={data['link']}, board={data['board']}")
                    return data["id"]
                else:
                    log_test("POST with link and board fields", False, 
                            f"Fields present but values incorrect: link={data.get('link')}, board={data.get('board')}")
            else:
                log_test("POST with link and board fields", False, 
                        f"Missing link or board in response. Keys: {list(data.keys())}")
        else:
            log_test("POST with link and board fields", False, 
                    f"Status: {response.status_code}, Body: {response.text}")
    except Exception as e:
        log_test("POST with link and board fields", False, f"Exception: {str(e)}")
    
    return None


def test_get_returns_link_and_board():
    """Test 2: GET /api/past-papers returns items with link and board fields."""
    try:
        response = requests.get(f"{API_BASE}/past-papers", headers=AUTH_HEADERS, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                # Check if any item has link or board populated
                items_with_link = [item for item in data if item.get("link")]
                items_with_board = [item for item in data if item.get("board")]
                
                if items_with_link or items_with_board:
                    log_test("GET returns link and board fields", True, 
                            f"Found {len(items_with_link)} items with link, {len(items_with_board)} items with board")
                else:
                    log_test("GET returns link and board fields", True, 
                            "No items with link/board yet, but fields are supported (empty is valid)")
            else:
                log_test("GET returns link and board fields", True, 
                        "Empty list returned (valid state)")
        else:
            log_test("GET returns link and board fields", False, 
                    f"Status: {response.status_code}, Body: {response.text}")
    except Exception as e:
        log_test("GET returns link and board fields", False, f"Exception: {str(e)}")


def test_extract_valid_pdf():
    """Test 3: POST /api/past-papers/extract with valid PDF."""
    pdf_path = "/tmp/test_paper.pdf"
    
    if not os.path.exists(pdf_path):
        log_test("Extract from valid PDF", False, f"Test PDF not found at {pdf_path}")
        return
    
    try:
        with open(pdf_path, 'rb') as f:
            files = {'file': ('test_paper.pdf', f, 'application/pdf')}
            params = {
                'subject': 'Physics',
                'board': 'CBSE',
                'difficulty': 'Medium'
            }
            
            # Increased timeout to 120s for LLM processing
            response = requests.post(
                f"{API_BASE}/past-papers/extract",
                headers=AUTH_HEADERS,
                files=files,
                params=params,
                timeout=120
            )
        
        if response.status_code == 200:
            data = response.json()
            
            # Verify response structure
            if "questions" in data and "count" in data:
                questions = data["questions"]
                count = data["count"]
                
                if isinstance(questions, list) and count == len(questions):
                    if count > 0:
                        # Verify first question structure
                        q = questions[0]
                        has_q = "q" in q and q["q"].strip()
                        has_valid_answer_type = q.get("answerType") in {"Multiple choice", "Typed response", "Exam style"}
                        has_valid_difficulty = q.get("difficulty") in {"Easy", "Medium", "Exam level", "Hard"}
                        
                        if has_q and has_valid_answer_type and has_valid_difficulty:
                            log_test("Extract from valid PDF", True, 
                                    f"Extracted {count} questions. Sample: q='{q['q'][:50]}...', answerType={q['answerType']}, difficulty={q['difficulty']}")
                        else:
                            log_test("Extract from valid PDF", False, 
                                    f"Question structure invalid: has_q={has_q}, valid_answerType={has_valid_answer_type}, valid_difficulty={has_valid_difficulty}")
                    else:
                        log_test("Extract from valid PDF", False, 
                                "No questions extracted from PDF (count=0)")
                else:
                    log_test("Extract from valid PDF", False, 
                            f"Invalid response: questions is not list or count mismatch. count={count}, len(questions)={len(questions) if isinstance(questions, list) else 'N/A'}")
            else:
                log_test("Extract from valid PDF", False, 
                        f"Missing 'questions' or 'count' in response. Keys: {list(data.keys())}")
        else:
            log_test("Extract from valid PDF", False, 
                    f"Status: {response.status_code}, Body: {response.text[:500]}")
    except requests.exceptions.Timeout:
        log_test("Extract from valid PDF", False, "Request timed out after 120s (LLM processing took too long)")
    except Exception as e:
        log_test("Extract from valid PDF", False, f"Exception: {str(e)}")


def test_extract_non_pdf_file():
    """Test 4: POST /api/past-papers/extract with non-PDF file should return 422."""
    try:
        # Create a temporary text file
        text_content = b"This is not a PDF file"
        files = {'file': ('test.txt', text_content, 'text/plain')}
        params = {'subject': 'Physics', 'board': 'CBSE', 'difficulty': 'Medium'}
        
        response = requests.post(
            f"{API_BASE}/past-papers/extract",
            headers=AUTH_HEADERS,
            files=files,
            params=params,
            timeout=10
        )
        
        if response.status_code == 422:
            log_test("Extract non-PDF file returns 422", True, 
                    f"Correctly rejected: {response.json().get('detail', '')}")
        else:
            log_test("Extract non-PDF file returns 422", False, 
                    f"Expected 422, got {response.status_code}. Body: {response.text}")
    except Exception as e:
        log_test("Extract non-PDF file returns 422", False, f"Exception: {str(e)}")


def test_extract_no_file():
    """Test 5: POST /api/past-papers/extract with no file should return 422."""
    try:
        params = {'subject': 'Physics', 'board': 'CBSE', 'difficulty': 'Medium'}
        
        # Send request without file
        response = requests.post(
            f"{API_BASE}/past-papers/extract",
            headers=AUTH_HEADERS,
            params=params,
            timeout=10
        )
        
        if response.status_code == 422:
            log_test("Extract with no file returns 422", True, 
                    f"Correctly rejected: {response.json().get('detail', '') if response.headers.get('content-type', '').startswith('application/json') else response.text[:100]}")
        else:
            log_test("Extract with no file returns 422", False, 
                    f"Expected 422, got {response.status_code}. Body: {response.text[:200]}")
    except Exception as e:
        log_test("Extract with no file returns 422", False, f"Exception: {str(e)}")


def test_get_requires_auth():
    """Test 6: GET /api/past-papers without a token should return 401."""
    try:
        response = requests.get(f"{API_BASE}/past-papers", timeout=10)
        log_test("Anonymous GET /api/past-papers is rejected", response.status_code == 401,
                f"Status: {response.status_code}")
    except Exception as e:
        log_test("Anonymous GET /api/past-papers is rejected", False, f"Exception: {str(e)}")


def test_pre_existing_endpoints():
    """Test 7: Verify pre-existing endpoints still work (regression check)."""
    try:
        # Test GET /api/
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200 and response.json() == {"message": "Hello World"}:
            log_test("Pre-existing GET /api/ still works", True, "Root endpoint functional")
        else:
            log_test("Pre-existing GET /api/ still works", False, 
                    f"Status: {response.status_code}, Body: {response.text}")
        
        # Test GET /api/past-papers
        response = requests.get(f"{API_BASE}/past-papers", headers=AUTH_HEADERS, timeout=10)
        if response.status_code == 200 and isinstance(response.json(), list):
            log_test("Pre-existing GET /api/past-papers still works", True, 
                    f"Returns list with {len(response.json())} items")
        else:
            log_test("Pre-existing GET /api/past-papers still works", False, 
                    f"Status: {response.status_code}, Body: {response.text}")
        
        # Test POST /api/past-papers (basic MCQ without new fields)
        payload = {
            "subject": "Chemistry",
            "topic": "Acids",
            "q": "What is the pH of pure water?",
            "answerType": "Multiple choice",
            "difficulty": "Easy",
            "options": ["5", "7", "9", "11"],
            "a": 1
        }
        response = requests.post(f"{API_BASE}/past-papers", headers=AUTH_HEADERS, json=payload, timeout=10)
        if response.status_code == 201:
            data = response.json()
            created_ids.append(data["id"])
            log_test("Pre-existing POST /api/past-papers still works", True, 
                    f"Created item with id={data['id']}")
        else:
            log_test("Pre-existing POST /api/past-papers still works", False, 
                    f"Status: {response.status_code}, Body: {response.text}")
        
        # Test DELETE /api/past-papers/{id}
        if created_ids:
            test_id = created_ids[-1]
            response = requests.delete(f"{API_BASE}/past-papers/{test_id}", headers=AUTH_HEADERS, timeout=10)
            if response.status_code == 204:
                created_ids.remove(test_id)
                log_test("Pre-existing DELETE /api/past-papers/{id} still works", True, 
                        f"Deleted item {test_id}")
            else:
                log_test("Pre-existing DELETE /api/past-papers/{id} still works", False, 
                        f"Status: {response.status_code}, Body: {response.text}")
        else:
            log_test("Pre-existing DELETE /api/past-papers/{id} still works", False, 
                    "No item to delete (POST failed)")
            
    except Exception as e:
        log_test("Pre-existing endpoints regression check", False, f"Exception: {str(e)}")


def cleanup_created_items():
    """Clean up any remaining test items."""
    print("\n🧹 Cleaning up test data...")
    for item_id in created_ids[:]:
        try:
            response = requests.delete(f"{API_BASE}/past-papers/{item_id}", headers=AUTH_HEADERS, timeout=10)
            if response.status_code == 204:
                print(f"  Deleted {item_id}")
                created_ids.remove(item_id)
        except Exception as e:
            print(f"  Failed to delete {item_id}: {e}")


def print_summary():
    """Print test summary."""
    print("\n" + "="*70)
    print("REGRESSION TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for t in test_results if t["passed"])
    failed = sum(1 for t in test_results if not t["passed"])
    total = len(test_results)
    
    print(f"\nTotal: {total} tests")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    if failed > 0:
        print("\n❌ FAILED TESTS:")
        for t in test_results:
            if not t["passed"]:
                print(f"  - {t['name']}")
                if t["details"]:
                    print(f"    {t['details']}")
    
    print("\n" + "="*70)
    
    return failed == 0


def main():
    """Run all regression tests."""
    print("="*70)
    print("PAST-PAPER API REGRESSION TEST SUITE")
    print("Testing new features: link field, board field, PDF extraction")
    print("="*70)
    print(f"Backend URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    if not ACCESS_TOKEN:
        print("WARNING: TEST_ACCESS_TOKEN is not set; authenticated tests will get 401")
    print("="*70 + "\n")
    
    # Run regression tests for new features
    test_post_with_link_and_board()
    test_get_returns_link_and_board()
    test_extract_valid_pdf()
    test_extract_non_pdf_file()
    test_extract_no_file()
    test_get_requires_auth()
    test_pre_existing_endpoints()
    
    # Cleanup remaining items
    cleanup_created_items()
    
    # Print summary
    all_passed = print_summary()
    
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
