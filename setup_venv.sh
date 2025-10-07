#!/bin/bash

echo "🚀 Setting up Python virtual environment for HK Elderly Activities..."

# Create venv
python3 -m venv venv

# Activate venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install packages (simplified - no scraping libraries)
echo "📦 Installing packages..."
pip install pandas requests

# Save requirements
pip freeze > requirements.txt

echo "✅ Virtual environment setup complete!"
echo ""
echo "📁 Project structure:"
echo "  - venv/                    (virtual environment)"
echo "  - download_real_data.py    (CSV downloader)"
echo "  - real_hk_activities.json  (output data)"
echo "  - requirements.txt         (dependencies)"
echo ""
echo "To activate: source venv/bin/activate"
echo "To run: python download_real_data.py"
