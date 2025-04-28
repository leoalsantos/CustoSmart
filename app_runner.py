#!/usr/bin/env python3
import os
import sys
import subprocess
import json
import time
import signal
import atexit

# Global variables to store process handles
processes = []

def load_db_config():
    """Load database configuration"""
    try:
        with open('db_config.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("Database configuration not found. Please run setup.sh first.")
        sys.exit(1)

def check_repository():
    """Check if the repository has been cloned"""
    if not os.path.exists('CustoSmart-Replit'):
        print("Repository not found. Please run setup.sh first.")
        sys.exit(1)

def detect_app_type():
    """Detect what type of application is in the repository"""
    # Check for package.json (Node.js app)
    if os.path.exists('CustoSmart-Replit/package.json'):
        return 'nodejs'
    
    # Check for requirements.txt or setup.py (Python app)
    if os.path.exists('CustoSmart-Replit/requirements.txt') or os.path.exists('CustoSmart-Replit/setup.py'):
        return 'python'
    
    # Check for specific Python framework files
    if os.path.exists('CustoSmart-Replit/app.py') or os.path.exists('CustoSmart-Replit/manage.py'):
        return 'python'
    
    # If we can't determine, assume it's a Python app
    return 'python'

def find_app_entry_point(app_type):
    """Find the main entry point for the application"""
    if app_type == 'nodejs':
        # Look for common Node.js entry points
        candidates = [
            'server.js',
            'app.js',
            'index.js',
            'main.js'
        ]
        
        for candidate in candidates:
            if os.path.exists(f'CustoSmart-Replit/{candidate}'):
                return candidate
                
        # If we can't find a specific entry point, check package.json
        try:
            with open('CustoSmart-Replit/package.json', 'r') as f:
                package_data = json.load(f)
                if 'main' in package_data:
                    return package_data['main']
        except:
            pass
            
        return 'index.js'  # Default Node.js entry point
        
    elif app_type == 'python':
        # Look for common Python entry points
        candidates = [
            'app.py',
            'main.py',
            'run.py',
            'server.py',
            'manage.py'
        ]
        
        for candidate in candidates:
            if os.path.exists(f'CustoSmart-Replit/{candidate}'):
                return candidate
                
        # If we can't find a specific entry point, look for files with if __name__ == '__main__'
        for root, dirs, files in os.walk('CustoSmart-Replit'):
            for file in files:
                if file.endswith('.py'):
                    try:
                        with open(os.path.join(root, file), 'r') as f:
                            content = f.read()
                            if "if __name__ == '__main__'" in content:
                                return os.path.relpath(os.path.join(root, file), 'CustoSmart-Replit')
                    except:
                        pass
                        
        return 'app.py'  # Default Python entry point

def run_application(app_type, entry_point, db_config):
    """Run the application with the correct command"""
    os.chdir('CustoSmart-Replit')
    
    # Set environment variables for database connection
    os.environ['DATABASE_URL'] = f"postgresql://{db_config['user']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['database']}"
    os.environ['PGUSER'] = db_config['user']
    os.environ['PGPASSWORD'] = db_config['password']
    os.environ['PGHOST'] = db_config['host']
    os.environ['PGPORT'] = str(db_config['port'])
    os.environ['PGDATABASE'] = db_config['database']
    
    print(f"Starting the CustoSmart application...")
    
    # Check if package.json exists and has scripts
    if os.path.exists('package.json'):
        print("Found package.json, using npm scripts to start the application")
        
        # First, build the application if needed
        print("Building the application...")
        build_process = subprocess.Popen(['npm', 'run', 'build'], 
                                        env=os.environ.copy())
        build_process.wait()
        
        if build_process.returncode != 0:
            print("Warning: Build may have failed, attempting to start anyway...")
        
        # Start the application
        print("Starting the application...")
        process = subprocess.Popen(['npm', 'run', 'start'], 
                                  env=os.environ.copy())
        processes.append(process)
        print("Application started with npm start")
        
    elif app_type == 'nodejs':
        # Run Node.js application
        process = subprocess.Popen(['node', entry_point], 
                                  env=os.environ.copy())
        processes.append(process)
        print(f"Node.js application started with entry point: {entry_point}")
        
    elif app_type == 'python':
        # Check if it's a Django application
        if entry_point == 'manage.py':
            process = subprocess.Popen(['python', entry_point, 'runserver', '0.0.0.0:8000'], 
                                      env=os.environ.copy())
            processes.append(process)
            print("Django application started on port 8000")
        else:
            # Regular Python application
            process = subprocess.Popen(['python', entry_point], 
                                      env=os.environ.copy())
            processes.append(process)
            print(f"Python application started with entry point: {entry_point}")
    
    # Keep the application running until interrupted
    try:
        while all(process.poll() is None for process in processes):
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()
        print("\nApplication stopped.")

def cleanup():
    """Clean up processes on exit"""
    for process in processes:
        if process.poll() is None:  # If process is still running
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()

def main():
    """Main function to run the application"""
    # Register cleanup function
    atexit.register(cleanup)
    
    # Handle SIGTERM signal
    signal.signal(signal.SIGTERM, lambda signum, frame: sys.exit(0))
    
    check_repository()
    db_config = load_db_config()
    
    app_type = detect_app_type()
    print(f"Detected application type: {app_type}")
    
    entry_point = find_app_entry_point(app_type)
    print(f"Using entry point: {entry_point}")
    
    run_application(app_type, entry_point, db_config)

if __name__ == "__main__":
    main()
