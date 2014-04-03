<?php
/*
Plugin Name: Example Thing!
Description: How to make a TinyMCE View
Author: wonderboymusic
Author URI: http://profiles.wordpress.org/wonderboymusic/
Version: 0.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

class ExampleThing {
	static $instance;

	public static function get_instance() {
		if ( ! self::$instance instanceof ExampleThing  ) {
			self::$instance = new self;
		}

		return self::$instance;
	}

	private function __construct() {
		add_action( 'load-post.php', array( $this, 'admin_enqueue_scripts' ) );
		add_action( 'load-post-new.php', array( $this, 'admin_enqueue_scripts' ) );
	}

	function admin_enqueue_scripts() {
		add_action( 'admin_footer', array( $this, 'print_templates' ) );
		$src = plugins_url( 'example-thing.js', __FILE__ );
		wp_enqueue_script( 'example-thing', $src, array( 'mce-view' ), false, 1 );
	}

	function print_templates() {
	?>
	<script type="text/html" id="tmpl-thing-details">
		<div class="media-embed">
			<div class="embed-media-settings">
				<label class="setting">
					<span><?php _e( 'Name' ); ?></span>
					<input type="text" data-setting="name" value="{{ data.name }}" />
				</label>
				<label class="setting">
					<span><?php _e( 'Favorite Color' ); ?></span>
					<input type="text" data-setting="color" value="{{ data.color }}" />
				</label>
			</div>
		</div>
	</script>

	<script type="text/html" id="tmpl-thing-too">
		<div class="media-embed">
			<div class="embed-media-settings">
				<p>Name: {{ data.model.name }}<br/>Favorite Color: {{ data.model.color }}</p>
			</div>
		</div>
	</script>

	<script type="text/html" id="tmpl-editor-thing">
		<div class="toolbar">
			<div class="dashicons dashicons-edit edit"></div>
			<div class="dashicons dashicons-no-alt remove"></div>
		</div>
		<p>Name: {{ data.name }}<br/>Favorite Color: {{ data.color }}</p>
	</script>
	<?php
	}
}
ExampleThing::get_instance();
