<?php
/**
 * Plugin Name: Creality CMS
 * Plugin URI:  https://creality.com.kw
 * Description: Lightweight CMS controls for dynamic Next.js frontend content.
 * Version:     1.0.0
 * Author:      Creality Kuwait
 * Author URI:  https://creality.com.kw
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Text Domain: creality-cms
 *
 * @package Creality_CMS
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class Creality_CMS {

	/** Plugin version. */
	const VERSION = '1.0.0';

	/** Main menu slug. */
	const MENU_SLUG = 'creality-cms';

	/** Settings nonce action. */
	const NONCE_ACTION = 'creality_cms_save_popup';

	/** @var self|null */
	private static $instance = null;

	/**
	 * Get singleton instance.
	 *
	 * @return self
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		$this->register_hooks();
	}

	/**
	 * Register WordPress hooks.
	 *
	 * @return void
	 */
	private function register_hooks() {
		add_action( 'admin_menu', array( $this, 'register_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_action( 'admin_init', array( $this, 'handle_popup_form_submission' ) );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register admin menu and submenu.
	 *
	 * @return void
	 */
	public function register_admin_menu() {
		add_menu_page(
			__( 'Creality CMS', 'creality-cms' ),
			__( 'Creality CMS', 'creality-cms' ),
			'manage_options',
			self::MENU_SLUG,
			array( $this, 'render_popup_settings_page' ),
			'dashicons-admin-generic',
			2
		);

		add_submenu_page(
			self::MENU_SLUG,
			__( 'Homepage Popup', 'creality-cms' ),
			__( 'Homepage Popup', 'creality-cms' ),
			'manage_options',
			self::MENU_SLUG,
			array( $this, 'render_popup_settings_page' )
		);
	}

	/**
	 * Enqueue admin assets for the popup settings page only.
	 *
	 * @param string $hook_suffix Current admin page hook.
	 * @return void
	 */
	public function enqueue_admin_assets( $hook_suffix ) {
		if ( 'toplevel_page_' . self::MENU_SLUG !== $hook_suffix ) {
			return;
		}

		wp_enqueue_media();
		wp_enqueue_style( 'common' );
		wp_add_inline_style( 'common', $this->get_admin_styles() );
		wp_add_inline_script( 'jquery-core', $this->get_admin_script() );
	}

	/**
	 * Handle popup settings save.
	 *
	 * @return void
	 */
	public function handle_popup_form_submission() {
		if ( ! is_admin() ) {
			return;
		}

		if ( ! isset( $_POST['creality_cms_action'] ) || 'save_popup_settings' !== wp_unslash( $_POST['creality_cms_action'] ) ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to manage these settings.', 'creality-cms' ) );
		}

		check_admin_referer( self::NONCE_ACTION );

		$enabled     = isset( $_POST['creality_popup_enabled'] ) ? '1' : '0';
		$title       = isset( $_POST['creality_popup_title'] ) ? sanitize_text_field( wp_unslash( $_POST['creality_popup_title'] ) ) : '';
		$description = isset( $_POST['creality_popup_description'] ) ? sanitize_textarea_field( wp_unslash( $_POST['creality_popup_description'] ) ) : '';
		$image       = isset( $_POST['creality_popup_image'] ) ? esc_url_raw( wp_unslash( $_POST['creality_popup_image'] ) ) : '';
		$button_text = isset( $_POST['creality_popup_button_text'] ) ? sanitize_text_field( wp_unslash( $_POST['creality_popup_button_text'] ) ) : '';
		$button_link = isset( $_POST['creality_popup_button_link'] ) ? sanitize_text_field( wp_unslash( $_POST['creality_popup_button_link'] ) ) : '';

		update_option( 'creality_popup_enabled', $enabled );
		update_option( 'creality_popup_title', $title );
		update_option( 'creality_popup_description', $description );
		update_option( 'creality_popup_image', $image );
		update_option( 'creality_popup_button_text', $button_text );
		update_option( 'creality_popup_button_link', $button_link );

		$redirect_url = add_query_arg(
			array(
				'page'    => self::MENU_SLUG,
				'updated' => '1',
			),
			admin_url( 'admin.php' )
		);

		wp_safe_redirect( $redirect_url );
		exit;
	}

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			'creality/v1',
			'/popup',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'rest_get_popup_settings' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * REST callback for popup settings.
	 *
	 * @return WP_REST_Response
	 */
	public function rest_get_popup_settings() {
		return new WP_REST_Response( $this->get_popup_settings(), 200 );
	}

	/**
	 * Get popup settings with safe defaults.
	 *
	 * @return array<string,mixed>
	 */
	private function get_popup_settings() {
		return array(
			'enabled'     => '1' === get_option( 'creality_popup_enabled', '0' ),
			'title'       => (string) get_option( 'creality_popup_title', '' ),
			'description' => (string) get_option( 'creality_popup_description', '' ),
			'image'       => esc_url_raw( (string) get_option( 'creality_popup_image', '' ) ),
			'button_text' => (string) get_option( 'creality_popup_button_text', '' ),
			'button_link' => (string) get_option( 'creality_popup_button_link', '' ),
		);
	}

	/**
	 * Render the popup settings page.
	 *
	 * @return void
	 */
	public function render_popup_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'creality-cms' ) );
		}

		$settings = $this->get_popup_settings();
		?>
		<div class="wrap creality-cms-admin">
			<div class="creality-cms-shell">
				<div class="creality-cms-header">
					<div>
						<h1><?php echo esc_html__( 'Homepage Popup Settings', 'creality-cms' ); ?></h1>
						<p><?php echo esc_html__( 'Manage the homepage popup content shown on the Next.js frontend.', 'creality-cms' ); ?></p>
					</div>
					<div class="creality-cms-header-actions">
						<button type="submit" form="creality-cms-popup-form" class="button button-primary button-large">
							<?php echo esc_html__( 'Save Settings', 'creality-cms' ); ?>
						</button>
					</div>
				</div>

				<?php if ( isset( $_GET['updated'] ) && '1' === sanitize_text_field( wp_unslash( $_GET['updated'] ) ) ) : ?>
					<div class="notice notice-success is-dismissible creality-cms-notice">
						<p><?php echo esc_html__( 'Homepage popup settings saved successfully.', 'creality-cms' ); ?></p>
					</div>
				<?php endif; ?>

				<form id="creality-cms-popup-form" method="post" action="">
					<?php wp_nonce_field( self::NONCE_ACTION ); ?>
					<input type="hidden" name="creality_cms_action" value="save_popup_settings" />

					<div class="creality-cms-card">
						<div class="creality-cms-card-header">
							<h2><?php echo esc_html__( 'Popup Content', 'creality-cms' ); ?></h2>
							<p><?php echo esc_html__( 'Update the popup title, description, image, and CTA shown on the homepage.', 'creality-cms' ); ?></p>
						</div>

						<div class="creality-cms-field">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_enabled"><?php echo esc_html__( 'Enable Popup', 'creality-cms' ); ?></label>
								<p><?php echo esc_html__( 'Turn the homepage popup on or off without editing code.', 'creality-cms' ); ?></p>
							</div>
							<label class="creality-cms-switch" for="creality_popup_enabled">
								<input
									type="checkbox"
									id="creality_popup_enabled"
									name="creality_popup_enabled"
									value="1"
									<?php checked( $settings['enabled'] ); ?>
								/>
								<span class="creality-cms-switch-slider" aria-hidden="true"></span>
							</label>
						</div>

						<div class="creality-cms-field">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_title"><?php echo esc_html__( 'Popup Title', 'creality-cms' ); ?></label>
							</div>
							<input
								type="text"
								class="regular-text"
								id="creality_popup_title"
								name="creality_popup_title"
								value="<?php echo esc_attr( $settings['title'] ); ?>"
								placeholder="<?php echo esc_attr__( 'Enter popup title', 'creality-cms' ); ?>"
							/>
						</div>

						<div class="creality-cms-field">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_description"><?php echo esc_html__( 'Popup Description', 'creality-cms' ); ?></label>
							</div>
							<textarea
								id="creality_popup_description"
								name="creality_popup_description"
								rows="5"
								class="large-text"
								placeholder="<?php echo esc_attr__( 'Enter popup description', 'creality-cms' ); ?>"
							><?php echo esc_textarea( $settings['description'] ); ?></textarea>
						</div>

						<div class="creality-cms-field creality-cms-field-image">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_image"><?php echo esc_html__( 'Popup Image', 'creality-cms' ); ?></label>
								<p><?php echo esc_html__( 'Select an image from the WordPress media library.', 'creality-cms' ); ?></p>
							</div>
							<div class="creality-cms-image-manager">
								<input
									type="url"
									class="large-text"
									id="creality_popup_image"
									name="creality_popup_image"
									value="<?php echo esc_attr( $settings['image'] ); ?>"
									placeholder="<?php echo esc_attr__( 'https://example.com/popup-image.jpg', 'creality-cms' ); ?>"
								/>
								<div class="creality-cms-image-actions">
									<button type="button" class="button creality-cms-upload-button">
										<?php echo esc_html__( 'Choose Image', 'creality-cms' ); ?>
									</button>
									<button type="button" class="button creality-cms-remove-button">
										<?php echo esc_html__( 'Remove Image', 'creality-cms' ); ?>
									</button>
								</div>
								<div class="creality-cms-image-preview-wrap <?php echo empty( $settings['image'] ) ? 'is-empty' : ''; ?>">
									<img
										class="creality-cms-image-preview"
										src="<?php echo esc_url( $settings['image'] ); ?>"
										alt="<?php echo esc_attr__( 'Popup image preview', 'creality-cms' ); ?>"
									/>
									<span class="creality-cms-image-placeholder">
										<?php echo esc_html__( 'No image selected yet.', 'creality-cms' ); ?>
									</span>
								</div>
							</div>
						</div>

						<div class="creality-cms-field">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_button_text"><?php echo esc_html__( 'Button Text', 'creality-cms' ); ?></label>
							</div>
							<input
								type="text"
								class="regular-text"
								id="creality_popup_button_text"
								name="creality_popup_button_text"
								value="<?php echo esc_attr( $settings['button_text'] ); ?>"
								placeholder="<?php echo esc_attr__( 'Explore Now', 'creality-cms' ); ?>"
							/>
						</div>

						<div class="creality-cms-field">
							<div class="creality-cms-field-copy">
								<label for="creality_popup_button_link"><?php echo esc_html__( 'Button Link', 'creality-cms' ); ?></label>
							</div>
							<input
								type="text"
								class="regular-text"
								id="creality_popup_button_link"
								name="creality_popup_button_link"
								value="<?php echo esc_attr( $settings['button_link'] ); ?>"
								placeholder="<?php echo esc_attr__( '/category/3d-printers or https://creality.com.kw/page', 'creality-cms' ); ?>"
							/>
						</div>
					</div>

					<div class="creality-cms-footer-actions">
						<button type="submit" class="button button-primary button-large">
							<?php echo esc_html__( 'Save Settings', 'creality-cms' ); ?>
						</button>
					</div>
				</form>
			</div>
		</div>
		<?php
	}

	/**
	 * Inline admin script.
	 *
	 * @return string
	 */
	private function get_admin_script() {
		return <<<JS
jQuery(function ($) {
	var frame;
	var imageInput = $('#creality_popup_image');
	var previewWrap = $('.creality-cms-image-preview-wrap');
	var previewImage = $('.creality-cms-image-preview');

	function syncPreview(url) {
		if (url) {
			previewImage.attr('src', url);
			previewWrap.removeClass('is-empty');
			return;
		}

		previewImage.attr('src', '');
		previewWrap.addClass('is-empty');
	}

	$('.creality-cms-upload-button').on('click', function (event) {
		event.preventDefault();

		if (frame) {
			frame.open();
			return;
		}

		frame = wp.media({
			title: 'Select Popup Image',
			button: {
				text: 'Use this image'
			},
			library: {
				type: 'image'
			},
			multiple: false
		});

		frame.on('select', function () {
			var attachment = frame.state().get('selection').first().toJSON();
			var imageUrl = attachment.url || '';
			imageInput.val(imageUrl);
			syncPreview(imageUrl);
		});

		frame.open();
	});

	$('.creality-cms-remove-button').on('click', function (event) {
		event.preventDefault();
		imageInput.val('');
		syncPreview('');
	});

	imageInput.on('input change', function () {
		syncPreview($(this).val());
	});

	syncPreview(imageInput.val());
});
JS;
	}

	/**
	 * Inline admin styles.
	 *
	 * @return string
	 */
	private function get_admin_styles() {
		return <<<CSS
.creality-cms-admin {
	max-width: 1200px;
}

.creality-cms-shell {
	padding-top: 20px;
}

.creality-cms-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20px;
	margin-bottom: 20px;
}

