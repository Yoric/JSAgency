A simple library for multi-agent computation in JavaScript
==========================================================

JavaScript offers workers, but they are rather annoying to use.
Dart offers essentially the same model, but with a nicer API.
Erlang offers a more featureful model that also handles errors
and failures. 

The objective of this library is to offer the best of all worlds:
a simple yet powerful model of agents, that can be used both
for asynchronous and multi-threaded computation.

Very much a work in progress.

Example
=======

To create an agent, any simple object [1] will do. For instance

    var myObject = {
      division: function(aNumerator, aDivider) {
        return aNumerator / aDivider;
      }
    }

Transform the agent into an object by passing it to `Agent.light`,
as follows:

    var myAgent = Agent.light(myObject)

You now have an agent. By opposition to your usual objects, an
agent receives messages and replies asynchronously with futures.
To send message `division` to your agent, simply write

    var myFuture = myAgent.send.division(10, 5);

This message will be sent asynchronously to the object, the object
will perform the operation and reply whenever the result is available.
To handle the reply, simply attach a property `onreply` to your future:

    myFuture.onreply = function(aReply) {
       if(aReply.success) {
          alert("Success :" + aReply.success);
       } else {
          alert("Error: " + aReply.error);
       }
    }

This should display

    Success: 2

This is it, you now know how to use an agent!


[1] That is, any object in which no field _contains_ a closure,
XMLHttpRequest or any other non-transferable object. Its methods
can, however, make use of closures, XMLHttpRequest, etc.

The API
=======

Creating an agent
-----------------

To create an agent from an object, use one of the following cuntions:
- `Agent.light` (to create an agent executed in the same thread)
- `Agent.heavy` (to create an agent executed in its own thread)

The API is identical.

Sending messages
----------------

Creating an agent `myAgent` from an object `myObject` yields an agent
that can send messages to (a copy of) `myObject`. For each method in
`myObject`, `myAgent` can send a message with the same name and the
same list of arguments.

To send a message corresponding to `myObj.foo(a, b, c)`, use
`myAgent.send.foo(a, b, c)`.

Sending a message always produces a `Future`.

Watching the Future
-------------------

To watch a Future, you may set its fields

- `onreply`  (to be informed once computation is complete)
- `onresult` (to be informed only in case of success)
- `onerror`  (to be informed only in case of error)

Once the reply is available, you may also read the following fields

- `result`
- `error`

Reading these fields before the reply is available is meaningless.

Watching the Agent
------------------

Instead of watching a Future, it is possible to watch the Agent itself.
This is important essentially to handle errors and failures, but all
replies can be observed, by setting the following fields:

- `onreply`  (to be informed every time a computation is complete)
- `onresult` (to be informed every time a computation ends in success)
- `onerror`  (to be informed every time a computation ends in error)
- `onfail`   (to be informed if the agent itself fails)

Failures
--------

To stop an agent, _fail_ it by calling its method `fail`. To be informed of
agent failures, watch `onfail`, as above.


In progress
===========

This work is currently untested.
