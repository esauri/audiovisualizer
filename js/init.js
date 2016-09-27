(function() {

	var sidebar = document.querySelector('.sidebar'),
		content = document.querySelector( '.content' ),
		openbtn = document.getElementById( 'open-button' ),
		closebtn = document.getElementById( 'close-button' ),
		isOpen = false;

	function init() {
		initEvents();
	}

	function initEvents() {
		openbtn.addEventListener( 'click', toggleMenu );
		if( closebtn ) {
			closebtn.addEventListener( 'click', toggleMenu );
		}

		// close the menu element if the target it´s not the menu element or one of its descendants..
		/*content.addEventListener( 'click', function(ev) {
			var target = ev.target;
			if( isOpen && target !== openbtn ) {
				toggleMenu();
			}
		} );*/
	}

	function toggleMenu() {
		if( isOpen ) {
			//classie.remove( $body, 'show-menu' );
			sidebar.classList.remove('show-menu');
		}
		else {
			//classie.add( $body, 'show-menu' );
			sidebar.classList.add('show-menu');
		}
		isOpen = !isOpen;
	}

	init();

})();