.creality-cms-header h1 {
	margin: 0 0 8px;
	font-size: 28px;
	line-height: 1.2;
}

.creality-cms-header p {
	margin: 0;
	color: #50575e;
	font-size: 14px;
}

.creality-cms-header-actions {
	flex-shrink: 0;
}

.creality-cms-card {
	background: #fff;
	border: 1px solid #dcdcde;
	border-radius: 16px;
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
	padding: 24px;
}

.creality-cms-card-header {
	margin-bottom: 8px;
}

.creality-cms-card-header h2 {
	margin: 0 0 6px;
	font-size: 18px;
}

.creality-cms-card-header p {
	margin: 0;
	color: #50575e;
}

.creality-cms-field {
	display: grid;
	grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
	gap: 20px;
	align-items: start;
	padding: 24px 0;
	border-top: 1px solid #f0f0f1;
}

.creality-cms-field:first-of-type {
	border-top: 0;
}

.creality-cms-field-copy label {
	display: block;
	margin-bottom: 6px;
	font-weight: 600;
	font-size: 14px;
}

.creality-cms-field-copy p {
	margin: 0;
	color: #646970;
	font-size: 13px;
	line-height: 1.5;
}

.creality-cms-field input[type="text"],
.creality-cms-field input[type="url"],
.creality-cms-field textarea {
	width: 100%;
	max-width: 100%;
}

