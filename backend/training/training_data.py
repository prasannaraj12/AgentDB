"""
Training data: curated NL → SQL pairs for all 4 default databases.
Each entry: { "question": str, "sql": str, "db": str, "chart": str|None, "intent": str }
"""

TRAINING_DATA = [

    # ── ecommerce.db ─────────────────────────────────────────────────────────

    # Aggregations
    {"question": "show total revenue", "sql": "SELECT SUM(total_amount) AS total_revenue FROM orders", "db": "ecommerce", "chart": None, "intent": "aggregate"},
    {"question": "what is the total revenue", "sql": "SELECT SUM(total_amount) AS total_revenue FROM orders", "db": "ecommerce", "chart": None, "intent": "aggregate"},
    {"question": "total sales amount", "sql": "SELECT SUM(total_amount) AS total_revenue FROM orders", "db": "ecommerce", "chart": None, "intent": "aggregate"},
    {"question": "how many orders are there", "sql": "SELECT COUNT(*) AS total_orders FROM orders", "db": "ecommerce", "chart": None, "intent": "count"},
    {"question": "count all orders", "sql": "SELECT COUNT(*) AS total_orders FROM orders", "db": "ecommerce", "chart": None, "intent": "count"},
    {"question": "how many customers do we have", "sql": "SELECT COUNT(*) AS total_customers FROM customers", "db": "ecommerce", "chart": None, "intent": "count"},
    {"question": "total number of products", "sql": "SELECT COUNT(*) AS total_products FROM products", "db": "ecommerce", "chart": None, "intent": "count"},
    {"question": "average order value", "sql": "SELECT ROUND(AVG(total_amount), 2) AS avg_order_value FROM orders", "db": "ecommerce", "chart": None, "intent": "aggregate"},
    {"question": "what is the average order amount", "sql": "SELECT ROUND(AVG(total_amount), 2) AS avg_order_value FROM orders", "db": "ecommerce", "chart": None, "intent": "aggregate"},

    # Top N
    {"question": "top 10 customers by spending", "sql": "SELECT c.first_name || ' ' || c.last_name AS customer, SUM(o.total_amount) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id ORDER BY total_spent DESC LIMIT 10", "db": "ecommerce", "chart": "bar", "intent": "top_n"},
    {"question": "who are the top customers", "sql": "SELECT c.first_name || ' ' || c.last_name AS customer, SUM(o.total_amount) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id ORDER BY total_spent DESC LIMIT 10", "db": "ecommerce", "chart": "bar", "intent": "top_n"},
    {"question": "top 5 customers by revenue", "sql": "SELECT c.first_name || ' ' || c.last_name AS customer, SUM(o.total_amount) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id ORDER BY total_spent DESC LIMIT 5", "db": "ecommerce", "chart": "bar", "intent": "top_n"},
    {"question": "best selling products", "sql": "SELECT p.name, SUM(oi.quantity) AS total_sold FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.product_id ORDER BY total_sold DESC LIMIT 10", "db": "ecommerce", "chart": "bar", "intent": "top_n"},
    {"question": "top 5 products by quantity sold", "sql": "SELECT p.name, SUM(oi.quantity) AS total_sold FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.product_id ORDER BY total_sold DESC LIMIT 5", "db": "ecommerce", "chart": "bar", "intent": "top_n"},
    {"question": "most expensive products", "sql": "SELECT name, price FROM products ORDER BY price DESC LIMIT 10", "db": "ecommerce", "chart": None, "intent": "top_n"},
    {"question": "cheapest products", "sql": "SELECT name, price FROM products ORDER BY price ASC LIMIT 10", "db": "ecommerce", "chart": None, "intent": "top_n"},
    {"question": "lowest stock products", "sql": "SELECT name, stock_quantity FROM products ORDER BY stock_quantity ASC LIMIT 10", "db": "ecommerce", "chart": "bar", "intent": "top_n"},

    # Group by
    {"question": "sales by category", "sql": "SELECT p.category, SUM(oi.quantity * oi.unit_price) AS revenue FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.category ORDER BY revenue DESC", "db": "ecommerce", "chart": "bar", "intent": "group_by"},
    {"question": "revenue by product category", "sql": "SELECT p.category, SUM(oi.quantity * oi.unit_price) AS revenue FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.category ORDER BY revenue DESC", "db": "ecommerce", "chart": "bar", "intent": "group_by"},
    {"question": "bar chart of sales by category", "sql": "SELECT p.category, SUM(oi.quantity * oi.unit_price) AS revenue FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.category ORDER BY revenue DESC", "db": "ecommerce", "chart": "bar", "intent": "group_by"},
    {"question": "orders by status", "sql": "SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY count DESC", "db": "ecommerce", "chart": "pie", "intent": "group_by"},
    {"question": "pie chart of order status", "sql": "SELECT status, COUNT(*) AS count FROM orders GROUP BY status", "db": "ecommerce", "chart": "pie", "intent": "group_by"},
    {"question": "customers by region", "sql": "SELECT region, COUNT(*) AS count FROM customers GROUP BY region ORDER BY count DESC", "db": "ecommerce", "chart": "bar", "intent": "group_by"},
    {"question": "revenue by region", "sql": "SELECT c.region, SUM(o.total_amount) AS revenue FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.region ORDER BY revenue DESC", "db": "ecommerce", "chart": "bar", "intent": "group_by"},

    # Trend
    {"question": "monthly revenue trend", "sql": "SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue FROM orders GROUP BY month ORDER BY month", "db": "ecommerce", "chart": "line", "intent": "trend"},
    {"question": "line chart of monthly sales", "sql": "SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue FROM orders GROUP BY month ORDER BY month", "db": "ecommerce", "chart": "line", "intent": "trend"},
    {"question": "orders over time", "sql": "SELECT strftime('%Y-%m', order_date) AS month, COUNT(*) AS orders FROM orders GROUP BY month ORDER BY month", "db": "ecommerce", "chart": "line", "intent": "trend"},

    # Filter
    {"question": "orders above 500", "sql": "SELECT * FROM orders WHERE total_amount > 500 ORDER BY total_amount DESC", "db": "ecommerce", "chart": None, "intent": "filter"},
    {"question": "completed orders", "sql": "SELECT * FROM orders WHERE status = 'Completed' ORDER BY order_date DESC", "db": "ecommerce", "chart": None, "intent": "filter"},
    {"question": "cancelled orders", "sql": "SELECT * FROM orders WHERE status = 'Cancelled'", "db": "ecommerce", "chart": None, "intent": "filter"},
    {"question": "products with low stock", "sql": "SELECT name, stock_quantity FROM products WHERE stock_quantity < 50 ORDER BY stock_quantity ASC", "db": "ecommerce", "chart": None, "intent": "filter"},

    # List all
    {"question": "show all customers", "sql": "SELECT * FROM customers LIMIT 50", "db": "ecommerce", "chart": None, "intent": "list"},
    {"question": "list all products", "sql": "SELECT * FROM products", "db": "ecommerce", "chart": None, "intent": "list"},
    {"question": "show all orders", "sql": "SELECT * FROM orders ORDER BY order_date DESC LIMIT 50", "db": "ecommerce", "chart": None, "intent": "list"},

    # ── ecommerce_dataset.db ─────────────────────────────────────────────────

    {"question": "top 10 customers by total spent", "sql": "SELECT c.name, SUM(o.total_amount) AS total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id ORDER BY total_spent DESC LIMIT 10", "db": "ecommerce_dataset", "chart": "bar", "intent": "top_n"},
    {"question": "revenue by product category", "sql": "SELECT p.category, SUM(oi.quantity * oi.price) AS revenue FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.category ORDER BY revenue DESC", "db": "ecommerce_dataset", "chart": "bar", "intent": "group_by"},
    {"question": "monthly revenue trend", "sql": "SELECT strftime('%Y-%m', order_date) AS month, SUM(total_amount) AS revenue FROM orders GROUP BY month ORDER BY month", "db": "ecommerce_dataset", "chart": "line", "intent": "trend"},
    {"question": "orders by status", "sql": "SELECT status, COUNT(*) AS count FROM orders GROUP BY status", "db": "ecommerce_dataset", "chart": "pie", "intent": "group_by"},
    {"question": "top 10 products by revenue", "sql": "SELECT p.name, SUM(oi.quantity * oi.price) AS revenue FROM products p JOIN order_items oi ON p.product_id = oi.product_id GROUP BY p.product_id ORDER BY revenue DESC LIMIT 10", "db": "ecommerce_dataset", "chart": "bar", "intent": "top_n"},
    {"question": "customers by city", "sql": "SELECT city, COUNT(*) AS count FROM customers GROUP BY city ORDER BY count DESC LIMIT 10", "db": "ecommerce_dataset", "chart": "bar", "intent": "group_by"},
    {"question": "inventory by warehouse", "sql": "SELECT warehouse_location, SUM(stock_quantity) AS total_stock FROM inventory GROUP BY warehouse_location ORDER BY total_stock DESC", "db": "ecommerce_dataset", "chart": "bar", "intent": "group_by"},
    {"question": "average product price by category", "sql": "SELECT category, ROUND(AVG(price), 2) AS avg_price FROM products GROUP BY category ORDER BY avg_price DESC", "db": "ecommerce_dataset", "chart": "bar", "intent": "aggregate"},
    {"question": "scatter chart of price vs stock", "sql": "SELECT p.name, p.price, i.stock_quantity FROM products p JOIN inventory i ON p.product_id = i.product_id", "db": "ecommerce_dataset", "chart": "scatter", "intent": "correlation"},

    # ── chinook.db ───────────────────────────────────────────────────────────

    {"question": "top 10 artists by number of tracks", "sql": "SELECT ar.Name AS artist, COUNT(t.TrackId) AS track_count FROM artists ar JOIN albums al ON ar.ArtistId = al.ArtistId JOIN tracks t ON al.AlbumId = t.AlbumId GROUP BY ar.ArtistId ORDER BY track_count DESC LIMIT 10", "db": "chinook", "chart": "bar", "intent": "top_n"},
    {"question": "best selling artists", "sql": "SELECT ar.Name AS artist, COUNT(t.TrackId) AS track_count FROM artists ar JOIN albums al ON ar.ArtistId = al.ArtistId JOIN tracks t ON al.AlbumId = t.AlbumId GROUP BY ar.ArtistId ORDER BY track_count DESC LIMIT 10", "db": "chinook", "chart": "bar", "intent": "top_n"},
    {"question": "sales by genre", "sql": "SELECT g.Name AS genre, SUM(ii.UnitPrice * ii.Quantity) AS revenue FROM genres g JOIN tracks t ON g.GenreId = t.GenreId JOIN invoice_items ii ON t.TrackId = ii.TrackId GROUP BY g.GenreId ORDER BY revenue DESC", "db": "chinook", "chart": "bar", "intent": "group_by"},
    {"question": "bar chart of revenue by genre", "sql": "SELECT g.Name AS genre, SUM(ii.UnitPrice * ii.Quantity) AS revenue FROM genres g JOIN tracks t ON g.GenreId = t.GenreId JOIN invoice_items ii ON t.TrackId = ii.TrackId GROUP BY g.GenreId ORDER BY revenue DESC", "db": "chinook", "chart": "bar", "intent": "group_by"},
    {"question": "top 5 customers by invoice total", "sql": "SELECT c.FirstName || ' ' || c.LastName AS customer, SUM(i.Total) AS total_spent FROM customers c JOIN invoices i ON c.CustomerId = i.CustomerId GROUP BY c.CustomerId ORDER BY total_spent DESC LIMIT 5", "db": "chinook", "chart": "bar", "intent": "top_n"},
    {"question": "who are the top customers", "sql": "SELECT c.FirstName || ' ' || c.LastName AS customer, SUM(i.Total) AS total_spent FROM customers c JOIN invoices i ON c.CustomerId = i.CustomerId GROUP BY c.CustomerId ORDER BY total_spent DESC LIMIT 10", "db": "chinook", "chart": "bar", "intent": "top_n"},
    {"question": "monthly invoice totals", "sql": "SELECT strftime('%Y-%m', InvoiceDate) AS month, SUM(Total) AS revenue FROM invoices GROUP BY month ORDER BY month", "db": "chinook", "chart": "line", "intent": "trend"},
    {"question": "line chart of monthly revenue", "sql": "SELECT strftime('%Y-%m', InvoiceDate) AS month, SUM(Total) AS revenue FROM invoices GROUP BY month ORDER BY month", "db": "chinook", "chart": "line", "intent": "trend"},
    {"question": "customers by country", "sql": "SELECT Country, COUNT(*) AS count FROM customers GROUP BY Country ORDER BY count DESC", "db": "chinook", "chart": "bar", "intent": "group_by"},
    {"question": "tracks by media type", "sql": "SELECT mt.Name AS media_type, COUNT(t.TrackId) AS count FROM media_types mt JOIN tracks t ON mt.MediaTypeId = t.MediaTypeId GROUP BY mt.MediaTypeId ORDER BY count DESC", "db": "chinook", "chart": "pie", "intent": "group_by"},
    {"question": "pie chart of tracks by media type", "sql": "SELECT mt.Name AS media_type, COUNT(t.TrackId) AS count FROM media_types mt JOIN tracks t ON mt.MediaTypeId = t.MediaTypeId GROUP BY mt.MediaTypeId", "db": "chinook", "chart": "pie", "intent": "group_by"},
    {"question": "revenue by country", "sql": "SELECT BillingCountry AS country, SUM(Total) AS revenue FROM invoices GROUP BY BillingCountry ORDER BY revenue DESC", "db": "chinook", "chart": "bar", "intent": "group_by"},
    {"question": "most expensive tracks", "sql": "SELECT t.Name AS track, ar.Name AS artist, t.UnitPrice FROM tracks t JOIN albums al ON t.AlbumId = al.AlbumId JOIN artists ar ON al.ArtistId = ar.ArtistId ORDER BY t.UnitPrice DESC LIMIT 10", "db": "chinook", "chart": None, "intent": "top_n"},
    {"question": "albums by artist", "sql": "SELECT ar.Name AS artist, COUNT(al.AlbumId) AS album_count FROM artists ar JOIN albums al ON ar.ArtistId = al.ArtistId GROUP BY ar.ArtistId ORDER BY album_count DESC LIMIT 10", "db": "chinook", "chart": "bar", "intent": "group_by"},
    {"question": "total revenue", "sql": "SELECT SUM(Total) AS total_revenue FROM invoices", "db": "chinook", "chart": None, "intent": "aggregate"},
    {"question": "how many tracks are there", "sql": "SELECT COUNT(*) AS total_tracks FROM tracks", "db": "chinook", "chart": None, "intent": "count"},
    {"question": "employees list", "sql": "SELECT FirstName || ' ' || LastName AS name, Title FROM employees ORDER BY Title", "db": "chinook", "chart": None, "intent": "list"},

    # ── sakila.db ────────────────────────────────────────────────────────────

    {"question": "top 10 most rented films", "sql": "SELECT f.title, COUNT(r.rental_id) AS rental_count FROM film f JOIN inventory i ON f.film_id = i.film_id JOIN rental r ON i.inventory_id = r.inventory_id GROUP BY f.film_id ORDER BY rental_count DESC LIMIT 10", "db": "sakila", "chart": "bar", "intent": "top_n"},
    {"question": "most popular films", "sql": "SELECT f.title, COUNT(r.rental_id) AS rental_count FROM film f JOIN inventory i ON f.film_id = i.film_id JOIN rental r ON i.inventory_id = r.inventory_id GROUP BY f.film_id ORDER BY rental_count DESC LIMIT 10", "db": "sakila", "chart": "bar", "intent": "top_n"},
    {"question": "films by rating", "sql": "SELECT rating, COUNT(*) AS count FROM film GROUP BY rating ORDER BY count DESC", "db": "sakila", "chart": "bar", "intent": "group_by"},
    {"question": "bar chart of films by rating", "sql": "SELECT rating, COUNT(*) AS count FROM film GROUP BY rating ORDER BY count DESC", "db": "sakila", "chart": "bar", "intent": "group_by"},
    {"question": "films by category", "sql": "SELECT c.name AS category, COUNT(fc.film_id) AS count FROM category c JOIN film_category fc ON c.category_id = fc.category_id GROUP BY c.category_id ORDER BY count DESC", "db": "sakila", "chart": "pie", "intent": "group_by"},
    {"question": "pie chart of films by category", "sql": "SELECT c.name AS category, COUNT(fc.film_id) AS count FROM category c JOIN film_category fc ON c.category_id = fc.category_id GROUP BY c.category_id", "db": "sakila", "chart": "pie", "intent": "group_by"},
    {"question": "top actors by film count", "sql": "SELECT a.first_name || ' ' || a.last_name AS actor, COUNT(fa.film_id) AS film_count FROM actor a JOIN film_actor fa ON a.actor_id = fa.actor_id GROUP BY a.actor_id ORDER BY film_count DESC LIMIT 10", "db": "sakila", "chart": "bar", "intent": "top_n"},
    {"question": "which actors appear in the most films", "sql": "SELECT a.first_name || ' ' || a.last_name AS actor, COUNT(fa.film_id) AS film_count FROM actor a JOIN film_actor fa ON a.actor_id = fa.actor_id GROUP BY a.actor_id ORDER BY film_count DESC LIMIT 10", "db": "sakila", "chart": "bar", "intent": "top_n"},
    {"question": "revenue by store", "sql": "SELECT s.store_id, SUM(p.amount) AS revenue FROM store s JOIN staff st ON s.store_id = st.store_id JOIN payment p ON st.staff_id = p.staff_id GROUP BY s.store_id", "db": "sakila", "chart": "bar", "intent": "group_by"},
    {"question": "top 10 customers by payments", "sql": "SELECT c.first_name || ' ' || c.last_name AS customer, SUM(p.amount) AS total_paid FROM customer c JOIN payment p ON c.customer_id = p.customer_id GROUP BY c.customer_id ORDER BY total_paid DESC LIMIT 10", "db": "sakila", "chart": "bar", "intent": "top_n"},
    {"question": "average rental duration by category", "sql": "SELECT c.name AS category, ROUND(AVG(f.rental_duration), 2) AS avg_duration FROM category c JOIN film_category fc ON c.category_id = fc.category_id JOIN film f ON fc.film_id = f.film_id GROUP BY c.category_id ORDER BY avg_duration DESC", "db": "sakila", "chart": "bar", "intent": "aggregate"},
    {"question": "customers by city", "sql": "SELECT ci.city, COUNT(c.customer_id) AS count FROM customer c JOIN address a ON c.address_id = a.address_id JOIN city ci ON a.city_id = ci.city_id GROUP BY ci.city_id ORDER BY count DESC LIMIT 10", "db": "sakila", "chart": "bar", "intent": "group_by"},
    {"question": "total payments", "sql": "SELECT SUM(amount) AS total_revenue FROM payment", "db": "sakila", "chart": None, "intent": "aggregate"},
    {"question": "how many films are there", "sql": "SELECT COUNT(*) AS total_films FROM film", "db": "sakila", "chart": None, "intent": "count"},
    {"question": "films longer than 2 hours", "sql": "SELECT title, length FROM film WHERE length > 120 ORDER BY length DESC", "db": "sakila", "chart": None, "intent": "filter"},
    {"question": "active customers", "sql": "SELECT COUNT(*) AS active_customers FROM customer WHERE active = 1", "db": "sakila", "chart": None, "intent": "filter"},
    {"question": "rentals over time", "sql": "SELECT strftime('%Y-%m', rental_date) AS month, COUNT(*) AS rentals FROM rental GROUP BY month ORDER BY month", "db": "sakila", "chart": "line", "intent": "trend"},
    {"question": "line chart of rentals over time", "sql": "SELECT strftime('%Y-%m', rental_date) AS month, COUNT(*) AS rentals FROM rental GROUP BY month ORDER BY month", "db": "sakila", "chart": "line", "intent": "trend"},
]
