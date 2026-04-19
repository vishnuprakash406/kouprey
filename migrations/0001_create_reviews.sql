-- Create reviews table for Kouprey
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  productId TEXT NOT NULL,
  displayName TEXT NOT NULL,
  email TEXT,
  rating INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(productId) REFERENCES products(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_productId ON reviews(productId);
CREATE INDEX IF NOT EXISTS idx_created_at ON reviews(created_at DESC);
