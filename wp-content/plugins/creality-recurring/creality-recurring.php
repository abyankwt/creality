<?php
/**
 * Plugin Name: Creality Recurring Orders
 * Plugin URI:  https://creality.com.kw
 * Description: Manual recurring order system for WooCommerce. Creates scheduled orders and sends payment links — no automatic billing, no card storage.
 * Version:     1.0.0
 * Author:      Creality Kuwait
 * Author URI:  https://creality.com.kw
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Text Domain: creality-recurring
 *
 * @package Creality_Recurring
 */

// Prevent direct file access.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/*--------------------------------------------------------------
 * Constants
 *------------------------------------------------------------*/
define( 'CREALITY_RECURRING_VERSION', '1.0.0' );
define( 'CREALITY_RECURRING_DB_VERSION', '1.0.0' );
define( 'CREALITY_RECURRING_CRON_HOOK', 'creality_process_recurring_orders' );

/**
 * Get the full subscriptions table name (with WP prefix).
 *
 * @return string
 */
function creality_recurring_table_name() {
    global $wpdb;
    return $wpdb->prefix . 'creality_subscriptions';
}

/*--------------------------------------------------------------
 * 1. ACTIVATION — Create Custom Database Table
 *------------------------------------------------------------*/
register_activation_hook( __FILE__, 'creality_recurring_activate' );

/**
 * Runs on plugin activation.
 * Creates the custom subscriptions table via dbDelta.
 */
function creality_recurring_activate() {
    global $wpdb;

    $table_name      = creality_recurring_table_name();
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE {$table_name} (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT(20) UNSIGNED NOT NULL,
        product_id BIGINT(20) UNSIGNED NOT NULL,
        frequency VARCHAR(10) NOT NULL DEFAULT 'monthly',
        next_billing_date DATETIME NOT NULL,
        status VARCHAR(10) NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY idx_user_id (user_id),
        KEY idx_next_billing_date (next_billing_date),
        KEY idx_status (status)
    ) {$charset_collate};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );

    update_option( 'creality_recurring_db_version', CREALITY_RECURRING_DB_VERSION );

    // Schedule cron if not already scheduled.
    if ( ! wp_next_scheduled( CREALITY_RECURRING_CRON_HOOK ) ) {
        // Schedule for next 2 AM local time.
        $timestamp = creality_recurring_next_2am();
        wp_schedule_event( $timestamp, 'daily', CREALITY_RECURRING_CRON_HOOK );
    }
}

/*--------------------------------------------------------------
 * 2. DEACTIVATION — Unschedule Cron
 *------------------------------------------------------------*/
register_deactivation_hook( __FILE__, 'creality_recurring_deactivate' );

/**
 * Runs on plugin deactivation. Cleans up the cron event.
 */
function creality_recurring_deactivate() {
    $timestamp = wp_next_scheduled( CREALITY_RECURRING_CRON_HOOK );
    if ( $timestamp ) {
        wp_unschedule_event( $timestamp, CREALITY_RECURRING_CRON_HOOK );
    }
}

/*--------------------------------------------------------------
 * 3. CRON SCHEDULING — Ensure cron is registered on every load
 *------------------------------------------------------------*/
add_action( 'init', 'creality_recurring_maybe_schedule_cron' );

/**
 * Re-schedules the cron event if it was missed (e.g. after a restore).
 */
function creality_recurring_maybe_schedule_cron() {
    if ( ! wp_next_scheduled( CREALITY_RECURRING_CRON_HOOK ) ) {
        $timestamp = creality_recurring_next_2am();
        wp_schedule_event( $timestamp, 'daily', CREALITY_RECURRING_CRON_HOOK );
    }
}

/**
 * Calculate the next occurrence of 2:00 AM in the site's timezone.
 *
 * @return int Unix timestamp (UTC).
 */
function creality_recurring_next_2am() {
    $tz   = wp_timezone();
    $now  = new DateTime( 'now', $tz );
    $next = new DateTime( 'today 02:00', $tz );

    // If 2 AM already passed today, schedule for tomorrow.
    if ( $now > $next ) {
        $next->modify( '+1 day' );
    }

    return $next->getTimestamp();
}

/*--------------------------------------------------------------
 * 4. CRON CALLBACK — Process Due Subscriptions
 *------------------------------------------------------------*/
add_action( CREALITY_RECURRING_CRON_HOOK, 'creality_recurring_process_subscriptions' );

