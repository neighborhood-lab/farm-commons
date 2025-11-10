# Farm Commons - Phase 2 Database Schema

> **Version:** 1.0
> **Last Updated:** 2025-11-10
> **Status:** Planning

## Overview

Phase 2 expands Farm Commons from labor management to full farm business operations, adding customer relationship management, product catalog, order processing, and inventory tracking. This schema builds upon Phase 1 infrastructure while maintaining data integrity and performance.

### Phase 2 Goals

- **Customer Management**: Track CSA members, market customers, wholesale buyers
- **Product Catalog**: Manage crops, value-added products, and pricing
- **Order Processing**: Handle sales, subscriptions, and delivery logistics
- **Inventory Tracking**: Monitor stock levels, harvests, and product availability

---

## Database Tables

### 1. Customers Table

Stores information about all customer types: CSA members, farmers market shoppers, wholesale buyers, and online customers.

```sql
CREATE TABLE customers (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,

  -- Customer Information
  customer_type VARCHAR(50) NOT NULL CHECK (customer_type IN ('csa_member', 'market', 'wholesale', 'online', 'restaurant')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  secondary_phone VARCHAR(20),

  -- Address Information
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'US',

  -- Location Data
  delivery_notes TEXT,
  coordinates GEOGRAPHY(POINT, 4326), -- For delivery routing

  -- CSA-Specific Fields
  csa_share_size VARCHAR(50), -- 'small', 'medium', 'large', 'family'
  csa_season_start DATE,
  csa_season_end DATE,
  csa_paid_in_full BOOLEAN DEFAULT false,
  csa_payment_plan VARCHAR(50), -- 'full', 'installments', 'weekly'

  -- Wholesale-Specific Fields
  business_name VARCHAR(255),
  tax_id VARCHAR(50),
  wholesale_discount_percent DECIMAL(5,2) DEFAULT 0.00,
  credit_limit DECIMAL(10,2) DEFAULT 0.00,
  payment_terms VARCHAR(50), -- 'net_30', 'net_60', 'due_on_receipt'

  -- Preferences
  delivery_preferences JSONB, -- Flexible storage for delivery windows, special instructions
  dietary_restrictions TEXT[],
  communication_preferences JSONB, -- Email, SMS, phone preferences
  marketing_opt_in BOOLEAN DEFAULT false,

  -- Metadata
  customer_since DATE NOT NULL DEFAULT CURRENT_DATE,
  last_order_date DATE,
  total_orders_count INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'archived')),
  notes TEXT,
  tags TEXT[],

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_customers_farm_id ON customers(farm_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_csa_season ON customers(csa_season_start, csa_season_end) WHERE customer_type = 'csa_member';
CREATE INDEX idx_customers_coordinates ON customers USING GIST(coordinates) WHERE coordinates IS NOT NULL;
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);

-- Triggers
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. Products Table

Manages all sellable items including fresh produce, value-added products, and services.

```sql
CREATE TABLE products (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  category_id UUID REFERENCES product_categories(id),

  -- Product Information
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL, -- URL-friendly name
  sku VARCHAR(100) UNIQUE, -- Stock Keeping Unit
  description TEXT,
  short_description VARCHAR(500),

  -- Product Type
  product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('crop', 'value_added', 'service', 'bundle')),

  -- Crop-Specific Fields
  variety VARCHAR(100), -- e.g., "Cherokee Purple" for tomatoes
  organic_certified BOOLEAN DEFAULT false,
  harvest_season VARCHAR(50)[], -- e.g., ['spring', 'summer', 'fall']

  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  wholesale_price DECIMAL(10,2),
  unit VARCHAR(50) NOT NULL, -- 'lb', 'oz', 'bunch', 'each', 'pint', 'quart', 'bag'
  pricing_tiers JSONB, -- Volume discounts: {5: 4.50, 10: 4.00}

  -- Inventory Settings
  track_inventory BOOLEAN DEFAULT true,
  current_stock DECIMAL(10,2) DEFAULT 0.00,
  reorder_point DECIMAL(10,2),
  max_stock_level DECIMAL(10,2),

  -- Physical Properties
  weight DECIMAL(10,3), -- in pounds
  weight_unit VARCHAR(10) DEFAULT 'lb',
  storage_requirements TEXT, -- e.g., "Refrigerate below 40°F"
  shelf_life_days INTEGER,

  -- Availability
  available_for_sale BOOLEAN DEFAULT true,
  available_online BOOLEAN DEFAULT true,
  available_at_market BOOLEAN DEFAULT true,
  available_for_csa BOOLEAN DEFAULT true,
  available_wholesale BOOLEAN DEFAULT false,
  seasonal_availability JSONB, -- Date ranges or month availability

  -- Media
  image_url VARCHAR(500),
  images JSONB, -- Array of image URLs

  -- Metadata
  tags TEXT[],
  nutrition_info JSONB,
  allergen_info TEXT[],
  certifications TEXT[], -- e.g., 'organic', 'non_gmo', 'fair_trade'
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'seasonal', 'out_of_stock')),

  -- Stats
  total_sold DECIMAL(10,2) DEFAULT 0.00,
  revenue_generated DECIMAL(10,2) DEFAULT 0.00,

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Product Categories Table
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(farm_id, slug)
);

