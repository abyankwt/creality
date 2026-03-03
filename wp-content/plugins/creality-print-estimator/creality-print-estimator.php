<?php
/**
 * Plugin Name: Creality 3D Print Estimator
 * Plugin URI:  https://creality.com.kw
 * Description: REST API for 3D print job estimation — accepts STL/OBJ uploads, analyzes dimensions, matches printers, and calculates costs.
 * Version:     1.0.0
 * Author:      Creality Kuwait
 * Author URI:  https://creality.com.kw
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Text Domain: creality-print-estimator
 *
 * @package Creality_Print_Estimator
 */

// Prevent direct file access.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/*==============================================================
 * MAIN PLUGIN CLASS
 *============================================================*/

final class Creality_Print_Estimator {

    /** Plugin version. */
    const VERSION = '1.0.0';

    /** DB schema version. */
    const DB_VERSION = '1.0.0';

    /** Option key prefix. */
    const OPT_PREFIX = 'creality_print_';

    /** Allowed file extensions. */
    const ALLOWED_EXTENSIONS = array( 'stl', 'obj' );

    /** Maximum upload size in bytes (50 MB). */
    const MAX_UPLOAD_SIZE = 52428800;

    /** @var self|null */
    private static $instance = null;

    /*--------------------------------------------------------------
     * PRINTER DEFINITIONS
     *------------------------------------------------------------*/

    /**
     * Internal printer specs (build volume in mm).
     *
     * @return array[]
     */
    private static function get_printers() {
        return array(
            array(
                'id'     => 'printer_a',
                'name'   => 'Creality K1 Max',
                'width'  => 300,
                'height' => 300,
                'depth'  => 300,
            ),
            array(
                'id'     => 'printer_b',
                'name'   => 'Creality Ender-3 V3',
                'width'  => 220,
                'height' => 220,
                'depth'  => 250,
            ),
            array(
                'id'     => 'printer_c',
                'name'   => 'Creality CR-10 Max',
                'width'  => 400,
                'height' => 400,
                'depth'  => 400,
            ),
        );
    }

    /*--------------------------------------------------------------
     * COST CONSTANTS
     *------------------------------------------------------------*/

    /** Material cost per gram in KWD. */
    const MATERIAL_COST_PER_GRAM = 0.015;

    /** Flat processing fee in KWD. */
    const PROCESSING_FEE = 3.0;

    /** Flat delivery fee in KWD. */
    const DELIVERY_FEE = 2.0;

    /** PLA density g/cm³. */
    const MATERIAL_DENSITY = 1.24;

    /** Minutes per gram of material. */
    const MINUTES_PER_GRAM = 2.5;

    /*--------------------------------------------------------------
     * SINGLETON
     *------------------------------------------------------------*/