.creality-cms-image-manager {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.creality-cms-image-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.creality-cms-image-preview-wrap {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 220px;
	border: 1px dashed #c3c4c7;
	border-radius: 14px;
	background: #f6f7f7;
	overflow: hidden;
}

.creality-cms-image-preview {
	display: block;
	max-width: 100%;
	max-height: 320px;
	object-fit: contain;
}

.creality-cms-image-preview-wrap.is-empty .creality-cms-image-preview {
	display: none;
}

.creality-cms-image-placeholder {
	color: #646970;
	font-size: 13px;
}

.creality-cms-image-preview-wrap:not(.is-empty) .creality-cms-image-placeholder {
	display: none;
}

.creality-cms-switch {
	position: relative;
	display: inline-flex;
	align-items: center;
	width: 54px;
	height: 30px;
}

.creality-cms-switch input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
}

.creality-cms-switch-slider {
	position: absolute;
	inset: 0;
	border-radius: 999px;
	background: #c3c4c7;
	transition: background-color 0.2s ease;
}

.creality-cms-switch-slider::before {
	content: "";
	position: absolute;
	top: 3px;
	left: 3px;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: #fff;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
	transition: transform 0.2s ease;
}

.creality-cms-switch input:checked + .creality-cms-switch-slider {
	background: #2271b1;
}

.creality-cms-switch input:checked + .creality-cms-switch-slider::before {
	transform: translateX(24px);
}

.creality-cms-switch input:focus + .creality-cms-switch-slider {
	box-shadow: 0 0 0 1px #2271b1, 0 0 0 4px rgba(34, 113, 177, 0.15);
}

.creality-cms-footer-actions {
	margin-top: 20px;
}

.creality-cms-notice {
	margin: 0 0 20px;
}

@media (max-width: 782px) {
	.creality-cms-header {
		flex-direction: column;
	}

	.creality-cms-header-actions {
		width: 100%;
	}

	.creality-cms-header-actions .button {
		width: 100%;
		justify-content: center;
	}

	.creality-cms-field {
		grid-template-columns: 1fr;
		gap: 12px;
	}
}
CSS;
	}
}

add_action(
	'plugins_loaded',
	function () {
		Creality_CMS::instance();
	}
);
