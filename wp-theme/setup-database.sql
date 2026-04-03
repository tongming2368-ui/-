-- PhotoTool WordPress 主题数据库扩展表
-- 用于存储摄影工具站的扩展数据

-- 如果表已存在则跳过创建

-- 1. 用户资料扩展表
CREATE TABLE IF NOT EXISTS `{prefix}phototool_user_profiles` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) UNSIGNED NOT NULL,
    `avatar` varchar(500) DEFAULT NULL COMMENT '头像 URL',
    `bio` text DEFAULT NULL COMMENT '个人简介',
    `camera_brand` varchar(100) DEFAULT NULL COMMENT '常用相机品牌',
    `camera_model` varchar(200) DEFAULT NULL COMMENT '常用相机型号',
    `specialties` text DEFAULT NULL COMMENT '擅长领域（JSON 数组）',
    `social_links` text DEFAULT NULL COMMENT '社交链接（JSON 对象）',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_id` (`user_id`),
    KEY `camera_brand` (`camera_brand`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户资料扩展表';

-- 2. 帖子表
CREATE TABLE IF NOT EXISTS `{prefix}phototool_posts` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `author_id` bigint(20) UNSIGNED NOT NULL,
    `title` varchar(500) NOT NULL COMMENT '帖子标题',
    `content` longtext DEFAULT NULL COMMENT '帖子内容',
    `category` varchar(100) DEFAULT 'general' COMMENT '分类：general, photo, gear, tips, showcase',
    `images` text DEFAULT NULL COMMENT '图片列表（JSON 数组）',
    `tags` text DEFAULT NULL COMMENT '标签（JSON 数组）',
    `likes_count` int(11) NOT NULL DEFAULT 0 COMMENT '点赞数',
    `comments_count` int(11) NOT NULL DEFAULT 0 COMMENT '评论数',
    `views_count` int(11) NOT NULL DEFAULT 0 COMMENT '浏览数',
    `is_pinned` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否置顶',
    `is_published` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否发布',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `author_id` (`author_id`),
    KEY `category` (`category`),
    KEY `is_published` (`is_published`),
    KEY `created_at` (`created_at`),
    FULLTEXT KEY `title_content` (`title`, `content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子表';

-- 3. 帖子评论表
CREATE TABLE IF NOT EXISTS `{prefix}phototool_comments` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `post_id` bigint(20) UNSIGNED NOT NULL,
    `author_id` bigint(20) UNSIGNED NOT NULL,
    `parent_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT '父评论 ID（支持嵌套）',
    `content` text NOT NULL COMMENT '评论内容',
    `likes_count` int(11) NOT NULL DEFAULT 0,
    `is_approved` tinyint(1) NOT NULL DEFAULT 1,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `post_id` (`post_id`),
    KEY `author_id` (`author_id`),
    KEY `parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子评论表';

-- 4. 点赞记录表
CREATE TABLE IF NOT EXISTS `{prefix}phototool_likes` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) UNSIGNED NOT NULL,
    `target_type` varchar(50) NOT NULL COMMENT '目标类型：post, comment',
    `target_id` bigint(20) UNSIGNED NOT NULL COMMENT '目标 ID',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_target` (`user_id`, `target_type`, `target_id`),
    KEY `target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞记录表';

-- 5. 聊天消息表
CREATE TABLE IF NOT EXISTS `{prefix}phototool_chat_messages` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `sender_id` bigint(20) UNSIGNED NOT NULL,
    `receiver_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT '接收者 ID（NULL 表示群聊）',
    `channel` varchar(100) DEFAULT 'general' COMMENT '频道：general, gear, tips, private',
    `content` text NOT NULL COMMENT '消息内容',
    `message_type` varchar(50) NOT NULL DEFAULT 'text' COMMENT '消息类型：text, image, link',
    `is_read` tinyint(1) NOT NULL DEFAULT 0,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `sender_id` (`sender_id`),
    KEY `receiver_id` (`receiver_id`),
    KEY `channel` (`channel`),
    KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';

-- 6. 设备/器材表
CREATE TABLE IF NOT EXISTS `{prefix}phototool_equipment` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` varchar(500) NOT NULL COMMENT '设备名称',
    `brand` varchar(100) NOT NULL COMMENT '品牌',
    `category` varchar(100) NOT NULL COMMENT '分类：camera, lens, flash, tripod, filter, other',
    `description` text DEFAULT NULL,
    `specs` text DEFAULT NULL COMMENT '规格参数（JSON 对象）',
    `image_url` varchar(500) DEFAULT NULL,
    `affiliate_link` varchar(500) DEFAULT NULL COMMENT '推广链接',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `brand` (`brand`),
    KEY `category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备器材表';

-- 7. 用户收藏表
CREATE TABLE IF NOT EXISTS `{prefix}phototool_favorites` (
    `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) UNSIGNED NOT NULL,
    `target_type` varchar(50) NOT NULL COMMENT '目标类型：post, equipment',
    `target_id` bigint(20) UNSIGNED NOT NULL COMMENT '目标 ID',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_target` (`user_id`, `target_type`, `target_id`),
    KEY `target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';
