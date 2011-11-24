Agents = {
    /**
     * Create a lightweight agent, executed in the same thread.
     *
     * @param {Object} aCode An object with the source of the agent.
     * @return {Communicator} A communication object for aCode
     */
    light: function(aCode) {
	if(this.strict) {//Enforce pass-by-source
	    aCode = eval(aCode.toSource());
	}
	var communicator = new Communicator();
	for each(key in Object.keys(aCode)) {
	    const k = key;
	    result.send[k] = function() {
		var replier = new Future(communicator);
		var args    = arguments;
		setTimeout(function() {
		    try {
			replier.result = aCode[k].call(aCode, args);
		    } catch(ex) {
			replier.error  = ex;
		    }
		}, 0);
	    }
	}
	return communicator;
    },
    /**
     * Create a heavyweight agent, executed in its own worker
     *
     * @return {Communicator} A communication object
     */
    heavy: function(aCode) {
	//TODO
    },

    /**
     * Create a heavyweight agent shared by several lightweight agents
     *
     * @return {Array.<Communicator>} A communication object
     */
    heavyCombo: function(aCode) {
	//TODO
    },

    /**
     * If true, |light| enforces pass-by-code even for lightweight agents
     */
    strict: true
}

function Communicator() {
    this.send = {}
}
Communicator.prototype = {
    send: null,	//a map map of functions returning a receiver
    fail: function(aReason) {
	this.send = null;//Remove the ability to send messages + permit garbage-collection
	if(this.onfail) {
	    this.onfail.call(this, aReason);
	}
    },
    onreply: null,//Replace this with a function to be informed of all replies
    onresult:null,//Replace this with a function to be informed of all successes
    onerror: null,//Replace this with a function to be informed of all exceptions
    onfail:  null,//Replace this with a function to be informed of all failures
}

function Future(aCommunicator) {
    this._result  = {value: this.NOT_READY};
    this._error   = {value: this.NOT_READY};
    this._manager = aCommunicator;
}
Future.prototype = {
    /**
     * A result handler
     *
     * If set, it will be called whenever the call is complete and a
     * result is vailable, with the result as argument.
     *
     * @type {(function(*):* | null)}
     */
    onresult: null,

    /**
     * An error handler
     *
     * If set, it will be called whenever the call is complete and a
     * result is vailable, with the error as argument.
     *
     * @type {(function(Error):* | null)}
     */
    onerror:  null,

    onreply:  null,

    /**
     * Set the result, trigger the listeners.
     */
    set result(aValue) {
	this._error.value = undefined;
	this._result.value= aValue;
	if(this.onresult) {
	    this.onresult.call(this, aValue);
	}
	if(this.onreply) {
	    this.onreply.call(this, {result: aValue});
	}
	const manager = this._manager;
	if(manager) {
	    if(manager.onresult) {
		manager.onresult.call(this._manager, aValue);
	    }
	    if(manager.onreply) {
		manager.onreply.call(this._manager, {result: aValue});
	    }
	}
    },
    get result() {
	return this._result.value;
    },

    /**
     * Set the error, trigger the listeners.
     */
    set error(aValue) {
	this._result.value = undefined;
	this._error.value= aValue;
	if(this.onerror) {
	    this.onerror.call(this, aValue);
	}
	if(this.onreply) {
	    this.onreply.call(this, {error: aValue});
	}
	const manager = this._manager;
	if(manager) {
	    if(manager.onerror) {
		manager.onerror.call(this._manager, aValue);
	    }
	    if(manager.onreply) {
		manager.onreply.call(this._manager, {error: aValue});
	    }
	}
    },
    get error() {
	return this._error.value;
    },

    /**
     * The result returned by the call, if any
     *
     * @type {{value: *}}
     */
    _result:  null,

    /**
     * The error returned by the call, if any
     *
     * @type {{value: {Error|null}}}
     */
    _error:   null,

    /**
     * The manager.
     *
     * @type {Communicator|null}
     */
    _manager: null,

    /**
     * A constant returned by |this.error| and |this.result| when they are
     * called before the result is available.
     */
    NOT_READY: {}
}