/**
 * Main cron handler.
 * Queries due active subscriptions, creates WooCommerce orders,
 * sends payment-link emails, and advances billing dates.
 */
function creality_recurring_process_subscriptions() {
    global $wpdb;

    // Ensure WooCommerce is active.
    if ( ! class_exists( 'WC_Order' ) ) {
        error_log( '[Creality Recurring] WooCommerce is not active. Aborting cron.' );
        return;
    }

    $table = creality_recurring_table_name();
    $now   = current_time( 'mysql' );

    // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
    $subscriptions = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM {$table} WHERE status = %s AND next_billing_date <= %s",
            'active',
            $now
        )
    );

    if ( empty( $subscriptions ) ) {
        return;
    }

    foreach ( $subscriptions as $sub ) {
        try {
            creality_recurring_process_single( $sub );
        } catch ( Exception $e ) {
            error_log(
                sprintf(
                    '[Creality Recurring] Error processing subscription #%d: %s',
                    $sub->id,
                    $e->getMessage()
                )
            );
        }
    }
}

/**
 * Process a single subscription: create order, send email, advance date.
 *
 * @param object $sub Subscription row from the database.
 *
 * @throws Exception On order creation failure.
 */
function creality_recurring_process_single( $sub ) {
    global $wpdb;

    $user = get_user_by( 'ID', $sub->user_id );
    if ( ! $user ) {
        throw new Exception( 'User not found: ' . $sub->user_id );
    }

    $product = wc_get_product( $sub->product_id );
    if ( ! $product || ! $product->is_purchasable() ) {
        throw new Exception( 'Product not purchasable: ' . $sub->product_id );
    }

    /*--- Create WooCommerce Order ---*/
    $order = wc_create_order( array(
        'customer_id' => $sub->user_id,
        'status'      => 'pending',
    ) );

    if ( is_wp_error( $order ) ) {
        throw new Exception( 'Order creation failed: ' . $order->get_error_message() );
    }

    // Add product line item.
    $order->add_product( $product, 1 );

    // Set billing address from user meta.
    $billing_fields = array(
        'first_name', 'last_name', 'company', 'address_1', 'address_2',
        'city', 'state', 'postcode', 'country', 'email', 'phone',
    );
    foreach ( $billing_fields as $field ) {
        $value = get_user_meta( $sub->user_id, 'billing_' . $field, true );
        if ( $value ) {
            $setter = "set_billing_{$field}";
            if ( is_callable( array( $order, $setter ) ) ) {
                $order->$setter( $value );
            }
        }
    }

    // Set shipping address from user meta.
    $shipping_fields = array(
        'first_name', 'last_name', 'company', 'address_1', 'address_2',
        'city', 'state', 'postcode', 'country',
    );
    foreach ( $shipping_fields as $field ) {
        $value = get_user_meta( $sub->user_id, 'shipping_' . $field, true );
        if ( $value ) {
            $setter = "set_shipping_{$field}";
            if ( is_callable( array( $order, $setter ) ) ) {
                $order->$setter( $value );
            }
        }
    }

    // Tag the order so it can be identified later.
    $order->add_meta_data( '_creality_subscription_id', $sub->id, true );
    $order->add_meta_data( '_creality_recurring_order', 'yes', true );

    $order->calculate_totals();
    $order->save();

    // Add a note.
    $order->add_order_note(
        sprintf(
            'Auto-generated recurring order from subscription #%d (%s).',
            $sub->id,
            $sub->frequency
        )
    );

    /*--- Generate Payment URL ---*/
    $payment_url = $order->get_checkout_payment_url();

    /*--- Send Email ---*/
    creality_recurring_send_payment_email( $user, $order, $product, $payment_url );

    /*--- Advance next_billing_date ---*/
    $table    = creality_recurring_table_name();
    $next_raw = $sub->next_billing_date;

    if ( 'weekly' === $sub->frequency ) {
        $next_date = gmdate( 'Y-m-d H:i:s', strtotime( $next_raw . ' +7 days' ) );
    } else {
        $next_date = gmdate( 'Y-m-d H:i:s', strtotime( $next_raw . ' +1 month' ) );
    }

    $wpdb->update(
        $table,
        array(
            'next_billing_date' => $next_date,
            'updated_at'        => current_time( 'mysql' ),
        ),
        array( 'id' => $sub->id ),
        array( '%s', '%s' ),
        array( '%d' )
    );

    error_log(
        sprintf(
            '[Creality Recurring] Subscription #%d → Order #%d created. Next billing: %s',
            $sub->id,
            $order->get_id(),
            $next_date
        )
    );
}

