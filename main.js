function Agent() {
    this.send = {}
}
Agent.prototype = {
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

/**
 * Create a lightweight agent.
 *
 * All operations on a lightweight agent are executed asynchronously
 * in the main thread. Using lightweight agents is good for improving
 * reactivity but will the performance of the application.
 *
 * @param {Object} aCode An object with the source of the agent.
 * @param {bool?} aStrictness If |true|, all messages and results are passed by
 * source, enforcing the same behavior as with heavyweight agents. If |false|,
 * all messages and results are passed by reference, which is faster but does
 * not enforce separation of agents. If omitted, uses the behavior specified
 * by |Agent.strict|.
 *
 * @return {Agent} The resulting agent.
 */
Agent.light = function(aCode, aStrictness) {
    const strict = (aStrictness === undefined)?this.strict:aStrictness;
    if(strict) {//Enforce pass-by-source
	aCode = eval(aCode.toSource());
    }
    var communicator = new Agent();
    for each(key in Object.keys(aCode)) {
	const k = key;
	result.send[k] = function() {
	    var replier = new Future(communicator);
	    var args;
	    if(strict) {//Enforce pass-by-source
		args = [];
		for(let i = 0; i < arguments.length; ++i) {
		    args[i] = eval(arguments[i].toSource());
		}
	    } else {
		args = arguments;
	    }
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
}

/**
 * If |true|, all messages and results to/from lightweight agents are passed by
 * source, enforcing the same behavior as with heavyweight agents. If |false|,
 * all messages and results are passed by reference, which is faster but does
 * not enforce separation of agents. This can be overridden on a per-agent
 * basis as an argument to |Agent.light|.
 */
Agent.strict = true;

/**
 * Create a heavyweight agent.
 *
 * All operations on a heavyweight agent are executed asynchronously
 * in its own thread. Using heavyweight agents is good for improving
 * speed of the application if your agents perform heavy computations.
 * Note that communications with a heavyweight agent are relatively
 * slow.
 *
 * @param {Object} aCode An object with the source of the agent.
 * @return {Agent} The resulting agent.
 */
Agent.heavy = function(aCode) {
    //TODO:
}

/**
 * Return a new object similar to |Agent|, but with
 * its own main thread
 */
Agent.group = function() {
    //TODO: Can this even be implemented?
}

/**
 * The promise of a future result.
 *
 * You should not need to call the constructor directly.
 */
function Future(aAgent) {
    this._result  = {value: this.NOT_READY, ready:false};
    this._error   = {value: this.NOT_READY, ready:false};
    this._manager = aAgent;
}

Future.prototype = {
    /**
     * A result handler
     *
     * If set, it will be called whenever the call is complete and a
     * result is vailable, with the result as argument. If the result
     * is already available, the handler is triggered immediately.
     *
     * @type {(function(*):* | null)}
     */
    get onresult() {
	return this._onresult;
    },
    set onresult(aCallback) {
	//Trigger the callback immediately if the result is already available
	if(this._result.ready) {
	    var self;
	    setTimeout(function() {
		aCallback.call(self, self._result.value);
	    })
	}
	this._onresult = aCallback;
    },
    _onresult: null,

    /**
     * An error handler
     *
     * If set, it will be called whenever the call is complete and a
     * error is vailable, with the result as argument. If the error
     * is already available, the handler is triggered immediately.
     *
     * @type {(function(Error):* | null)}
     */
    get onerror() {
	return this._onerror;
    },
    set onerror(aCallback) {
	//Trigger the callback immediately if the error is already available
	if(this._error.ready) {
	    var self;
	    setTimeout(function() {
		aCallback.call(self, self._error.value);
	    })
	}
	this._onerror = aCallback;
    },
    _onerror: null,

    /**
     * A reply handler
     *
     * If set, it will be called whenever the call is complete, whether
     * it results in a success or an error. If the result/error
     * is already available, the handler is triggered immediately.
     *
     * To distinguish between a success and an error, the handler is
     * passed as argument either an object |{result: result}| or an
     * object |{error: error}|.
     *
     * @type {(function(Error):* | null)}
     */
    get onreply() {
	return this._onreply;
    },
    set onreply(aCallback) {
	//Trigger the callback immediately if the reply is already available
	var reply;
	if(this._result.ready) {
	    reply = {result: this._result.value}
	} else if(this._error.ready) {
	    reply = {error:  this._error.value}
	}
	if(reply) {
	    var self;
	    setTimeout(function() {
		aCallback.call(self, reply);
	    })
	}
	this._onreply = aCallback;
    },
    _onreply: null,

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
     * @type {Agent|null}
     */
    _manager: null,

    /**
     * A constant returned by |this.error| and |this.result| when they are
     * called before the result is available.
     */
    NOT_READY: {}
}