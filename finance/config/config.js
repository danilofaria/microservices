var MONGO_DEFAULT_PORT = 27017,
    MONGO_PORT = process.env.MONGO_PORT_27017_TCP_PORT || MONGO_DEFAULT_PORT,
    MONGO_DEFAULT_IP = '192.168.59.103',
    MONGO_IP = process.env.MONGO_PORT_27017_TCP_ADDR || MONGO_DEFAULT_IP,
    mongoAddress = 'mongodb://' + MONGO_IP + ':' + MONGO_PORT + '/test';

exports.mongoAddress = mongoAddress;