/*--------------------------------------------------------------
 * 5. EMAIL — Payment Link Notification
 *------------------------------------------------------------*/

/**
 * Send the recurring-order payment email.
 *
 * @param WP_User    $user        The customer.
 * @param WC_Order   $order       The newly created order.
 * @param WC_Product $product     The subscription product.
 * @param string     $payment_url Checkout payment URL.
 */
function creality_recurring_send_payment_email( $user, $order, $product, $payment_url ) {

    $to      = $user->user_email;
    $subject = __( 'Your Recurring Order is Ready — Creality Kuwait', 'creality-recurring' );

    $product_name = $product->get_name();
    $order_number = $order->get_order_number();
    $order_total  = $order->get_formatted_order_total();
    $first_name   = $user->first_name ? $user->first_name : $user->display_name;

    $body = creality_recurring_email_template(
        $first_name,
        $product_name,
        $order_number,
        $order_total,
        $payment_url
    );

    // Set HTML content type for this email.
    add_filter( 'wp_mail_content_type', 'creality_recurring_html_content_type' );

    $headers = array( 'From: Creality Kuwait <noreply@creality.com.kw>' );

    $sent = wp_mail( $to, $subject, $body, $headers );

    // Remove the filter immediately to avoid affecting other emails.
    remove_filter( 'wp_mail_content_type', 'creality_recurring_html_content_type' );

    if ( ! $sent ) {
        error_log( '[Creality Recurring] Failed to send email to: ' . $to );
    }
}

/**
 * Return text/html content type for wp_mail.
 *
 * @return string
 */
function creality_recurring_html_content_type() {
    return 'text/html';
}

/**
 * Generate the HTML email body.
 *
 * @param string $first_name   Customer first name.
 * @param string $product_name Product name.
 * @param string $order_number Order number.
 * @param string $order_total  Formatted order total.
 * @param string $payment_url  Payment URL.
 *
 * @return string HTML email body.
 */
function creality_recurring_email_template( $first_name, $product_name, $order_number, $order_total, $payment_url ) {
    // Escape all dynamic values for HTML output.
    $first_name   = esc_html( $first_name );
    $product_name = esc_html( $product_name );
    $order_number = esc_html( $order_number );
    $order_total  = wp_kses_post( $order_total );
    $payment_url  = esc_url( $payment_url );

    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Recurring Order is Ready</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:30px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td style="background-color:#1a1a2e;padding:30px 40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Creality Kuwait</h1>
    <p style="color:#a0a0b8;margin:6px 0 0;font-size:13px;">Your Recurring Order</p>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:35px 40px;">
    <p style="color:#333;font-size:16px;margin:0 0 20px;">Hi {$first_name},</p>

    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 25px;">
        A new recurring order has been created for you. Please complete the payment
        at your convenience using the button below.
    </p>

    <!-- Order Details Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:6px;margin-bottom:30px;">
    <tr><td style="padding:20px 25px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td style="color:#777;font-size:13px;padding-bottom:10px;">Product</td>
            <td style="color:#333;font-size:14px;font-weight:600;text-align:right;padding-bottom:10px;">{$product_name}</td>
        </tr>
        <tr>
            <td style="color:#777;font-size:13px;padding-bottom:10px;">Order Number</td>
            <td style="color:#333;font-size:14px;font-weight:600;text-align:right;padding-bottom:10px;">#{$order_number}</td>
        </tr>
        <tr>
            <td style="color:#777;font-size:13px;">Total</td>
            <td style="color:#333;font-size:14px;font-weight:600;text-align:right;">{$order_total}</td>
        </tr>
        </table>
    </td></tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
        <a href="{$payment_url}"
           style="display:inline-block;background-color:#0066ff;color:#ffffff;text-decoration:none;
                  padding:14px 40px;border-radius:6px;font-size:16px;font-weight:600;
                  letter-spacing:0.3px;">
            Pay Now
        </a>
    </td></tr>
    </table>

    <p style="color:#999;font-size:12px;margin-top:25px;line-height:1.5;">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <a href="{$payment_url}" style="color:#0066ff;word-break:break-all;">{$payment_url}</a>
    </p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
    <p style="color:#aaa;font-size:12px;margin:0;">
        &copy; Creality Kuwait. This email was sent because you have an active subscription.
    </p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>
HTML;
}

