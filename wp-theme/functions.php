<?php
/**
 * PhotoTool 主题功能文件
 *
 * @package PhotoTool
 * @version 1.0.0
 */

// 禁止直接访问
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 主题常量定义
 */
define('PHOTOTOOL_VERSION', '1.0.0');
define('PHOTOTOOL_DIR', get_template_directory());
define('PHOTOTOOL_URI', get_template_directory_uri());

/**
 * 主题初始化
 */
function phototool_setup() {
    // 添加主题支持
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
    ));

    // 注册导航菜单
    register_nav_menus(array(
        'primary' => __('主菜单', 'phototool'),
        'footer'  => __('底部菜单', 'phototool'),
    ));
}
add_action('after_setup_theme', 'phototool_setup');

/**
 * 加载前端资源（CSS 和 JS）
 */
function phototool_enqueue_assets() {
    $dist_dir = PHOTOTOOL_DIR . '/dist';
    $dist_uri = PHOTOTOOL_URI . '/dist';

    // 尝试读取 Vite manifest.json
    $manifest_path = $dist_dir . '/assets/manifest.json';
    $css_files = array();
    $js_files = array();

    if (file_exists($manifest_path)) {
        $manifest = json_decode(file_get_contents($manifest_path), true);

        if ($manifest) {
            foreach ($manifest as $key => $entry) {
                if (isset($entry['isEntry']) && $entry['isEntry']) {
                    // 入口 JS 文件
                    if (isset($entry['file'])) {
                        $js_files[] = array(
                            'handle' => 'phototool-' . sanitize_title($key),
                            'src'    => $dist_uri . '/assets/' . $entry['file'],
                            'deps'   => array(),
                            'ver'    => PHOTOTOOL_VERSION,
                        );
                    }
                    // 入口 CSS 文件
                    if (isset($entry['css']) && is_array($entry['css'])) {
                        foreach ($entry['css'] as $css_file) {
                            $css_files[] = array(
                                'handle' => 'phototool-' . sanitize_title($key) . '-css',
                                'src'    => $dist_uri . '/assets/' . $css_file,
                                'ver'    => PHOTOTOOL_VERSION,
                            );
                        }
                    }
                }
            }
        }
    }

    // 如果没有 manifest.json，直接引用已知文件
    if (empty($js_files)) {
        $js_files[] = array(
            'handle' => 'phototool-app',
            'src'    => $dist_uri . '/assets/index-BWU9NqkV.js',
            'deps'   => array(),
            'ver'    => PHOTOTOOL_VERSION,
        );
    }

    if (empty($css_files)) {
        $css_files[] = array(
            'handle' => 'phototool-style',
            'src'    => $dist_uri . '/assets/index-DJPWkdSY.css',
            'ver'    => PHOTOTOOL_VERSION,
        );
    }

    // 注册并加载 CSS
    foreach ($css_files as $css) {
        wp_register_style($css['handle'], $css['src'], array(), $css['ver']);
        wp_enqueue_style($css['handle']);
    }

    // 注册并加载 JS
    foreach ($js_files as $js) {
        wp_register_script($js['handle'], $js['src'], $js['deps'], $js['ver'], true);
        wp_enqueue_script($js['handle']);
    }

    // 通过 wp_localize_script 传递 API 配置
    $api_config = array(
        'restUrl'   => esc_url_raw(rest_url('phototool/v1/')),
        'nonce'     => wp_create_nonce('wp_rest'),
        'userId'    => get_current_user_id(),
        'userLogin' => is_user_logged_in() ? wp_get_current_user()->user_login : '',
        'userName'  => is_user_logged_in() ? wp_get_current_user()->display_name : '',
        'userEmail' => is_user_logged_in() ? wp_get_current_user()->user_email : '',
        'siteUrl'   => home_url(),
        'siteName'  => get_bloginfo('name'),
    );

    // 将配置附加到最后一个 JS 文件
    if (!empty($js_files)) {
        $last_js = end($js_files);
        wp_localize_script($last_js['handle'], 'PhotoToolConfig', $api_config);
    }
}
add_action('wp_enqueue_scripts', 'phototool_enqueue_assets');

