/*globals window, document, $, jQuery, _, Backbone */
(function ($, _, Backbone) {
	"use strict";
	var media = wp.media,

	ThingDetailsController = media.controller.State.extend({
		defaults: {
			id: 'thing-details',
			title: 'Thing Details!',
			toolbar: 'thing-details',
			content: 'thing-details',
			menu: 'thing-details',
			router: false,
			priority: 60
		},

		initialize: function( options ) {
			this.thing = options.thing;
			media.controller.State.prototype.initialize.apply( this, arguments );
		}
	}),

	ThingTooController = media.controller.State.extend({
		defaults: {
			id: 'thing-too',
			title: 'Thing Too!',
			router: false,
			priority: 60,
			toolbar: 'thing-too',
			content: 'thing-too',
			menu: 'thing-details'
		},

		initialize: function( options ) {
			this.thing = options.thing;
			media.controller.State.prototype.initialize.apply( this, arguments );
		}
	}),

	ThingDetailsView = media.view.Settings.AttachmentDisplay.extend({
		className: 'thing-details',
		template:  media.template( 'thing-details' ),
		prepare: function() {
			return _.defaults( {
				model: this.model.toJSON()
			}, this.options );
		}
	}),

	ThingTooView = media.view.Settings.AttachmentDisplay.extend({
		className: 'thing-too',
		template:  media.template( 'thing-too' ),
		prepare: function() {
			return _.defaults( {
				model: this.model.toJSON()
			}, this.options );
		}
	}),

	ThingDetailsFrame = media.view.MediaFrame.Select.extend({
		defaults: {
			id:      'thing',
			url:     '',
			type:    'link',
			title:   'Thing!',
			priority: 120
		},

		initialize: function( options ) {
			this.thing = new Backbone.Model( options.metadata );
			this.options.selection = new media.model.Selection( this.thing.attachment, { multiple: false } );
			media.view.MediaFrame.Select.prototype.initialize.apply( this, arguments );
		},

		bindHandlers: function() {
			media.view.MediaFrame.Select.prototype.bindHandlers.apply( this, arguments );

			this.on( 'menu:create:thing-details', this.createMenu, this );
			this.on( 'content:render:thing-details', this.contentDetailsRender, this );
			this.on( 'content:render:thing-too', this.contentTooRender, this );
			this.on( 'menu:render:thing-details', this.menuRender, this );
			this.on( 'toolbar:render:thing-details', this.toolbarRender, this );
			this.on( 'toolbar:render:thing-too', this.toolbarTooRender, this );
		},

		contentDetailsRender: function() {
			var view = new ThingDetailsView({
				controller: this,
				model: this.state().thing,
				attachment: this.state().thing.attachment
			}).render();

			this.content.set( view );
		},

		contentTooRender: function() {
			var view = new ThingTooView({
				controller: this,
				model: this.thing,
				attachment: this.thing.attachment
			}).render();

			this.content.set( view );
		},

		menuRender: function( view ) {
			var lastState = this.lastState(),
				previous = lastState && lastState.id,
				frame = this;

			view.set({
				cancel: {
					text: 'Cancel!',
					priority: 20,
					click: function() {
						if ( previous ) {
							frame.setState( previous );
						} else {
							frame.close();
						}
					}
				},
				separateCancel: new media.View({
					className: 'separator',
					priority: 40
				})
			});
		},

		toolbarRender: function() {
			this.toolbar.set( new media.view.Toolbar({
				controller: this,
				items: {
					button: {
						style:    'primary',
						text:     'Update Thing!',
						priority: 80,
						click:    function() {
							var controller = this.controller;
							controller.close();
							controller.state().trigger( 'update', controller.thing.toJSON() );
							controller.setState( controller.options.state );
							controller.reset();
						}
					}
				}
			}) );
		},

		toolbarTooRender: function() {
			this.toolbar.set( new media.view.Toolbar({
				controller: this,
				items: {
					button: {
						style:    'primary',
						text:     'Update Thing Too!',
						priority: 80,
						click:    function() {
							var controller = this.controller;
							controller.state().trigger( 'thing-too', controller.thing.toJSON() );
							controller.setState( controller.options.state );
							controller.reset();
						}
					}
				}
			}) );
		},

		createStates: function() {
			this.states.add([
				new ThingDetailsController( {
					thing: this.thing
				} ),

				new ThingTooController( {
					thing: this.thing
				} )
			]);
		}
	}),

	thing = {
		coerce : media.coerce,

		defaults : {
			name : '',
			color : ''
		},

		edit : function ( data ) {
			var frame, shortcode = wp.shortcode.next( 'thing', data ).shortcode;
			frame = new ThingDetailsFrame({
				frame: 'thing',
				state: 'thing-details',
				metadata: _.defaults( shortcode.attrs.named, thing.defaults )
			});

			return frame;
		},

		shortcode : function( model ) {
			var self = this, content;

			_.each( thing.defaults, function( value, key ) {
				model[ key ] = self.coerce( model, key );

				if ( value === model[ key ] ) {
					delete model[ key ];
				}
			});

			content = model.content;
			delete model.content;

			return new wp.shortcode({
				tag: 'thing',
				attrs: model,
				content: content
			});
		}
	},

	thingMce = {
		toView:  function( content ) {
			var match = wp.shortcode.next( 'thing', content );

			if ( ! match ) {
				return;
			}

			return {
				index:   match.index,
				content: match.content,
				options: {
					shortcode: match.shortcode
				}
			};
		},
		View: wp.mce.View.extend({
			className: 'editor-thing',
			template:  media.template( 'editor-thing' ),
			initialize: function( options ) {
				this.shortcode = options.shortcode;
			},
			getHtml: function() {
				return this.template( _.defaults(
					this.shortcode.attrs.named,
					thing.defaults
				) );
			}
		}),

		edit: function( node ) {
			var self = this, frame, data;

			data = window.decodeURIComponent( $( node ).attr('data-wpview-text') );
			frame = thing.edit( data );
			frame.state('thing-details').on( 'update', function( selection ) {
				var shortcode = thing.shortcode( selection ).string();
				$( node ).attr( 'data-wpview-text', window.encodeURIComponent( shortcode ) );
				wp.mce.views.refreshView( self, shortcode );
				frame.detach();
			});
			frame.open();
		}
	};
	wp.mce.views.register( 'thing', thingMce );

}(jQuery, _, Backbone));