/*--------------------------------------------------------------
 * 6. REST API ENDPOINTS
 *------------------------------------------------------------*/
add_action( 'rest_api_init', 'creality_recurring_register_routes' );

/**
 * Register all REST API routes for the recurring subscription system.
 */
function creality_recurring_register_routes() {

    $namespace = 'creality/v1';

    // POST /subscribe — Create a new subscription.
    register_rest_route( $namespace, '/subscribe', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'creality_recurring_api_subscribe',
        'permission_callback' => 'creality_recurring_check_auth',
        'args'                => array(
            'product_id' => array(
                'required'          => true,
                'type'              => 'integer',
                'sanitize_callback' => 'absint',
            ),
            'frequency'  => array(
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ( $value ) {
                    return in_array( $value, array( 'weekly', 'monthly' ), true );
                },
            ),
        ),
    ) );

    // GET /subscriptions — List current user's subscriptions.
    register_rest_route( $namespace, '/subscriptions', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'creality_recurring_api_list',
        'permission_callback' => 'creality_recurring_check_auth',
    ) );

    // POST /subscriptions/{id}/pause
    register_rest_route( $namespace, '/subscriptions/(?P<id>\d+)/pause', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'creality_recurring_api_pause',
        'permission_callback' => 'creality_recurring_check_auth',
        'args'                => array(
            'id' => array(
                'required'          => true,
                'type'              => 'integer',
                'sanitize_callback' => 'absint',
            ),
        ),
    ) );

    // POST /subscriptions/{id}/resume
    register_rest_route( $namespace, '/subscriptions/(?P<id>\d+)/resume', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'creality_recurring_api_resume',
        'permission_callback' => 'creality_recurring_check_auth',
        'args'                => array(
            'id' => array(
                'required'          => true,
                'type'              => 'integer',
                'sanitize_callback' => 'absint',
            ),
        ),
    ) );

    // POST /subscriptions/{id}/cancel
    register_rest_route( $namespace, '/subscriptions/(?P<id>\d+)/cancel', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'creality_recurring_api_cancel',
        'permission_callback' => 'creality_recurring_check_auth',
        'args'                => array(
            'id' => array(
                'required'          => true,
                'type'              => 'integer',
                'sanitize_callback' => 'absint',
            ),
        ),
    ) );
}

/*--------------------------------------------------------------
 * 6a. Permission Callback
 *------------------------------------------------------------*/

/**
 * Ensure the request is from a logged-in user.
 *
 * @return bool|WP_Error
 */
function creality_recurring_check_auth() {
    if ( ! is_user_logged_in() ) {
        return new WP_Error(
            'rest_not_logged_in',
            __( 'You must be logged in to access this endpoint.', 'creality-recurring' ),
            array( 'status' => 401 )
        );
    }
    return true;
}

/*--------------------------------------------------------------
 * 6b. POST /subscribe
 *------------------------------------------------------------*/

/**
 * Create a new subscription for the current user.
 *
 * @param WP_REST_Request $request The incoming request.
 *
 * @return WP_REST_Response|WP_Error
 */
