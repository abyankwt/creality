<?php
/**
 * Plugin Name: Creality Operations
 * Plugin URI:  https://creality.com.kw
 * Description: Operational backend systems for maintenance tickets, returns, refunds, test orders, and model library management.
 * Version:     1.0.0
 * Author:      Creality Kuwait
 * Author URI:  https://creality.com.kw
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Text Domain: creality-operations
 *
 * @package Creality_Operations
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once __DIR__ . '/includes/class-creality-operations.php';

register_activation_hook( __FILE__, array( 'Creality_Operations', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Creality_Operations', 'deactivate' ) );

add_action(
    'plugins_loaded',
    function () {
        Creality_Operations::instance();
    }
);

