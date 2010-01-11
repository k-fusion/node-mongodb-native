/**
  Reply message from mongo db
**/
MongoReply = function(binary_reply) {  
  this.parser = new BinaryParser();
  this.bson = new BSON();
  this.documents = [];
  
  // sys.puts("=======================================================================================");
  // new BinaryParser().pprint(binary_reply);
  
  var index = 0;
  // Unpack the standard header first
  var messageLength = this.parser.toInt(binary_reply.substr(index, 4));
  // sys.puts("======================== Total Message Length: " + messageLength + " Data Size: " + binary_reply.length);  
  index = index + 4;
  // Fetch the request id for this reply
  this.requestId = this.parser.toInt(binary_reply.substr(index, 4));  
  index = index + 4;
  // Fetch the id of the request that triggered the response
  this.responseTo = this.parser.toInt(binary_reply.substr(index, 4));
  // Skip op-code field
  index = index + 4 + 4;
  // Unpack the reply message
  this.responseFlag = this.parser.toInt(binary_reply.substr(index, 4));
  index = index + 4;
  // Unpack the cursor id (a 64 bit long integer)
  var low_bits = Integer.fromInt(this.parser.toInt(binary_reply.substr(index, 4)))
  var high_bits = Integer.fromInt(this.parser.toInt(binary_reply.substr(index + 4, 4)))
  this.cursorId = new Long(low_bits, high_bits)
  index = index + 8;
  // Unpack the starting from
  this.startingFrom = this.parser.toInt(binary_reply.substr(index, 4));
  index = index + 4;
  // Unpack the number of objects returned
  this.numberReturned = this.parser.toInt(binary_reply.substr(index, 4));
  index = index + 4;
  // Let's unpack all the bson document, deserialize them and store them
  for(var object_index = 0; object_index < this.numberReturned; object_index++) {
    // sys.puts("Decoding object " + object_index + " of " + this.numberReturned);
    // Read the size of the bson object
    var bsonObjectSize = this.parser.toInt(binary_reply.substr(index, 4));
    // sys.puts("============== decode object");
    // new BinaryParser().pprint(binary_reply.substr(index, bsonObjectSize));
    // Read the entire object and deserialize it
    this.documents.push(this.bson.deserialize(binary_reply.substr(index, bsonObjectSize)));
    // Adjust for next object
    index = index + bsonObjectSize;
  }
}

MongoReply.prototype = new Object()
MongoReply.prototype.is_error = function(){
  if(this.documents.length == 1) {
    return this.documents[0].ok == 1 ? false : true;
  }
  return false;
}
MongoReply.prototype.error_message = function() {
  return this.documents.length == 1 && this.documents[0].ok == 1 ? '' : this.documents[0].errmsg;
}