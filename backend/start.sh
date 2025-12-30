#!/bin/bash
# Quick start script for the FastAPI backend

set -e

echo "=========================================="
echo "  Notes RAG Backend - Quick Start"
echo "=========================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

echo "✓ Python found: $(python3 --version)"

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found"
    echo "   Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "📝 Please edit .env and add your:"
    echo "   - OPENAI_API_KEY"
    echo "   - MONGODB_URI"
    echo ""
    echo "   Then run this script again."
    exit 1
fi

echo "✓ .env file found"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo ""
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

echo "✓ Virtual environment found"

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

# Check if MongoDB URI is set
if grep -q "mongodb+srv://username:password" .env; then
    echo ""
    echo "⚠️  Default MongoDB URI detected in .env"
    echo "   Please update MONGODB_URI with your actual connection string"
    exit 1
fi

# Check if OpenAI key is set
if grep -q "sk-your-openai-api-key" .env; then
    echo ""
    echo "⚠️  Default OpenAI API key detected in .env"
    echo "   Please update OPENAI_API_KEY with your actual key"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Starting FastAPI Backend"
echo "=========================================="
echo ""
echo "  API:    http://localhost:8000"
echo "  Docs:   http://localhost:8000/docs"
echo "  Health: http://localhost:8000/health"
echo ""
echo "  Press Ctrl+C to stop"
echo ""

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
