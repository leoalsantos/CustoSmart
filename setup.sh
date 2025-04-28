#!/bin/bash

# Display status message
echo "Setting up CustoSmart application..."

# Clone the repository
if [ -d "CustoSmart-Replit" ]; then
  echo "Repository already exists, pulling latest changes..."
  cd CustoSmart-Replit
  git pull
  cd ..
else
  echo "Cloning repository..."
  git clone https://github.com/leoalsantos/CustoSmart-Replit.git
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
  echo "Python is not installed. Please install Python 3 to continue."
  exit 1
fi

# Run the database setup script
echo "Setting up database..."
python3 setup_db.py

# Navigate to the repository directory
cd CustoSmart-Replit

# Install required Python packages if requirements.txt exists
if [ -f "requirements.txt" ]; then
  echo "Installing Python dependencies..."
  pip install -r requirements.txt
fi

# Install Node.js dependencies if package.json exists
if [ -f "package.json" ]; then
  echo "Installing Node.js dependencies..."
  if command -v npm &> /dev/null; then
    npm install
  else
    echo "npm not found. Node.js dependencies could not be installed."
    echo "You may need to manually install Node.js and run 'npm install' later."
  fi
fi

# Garantir que o diretório do projeto existe
if [ ! -d "CustoSmart-Replit" ]; then
  echo "Diretório CustoSmart-Replit não encontrado. Clonando repositório..."
  git clone https://github.com/leoalsantos/CustoSmart-Replit.git
fi

# Copiar arquivo .env para o diretório do projeto
if [ -f .env ]; then
  echo "Copiando arquivo .env para o diretório do projeto..."
  cp .env CustoSmart-Replit/
fi

# Inicializar o banco de dados com Drizzle
echo "Inicializando banco de dados com Drizzle..."
cp init_db.js CustoSmart-Replit/
cd CustoSmart-Replit
node init_db.js
cd ..

echo "Setup completed successfully!"
echo "Run './run.sh' to start the application."
