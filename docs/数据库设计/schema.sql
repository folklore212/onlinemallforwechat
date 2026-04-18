-- 政企制服采购商城数据库设计
-- 创建数据库
CREATE DATABASE IF NOT EXISTS `wechat_online_shop` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `wechat_online_shop`;

-- 用户表（支持微信用户、政企客户、服装厂、管理员）
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `openid` VARCHAR(128) UNIQUE COMMENT '微信openid',
  `unionid` VARCHAR(128) COMMENT '微信unionid',
  `username` VARCHAR(50) COMMENT '用户名',
  `phone` VARCHAR(20) COMMENT '手机号',
  `email` VARCHAR(100) COMMENT '邮箱',
  `avatar_url` VARCHAR(500) COMMENT '头像',
  `user_type` ENUM('gov_enterprise', 'clothing_factory', 'admin') NOT NULL DEFAULT 'gov_enterprise',
  `company_name` VARCHAR(200) COMMENT '单位名称',
  `company_address` VARCHAR(500) COMMENT '单位地址',
  `contact_person` VARCHAR(50) COMMENT '联系人',
  `contact_phone` VARCHAR(20) COMMENT '联系电话',
  `is_active` BOOLEAN DEFAULT true,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`),
  INDEX `idx_user_type` (`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 商品分类表
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `description` TEXT COMMENT '分类描述',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `parent_id` INT DEFAULT 0 COMMENT '父分类ID',
  `is_active` BOOLEAN DEFAULT true,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 商品表（制服）
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL COMMENT '商品名称',
  `description` TEXT COMMENT '商品描述',
  `category_id` INT NOT NULL COMMENT '分类ID',
  `sku` VARCHAR(50) UNIQUE COMMENT 'SKU编码',
  `unit_price` DECIMAL(10,2) NOT NULL COMMENT '单价',
  `cost_price` DECIMAL(10,2) COMMENT '成本价',
  `stock_quantity` INT DEFAULT 0 COMMENT '库存数量',
  `min_order_quantity` INT DEFAULT 1 COMMENT '最小起订量',
  `max_order_quantity` INT COMMENT '最大订购量',
  `size_chart` JSON COMMENT '尺码表（JSON格式）',
  `color_options` JSON COMMENT '颜色选项',
  `main_image_url` VARCHAR(500) COMMENT '主图',
  `image_gallery` JSON COMMENT '商品图集',
  `is_active` BOOLEAN DEFAULT true,
  `created_by` INT COMMENT '创建人（服装厂用户ID）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 购物车表
CREATE TABLE IF NOT EXISTS `shopping_carts` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `product_id` INT NOT NULL COMMENT '商品ID',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
  `selected_size` VARCHAR(50) COMMENT '选择尺码',
  `selected_color` VARCHAR(50) COMMENT '选择颜色',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),
  UNIQUE KEY `uk_user_product` (`user_id`, `product_id`, `selected_size`, `selected_color`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 订单表
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `order_no` VARCHAR(50) UNIQUE NOT NULL COMMENT '订单编号',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `company_name` VARCHAR(200) COMMENT '单位名称（下单时填写）',
  `contact_person` VARCHAR(50) COMMENT '联系人',
  `contact_phone` VARCHAR(20) COMMENT '联系电话',
  `delivery_address` VARCHAR(500) COMMENT '收货地址',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
  `order_status` ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  `payment_status` ENUM('not_required', 'pending', 'paid') DEFAULT 'not_required' COMMENT '政企客户无需支付',
  `notes` TEXT COMMENT '订单备注',
  `admin_notes` TEXT COMMENT '管理员备注',
  `confirmed_by` INT COMMENT '确认人（管理员ID）',
  `confirmed_at` TIMESTAMP NULL COMMENT '确认时间',
  `shipped_at` TIMESTAMP NULL COMMENT '发货时间',
  `delivered_at` TIMESTAMP NULL COMMENT '送达时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`confirmed_by`) REFERENCES `users`(`id`),
  INDEX `idx_order_no` (`order_no`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_order_status` (`order_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 订单明细表
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `order_id` INT NOT NULL COMMENT '订单ID',
  `product_id` INT NOT NULL COMMENT '商品ID',
  `product_name` VARCHAR(200) NOT NULL COMMENT '商品名称（快照）',
  `unit_price` DECIMAL(10,2) NOT NULL COMMENT '单价（快照）',
  `quantity` INT NOT NULL COMMENT '数量',
  `selected_size` VARCHAR(50) COMMENT '选择尺码',
  `selected_color` VARCHAR(50) COMMENT '选择颜色',
  `subtotal` DECIMAL(10,2) NOT NULL COMMENT '小计',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统配置表
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `config_key` VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
  `config_value` TEXT COMMENT '配置值',
  `description` VARCHAR(200) COMMENT '描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入初始数据（可选）
-- 插入管理员用户（密码需通过应用设置）
-- INSERT INTO `users` (`username`, `phone`, `user_type`, `company_name`, `contact_person`) VALUES
-- ('admin', '13800138000', 'admin', '系统管理', '管理员');

-- 插入默认分类
INSERT INTO `categories` (`name`, `description`, `sort_order`) VALUES
('工作服', '各类工作制服', 1),
('制服', '企业单位制服', 2),
('防护服', '安全防护服装', 3),
('其他', '其他服装', 4);