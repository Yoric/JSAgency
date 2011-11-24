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

Transform the agent into an object by passing it to `Agent.light`
[2], as follows:

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
         alert("Success! :" + aReply.success);
      } else {
         alert("Error: !" + aReply.error);
      }
   }

This is it, you now know how to use an agent!


[1] That is, any object in which no field _contains_ a closure,
XMLHttpRequest or any other non-transferable object. Its methods
can, however, make use of closures, XMLHttpRequest, etc.

[2] A corresponding `Agent.heavy` is at work.