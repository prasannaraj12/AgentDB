import sqlite3
import random
from datetime import datetime, timedelta

def setup_db(db_path="ecommerce.db"):
    print(f"Setting up database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Drop existing tables if they exist to start fresh
    cursor.execute('DROP TABLE IF EXISTS order_items')
    cursor.execute('DROP TABLE IF EXISTS orders')
    cursor.execute('DROP TABLE IF EXISTS products')
    cursor.execute('DROP TABLE IF EXISTS customers')

    # Create tables
    cursor.execute('''
        CREATE TABLE customers (
            customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            signup_date DATE NOT NULL,
            region TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE products (
            product_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            stock_quantity INTEGER NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE orders (
            order_id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            order_date DATE NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE order_items (
            order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (order_id),
            FOREIGN KEY (product_id) REFERENCES products (product_id)
        )
    ''')

    # Insert dummy data
    
    # Categories
    categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books']
    regions = ['North America', 'Europe', 'Asia', 'South America', 'Australia']
    
    # 50 Customers
    for i in range(1, 51):
        first_name = f"User{i}"
        last_name = f"Smith{i}"
        email = f"user{i}@example.com"
        # Random date in last 2 years
        days_ago = random.randint(0, 730)
        signup_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        region = random.choice(regions)
        cursor.execute('INSERT INTO customers (first_name, last_name, email, signup_date, region) VALUES (?, ?, ?, ?, ?)',
                       (first_name, last_name, email, signup_date, region))

    # 20 Products
    products_data = []
    for i in range(1, 21):
        name = f"Product {i}"
        category = random.choice(categories)
        price = round(random.uniform(10.0, 500.0), 2)
        stock = random.randint(10, 1000)
        cursor.execute('INSERT INTO products (name, category, price, stock_quantity) VALUES (?, ?, ?, ?)',
                       (name, category, price, stock))
        products_data.append((i, price))

    # 200 Orders over the last year
    for i in range(1, 201):
        customer_id = random.randint(1, 50)
        days_ago = random.randint(0, 365)
        order_date = (datetime.now() - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        status = random.choice(['Completed', 'Completed', 'Completed', 'Processing', 'Cancelled'])
        
        # We will update total_amount after adding items
        cursor.execute('INSERT INTO orders (customer_id, order_date, total_amount, status) VALUES (?, ?, ?, ?)',
                       (customer_id, order_date, 0.0, status))
        order_id = cursor.lastrowid
        
        # 1-4 items per order
        num_items = random.randint(1, 4)
        order_total = 0
        for _ in range(num_items):
            prod = random.choice(products_data)
            product_id = prod[0]
            unit_price = prod[1]
            quantity = random.randint(1, 3)
            order_total += unit_price * quantity
            
            cursor.execute('INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                           (order_id, product_id, quantity, unit_price))
            
        # Update order total
        cursor.execute('UPDATE orders SET total_amount = ? WHERE order_id = ?', (round(order_total, 2), order_id))

    conn.commit()
    conn.close()
    print("Database setup complete.")

if __name__ == "__main__":
    setup_db()