-- Indexes
CREATE INDEX idx_products_farm_id ON products(farm_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_available ON products(available_for_sale, available_online);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_slug ON products(farm_id, slug);

-- Triggers
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 3. Orders Table

Manages all customer orders including CSA subscriptions, market sales, and online purchases.

```sql
CREATE TABLE orders (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Human-readable order number

  -- Foreign Keys
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,

  -- Order Type
  order_type VARCHAR(50) NOT NULL CHECK (order_type IN ('csa_subscription', 'market_sale', 'online', 'wholesale', 'custom')),

  -- Order Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery',
    'delivered', 'picked_up', 'cancelled', 'refunded'
  )),

  -- Fulfillment
  fulfillment_method VARCHAR(50) NOT NULL CHECK (fulfillment_method IN ('pickup', 'delivery', 'shipping', 'csa_share')),
  fulfillment_date DATE NOT NULL,
  fulfillment_time_slot VARCHAR(50), -- e.g., "9:00 AM - 11:00 AM"

  -- Delivery Information
  delivery_address_line1 VARCHAR(255),
  delivery_address_line2 VARCHAR(255),
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(50),
  delivery_postal_code VARCHAR(20),
  delivery_notes TEXT,
  delivery_coordinates GEOGRAPHY(POINT, 4326),

  -- Financial Information
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  discount_code VARCHAR(50),
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  delivery_fee DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Payment
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'authorized', 'paid', 'partially_paid', 'refunded', 'failed'
  )),
  payment_method VARCHAR(50), -- 'cash', 'credit_card', 'check', 'bank_transfer', 'ebt'
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_reference VARCHAR(255), -- Transaction ID from payment processor
  amount_paid DECIMAL(10,2) DEFAULT 0.00,

  -- Subscription (for CSA)
  subscription_id UUID REFERENCES subscriptions(id),
  subscription_week INTEGER, -- Week number in subscription

  -- Metadata
  channel VARCHAR(50), -- 'website', 'market', 'phone', 'farm_stand'
  customer_notes TEXT,
  internal_notes TEXT,
  tags TEXT[],

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES users(id),
  cancelled_reason TEXT
);

-- Order Items Table (line items)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Product snapshot at time of order
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),

  -- Quantity and Pricing
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  line_total DECIMAL(10,2) NOT NULL,

  -- Fulfillment
  quantity_fulfilled DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CSA Subscriptions Table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  subscription_name VARCHAR(255) NOT NULL, -- e.g., "Summer CSA 2025"
  share_size VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  delivery_frequency VARCHAR(50) NOT NULL, -- 'weekly', 'biweekly', 'monthly'
  total_weeks INTEGER NOT NULL,

  price_per_week DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),

  delivery_preferences JSONB,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_farm_id ON orders(farm_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_fulfillment_date ON orders(fulfillment_date);
CREATE INDEX idx_orders_type ON orders(order_type);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_farm_id ON subscriptions(farm_id);
CREATE INDEX idx_subscriptions_dates ON subscriptions(start_date, end_date);

-- Triggers
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 4. Inventory Table

Tracks stock levels, harvests, and inventory movements for accurate product availability.

```sql
CREATE TABLE inventory_transactions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  field_id UUID REFERENCES fields(id), -- For harvest transactions
  order_id UUID REFERENCES orders(id), -- For sale transactions

  -- Transaction Type
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
    'harvest', 'purchase', 'sale', 'adjustment', 'waste', 'donation',
    'sample', 'transfer', 'return', 'production'
  )),

  -- Quantity
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,

  -- Stock Impact
  quantity_before DECIMAL(10,2) NOT NULL,
  quantity_after DECIMAL(10,2) NOT NULL,

  -- Financial
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2),

  -- Location
  location VARCHAR(255), -- Storage location: 'cooler_1', 'warehouse_a', 'farm_stand'

  -- Metadata
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reference_number VARCHAR(100), -- External reference
  notes TEXT,
  batch_number VARCHAR(100), -- For traceability
  expiry_date DATE,

  -- Harvest-Specific
  harvest_quality VARCHAR(50), -- 'premium', 'standard', 'seconds'
  worker_id UUID REFERENCES workers(id), -- Who harvested

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Current Inventory View
CREATE TABLE inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location VARCHAR(255) NOT NULL,

  -- Stock Levels
  quantity_on_hand DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  quantity_reserved DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Reserved for orders
  quantity_available DECIMAL(10,2) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,

  -- Thresholds
  reorder_point DECIMAL(10,2),
  max_capacity DECIMAL(10,2),

  -- Valuation
  average_cost DECIMAL(10,2),
  total_value DECIMAL(10,2) GENERATED ALWAYS AS (quantity_on_hand * average_cost) STORED,

  -- Tracking
  last_counted_at TIMESTAMP WITH TIME ZONE,
  last_counted_by UUID REFERENCES users(id),
  last_transaction_at TIMESTAMP WITH TIME ZONE,

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(farm_id, product_id, location)
);

