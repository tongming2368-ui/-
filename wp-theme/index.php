<?php
/**
 * WordPress 主题入口文件
 *
 * 这是 WordPress 主题的主模板文件。
 * 它是所有页面请求的最终回退模板。
 *
 * @package PhotoTool
 * @version 1.0.0
 */

// 禁止直接访问
if (!defined('ABSPATH')) {
    exit;
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
    <?php wp_body_open(); ?>

    <?php get_header(); ?>

    <main id="main-content" class="site-main">
        <div id="app">
            <!-- Vue 应用挂载点 -->
            <noscript>
                <div class="no-js-message">
                    <p>此网站需要 JavaScript 才能正常运行。请启用 JavaScript 或使用支持的浏览器。</p>
                </div>
            </noscript>
        </div>
    </main>

    <?php get_footer(); ?>

    <?php wp_footer(); ?>
</body>
</html>