/**
 * 注册 REST API 路由
 */
function phototool_register_rest_routes() {
    // 用户认证相关路由
    register_rest_route('phototool/v1', '/auth/login', array(
        'methods'  => 'POST',
        'callback' => 'phototool_auth_login',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('phototool/v1', '/auth/register', array(
        'methods'  => 'POST',
        'callback' => 'phototool_auth_register',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('phototool/v1', '/auth/logout', array(
        'methods'  => 'POST',
        'callback' => 'phototool_auth_logout',
        'permission_callback' => 'phototool_check_auth_permission',
    ));

    register_rest_route('phototool/v1', '/auth/me', array(
        'methods'  => 'GET',
        'callback' => 'phototool_auth_me',
        'permission_callback' => 'phototool_check_auth_permission',
    ));

    // 帖子相关路由
    register_rest_route('phototool/v1', '/posts', array(
        'methods'  => 'GET',
        'callback' => 'phototool_get_posts',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('phototool/v1', '/posts', array(
        'methods'  => 'POST',
        'callback' => 'phototool_create_post',
        'permission_callback' => 'phototool_check_auth_permission',
    ));

    register_rest_route('phototool/v1', '/posts/(?P<id>\d+)', array(
        'methods'  => 'GET',
        'callback' => 'phototool_get_post',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('phototool/v1', '/posts/(?P<id>\d+)', array(
        'methods'  => 'PUT',
        'callback' => 'phototool_update_post',
        'permission_callback' => 'phototool_check_auth_permission',
    ));

    register_rest_route('phototool/v1', '/posts/(?P<id>\d+)', array(
        'methods'  => 'DELETE',
        'callback' => 'phototool_delete_post',
        'permission_callback' => 'phototool_check_auth_permission',
    ));

    // 聊天相关路由
    register_rest_route('phototool/v1', '/chat/messages', array(
        'methods'  => 'GET',
        'callback' => 'phototool_get_chat_messages',
        'permission_callback' => 'phototool_check_auth_permission',
    ));

    register_rest_route('phototool/v1', '/chat/messages', array(
        'methods'  => 'POST',
        'callback' => 'phototool_send_chat_message',
        'permission_callback' => 'phototool_check_auth_permission',
    ));

    // 用户相关路由
    register_rest_route('phototool/v1', '/users/(?P<id>\d+)', array(
        'methods'  => 'GET',
        'callback' => 'phototool_get_user',
        'permission_callback' => '__return_true',
    ));

    register_rest_route('phototool/v1', '/users/profile', array(
        'methods'  => 'PUT',
        'callback' => 'phototool_update_user_profile',
        'permission_callback' => 'phototool_check_auth_permission',
    ));
}
add_action('rest_api_init', 'phototool_register_rest_routes');

/**
 * 权限检查：用户是否已登录
 */
function phototool_check_auth_permission() {
    return is_user_logged_in();
}

// ========================
// 用户认证 API 回调函数（骨架）
// ========================

/**
 * 用户登录
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_auth_login($request) {
    // TODO: 实现登录逻辑
    // 1. 验证用户名/邮箱和密码
    // 2. 生成登录 token 或使用 WordPress 登录
    // 3. 返回用户信息和 token
    return new WP_REST_Response(array('message' => '登录接口 - 待实现'), 501);
}

/**
 * 用户注册
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_auth_register($request) {
    // TODO: 实现注册逻辑
    // 1. 验证输入数据
    // 2. 创建新用户
    // 3. 返回用户信息
    return new WP_REST_Response(array('message' => '注册接口 - 待实现'), 501);
}

/**
 * 用户登出
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_auth_logout($request) {
    // TODO: 实现登出逻辑
    // 1. 清除会话或 token
    return new WP_REST_Response(array('message' => '登出接口 - 待实现'), 501);
}

/**
 * 获取当前用户信息
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_auth_me($request) {
    // TODO: 实现获取当前用户信息逻辑
    // 1. 从请求中获取用户 ID
    // 2. 返回用户详细信息
    return new WP_REST_Response(array('message' => '获取用户信息接口 - 待实现'), 501);
}

// ========================
// 帖子 API 回调函数（骨架）
// ========================

/**
 * 获取帖子列表
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_get_posts($request) {
    // TODO: 实现获取帖子列表逻辑
    // 1. 获取分页参数
    // 2. 查询自定义帖子表
    // 3. 返回帖子列表
    return new WP_REST_Response(array('message' => '获取帖子列表接口 - 待实现'), 501);
}

/**
 * 创建新帖子
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_create_post($request) {
    // TODO: 实现创建帖子逻辑
    // 1. 验证输入数据
    // 2. 插入自定义帖子表
    // 3. 返回新帖子信息
    return new WP_REST_Response(array('message' => '创建帖子接口 - 待实现'), 501);
}

/**
 * 获取单个帖子
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_get_post($request) {
    // TODO: 实现获取单个帖子逻辑
    // 1. 获取帖子 ID
    // 2. 查询帖子详情
    // 3. 返回帖子信息
    return new WP_REST_Response(array('message' => '获取帖子详情接口 - 待实现'), 501);
}

/**
 * 更新帖子
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_update_post($request) {
    // TODO: 实现更新帖子逻辑
    // 1. 验证权限（是否为帖子作者）
    // 2. 更新帖子数据
    // 3. 返回更新后的帖子信息
    return new WP_REST_Response(array('message' => '更新帖子接口 - 待实现'), 501);
}

/**
 * 删除帖子
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_delete_post($request) {
    // TODO: 实现删除帖子逻辑
    // 1. 验证权限（是否为帖子作者或管理员）
    // 2. 删除帖子
    // 3. 返回成功消息
    return new WP_REST_Response(array('message' => '删除帖子接口 - 待实现'), 501);
}

// ========================
// 聊天 API 回调函数（骨架）
// ========================

/**
 * 获取聊天消息
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_get_chat_messages($request) {
    // TODO: 实现获取聊天消息逻辑
    // 1. 获取分页参数
    // 2. 查询聊天消息表
    // 3. 返回消息列表
    return new WP_REST_Response(array('message' => '获取聊天消息接口 - 待实现'), 501);
}

/**
 * 发送聊天消息
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_send_chat_message($request) {
    // TODO: 实现发送聊天消息逻辑
    // 1. 验证输入数据
    // 2. 插入聊天消息表
    // 3. 返回新消息信息
    return new WP_REST_Response(array('message' => '发送聊天消息接口 - 待实现'), 501);
}

// ========================
// 用户 API 回调函数（骨架）
// ========================

/**
 * 获取用户信息
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_get_user($request) {
    // TODO: 实现获取用户信息逻辑
    // 1. 获取用户 ID
    // 2. 查询用户信息
    // 3. 返回用户数据
    return new WP_REST_Response(array('message' => '获取用户信息接口 - 待实现'), 501);
}

/**
 * 更新用户资料
 *
 * @param WP_REST_Request $request 请求对象
 * @return WP_REST_Response
 */
function phototool_update_user_profile($request) {
    // TODO: 实现更新用户资料逻辑
    // 1. 验证输入数据
    // 2. 更新用户元数据
    // 3. 返回更新后的用户信息
    return new WP_REST_Response(array('message' => '更新用户资料接口 - 待实现'), 501);
}

/**
 * 添加短代码：Vue 挂载点
 */
function phototool_app_shortcode() {
    return '<div id="app"></div>';
}
add_shortcode('phototool_app', 'phototool_app_shortcode');
