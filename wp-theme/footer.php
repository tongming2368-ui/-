<?php
/**
 * 底部模板文件
 *
 * 包含 HTML 文档的结尾部分。
 *
 * @package PhotoTool
 * @version 1.0.0
 */

// 禁止直接访问
if (!defined('ABSPATH')) {
    exit;
}
?>

    <footer id="site-footer" class="site-footer">
        <div class="footer-container">
            <nav id="footer-navigation" class="footer-navigation">
                <?php
                if (has_nav_menu('footer')) {
                    wp_nav_menu(array(
                        'theme_location' => 'footer',
                        'menu_id'        => 'footer-menu',
                        'container'      => false,
                        'fallback_cb'    => false,
                    ));
                }
                ?>
            </nav>

            <div class="site-info">
                <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. All rights reserved.</p>
            </div>
        </div>
    </footer>

<?php wp_footer(); ?>
</body>
</html>