    public static function instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->register_hooks();
    }

    private function register_hooks() {
        add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
        add_action( 'admin_notices', array( $this, 'admin_notice' ) );
    }

    /*--------------------------------------------------------------
     * TABLE NAME
     *------------------------------------------------------------*/

    public static function table_name() {
        global $wpdb;
        return $wpdb->prefix . 'creality_print_jobs';
    }

    /*--------------------------------------------------------------
     * 1. ACTIVATION — Create Table
     *------------------------------------------------------------*/

    public static function activate() {
        global $wpdb;

        $table           = self::table_name();
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE {$table} (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT(20) UNSIGNED NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            width_mm DECIMAL(10,2) NOT NULL DEFAULT 0,
            height_mm DECIMAL(10,2) NOT NULL DEFAULT 0,
            depth_mm DECIMAL(10,2) NOT NULL DEFAULT 0,
            volume_cm3 DECIMAL(10,2) NOT NULL DEFAULT 0,
            material_grams DECIMAL(10,2) NOT NULL DEFAULT 0,
            estimated_time_minutes INT UNSIGNED NOT NULL DEFAULT 0,
            printer_match VARCHAR(500) DEFAULT NULL,
            material_cost DECIMAL(10,3) NOT NULL DEFAULT 0,
            processing_cost DECIMAL(10,3) NOT NULL DEFAULT 0,
            delivery_cost DECIMAL(10,3) NOT NULL DEFAULT 0,
            total_cost DECIMAL(10,3) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY idx_user_id (user_id)
        ) {$charset_collate};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );

        update_option( self::OPT_PREFIX . 'db_version', self::DB_VERSION );

        // Create uploads sub-directory for 3D files.
        $upload_dir = self::get_upload_dir();
        if ( ! file_exists( $upload_dir ) ) {
            wp_mkdir_p( $upload_dir );
            // Add index.php to prevent directory listing.
            file_put_contents( $upload_dir . '/index.php', '<?php // Silence is golden.' );
            // Add .htaccess to block direct access.
            file_put_contents( $upload_dir . '/.htaccess', "Order deny,allow\nDeny from all" );
        }
    }

    public static function deactivate() {
        // Data and files persist on deactivation.
    }

    /**
     * Get the dedicated upload directory for 3D model files.
     *
     * @return string Absolute path.
     */
    private static function get_upload_dir() {
        $upload = wp_upload_dir();
        return trailingslashit( $upload['basedir'] ) . 'creality-3d-models';
    }

    /*--------------------------------------------------------------
     * 2. REST API
     *------------------------------------------------------------*/

    public function register_rest_routes() {
        register_rest_route( 'creality-print/v1', '/analyze', array(
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => array( $this, 'api_analyze' ),
            'permission_callback' => array( $this, 'api_check_auth' ),
        ) );
    }

    /**
     * Permission: user must be logged in.
     *
     * @return bool|WP_Error
     */
    public function api_check_auth() {
        if ( ! is_user_logged_in() ) {
            return new WP_Error(
                'rest_not_logged_in',
                __( 'You must be logged in to use the print estimator.', 'creality-print-estimator' ),
                array( 'status' => 401 )
            );
        }
        return true;
    }

    /*--------------------------------------------------------------
     * 3. POST /analyze — Main Endpoint
     *------------------------------------------------------------*/

    /**
     * Handle file upload, analyze, calculate costs, save job, return result.
     *
     * @param WP_REST_Request $request Incoming request.
     * @return WP_REST_Response|WP_Error
     */
    public function api_analyze( WP_REST_Request $request ) {
        global $wpdb;

        /*--- Validate file presence ---*/
        $files = $request->get_file_params();
        if ( empty( $files['file'] ) ) {
            return new WP_Error(
                'missing_file',
                __( 'No file uploaded. Please provide an STL or OBJ file.', 'creality-print-estimator' ),
                array( 'status' => 400 )
            );
        }

        $file = $files['file'];

        /*--- Validate upload error ---*/
        if ( $file['error'] !== UPLOAD_ERR_OK ) {
            return new WP_Error(
                'upload_error',
                __( 'File upload failed. Please try again.', 'creality-print-estimator' ),
                array( 'status' => 400 )
            );
        }

        /*--- Validate file size ---*/
        if ( $file['size'] > self::MAX_UPLOAD_SIZE ) {
            return new WP_Error(
                'file_too_large',
                __( 'File exceeds the 50 MB size limit.', 'creality-print-estimator' ),
                array( 'status' => 400 )
            );
        }

        /*--- Validate extension ---*/
        $ext = strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) );
        if ( ! in_array( $ext, self::ALLOWED_EXTENSIONS, true ) ) {
            return new WP_Error(
                'invalid_file_type',
                __( 'Only .stl and .obj files are accepted.', 'creality-print-estimator' ),
                array( 'status' => 400 )
            );
        }

        /*--- Sanitize filename ---*/
        $safe_name = sanitize_file_name( $file['name'] );
        $unique_name = wp_unique_filename( self::get_upload_dir(), $safe_name );
        $dest_path = trailingslashit( self::get_upload_dir() ) . $unique_name;

        /*--- Move file ---*/
        if ( ! move_uploaded_file( $file['tmp_name'], $dest_path ) ) {
            return new WP_Error(
                'move_failed',
                __( 'Failed to save uploaded file.', 'creality-print-estimator' ),
                array( 'status' => 500 )
            );
        }

        /*--- Analyze model ---*/
        $analysis = self::analyze_model( $dest_path );

        /*--- Find compatible printers ---*/
        $compatible = self::match_printers(
            $analysis['width_mm'],
            $analysis['height_mm'],
            $analysis['depth_mm']
        );

        /*--- Calculate costs ---*/
        $costs = self::calculate_costs( $analysis['material_grams'] );

        /*--- Save to database ---*/
        $user_id = get_current_user_id();
        $table   = self::table_name();

        $printer_names = array_map( function ( $p ) {
            return $p['name'];
        }, $compatible );

        $wpdb->insert(
            $table,
            array(
                'user_id'                => $user_id,
                'file_name'              => $safe_name,
                'file_path'              => $dest_path,
                'width_mm'               => $analysis['width_mm'],
                'height_mm'              => $analysis['height_mm'],
                'depth_mm'               => $analysis['depth_mm'],
                'volume_cm3'             => $analysis['volume_cm3'],
                'material_grams'         => $analysis['material_grams'],
                'estimated_time_minutes' => $analysis['estimated_time_minutes'],
                'printer_match'          => implode( ', ', $printer_names ),
                'material_cost'          => $costs['material_cost'],
                'processing_cost'        => $costs['processing_cost'],
                'delivery_cost'          => $costs['delivery_cost'],
                'total_cost'             => $costs['total_cost'],
                'created_at'             => current_time( 'mysql' ),
            ),
            array(
                '%d', '%s', '%s',
                '%f', '%f', '%f', '%f', '%f', '%d',
                '%s', '%f', '%f', '%f', '%f', '%s',
            )
        );

        if ( ! $wpdb->insert_id ) {
            return new WP_Error(
                'db_error',
                __( 'Failed to save print job.', 'creality-print-estimator' ),
                array( 'status' => 500 )
            );
        }

        $job_id = $wpdb->insert_id;

        /*--- Format response ---*/
        $response_printers = array_map( function ( $p ) {
            return array(
                'id'         => $p['id'],
                'name'       => $p['name'],
                'build_volume' => sprintf( '%d×%d×%d mm', $p['width'], $p['height'], $p['depth'] ),
            );
        }, $compatible );

        return new WP_REST_Response(
            array(
                'success' => true,
                'data'    => array(
                    'job_id'     => $job_id,
                    'file_name'  => $safe_name,
                    'dimensions' => array(
                        'width'  => round( $analysis['width_mm'], 2 ),
                        'height' => round( $analysis['height_mm'], 2 ),
                        'depth'  => round( $analysis['depth_mm'], 2 ),
                    ),
                    'volume_cm3'             => round( $analysis['volume_cm3'], 2 ),
                    'material_grams'         => round( $analysis['material_grams'], 2 ),
                    'estimated_time_minutes' => $analysis['estimated_time_minutes'],
                    'estimated_time_display' => self::format_time( $analysis['estimated_time_minutes'] ),
                    'compatible_printers'    => $response_printers,
                    'breakdown'              => array(
                        'material_cost'   => round( $costs['material_cost'], 3 ),
                        'processing_cost' => round( $costs['processing_cost'], 3 ),
                        'delivery_cost'   => round( $costs['delivery_cost'], 3 ),
                        'total_cost'      => round( $costs['total_cost'], 3 ),
                        'currency'        => 'KWD',
                    ),
                ),
            ),
            200
        );
    }

    /*--------------------------------------------------------------
     * 4. MOCK ANALYSIS ENGINE
     *------------------------------------------------------------*/

    /**
     * Analyze a 3D model file.
     *
     * Phase 1: mock analysis with realistic random values.
     * Phase 2: will integrate actual slicer API.
     *
     * @param string $file_path Absolute path to the uploaded file.
     * @return array Analysis results.
     */
    private static function analyze_model( $file_path ) {
        // Use file size as seed for repeatable "random" values per file.
        $file_size = filesize( $file_path );
        $seed      = crc32( basename( $file_path ) . $file_size );
        mt_srand( $seed );

        // Generate realistic bounding box (10–350 mm per axis).
        $width_mm  = mt_rand( 1000, 35000 ) / 100;  // 10.00 – 350.00
        $height_mm = mt_rand( 1000, 35000 ) / 100;
        $depth_mm  = mt_rand( 500, 30000 )  / 100;   // 5.00 – 300.00

        // Volume: bounding box volume × fill ratio (20–45% is typical for 3D prints).
        $bbox_volume_mm3 = $width_mm * $height_mm * $depth_mm;
        $fill_ratio      = mt_rand( 20, 45 ) / 100;
        $volume_mm3      = $bbox_volume_mm3 * $fill_ratio;
        $volume_cm3      = $volume_mm3 / 1000;

        // Material weight.
        $material_grams = $volume_cm3 * self::MATERIAL_DENSITY;

        // Estimated print time.
        $estimated_time_minutes = (int) ceil( $material_grams * self::MINUTES_PER_GRAM );

        // Reset random seed.
        mt_srand();

        return array(
            'width_mm'               => $width_mm,
            'height_mm'              => $height_mm,
            'depth_mm'               => $depth_mm,
            'volume_cm3'             => $volume_cm3,
            'material_grams'         => $material_grams,
            'estimated_time_minutes' => $estimated_time_minutes,
        );
    }

    /*--------------------------------------------------------------
     * 5. PRINTER COMPATIBILITY
     *------------------------------------------------------------*/

    /**
     * Find printers whose build volume can accommodate the model.
     *
     * @param float $w Model width in mm.
     * @param float $h Model height in mm.
     * @param float $d Model depth in mm.
     * @return array Compatible printer specs.
     */
    private static function match_printers( $w, $h, $d ) {
        $compatible = array();
        foreach ( self::get_printers() as $printer ) {
            // Model fits if each dimension is within the printer's build volume.
            // Check all axis permutations would be complex; for simplicity,
            // check if sorted dimensions fit sorted build volume.
            $model_dims   = array( $w, $h, $d );
            $printer_dims = array( $printer['width'], $printer['height'], $printer['depth'] );
            sort( $model_dims );
            sort( $printer_dims );

            if (
                $model_dims[0] <= $printer_dims[0] &&
                $model_dims[1] <= $printer_dims[1] &&
                $model_dims[2] <= $printer_dims[2]
            ) {
                $compatible[] = $printer;
            }
        }
        return $compatible;
    }

    /*--------------------------------------------------------------
     * 6. COST CALCULATION
     *------------------------------------------------------------*/

    /**
     * Calculate job cost breakdown.
     *
     * @param float $material_grams Weight in grams.
     * @return array Cost breakdown.
     */
    private static function calculate_costs( $material_grams ) {
        $material_cost   = $material_grams * self::MATERIAL_COST_PER_GRAM;
        $processing_cost = self::PROCESSING_FEE;
        $delivery_cost   = self::DELIVERY_FEE;
        $total_cost      = $material_cost + $processing_cost + $delivery_cost;

        return array(
            'material_cost'   => $material_cost,
            'processing_cost' => $processing_cost,
            'delivery_cost'   => $delivery_cost,
            'total_cost'      => $total_cost,
        );
    }

    /*--------------------------------------------------------------
     * 7. HELPERS
     *------------------------------------------------------------*/

    /**
     * Format minutes into a human-readable string.
     *
     * @param int $minutes Total minutes.
     * @return string e.g. "2h 30m".
     */
    private static function format_time( $minutes ) {
        if ( $minutes < 60 ) {
            return $minutes . 'm';
        }
        $hours = floor( $minutes / 60 );
        $mins  = $minutes % 60;
        return $mins > 0
            ? sprintf( '%dh %dm', $hours, $mins )
            : sprintf( '%dh', $hours );
    }

    /*--------------------------------------------------------------
     * 8. ADMIN NOTICE
     *------------------------------------------------------------*/

    public function admin_notice() {
        if ( ! class_exists( 'WooCommerce' ) ) {
            echo '<div class="notice notice-error"><p>';
            esc_html_e(
                'Creality 3D Print Estimator requires WooCommerce to be installed and activated.',
                'creality-print-estimator'
            );
            echo '</p></div>';
        }
    }
}

/*==============================================================
 * LIFECYCLE HOOKS
 *============================================================*/
register_activation_hook( __FILE__, array( 'Creality_Print_Estimator', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Creality_Print_Estimator', 'deactivate' ) );

/*==============================================================
 * BOOT
 *============================================================*/
add_action( 'plugins_loaded', function () {
    Creality_Print_Estimator::instance();
} );

/*==============================================================
 * ALLOW STL/OBJ UPLOADS IN WORDPRESS
 *============================================================*/
add_filter( 'upload_mimes', function ( $mimes ) {
    $mimes['stl'] = 'application/sla';
    $mimes['obj'] = 'text/plain';
    return $mimes;
} );
