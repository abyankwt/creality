<?php
/**
 * Plugin Name: Creality Loyalty & Rewards
 * Plugin URI:  https://creality.com.kw
 * Description: Tier-based loyalty points engine for WooCommerce. Earns points on completed orders, supports recurring bonus multipliers, and generates discount coupons from redeemed points.
 * Version:     1.0.0
 * Author:      Creality Kuwait
 * Author URI:  https://creality.com.kw
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Text Domain: creality-loyalty
 *
 * @package Creality_Loyalty
 */

// Prevent direct file access.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/*==============================================================
 * MAIN PLUGIN CLASS
 *============================================================*/

/**
 * Class Creality_Loyalty
 *
 * Singleton entry point for the loyalty & rewards engine.
 */
final class Creality_Loyalty {

    /** Plugin version. */
    const VERSION = '1.0.0';

    /** Database schema version. */
    const DB_VERSION = '1.0.0';

    /** Settings option key prefix. */
    const OPT_PREFIX = 'creality_loyalty_';

    /** @var self|null Singleton instance. */
    private static $instance = null;

    /**
     * Get or create the singleton instance.
     *
     * @return self
     */
    public static function instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /** Private constructor — use instance(). */
    private function __construct() {
        $this->register_hooks();
    }

    /**
     * Register all WordPress hooks.
     */
    private function register_hooks() {
        // Admin settings.
        add_filter( 'woocommerce_settings_tabs_array', array( $this, 'add_settings_tab' ), 50 );
        add_action( 'woocommerce_settings_tabs_loyalty', array( $this, 'render_settings' ) );
        add_action( 'woocommerce_update_options_loyalty', array( $this, 'save_settings' ) );

        // WooCommerce admin notice.
        add_action( 'admin_notices', array( $this, 'admin_notice_wc_required' ) );

        // Points on order completion.
        add_action( 'woocommerce_order_status_completed', array( $this, 'award_points_on_completion' ), 10, 1 );

        // REST API.
        add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
    }

    /*--------------------------------------------------------------
     * TABLE NAME HELPER
     *------------------------------------------------------------*/

    /**
     * Get the fully-prefixed loyalty points table name.
     *
     * @return string
     */
    public static function table_name() {
        global $wpdb;
        return $wpdb->prefix . 'creality_loyalty_points';
    }

    /*--------------------------------------------------------------
     * 1. ACTIVATION — Create Table
     *------------------------------------------------------------*/

    /**
     * Runs on plugin activation. Creates the points ledger table.
     */
    public static function activate() {
        global $wpdb;

        $table           = self::table_name();
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE {$table} (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT(20) UNSIGNED NOT NULL,
            points_earned INT NOT NULL DEFAULT 0,
            points_used INT NOT NULL DEFAULT 0,
            source_order_id BIGINT(20) UNSIGNED DEFAULT NULL,
            expires_at DATETIME DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY idx_user_id (user_id),
            KEY idx_expires_at (expires_at)
        ) {$charset_collate};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );

        update_option( self::OPT_PREFIX . 'db_version', self::DB_VERSION );

