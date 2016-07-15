define(['./GestureRecognizer'], function(GestureRecognizer){
	/**
	 * @alias SelectionRecognizer
	 * @augments ClickRecognizer
	 * @constructor
	 * @param target {EventTarget} The document element this gesture recognizer observes for mouse and touch events.
	 * @param callback {Function} An An optional function to call when this gesture is recognized. If non-null, the
	 * function is called when this gesture is recognized, and is passed two argument: this gesture recognizer and the event it was originated by.
	 */
	var SelectionRecognizer = function(target, callback) {
		GestureRecognizer.call(this, target, function(){});

		this._callback = callback;

		this._handleSingleClick = this.handleSelectionEvent.bind(this);
		this._handleDoubleClick = this.handleSelectionEvent.bind(this);

		this._target = target;

		target.addEventListener("dblclick", this._handleDoubleClick, false);
		target.addEventListener("click", this._handleSingleClick, false);
	};

	SelectionRecognizer.prototype = Object.create(GestureRecognizer.prototype);

	/**
	 * @inheritDoc
	 */
	SelectionRecognizer.prototype.handleSelectionEvent = function(event) {
		if(this.enabled) {
			this._callback(event);
		}
	};

	SelectionRecognizer.prototype.destroy = function() {
		this._target.removeEventListener("click", this._handleSingleClick);
		this._target.removeEventListener("dblclick", this._handleDoubleClick);
	};

	return SelectionRecognizer;
});