function creality_recurring_api_subscribe( WP_REST_Request $request ) {
    global $wpdb;

    $user_id    = get_current_user_id();
    $product_id = $request->get_param( 'product_id' );
    $frequency  = $request->get_param( 'frequency' );

    // Validate product.
    $product = wc_get_product( $product_id );
    if ( ! $product ) {
        return new WP_Error(
            'invalid_product',
            __( 'Product not found.', 'creality-recurring' ),
            array( 'status' => 404 )
        );
    }
    if ( ! $product->is_purchasable() ) {
        return new WP_Error(
            'product_not_purchasable',
            __( 'This product cannot be purchased.', 'creality-recurring' ),
            array( 'status' => 400 )
        );
    }

    // Check for existing active subscription for same product + frequency.
    $table    = creality_recurring_table_name();
    $existing = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE user_id = %d AND product_id = %d AND frequency = %s AND status = %s",
            $user_id,
            $product_id,
            $frequency,
            'active'
        )
    );
    if ( $existing > 0 ) {
        return new WP_Error(
            'duplicate_subscription',
            __( 'You already have an active subscription for this product with the same frequency.', 'creality-recurring' ),
            array( 'status' => 409 )
        );
    }

    // Calculate next billing date.
    $now = current_time( 'mysql' );
    if ( 'weekly' === $frequency ) {
        $next_billing = gmdate( 'Y-m-d H:i:s', strtotime( $now . ' +7 days' ) );
    } else {
        $next_billing = gmdate( 'Y-m-d H:i:s', strtotime( $now . ' +1 month' ) );
    }

    // Insert subscription.
    $inserted = $wpdb->insert(
        $table,
        array(
            'user_id'           => $user_id,
            'product_id'        => $product_id,
            'frequency'         => $frequency,
            'next_billing_date' => $next_billing,
            'status'            => 'active',
            'created_at'        => $now,
            'updated_at'        => $now,
        ),
        array( '%d', '%d', '%s', '%s', '%s', '%s', '%s' )
    );

    if ( false === $inserted ) {
        return new WP_Error(
            'db_error',
            __( 'Failed to create subscription.', 'creality-recurring' ),
            array( 'status' => 500 )
        );
    }

    $subscription_id = $wpdb->insert_id;

    return new WP_REST_Response(
        array(
            'success'      => true,
            'message'      => __( 'Subscription created successfully.', 'creality-recurring' ),
            'subscription' => array(
                'id'                => $subscription_id,
                'user_id'           => $user_id,
                'product_id'        => $product_id,
                'product_name'      => $product->get_name(),
                'frequency'         => $frequency,
                'next_billing_date' => $next_billing,
                'status'            => 'active',
            ),
        ),
        201
    );
}

/*--------------------------------------------------------------
 * 6c. GET /subscriptions
 *------------------------------------------------------------*/

/**
 * List all subscriptions for the current user.
 *
 * @param WP_REST_Request $request The incoming request.
 *
 * @return WP_REST_Response
 */
function creality_recurring_api_list( WP_REST_Request $request ) {
    global $wpdb;

    $user_id = get_current_user_id();
    $table   = creality_recurring_table_name();

    $rows = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM {$table} WHERE user_id = %d ORDER BY created_at DESC",
            $user_id
        )
    );

    $subscriptions = array();
    foreach ( $rows as $row ) {
        $product      = wc_get_product( $row->product_id );
        $product_name = $product ? $product->get_name() : __( '(Deleted product)', 'creality-recurring' );
        $product_img  = $product ? wp_get_attachment_url( $product->get_image_id() ) : '';

        $subscriptions[] = array(
            'id'                => (int) $row->id,
            'product_id'        => (int) $row->product_id,
            'product_name'      => $product_name,
            'product_image'     => $product_img ? $product_img : '',
            'frequency'         => $row->frequency,
            'next_billing_date' => $row->next_billing_date,
            'status'            => $row->status,
            'created_at'        => $row->created_at,
            'updated_at'        => $row->updated_at,
        );
    }

    return new WP_REST_Response(
        array(
            'success'       => true,
            'subscriptions' => $subscriptions,
        ),
        200
    );
}

/*--------------------------------------------------------------
 * 6d. POST /subscriptions/{id}/pause
 *------------------------------------------------------------*/

/**
 * Pause an active subscription.
 *
 * @param WP_REST_Request $request The incoming request.
 *
 * @return WP_REST_Response|WP_Error
 */
function creality_recurring_api_pause( WP_REST_Request $request ) {
    return creality_recurring_transition_status(
        $request->get_param( 'id' ),
        'active',   // Must be in this status.
        'paused'    // Transition to this status.
    );
}

/*--------------------------------------------------------------
 * 6e. POST /subscriptions/{id}/resume
 *------------------------------------------------------------*/

/**
 * Resume a paused subscription.
 *
 * @param WP_REST_Request $request The incoming request.
 *
 * @return WP_REST_Response|WP_Error
 */
function creality_recurring_api_resume( WP_REST_Request $request ) {
    return creality_recurring_transition_status(
        $request->get_param( 'id' ),
        'paused',  // Must be in this status.
        'active'   // Transition to this status.
    );
}

/*--------------------------------------------------------------
 * 6f. POST /subscriptions/{id}/cancel
 *------------------------------------------------------------*/

/**
 * Cancel a subscription (active or paused).
 *
 * @param WP_REST_Request $request The incoming request.
 *
 * @return WP_REST_Response|WP_Error
 */
function creality_recurring_api_cancel( WP_REST_Request $request ) {
    return creality_recurring_transition_status(
        $request->get_param( 'id' ),
        null,         // Any non-cancelled status.
        'cancelled'   // Transition to this status.
    );
}

