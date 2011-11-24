var object;

importScripts("main.js");

Agent.fail = function(aReason) {
    self.postMessage({failure: aReason});
}

self.onmessage = function(aInitCode) {
    var queue = []; //Record messages that may have been received while initializing
    self.onmessage = function(aWaitingInstruction) {
	queue.push(aWaitingInstruction);
    }
    object = eval(aInitCode);//Initialize object
    handleMessage = function(aInstruction) {
	const key = aInstructions.key;
	const args= aInstruction.args;
	const id  = aInstructions.id;
	try {
	    const result = object[key].call(object, args);
	    self.postMessage({result: ex, id: id})
	} catch(ex) {
	    self.postMessage({error: ex, id: id})
	}
    }
    self.onmessage = handleMessage;
    for each(msg in queue) {//Handle waiting messages
	handleMessage(msg);
    }
    queue = null;
}