        // Seed default settings if first install.
        $defaults = array(
            'base_multiplier'        => 1,
            'bronze_threshold'       => 0,
            'silver_threshold'       => 100,
            'gold_threshold'         => 500,
            'bronze_multiplier'      => 1,
            'silver_multiplier'      => 1.5,
            'gold_multiplier'        => 2,
            'recurring_multiplier'   => 1.25,
            'reward_type'            => 'fixed',
            'fixed_discount'         => 1,
            'percentage_discount'    => 5,
            'expiry_days'            => '',
        );
        foreach ( $defaults as $key => $value ) {
            if ( false === get_option( self::OPT_PREFIX . $key ) ) {
                update_option( self::OPT_PREFIX . $key, $value );
            }
        }
    }

    /**
     * Runs on plugin deactivation. Currently a no-op — we keep data intact.
     */
    public static function deactivate() {
        // Intentionally empty. Data persists.
    }

    /*--------------------------------------------------------------
     * 2. ADMIN SETTINGS — WooCommerce Settings Tab
     *------------------------------------------------------------*/

    /**
     * Add "Loyalty" tab to WooCommerce → Settings.
     *
     * @param array $tabs Existing tabs.
     * @return array
     */
    public function add_settings_tab( $tabs ) {
        $tabs['loyalty'] = __( 'Loyalty', 'creality-loyalty' );
        return $tabs;
    }

    /**
     * Render the settings fields on the Loyalty tab.
     */
    public function render_settings() {
        woocommerce_admin_fields( $this->get_settings_fields() );
    }

    /**
     * Save the settings fields on the Loyalty tab.
     */
    public function save_settings() {
        woocommerce_update_options( $this->get_settings_fields() );
    }

    /**
     * Define all admin settings fields.
     *
     * @return array WooCommerce settings API field definitions.
     */
    private function get_settings_fields() {
        return array(

            /*--- Section: General ---*/
            array(
                'title' => __( 'Loyalty Points Configuration', 'creality-loyalty' ),
                'type'  => 'title',
                'desc'  => __( 'Configure the points earning rules, tiers, and reward values.', 'creality-loyalty' ),
                'id'    => self::OPT_PREFIX . 'section_general',
            ),
            array(
                'title'    => __( 'Base Points Multiplier', 'creality-loyalty' ),
                'desc'     => __( 'Points earned per 1 KWD spent (before tier multiplier).', 'creality-loyalty' ),
                'id'       => self::OPT_PREFIX . 'base_multiplier',
                'type'     => 'number',
                'default'  => 1,
                'css'      => 'width:80px;',
                'custom_attributes' => array( 'min' => '0', 'step' => '0.1' ),
            ),

            /*--- Section: Tiers ---*/
            array(
                'title' => __( 'Tier Thresholds (Lifetime Spend in KWD)', 'creality-loyalty' ),
                'type'  => 'title',
                'id'    => self::OPT_PREFIX . 'section_tiers',
            ),
            array(
                'title'   => __( 'Bronze Threshold', 'creality-loyalty' ),
                'id'      => self::OPT_PREFIX . 'bronze_threshold',
                'type'    => 'number',
                'default' => 0,
                'css'     => 'width:100px;',
                'custom_attributes' => array( 'min' => '0', 'step' => '1' ),
            ),
            array(
                'title'   => __( 'Silver Threshold', 'creality-loyalty' ),
                'id'      => self::OPT_PREFIX . 'silver_threshold',
                'type'    => 'number',
                'default' => 100,
                'css'     => 'width:100px;',
                'custom_attributes' => array( 'min' => '0', 'step' => '1' ),
            ),
            array(
                'title'   => __( 'Gold Threshold', 'creality-loyalty' ),
                'id'      => self::OPT_PREFIX . 'gold_threshold',
                'type'    => 'number',
                'default' => 500,
                'css'     => 'width:100px;',
                'custom_attributes' => array( 'min' => '0', 'step' => '1' ),
            ),

            /*--- Section: Tier Multipliers ---*/
            array(
                'title' => __( 'Tier Multipliers', 'creality-loyalty' ),
                'type'  => 'title',
                'id'    => self::OPT_PREFIX . 'section_multipliers',
            ),
            array(
                'title'   => __( 'Bronze Multiplier', 'creality-loyalty' ),
                'id'      => self::OPT_PREFIX . 'bronze_multiplier',
                'type'    => 'number',
                'default' => 1,
                'css'     => 'width:80px;',
                'custom_attributes' => array( 'min' => '0', 'step' => '0.1' ),
            ),
            array(
                'title'   => __( 'Silver Multiplier', 'creality-loyalty' ),
                'id'      => self::OPT_PREFIX . 'silver_multiplier',
                'type'    => 'number',
                'default' => 1.5,
                'css'     => 'width:80px;',
                'custom_attributes' => array( 'min' => '0', 'step' => '0.1' ),
            ),
            array(
                'title'   => __( 'Gold Multiplier', 'creality-loyalty' ),
                'id'      => self::OPT_PREFIX . 'gold_multiplier',
                'type'    => 'number',
                'default' => 2,
                'css'     => 'width:80px;',
                'custom_attributes' => array( 'min' => '0', 'step' => '0.1' ),
            ),
            array(
                'title'   => __( 'Recurring Subscription Bonus Multiplier', 'creality-loyalty' ),
                'desc'    => __( 'Extra multiplier applied when the order was created by the recurring system.', 'creality-loyalty' ),
                'id'      => self::OPT_PREFIX . 'recurring_multiplier',
                'type'    => 'number',
                'default' => 1.25,
                'css'     => 'width:80px;',
                'custom_attributes' => array( 'min' => '1', 'step' => '0.05' ),
            ),

            /*--- Section: Reward ---*/
            array(
                'title' => __( 'Reward Configuration', 'creality-loyalty' ),
                'type'  => 'title',
                'id'    => self::OPT_PREFIX . 'section_reward',
            ),
            array(
                'title'   => __( 'Reward Type', 'creality-loyalty' ),
                'id'      => self::OPT_PREFIX . 'reward_type',
                'type'    => 'select',
                'default' => 'fixed',
                'options' => array(
                    'fixed'      => __( 'Fixed Cart Discount (KWD)', 'creality-loyalty' ),
                    'percentage' => __( 'Percentage Discount (%)', 'creality-loyalty' ),
                ),
            ),
            array(
                'title'   => __( 'Fixed Discount Value (KWD)', 'creality-loyalty' ),
                'desc'    => __( 'Coupon value when reward type is Fixed.', 'creality-loyalty' ),
                'id'      => self::OPT_PREFIX . 'fixed_discount',
                'type'    => 'number',
                'default' => 1,
                'css'     => 'width:80px;',
                'custom_attributes' => array( 'min' => '0', 'step' => '0.1' ),
            ),
            array(
                'title'   => __( 'Percentage Discount Value (%)', 'creality-loyalty' ),
                'desc'    => __( 'Coupon value when reward type is Percentage.', 'creality-loyalty' ),
                'id'      => self::OPT_PREFIX . 'percentage_discount',
                'type'    => 'number',
                'default' => 5,
                'css'     => 'width:80px;',
                'custom_attributes' => array( 'min' => '0', 'step' => '1', 'max' => '100' ),
            ),

            /*--- Section: Expiry ---*/
            array(
                'title' => __( 'Points Expiry', 'creality-loyalty' ),
                'type'  => 'title',
                'id'    => self::OPT_PREFIX . 'section_expiry',
            ),
            array(
                'title'   => __( 'Default Expiry Duration (Days)', 'creality-loyalty' ),
                'desc'    => __( 'Leave empty or 0 for points that never expire.', 'creality-loyalty' ),
                'id'      => self::OPT_PREFIX . 'expiry_days',
                'type'    => 'number',
                'default' => '',
                'css'     => 'width:80px;',
                'custom_attributes' => array( 'min' => '0', 'step' => '1' ),
            ),

            // End all sections.
            array( 'type' => 'sectionend', 'id' => self::OPT_PREFIX . 'section_general' ),
        );
    }

    /*--------------------------------------------------------------
     * 3. HELPER — Get an admin setting value
     *------------------------------------------------------------*/

    /**
     * Get a loyalty setting value.
     *
     * @param string $key     Setting key (without prefix).
     * @param mixed  $default Fallback value.
     * @return mixed
     */
    public static function get_setting( $key, $default = '' ) {
        return get_option( self::OPT_PREFIX . $key, $default );
    }

    /*--------------------------------------------------------------
     * 4. TIER CALCULATION
     *------------------------------------------------------------*/

    /**
     * Determine a user's loyalty tier based on lifetime completed orders.
     *
     * @param int $user_id WordPress user ID.
     * @return array { tier: string, multiplier: float, lifetime_spend: float, next_tier: string|null, next_threshold: float|null }
     */
    public static function calculate_tier( $user_id ) {
        $lifetime_spend = self::get_lifetime_spend( $user_id );

        $gold_threshold   = (float) self::get_setting( 'gold_threshold', 500 );
        $silver_threshold = (float) self::get_setting( 'silver_threshold', 100 );

        $gold_mult   = (float) self::get_setting( 'gold_multiplier', 2 );
        $silver_mult = (float) self::get_setting( 'silver_multiplier', 1.5 );
        $bronze_mult = (float) self::get_setting( 'bronze_multiplier', 1 );

        if ( $lifetime_spend >= $gold_threshold && $gold_threshold > 0 ) {
            return array(
                'tier'           => 'gold',
                'multiplier'     => $gold_mult,
                'lifetime_spend' => $lifetime_spend,
                'next_tier'      => null,
                'next_threshold' => null,
            );
        }

        if ( $lifetime_spend >= $silver_threshold && $silver_threshold > 0 ) {
            return array(
                'tier'           => 'silver',
                'multiplier'     => $silver_mult,
                'lifetime_spend' => $lifetime_spend,
                'next_tier'      => 'gold',
                'next_threshold' => $gold_threshold,
            );
        }

        return array(
            'tier'           => 'bronze',
            'multiplier'     => $bronze_mult,
            'lifetime_spend' => $lifetime_spend,
            'next_tier'      => 'silver',
            'next_threshold' => $silver_threshold,
        );
    }

    /**
     * Get a user's lifetime completed order spend.
     *
     * @param int $user_id WordPress user ID.
     * @return float Total spend in base currency.
     */
    public static function get_lifetime_spend( $user_id ) {
        $customer = new WC_Customer( $user_id );
        return (float) $customer->get_total_spent();
    }

    /*--------------------------------------------------------------
     * 5. POINTS AWARDING — On Order Completion
     *------------------------------------------------------------*/

    /**
     * Hook: woocommerce_order_status_completed
     * Awards loyalty points when an order is marked completed.
     *
     * @param int $order_id WooCommerce order ID.
     */
    public function award_points_on_completion( $order_id ) {
        global $wpdb;

        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            return;
        }

        // Prevent double-awarding.
        if ( $order->get_meta( '_creality_loyalty_points_awarded' ) ) {
            return;
        }

        $user_id = $order->get_user_id();
        if ( ! $user_id ) {
            return; // Guest order — no loyalty.
        }

        $order_total   = (float) $order->get_total();
        $base_mult     = (float) self::get_setting( 'base_multiplier', 1 );
        $tier_info     = self::calculate_tier( $user_id );
        $tier_mult     = $tier_info['multiplier'];

        // Check if this order was created by the recurring system.
        $is_recurring  = $order->get_meta( '_creality_recurring_order' ) === 'yes';
        $recur_mult    = $is_recurring ? (float) self::get_setting( 'recurring_multiplier', 1.25 ) : 1;

        // Final points = floor( order_total × base × tier × recurring ).
        $points = (int) floor( $order_total * $base_mult * $tier_mult * $recur_mult );

        if ( $points <= 0 ) {
            return;
        }

        // Calculate expiry.
        $expiry_days = (int) self::get_setting( 'expiry_days', 0 );
        $expires_at  = null;
        if ( $expiry_days > 0 ) {
            $expires_at = gmdate( 'Y-m-d H:i:s', strtotime( '+' . $expiry_days . ' days' ) );
        }

        // Insert points row.
        $table = self::table_name();
        $wpdb->insert(
            $table,
            array(
                'user_id'         => $user_id,
                'points_earned'   => $points,
                'points_used'     => 0,
                'source_order_id' => $order_id,
                'expires_at'      => $expires_at,
                'created_at'      => current_time( 'mysql' ),
            ),
            array( '%d', '%d', '%d', '%d', '%s', '%s' )
        );

        // Mark order so we don't double-award.
        $order->update_meta_data( '_creality_loyalty_points_awarded', $points );
        $order->save();

        // Add order note.
        $order->add_order_note(
            sprintf(
                /* translators: 1: points, 2: tier */
                __( 'Loyalty: %1$d points awarded (tier: %2$s).', 'creality-loyalty' ),
                $points,
                $tier_info['tier']
            )
        );
    }

    /*--------------------------------------------------------------
     * 6. POINTS BALANCE HELPERS
     *------------------------------------------------------------*/

    /**
     * Get a user's total earned points (all time).
     *
     * @param int $user_id WordPress user ID.
     * @return int
     */
    public static function get_total_earned( $user_id ) {
        global $wpdb;
        $table = self::table_name();

        return (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COALESCE( SUM(points_earned), 0 ) FROM {$table} WHERE user_id = %d",
                $user_id
            )
        );
    }

    /**
     * Get a user's total used (redeemed) points (all time).
     *
     * @param int $user_id WordPress user ID.
     * @return int
     */
    public static function get_total_used( $user_id ) {
        global $wpdb;
        $table = self::table_name();

        return (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COALESCE( SUM(points_used), 0 ) FROM {$table} WHERE user_id = %d",
                $user_id
            )
        );
    }

    /**
     * Get a user's available (non-expired, non-used) points balance.
     * Available = SUM(points_earned - points_used) for rows that
     * are either non-expired or have no expiry set.
     *
     * @param int $user_id WordPress user ID.
     * @return int
     */
    public static function get_available_points( $user_id ) {
        global $wpdb;
        $table = self::table_name();
        $now   = current_time( 'mysql' );

        return (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COALESCE( SUM(points_earned - points_used), 0 )
                 FROM {$table}
                 WHERE user_id = %d
                   AND (points_earned - points_used) > 0
                   AND (expires_at IS NULL OR expires_at > %s)",
                $user_id,
                $now
            )
        );
    }

    /**
     * Deduct points from a user's balance using FIFO (oldest rows first).
     * Skips expired rows.
     *
     * @param int $user_id        WordPress user ID.
     * @param int $points_to_use  Points to deduct.
     * @return bool True on success.
     */
    public static function deduct_points( $user_id, $points_to_use ) {
        global $wpdb;
        $table     = self::table_name();
        $now       = current_time( 'mysql' );
        $remaining = $points_to_use;

        // Get rows with available balance, oldest first.
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, points_earned, points_used
                 FROM {$table}
                 WHERE user_id = %d
                   AND (points_earned - points_used) > 0
                   AND (expires_at IS NULL OR expires_at > %s)
                 ORDER BY created_at ASC",
                $user_id,
                $now
            )
        );

        foreach ( $rows as $row ) {
            if ( $remaining <= 0 ) {
                break;
            }

            $available = $row->points_earned - $row->points_used;
            $deduct    = min( $available, $remaining );

            $wpdb->update(
                $table,
                array( 'points_used' => $row->points_used + $deduct ),
                array( 'id' => $row->id ),
                array( '%d' ),
                array( '%d' )
            );

            $remaining -= $deduct;
        }

        return 0 === $remaining;
    }

    /*--------------------------------------------------------------
     * 7. COUPON GENERATION
     *------------------------------------------------------------*/

    /**
     * Generate a WooCommerce coupon for redeemed points.
     *
     * @param int $user_id         WordPress user ID.
     * @param int $points_redeemed Number of points being redeemed.
     * @return string The generated coupon code.
     *
     * @throws Exception If coupon creation fails.
     */
    public static function generate_reward_coupon( $user_id, $points_redeemed ) {
        $reward_type = self::get_setting( 'reward_type', 'fixed' );

        if ( 'percentage' === $reward_type ) {
            $discount_type = 'percent';
            $amount        = (float) self::get_setting( 'percentage_discount', 5 );
        } else {
            $discount_type = 'fixed_cart';
            $amount        = (float) self::get_setting( 'fixed_discount', 1 );
        }

        // Generate unique code.
        $code = 'LOYALTY-' . strtoupper( wp_generate_password( 8, false ) );

        $coupon = new WC_Coupon();
        $coupon->set_code( $code );
        $coupon->set_discount_type( $discount_type );
        $coupon->set_amount( $amount );
        $coupon->set_usage_limit( 1 );
        $coupon->set_individual_use( true );
        $coupon->set_email_restrictions( array( ( new WC_Customer( $user_id ) )->get_email() ) );
        $coupon->set_description(
            sprintf(
                /* translators: %d: points redeemed */
                __( 'Loyalty reward — %d points redeemed.', 'creality-loyalty' ),
                $points_redeemed
            )
        );

        // Optional expiry (30 days by default for coupons).
        $coupon->set_date_expires( strtotime( '+30 days' ) );

        $coupon->save();

        if ( ! $coupon->get_id() ) {
            throw new Exception( __( 'Failed to create coupon.', 'creality-loyalty' ) );
        }

        return $code;
    }

    /*--------------------------------------------------------------
     * 8. REST API ENDPOINTS
     *------------------------------------------------------------*/

    /**
     * Register REST API routes.
     */
    public function register_rest_routes() {
        $namespace = 'creality-loyalty/v1';

        // GET /points — Current user's points summary.
        register_rest_route( $namespace, '/points', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( $this, 'api_get_points' ),
            'permission_callback' => array( $this, 'api_check_auth' ),
        ) );

        // POST /redeem — Redeem points for a coupon.
        register_rest_route( $namespace, '/redeem', array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array( $this, 'api_redeem_points' ),
            'permission_callback' => array( $this, 'api_check_auth' ),
            'args'                => array(
                'points_to_redeem' => array(
                    'required'          => true,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                    'validate_callback' => function ( $value ) {
                        return $value > 0;
                    },
                ),
            ),
        ) );
    }

    /**
     * Permission callback: user must be logged in.
     *
     * @return bool|WP_Error
     */
    public function api_check_auth() {
        if ( ! is_user_logged_in() ) {
            return new WP_Error(
                'rest_not_logged_in',
                __( 'You must be logged in.', 'creality-loyalty' ),
                array( 'status' => 401 )
            );
        }
        return true;
    }

    /*--------------------------------------------------------------
     * 8a. GET /points
     *------------------------------------------------------------*/

    /**
     * Return the current user's loyalty points summary.
     *
     * @param WP_REST_Request $request Incoming request.
     * @return WP_REST_Response
     */
    public function api_get_points( WP_REST_Request $request ) {
        $user_id = get_current_user_id();

        $total_earned    = self::get_total_earned( $user_id );
        $total_used      = self::get_total_used( $user_id );
        $available       = self::get_available_points( $user_id );
        $tier_info       = self::calculate_tier( $user_id );

        return new WP_REST_Response(
            array(
                'success' => true,
                'data'    => array(
                    'available_points'  => $available,
                    'total_earned'      => $total_earned,
                    'total_used'        => $total_used,
                    'tier'              => $tier_info['tier'],
                    'tier_multiplier'   => $tier_info['multiplier'],
                    'lifetime_spend'    => $tier_info['lifetime_spend'],
                    'next_tier'         => $tier_info['next_tier'],
                    'next_threshold'    => $tier_info['next_threshold'],
                ),
            ),
            200
        );
    }

    /*--------------------------------------------------------------
     * 8b. POST /redeem
     *------------------------------------------------------------*/

    /**
     * Redeem points for a WooCommerce coupon.
     *
     * @param WP_REST_Request $request Incoming request.
     * @return WP_REST_Response|WP_Error
     */
    public function api_redeem_points( WP_REST_Request $request ) {
        $user_id          = get_current_user_id();
        $points_to_redeem = $request->get_param( 'points_to_redeem' );

        // Check available balance.
        $available = self::get_available_points( $user_id );
        if ( $points_to_redeem > $available ) {
            return new WP_Error(
                'insufficient_points',
                sprintf(
                    /* translators: 1: requested points, 2: available points */
                    __( 'Not enough points. Requested %1$d but you only have %2$d available.', 'creality-loyalty' ),
                    $points_to_redeem,
                    $available
                ),
                array( 'status' => 400 )
            );
        }

        // Deduct using FIFO.
        $deducted = self::deduct_points( $user_id, $points_to_redeem );
        if ( ! $deducted ) {
            return new WP_Error(
                'deduction_failed',
                __( 'Failed to deduct points. Please try again.', 'creality-loyalty' ),
                array( 'status' => 500 )
            );
        }

        // Generate coupon.
        try {
            $coupon_code = self::generate_reward_coupon( $user_id, $points_to_redeem );
        } catch ( Exception $e ) {
            return new WP_Error(
                'coupon_error',
                $e->getMessage(),
                array( 'status' => 500 )
            );
        }

        // Determine coupon details for response.
        $reward_type = self::get_setting( 'reward_type', 'fixed' );
        if ( 'percentage' === $reward_type ) {
            $discount_label = self::get_setting( 'percentage_discount', 5 ) . '%';
        } else {
            $discount_label = self::get_setting( 'fixed_discount', 1 ) . ' KWD';
        }

        return new WP_REST_Response(
            array(
                'success' => true,
                'message' => __( 'Points redeemed successfully!', 'creality-loyalty' ),
                'data'    => array(
                    'coupon_code'     => $coupon_code,
                    'discount'        => $discount_label,
                    'discount_type'   => $reward_type,
                    'points_redeemed' => $points_to_redeem,
                    'remaining_points' => self::get_available_points( $user_id ),
                ),
            ),
            200
        );
    }

    /*--------------------------------------------------------------
     * 9. ADMIN NOTICE — WooCommerce Required
     *------------------------------------------------------------*/

    /**
     * Show admin warning if WooCommerce is not active.
     */
    public function admin_notice_wc_required() {
        if ( ! class_exists( 'WooCommerce' ) ) {
            echo '<div class="notice notice-error"><p>';
            esc_html_e(
                'Creality Loyalty & Rewards requires WooCommerce to be installed and activated.',
                'creality-loyalty'
            );
            echo '</p></div>';
        }
    }
}

/*==============================================================
 * PLUGIN LIFECYCLE HOOKS
 *============================================================*/
register_activation_hook( __FILE__, array( 'Creality_Loyalty', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Creality_Loyalty', 'deactivate' ) );

/*==============================================================
 * BOOT THE PLUGIN
 *============================================================*/
add_action( 'plugins_loaded', function () {
    if ( class_exists( 'WooCommerce' ) ) {
        Creality_Loyalty::instance();
    }
} );