/*--------------------------------------------------------------
 * 6g. Status Transition Helper
 *------------------------------------------------------------*/

/**
 * Validate ownership and transition a subscription's status.
 *
 * @param int         $subscription_id Subscription ID.
 * @param string|null $required_status Required current status (null = any except target).
 * @param string      $new_status      The target status.
 *
 * @return WP_REST_Response|WP_Error
 */
function creality_recurring_transition_status( $subscription_id, $required_status, $new_status ) {
    global $wpdb;

    $user_id = get_current_user_id();
    $table   = creality_recurring_table_name();

    // Fetch the subscription.
    $sub = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT * FROM {$table} WHERE id = %d",
            $subscription_id
        )
    );

    // Check existence.
    if ( ! $sub ) {
        return new WP_Error(
            'not_found',
            __( 'Subscription not found.', 'creality-recurring' ),
            array( 'status' => 404 )
        );
    }

    // Check ownership.
    if ( (int) $sub->user_id !== $user_id ) {
        return new WP_Error(
            'forbidden',
            __( 'You do not own this subscription.', 'creality-recurring' ),
            array( 'status' => 403 )
        );
    }

    // Check current status allows transition.
    if ( $sub->status === $new_status ) {
        return new WP_Error(
            'invalid_transition',
            /* translators: %s: current status */
            sprintf( __( 'Subscription is already %s.', 'creality-recurring' ), $new_status ),
            array( 'status' => 400 )
        );
    }

    if ( null !== $required_status && $sub->status !== $required_status ) {
        return new WP_Error(
            'invalid_transition',
            sprintf(
                /* translators: 1: required status, 2: current status */
                __( 'Subscription must be %1$s to perform this action. Current status: %2$s.', 'creality-recurring' ),
                $required_status,
                $sub->status
            ),
            array( 'status' => 400 )
        );
    }

    // For cancel, allow from both active and paused.
    if ( 'cancelled' === $new_status && 'cancelled' === $sub->status ) {
        return new WP_Error(
            'already_cancelled',
            __( 'Subscription is already cancelled.', 'creality-recurring' ),
            array( 'status' => 400 )
        );
    }

    // Perform the update.
    $update_data = array(
        'status'     => $new_status,
        'updated_at' => current_time( 'mysql' ),
    );

    // When resuming, recalculate next billing date if it's in the past.
    if ( 'active' === $new_status ) {
        $now = current_time( 'mysql' );
        if ( $sub->next_billing_date < $now ) {
            if ( 'weekly' === $sub->frequency ) {
                $update_data['next_billing_date'] = gmdate( 'Y-m-d H:i:s', strtotime( $now . ' +7 days' ) );
            } else {
                $update_data['next_billing_date'] = gmdate( 'Y-m-d H:i:s', strtotime( $now . ' +1 month' ) );
            }
        }
    }

    $updated = $wpdb->update(
        $table,
        $update_data,
        array( 'id' => $subscription_id ),
        array_fill( 0, count( $update_data ), '%s' ),
        array( '%d' )
    );

    if ( false === $updated ) {
        return new WP_Error(
            'db_error',
            __( 'Failed to update subscription.', 'creality-recurring' ),
            array( 'status' => 500 )
        );
    }

    return new WP_REST_Response(
        array(
            'success' => true,
            'message' => sprintf(
                /* translators: %s: new status */
                __( 'Subscription has been %s.', 'creality-recurring' ),
                $new_status
            ),
            'subscription' => array(
                'id'                => (int) $subscription_id,
                'status'            => $new_status,
                'next_billing_date' => isset( $update_data['next_billing_date'] )
                    ? $update_data['next_billing_date']
                    : $sub->next_billing_date,
                'updated_at'        => $update_data['updated_at'],
            ),
        ),
        200
    );
}

/*--------------------------------------------------------------
 * 7. ADMIN NOTICE — Requires WooCommerce
 *------------------------------------------------------------*/
add_action( 'admin_notices', 'creality_recurring_admin_notice' );

/**
 * Show an admin warning if WooCommerce is not active.
 */
function creality_recurring_admin_notice() {
    if ( ! class_exists( 'WooCommerce' ) ) {
        echo '<div class="notice notice-error"><p>';
        esc_html_e(
            'Creality Recurring Orders requires WooCommerce to be installed and activated.',
            'creality-recurring'
        );
        echo '</p></div>';
    }
}