-- Batch Tracking (for traceability)
CREATE TABLE inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number VARCHAR(100) UNIQUE NOT NULL,

  -- Source Information
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('harvest', 'purchase', 'production')),
  field_id UUID REFERENCES fields(id),
  supplier VARCHAR(255),

  -- Batch Details
  harvest_date DATE,
  production_date DATE,
  expiry_date DATE,
  quantity_original DECIMAL(10,2) NOT NULL,
  quantity_remaining DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,

  -- Quality
  quality_grade VARCHAR(50),
  quality_notes TEXT,

  -- Certifications
  organic_certified BOOLEAN DEFAULT false,
  certification_documents JSONB,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'expired', 'recalled')),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inventory_transactions_farm_id ON inventory_transactions(farm_id);
CREATE INDEX idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX idx_inventory_transactions_field_id ON inventory_transactions(field_id) WHERE field_id IS NOT NULL;
CREATE INDEX idx_inventory_transactions_order_id ON inventory_transactions(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_inventory_transactions_batch ON inventory_transactions(batch_number) WHERE batch_number IS NOT NULL;

CREATE INDEX idx_inventory_levels_farm_product ON inventory_levels(farm_id, product_id);
CREATE INDEX idx_inventory_levels_location ON inventory_levels(location);
CREATE INDEX idx_inventory_levels_available ON inventory_levels(quantity_available) WHERE quantity_available > 0;

CREATE INDEX idx_inventory_batches_product_id ON inventory_batches(product_id);
CREATE INDEX idx_inventory_batches_batch_number ON inventory_batches(batch_number);
CREATE INDEX idx_inventory_batches_status ON inventory_batches(status);
CREATE INDEX idx_inventory_batches_expiry ON inventory_batches(expiry_date) WHERE status = 'active';

-- Triggers
CREATE TRIGGER update_inventory_levels_updated_at
  BEFORE UPDATE ON inventory_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_batches_updated_at
  BEFORE UPDATE ON inventory_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Relationships & Constraints

### Entity Relationships

```
farms (Phase 1)
  ├── customers (1:M)
  ├── products (1:M)
  │   └── product_categories (M:1)
  ├── orders (1:M)
  │   ├── order_items (1:M) → products (M:1)
  │   └── subscriptions (M:1)
  ├── inventory_transactions (1:M)
  │   ├── products (M:1)
  │   ├── fields (M:1) [Phase 1]
  │   ├── orders (M:1)
  │   └── workers (M:1) [Phase 1]
  └── inventory_levels (1:M)
      └── products (M:1)

customers
  ├── orders (1:M)
  └── subscriptions (1:M)

subscriptions
  └── orders (1:M)
```

### Key Business Rules

1. **Order Total Calculation**
   ```sql
   -- Order total must equal sum of line items plus fees minus discounts
   ALTER TABLE orders ADD CONSTRAINT check_order_total
   CHECK (total_amount = subtotal - discount_amount + tax_amount + delivery_fee);
   ```

2. **Inventory Consistency**
   ```sql
   -- Quantity after transaction must be calculated correctly
   ALTER TABLE inventory_transactions ADD CONSTRAINT check_quantity_calculation
   CHECK (
     (transaction_type IN ('harvest', 'purchase', 'return', 'production')
       AND quantity_after = quantity_before + quantity)
     OR
     (transaction_type IN ('sale', 'waste', 'donation', 'sample')
       AND quantity_after = quantity_before - quantity)
   );
   ```

3. **CSA Subscription Dates**
   ```sql
   ALTER TABLE subscriptions ADD CONSTRAINT check_subscription_dates
   CHECK (end_date > start_date);
   ```

4. **Product Pricing**
   ```sql
   ALTER TABLE products ADD CONSTRAINT check_pricing
   CHECK (
     base_price > 0
     AND (wholesale_price IS NULL OR wholesale_price <= base_price)
   );
   ```

---

## Data Integrity Functions

### Automatic Order Number Generation

```sql
CREATE SEQUENCE order_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' ||
      TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
      LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();
```

### Update Customer Lifetime Value

```sql
CREATE OR REPLACE FUNCTION update_customer_lifetime_value()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.payment_status = 'paid') OR
     (TG_OP = 'UPDATE' AND NEW.payment_status = 'paid' AND OLD.payment_status != 'paid') THEN

    UPDATE customers
    SET
      lifetime_value = lifetime_value + NEW.total_amount,
      total_orders_count = total_orders_count + 1,
      last_order_date = NEW.created_at::DATE
    WHERE id = NEW.customer_id;

  ELSIF TG_OP = 'UPDATE' AND NEW.payment_status = 'refunded' AND OLD.payment_status = 'paid' THEN

    UPDATE customers
    SET
      lifetime_value = lifetime_value - OLD.total_amount,
      total_orders_count = total_orders_count - 1
    WHERE id = NEW.customer_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_stats
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_lifetime_value();
```

### Update Inventory Levels

```sql
CREATE OR REPLACE FUNCTION update_inventory_levels()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory_levels (farm_id, product_id, location, quantity_on_hand, last_transaction_at)
  VALUES (NEW.farm_id, NEW.product_id, COALESCE(NEW.location, 'default'), NEW.quantity_after, NEW.transaction_date)
  ON CONFLICT (farm_id, product_id, location)
  DO UPDATE SET
    quantity_on_hand = NEW.quantity_after,
    last_transaction_at = NEW.transaction_date,
    updated_at = NOW();

  -- Update product current_stock
  UPDATE products
  SET current_stock = (
    SELECT SUM(quantity_on_hand)
    FROM inventory_levels
    WHERE product_id = NEW.product_id
  )
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_inventory_levels
  AFTER INSERT ON inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_levels();
```

---

## Migration Strategy

### Migration Order

1. **Create Phase 2 Tables** (no dependencies)
   - `product_categories`
   - `customers`

2. **Create Product Tables** (depends on categories)
   - `products`

3. **Create Order Tables** (depends on customers, products)
   - `subscriptions`
   - `orders`
   - `order_items`

4. **Create Inventory Tables** (depends on products, fields, orders, workers)
   - `inventory_levels`
   - `inventory_transactions`
   - `inventory_batches`

5. **Create Functions and Triggers**
   - Order number generation
   - Customer stats updates
   - Inventory sync

### Sample Migration File

```sql
-- migrations/006_create_phase2_tables.sql

BEGIN;

-- 1. Create product_categories
CREATE TABLE product_categories (...);

-- 2. Create customers
CREATE TABLE customers (...);

-- 3. Create products
CREATE TABLE products (...);

-- 4. Create subscriptions and orders
CREATE TABLE subscriptions (...);
CREATE TABLE orders (...);
CREATE TABLE order_items (...);

-- 5. Create inventory tables
CREATE TABLE inventory_levels (...);
CREATE TABLE inventory_transactions (...);
CREATE TABLE inventory_batches (...);

-- 6. Create indexes
CREATE INDEX ...;

-- 7. Create functions and triggers
CREATE FUNCTION ...;
CREATE TRIGGER ...;

COMMIT;
```

---

## Integration with Phase 1

### Linking Harvest to Inventory

```sql
-- When a harvest occurs, create inventory transaction
INSERT INTO inventory_transactions (
  farm_id, product_id, field_id, worker_id,
  transaction_type, quantity, unit,
  quantity_before, quantity_after,
  batch_number, harvest_quality
)
SELECT
  f.farm_id,
  p.id AS product_id,
  ts.field_id,
  te.worker_id,
  'harvest',
  te.quantity_harvested,
  'lb',
  COALESCE(il.quantity_on_hand, 0),
  COALESCE(il.quantity_on_hand, 0) + te.quantity_harvested,
  'BATCH-' || TO_CHAR(NOW(), 'YYYYMMDD-') || gen_random_uuid()::TEXT,
  'standard'
FROM time_entries te
JOIN task_schedules ts ON te.schedule_id = ts.id
JOIN fields f ON ts.field_id = f.id
JOIN products p ON p.name ILIKE '%' || ts.task_name || '%'
LEFT JOIN inventory_levels il ON il.product_id = p.id
WHERE te.task_completed = true
  AND ts.task_name ILIKE '%harvest%';
```

### Customer Portal Access

```sql
-- Link customers to users for portal access
ALTER TABLE customers
ADD COLUMN user_id UUID REFERENCES users(id);

CREATE INDEX idx_customers_user_id ON customers(user_id);
```

---

## Performance Considerations

### Query Optimization

1. **Composite Indexes for Common Queries**
   ```sql
   -- Orders by farm, date, and status
   CREATE INDEX idx_orders_farm_date_status
   ON orders(farm_id, fulfillment_date, status);

   -- Products available for sale
   CREATE INDEX idx_products_available_sale
   ON products(farm_id, available_for_sale, status)
   WHERE available_for_sale = true AND status = 'active';
   ```

2. **Partial Indexes for Active Records**
   ```sql
   -- Only index active customers
   CREATE INDEX idx_active_customers
   ON customers(farm_id, customer_type)
   WHERE status = 'active';
   ```

3. **Materialized Views for Reports**
   ```sql
   CREATE MATERIALIZED VIEW daily_sales_summary AS
   SELECT
     farm_id,
     DATE(created_at) as sale_date,
     COUNT(*) as order_count,
     SUM(total_amount) as total_revenue,
     AVG(total_amount) as avg_order_value
   FROM orders
   WHERE payment_status = 'paid'
   GROUP BY farm_id, DATE(created_at);

   CREATE UNIQUE INDEX ON daily_sales_summary(farm_id, sale_date);

   -- Refresh nightly
   REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_summary;
   ```

---

## Security & Privacy

### Data Access Policies

```sql
-- Row-Level Security for multi-tenant isolation
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Customers can only see their own data
CREATE POLICY customer_own_data ON customers
  FOR ALL
  USING (user_id = current_setting('app.user_id')::UUID);

-- Farm managers can see all farm data
CREATE POLICY manager_farm_data ON orders
  FOR ALL
  USING (
    farm_id IN (
      SELECT farm_id FROM users
      WHERE id = current_setting('app.user_id')::UUID
      AND role IN ('manager', 'admin')
    )
  );
```

### PII Protection

```sql
-- Encrypt sensitive customer data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to anonymize customer data for analytics
CREATE OR REPLACE FUNCTION anonymize_customer(customer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE customers
  SET
    email = 'anonymized_' || id || '@example.com',
    phone = NULL,
    secondary_phone = NULL,
    address_line1 = NULL,
    address_line2 = NULL
  WHERE id = customer_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Testing Strategy

### Sample Data Generation

```sql
-- Generate test customers
INSERT INTO customers (farm_id, customer_type, first_name, last_name, email, phone)
SELECT
  farm_id,
  (ARRAY['csa_member', 'market', 'wholesale'])[floor(random() * 3 + 1)],
  'Test' || generate_series,
  'Customer' || generate_series,
  'test' || generate_series || '@example.com',
  '+1555' || LPAD(generate_series::TEXT, 7, '0')
FROM farms, generate_series(1, 100);

-- Generate test products
INSERT INTO products (farm_id, name, product_type, base_price, unit, track_inventory)
SELECT
  id,
  crop_name || ' ' || variety,
  'crop',
  (random() * 10 + 2)::NUMERIC(10,2),
  (ARRAY['lb', 'bunch', 'each', 'pint'])[floor(random() * 4 + 1)],
  true
FROM farms
CROSS JOIN (VALUES
  ('Tomatoes', 'Heirloom'),
  ('Lettuce', 'Buttercrunch'),
  ('Carrots', 'Rainbow'),
  ('Cucumbers', 'Marketmore')
) AS crops(crop_name, variety);
```

### Validation Queries

```sql
-- Verify inventory consistency
SELECT
  p.name,
  p.current_stock,
  SUM(il.quantity_on_hand) as calculated_stock,
  p.current_stock - SUM(il.quantity_on_hand) as difference
FROM products p
LEFT JOIN inventory_levels il ON il.product_id = p.id
GROUP BY p.id, p.name, p.current_stock
HAVING p.current_stock != COALESCE(SUM(il.quantity_on_hand), 0);

-- Verify order totals
SELECT order_number, total_amount, calculated_total, difference
FROM (
  SELECT
    o.order_number,
    o.total_amount,
    (o.subtotal - o.discount_amount + o.tax_amount + o.delivery_fee) as calculated_total,
    o.total_amount - (o.subtotal - o.discount_amount + o.tax_amount + o.delivery_fee) as difference
  FROM orders o
) AS order_totals
WHERE ABS(difference) > 0.01;
```

---

## Future Enhancements

### Phase 3 Considerations

1. **Multi-Location Support**
   - Inventory per location/farm stand
   - Transfer orders between locations

2. **Advanced Pricing**
   - Dynamic pricing based on supply
   - Customer-specific pricing
   - Seasonal price adjustments

3. **Subscription Flexibility**
   - Vacation holds
   - Product substitutions
   - Add-on products

4. **Marketplace Features**
   - Multi-farm marketplace
   - Farm-to-farm wholesale
   - Cooperative purchasing

---

## Appendix: Quick Reference

### Table Summary

| Table | Purpose | Key Relationships |
|-------|---------|------------------|
| `customers` | Customer management | → `farms`, → `users` |
| `products` | Product catalog | → `farms`, → `product_categories` |
| `product_categories` | Product organization | → `farms`, self-reference |
| `orders` | Order management | → `farms`, → `customers`, → `subscriptions` |
| `order_items` | Line items | → `orders`, → `products` |
| `subscriptions` | CSA memberships | → `farms`, → `customers` |
| `inventory_transactions` | Stock movements | → `farms`, → `products`, → `fields`, → `orders`, → `workers` |
| `inventory_levels` | Current stock | → `farms`, → `products` |
| `inventory_batches` | Batch tracking | → `farms`, → `products`, → `fields` |

### Column Naming Conventions

- Primary keys: `id` (UUID)
- Foreign keys: `{table_name}_id` (e.g., `farm_id`, `customer_id`)
- Timestamps: `created_at`, `updated_at`, `{action}_at`
- Amounts: `{description}_amount` or `total_{description}`
- Status fields: `status`, `{entity}_status`
- Boolean flags: `is_{condition}` or `has_{feature}` or direct adjective

### Standard Audit Fields

All tables should include:
```sql
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
created_by UUID REFERENCES users(id),
updated_by UUID REFERENCES users(id)
```

---

## Changelog

### Version 1.0 (2025-11-10)
- Initial Phase 2 schema design
- Defined customers, products, orders, and inventory tables
- Established relationships with Phase 1 tables
- Added business rules and constraints
- Included migration strategy and testing approach

---

**Review Status:** ✅ Ready for stakeholder review
**Next Steps:** Review with product team, validate with real farm workflows, prototype key queries
