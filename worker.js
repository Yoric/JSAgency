var object;

self.onmessage = function(aInitCode) {
    var queue = []; //Handle messages that may have been received while initializing
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
	    //Note: we rely on the fact that we can only ever handle one message
	    //at a time
	} catch(ex) {
	    self.postMessage({error: ex, id: id})
	}
    }
    self.onmessage = handleMessage;
    for each(msg in queue) {
	handleMessage(msg);
    }
    queue = null;
}