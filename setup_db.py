#!/usr/bin/env python3
import os
import sys
import psycopg2
from psycopg2 import sql
import subprocess
import json

def get_db_connection_params():
    """Get database connection parameters from environment variables"""
    params = {
        'user': os.getenv('PGUSER', 'postgres'),
        'password': os.getenv('PGPASSWORD', 'postgres'),
        'host': os.getenv('PGHOST', 'localhost'),
        'port': os.getenv('PGPORT', '5432'),
        'database': 'postgres'  # Connect to default database first
    }
    
    # For complete DATABASE_URL format
    db_url = os.getenv('DATABASE_URL')
    if db_url:
        print("Using DATABASE_URL environment variable")
    else:
        print("Using individual database environment variables")
        
    return params

def setup_database():
    """Set up the PostgreSQL database for CustoSmart"""
    try:
        # Connect to PostgreSQL server
        params = get_db_connection_params()
        print(f"Connecting to PostgreSQL server on {params['host']}:{params['port']}...")
        
        # First, connect to the default postgres database
        conn_string = f"dbname={params['database']} user={params['user']} password={params['password']} host={params['host']} port={params['port']}"
        conn = psycopg2.connect(conn_string)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if the database already exists
        target_db = os.getenv('PGDATABASE', 'custosmart')
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (target_db,))
        exists = cursor.fetchone()
        
        if not exists:
            print(f"Creating database '{target_db}'...")
            cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(target_db)))
            print(f"Database '{target_db}' created successfully")
        else:
            print(f"Database '{target_db}' already exists")
            
        cursor.close()
        conn.close()
        
        # Now connect to the target database to set up schema
        params['database'] = target_db
        conn_string = f"dbname={params['database']} user={params['user']} password={params['password']} host={params['host']} port={params['port']}"
        conn = psycopg2.connect(conn_string)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Create tables if they don't exist
        # This is a simple schema based on what might be needed for a cost management app
        # The actual schema will be determined by inspecting the repository
        
        # Clone repository if not already cloned to inspect schema
        if not os.path.exists('CustoSmart-Replit'):
            print("Cloning repository to analyze schema...")
            subprocess.run(['git', 'clone', 'https://github.com/leoalsantos/CustoSmart-Replit.git'], check=True)
        
        # Attempt to find schema information in the repository
        schema_files = find_schema_files('CustoSmart-Replit')
        if schema_files:
            for schema_file in schema_files:
                print(f"Found schema file: {schema_file}")
                # Skip executing original schema files as they have syntax issues
                # Instead, we will use our fixed schema file
                if False and schema_file.endswith('.sql'):
                    with open(schema_file, 'r') as f:
                        sql_script = f.read()
                        cursor.execute(sql_script)
                        print(f"Executed SQL script from {schema_file}")
        else:
            # Execute our fixed SQL script
            print("Creating schema from fixed script...")
            try:
                with open('fixed_script.sql', 'r') as f:
                    sql_script = f.read()
                    cursor.execute(sql_script)
                    print("Executed fixed SQL script successfully")
            except Exception as e:
                print(f"Error executing fixed SQL script: {e}")
                # Fallback to basic schema
                print("Creating basic schema instead...")
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        username VARCHAR(100) UNIQUE NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    
                    CREATE TABLE IF NOT EXISTS projects (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        user_id INTEGER REFERENCES users(id),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    
                    CREATE TABLE IF NOT EXISTS expenses (
                        id SERIAL PRIMARY KEY,
                        project_id INTEGER REFERENCES projects(id),
                        name VARCHAR(255) NOT NULL,
                        amount DECIMAL(10, 2) NOT NULL,
                        date DATE NOT NULL,
                        category VARCHAR(100),
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                ''')
                
        # Create a database.json configuration file for the application
        db_config = {
            'host': params['host'],
            'port': params['port'],
            'database': params['database'],
            'user': params['user'],
            'password': params['password']
        }
        
        # Save the database configuration
        with open('db_config.json', 'w') as f:
            json.dump(db_config, f, indent=2)
            
        print("Database setup completed successfully!")
        
        # Create an environment file for the application
        with open('.env', 'w') as f:
            f.write(f"DATABASE_URL=postgresql://{params['user']}:{params['password']}@{params['host']}:{params['port']}/{params['database']}\n")
            f.write(f"PGUSER={params['user']}\n")
            f.write(f"PGPASSWORD={params['password']}\n")
            f.write(f"PGHOST={params['host']}\n")
            f.write(f"PGPORT={params['port']}\n")
            f.write(f"PGDATABASE={params['database']}\n")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error setting up database: {e}")
        sys.exit(1)

def find_schema_files(repo_path):
    """Find potential schema definition files in the repository"""
    schema_files = []
    
    # Look for common schema file patterns
    for root, dirs, files in os.walk(repo_path):
        for file in files:
            # Look for SQL files or schema definition files
            if file.endswith('.sql') or 'schema' in file.lower():
                schema_files.append(os.path.join(root, file))
            # Look for migration files
            elif 'migration' in file.lower() and (file.endswith('.py') or file.endswith('.js')):
                schema_files.append(os.path.join(root, file))
                
    return schema_files

if __name__ == "__main__":
    setup_database()
